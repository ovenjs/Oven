/**
 * Shard manager for handling multiple WebSocket connections
 * Manages Discord gateway sharding with automatic scaling and health monitoring
 * 
 * @author OvenJS Team
 * @since 0.1.0
 */

import { EventEmitter } from 'events';
import type { 
  GatewayInfo,
  ShardManagerOptions,
  ShardManagerStatus,
  ShardOptions,
  ShardState 
} from '@ovenjs/types';
import { Shard } from './Shard.js';

/**
 * Manages multiple Discord gateway shards with intelligent spawning and health monitoring
 * 
 * Features:
 * - Automatic shard count detection
 * - Rate-limited shard spawning
 * - Health monitoring and reconnection
 * - Broadcasting to all shards
 * - Individual shard management
 * 
 * @example
 * ```typescript
 * const manager = new ShardManager({
 *   token: 'Bot YOUR_BOT_TOKEN' as BotToken,
 *   intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMessages,
 *   shardCount: 'auto'
 * });
 * 
 * manager.on('ready', () => {
 *   console.log('All shards are ready!');
 * });
 * 
 * await manager.spawnAll();
 * ```
 */
export class ShardManager extends EventEmitter {
  private readonly options: Required<Omit<ShardManagerOptions, 'shardCount' | 'shardIds' | 'presence'>> & 
    Pick<ShardManagerOptions, 'shardCount' | 'shardIds' | 'presence'>;
  private readonly shards = new Map<number, Shard>();
  private gatewayInfo?: GatewayInfo;
  private spawnQueue: number[] = [];
  private spawning = false;

  /**
   * Creates a new ShardManager instance
   * 
   * @param options - Configuration options for shard management
   */
  constructor(options: ShardManagerOptions) {
    super();
    
    this.options = {
      token: options.token,
      intents: options.intents,
      shardCount: options.shardCount ?? 'auto',
      shardIds: options.shardIds,
      gatewayURL: options.gatewayURL ?? 'wss://gateway.discord.gg',
      version: options.version ?? 10,
      encoding: options.encoding ?? 'json',
      compress: options.compress ?? true,
      largeThreshold: options.largeThreshold ?? 50,
      presence: options.presence,
      spawnDelay: options.spawnDelay ?? 5000,
      spawnTimeout: options.spawnTimeout ?? 30000,
    };

    this.setMaxListeners(0);
  }

  /**
   * Calculates the recommended number of shards based on Discord's recommendation
   * 
   * @returns Recommended shard count
   * @throws {Error} If gateway info is not available
   */
  async calculateShards(): Promise<number> {
    if (!this.gatewayInfo) {
      throw new Error('Gateway info not available. Call fetchGatewayInfo() first.');
    }

    return this.gatewayInfo.shards;
  }

  /**
   * Fetches gateway information from Discord API
   * 
   * @returns Gateway information including recommended shard count
   */
  async fetchGatewayInfo(): Promise<GatewayInfo> {
    // TODO: This should use the REST client to fetch /gateway/bot
    // For now, we'll simulate the response based on typical Discord values
    this.gatewayInfo = {
      url: this.options.gatewayURL,
      shards: 1, // Would be fetched from Discord's API
      session_start_limit: {
        total: 1000,
        remaining: 1000,
        reset_after: 86400000, // 24 hours in milliseconds
        max_concurrency: 1,
      },
    };

    return this.gatewayInfo;
  }

  /**
   * Spawns all configured shards with rate limiting and error handling
   * 
   * @throws {Error} If shards are already being spawned
   */
  async spawnAll(): Promise<void> {
    if (this.spawning) {
      throw new Error('Shards are already being spawned');
    }

    // Ensure we have gateway info
    if (!this.gatewayInfo) {
      await this.fetchGatewayInfo();
    }

    // Determine final shard count
    let shardCount: number;
    if (this.options.shardCount === 'auto') {
      shardCount = await this.calculateShards();
    } else {
      shardCount = this.options.shardCount || 1;
    }

    // Determine which specific shards to spawn
    const shardIds = this.options.shardIds || Array.from({ length: shardCount }, (_, i) => i);

    // Prepare spawn queue
    this.spawnQueue = [...shardIds];
    this.spawning = true;

    this.emit('debug', `Spawning ${shardIds.length} shards (${shardIds.join(', ')})`);

    try {
      await this.processSpawnQueue(shardCount);
    } finally {
      this.spawning = false;
    }
  }

