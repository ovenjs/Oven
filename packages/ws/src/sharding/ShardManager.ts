/**
 * Shard manager for handling multiple WebSocket connections
 * Manages Discord gateway sharding with automatic scaling
 */

import { EventEmitter } from 'events';
import type { BotToken, GatewayInfo } from '@ovenjs/types';
import { Shard, ShardOptions, ShardState, ShardStatus } from './Shard.js';

export interface ShardManagerOptions {
  token: BotToken;
  intents: number;
  shardCount?: number | 'auto';
  shardIds?: number[];
  gatewayURL?: string;
  version?: number;
  encoding?: 'json' | 'etf';
  compress?: boolean;
  largeThreshold?: number;
  presence?: {
    activities?: any[];
    status?: 'online' | 'dnd' | 'idle' | 'invisible';
    afk?: boolean;
    since?: number | null;
  };
  spawnDelay?: number;
  spawnTimeout?: number;
}

export interface ShardManagerStatus {
  totalShards: number;
  readyShards: number;
  connectingShards: number;
  disconnectedShards: number;
  shards: ShardStatus[];
  averagePing: number;
}

/**
 * Manages multiple Discord gateway shards
 */
export class ShardManager extends EventEmitter {
  private readonly options: Required<Omit<ShardManagerOptions, 'shardCount' | 'shardIds'>> & 
    Pick<ShardManagerOptions, 'shardCount' | 'shardIds'>;
  private readonly shards = new Map<number, Shard>();
  private gatewayInfo?: GatewayInfo;
  private spawnQueue: number[] = [];
  private spawning = false;

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
   * Calculate the recommended number of shards
   */
  async calculateShards(): Promise<number> {
    if (!this.gatewayInfo) {
      throw new Error('Gateway info not available. Call fetchGatewayInfo() first.');
    }

    return this.gatewayInfo.shards;
  }

  /**
   * Fetch gateway information from Discord
   */
  async fetchGatewayInfo(): Promise<GatewayInfo> {
    // This would typically use the REST client to fetch /gateway/bot
    // For now, we'll simulate the response
    this.gatewayInfo = {
      url: this.options.gatewayURL,
      shards: 1, // Would be fetched from Discord
      session_start_limit: {
        total: 1000,
        remaining: 1000,
        reset_after: 86400000,
        max_concurrency: 1,
      },
    };

    return this.gatewayInfo;
  }

  /**
   * Spawn all shards
   */
  async spawnAll(): Promise<void> {
    if (this.spawning) {
      throw new Error('Shards are already being spawned');
    }

    // Fetch gateway info if not already available
    if (!this.gatewayInfo) {
      await this.fetchGatewayInfo();
    }

    // Determine shard count
    let shardCount: number;
    if (this.options.shardCount === 'auto') {
      shardCount = await this.calculateShards();
    } else {
      shardCount = this.options.shardCount || 1;
    }

    // Determine which shards to spawn
    const shardIds = this.options.shardIds || Array.from({ length: shardCount }, (_, i) => i);

    // Queue shards for spawning
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
   * Spawn a specific shard
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
   * Kill a specific shard
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
   * Restart a specific shard
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
   * Get a specific shard
   */
  getShard(id: number): Shard | undefined {
    return this.shards.get(id);
  }

  /**
   * Get all shards
   */
  getShards(): Map<number, Shard> {
    return new Map(this.shards);
  }

  /**
   * Connect all shards
   */
  async connectAll(): Promise<void> {
    const promises = Array.from(this.shards.values()).map(shard => shard.connect());
    await Promise.all(promises);
  }

  /**
   * Disconnect all shards
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.shards.values()).map(shard => shard.disconnect());
    await Promise.all(promises);
  }

  /**
   * Get manager status
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
   * Broadcast a payload to all ready shards
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
   * Check if all shards are ready
   */
  isReady(): boolean {
    if (this.shards.size === 0) return false;
    return Array.from(this.shards.values()).every(shard => shard.isReady());
  }

  /**
   * Get the first ready shard (for single-shard operations)
   */
  getFirstShard(): Shard | undefined {
    return Array.from(this.shards.values()).find(shard => shard.isReady());
  }

  /**
   * Process the spawn queue with proper rate limiting
   */
  private async processSpawnQueue(totalShards: number): Promise<void> {
    while (this.spawnQueue.length > 0) {
      const shardId = this.spawnQueue.shift()!;
      
      try {
        const shard = await this.spawnShard(shardId, totalShards);
        await shard.connect();
        
        // Wait for the shard to be ready or timeout
        await this.waitForShardReady(shard);
        
        // Add delay between spawning shards to avoid rate limits
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
   * Wait for a shard to become ready
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
   * Setup event handlers for a shard
   */
  private setupShardEvents(shard: Shard): void {
    // Forward shard events
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
   * Destroy the shard manager
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