  /**
   * Spawns a specific shard with proper configuration
   * 
   * @param id - Shard ID to spawn
   * @param totalShards - Total number of shards (for shard array)
   * @returns The created shard instance
   * @throws {Error} If shard already exists
   */
  async spawnShard(id: number, totalShards?: number): Promise<Shard> {
    if (this.shards.has(id)) {
      throw new Error(`Shard ${id} already exists`);
    }

    const shardCount = totalShards || this.gatewayInfo?.shards || 1;

    const shardOptions: ShardOptions = {
      id,
      count: shardCount,
      token: this.options.token,
      intents: this.options.intents,
      gatewayURL: this.options.gatewayURL,
      version: this.options.version,
      encoding: this.options.encoding,
      compress: this.options.compress,
      largeThreshold: this.options.largeThreshold,
      presence: this.options.presence,
    };

    const shard = new Shard(shardOptions);
    this.setupShardEvents(shard);
    this.shards.set(id, shard);

    this.emit('shardSpawn', shard);
    this.emit('debug', `Spawned shard ${id}`);

    return shard;
  }

  /**
   * Terminates and removes a specific shard
   * 
   * @param id - Shard ID to kill
   * @throws {Error} If shard doesn't exist
   */
  async killShard(id: number): Promise<void> {
    const shard = this.shards.get(id);
    if (!shard) {
      throw new Error(`Shard ${id} does not exist`);
    }

    await shard.disconnect();
    shard.destroy();
    this.shards.delete(id);

    this.emit('shardKill', id);
    this.emit('debug', `Killed shard ${id}`);
  }

  /**
   * Restarts a specific shard with graceful reconnection
   * 
   * @param id - Shard ID to restart
   * @throws {Error} If shard doesn't exist
   */
  async restartShard(id: number): Promise<void> {
    const shard = this.shards.get(id);
    if (!shard) {
      throw new Error(`Shard ${id} does not exist`);
    }

    this.emit('debug', `Restarting shard ${id}`);
    
    await shard.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
    await shard.connect();
  }

  /**
   * Gets a specific shard by ID
   * 
   * @param id - Shard ID to retrieve
   * @returns Shard instance or undefined if not found
   */
  getShard(id: number): Shard | undefined {
    return this.shards.get(id);
  }

  /**
   * Gets all managed shards
   * 
   * @returns Map of all shard instances
   */
  getShards(): Map<number, Shard> {
    return new Map(this.shards);
  }

  /**
   * Connects all spawned shards to Discord
   */
  async connectAll(): Promise<void> {
    const promises = Array.from(this.shards.values()).map(shard => shard.connect());
    await Promise.all(promises);
  }

  /**
   * Disconnects all shards gracefully
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.shards.values()).map(shard => shard.disconnect());
    await Promise.all(promises);
  }

  /**
   * Gets comprehensive status of shard manager and all shards
   * 
   * @returns Complete status information
   */
  getStatus(): ShardManagerStatus {
    const shardStatuses = Array.from(this.shards.values()).map(shard => shard.getStatus());
    
    const readyShards = shardStatuses.filter(s => s.state === ShardState.READY).length;
    const connectingShards = shardStatuses.filter(s => 
      s.state === ShardState.CONNECTING || 
      s.state === ShardState.IDENTIFYING ||
      s.state === ShardState.RESUMING
    ).length;
    const disconnectedShards = shardStatuses.filter(s => s.state === ShardState.DISCONNECTED).length;

    const pings = shardStatuses.map(s => s.ping).filter(p => p > 0);
    const averagePing = pings.length > 0 ? pings.reduce((a, b) => a + b, 0) / pings.length : 0;

    return {
      totalShards: this.shards.size,
      readyShards,
      connectingShards,
      disconnectedShards,
      shards: shardStatuses,
      averagePing,
    };
  }

  /**
   * Broadcasts a payload to all ready shards
   * 
   * @param payload - Gateway payload to broadcast
   * @returns Number of shards that received the payload
   */
  broadcast(payload: any): number {
    let sentTo = 0;
    
    for (const shard of this.shards.values()) {
      if (shard.isReady()) {
        try {
          shard.send(payload);
          sentTo++;
        } catch (error) {
          this.emit('error', error);
        }
      }
    }

    return sentTo;
  }

  /**
   * Checks if all shards are ready and operational
   * 
   * @returns True if all shards are ready
   */
  isReady(): boolean {
    if (this.shards.size === 0) return false;
    return Array.from(this.shards.values()).every(shard => shard.isReady());
  }

  /**
   * Gets the first ready shard (useful for single-shard operations)
   * 
   * @returns First ready shard or undefined
   */
  getFirstShard(): Shard | undefined {
    return Array.from(this.shards.values()).find(shard => shard.isReady());
  }

  /**
   * Processes the spawn queue with proper rate limiting and error handling
   * 
   * @param totalShards - Total number of shards for configuration
   * @private
   */
  private async processSpawnQueue(totalShards: number): Promise<void> {
    while (this.spawnQueue.length > 0) {
      const shardId = this.spawnQueue.shift()!;
      
      try {
        const shard = await this.spawnShard(shardId, totalShards);
        await shard.connect();
        
        // Wait for the shard to be ready or timeout
        await this.waitForShardReady(shard);
        
        // Add delay between spawning shards to respect rate limits
        if (this.spawnQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.options.spawnDelay));
        }
      } catch (error) {
        this.emit('error', new Error(`Failed to spawn shard ${shardId}: ${error}`));
        // Continue with next shard instead of failing completely
      }
    }
  }

  /**
   * Waits for a shard to become ready with timeout handling
   * 
   * @param shard - Shard to wait for
   * @returns Promise that resolves when shard is ready
   * @private
   */
  private async waitForShardReady(shard: Shard): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Shard ${shard.getId()} spawn timeout`));
      }, this.options.spawnTimeout);

      const onReady = () => {
        cleanup();
        resolve();
      };

      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        clearTimeout(timeout);
        shard.off('ready', onReady);
        shard.off('error', onError);
      };

      shard.once('ready', onReady);
      shard.once('error', onError);
    });
  }

  /**
   * Sets up event forwarding and handling for a shard
   * 
   * @param shard - Shard to setup events for
   * @private
   */
  private setupShardEvents(shard: Shard): void {
    // Forward shard events to manager listeners
    shard.on('ready', (data) => {
      this.emit('shardReady', shard.getId(), data);
      
      // Check if all shards are ready
      if (this.isReady()) {
        this.emit('ready');
      }
    });

    shard.on('resumed', () => {
      this.emit('shardResumed', shard.getId());
    });

    shard.on('disconnect', (code, reason) => {
      this.emit('shardDisconnect', shard.getId(), code, reason);
    });

    shard.on('error', (error) => {
      this.emit('shardError', shard.getId(), error);
    });

    shard.on('dispatch', (payload) => {
      this.emit('dispatch', shard.getId(), payload);
    });

    shard.on('stateChange', (newState, oldState) => {
      this.emit('shardStateChange', shard.getId(), newState, oldState);
    });

    shard.on('debug', (message) => {
      this.emit('debug', message);
    });
  }

  /**
   * Destroys the shard manager and all managed shards
   * 
   * Cleans up all resources and connections. After calling this method,
   * the manager cannot be reused.
   */
  async destroy(): Promise<void> {
    this.spawning = false;
    this.spawnQueue = [];
    
    // Disconnect and destroy all shards
    const destroyPromises = Array.from(this.shards.values()).map(async shard => {
      await shard.disconnect();
      shard.destroy();
    });
    
    await Promise.all(destroyPromises);
    this.shards.clear();
    this.removeAllListeners();
  }
}