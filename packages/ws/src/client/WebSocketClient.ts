/**
 * Main WebSocket client for Discord gateway
 * Orchestrates sharding, event handling, and connection management
 */

import { EventEmitter } from 'events';
import type { BotToken, GatewayIntentBits, GatewayInfo } from '@ovenjs/types';
import { ShardManager, ShardManagerOptions, ShardManagerStatus } from '../sharding/index.js';
import { EventHandler, EventHandlerOptions, ProcessedEvent } from '../handlers/index.js';

export interface WebSocketClientOptions {
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
  validateEvents?: boolean;
  debugMode?: boolean;
  restClient?: any; // Will be typed when REST client is available
}

export interface WebSocketClientStatus {
  connected: boolean;
  ready: boolean;
  shardManager: ShardManagerStatus;
  eventStats: Record<string, number>;
  totalEvents: number;
  eventsPerSecond: number;
}

/**
 * Main WebSocket client for Discord gateway connections
 */
export class WebSocketClient extends EventEmitter {
  private readonly options: WebSocketClientOptions;
  private readonly shardManager: ShardManager;
  private readonly eventHandler: EventHandler;
  private readonly restClient?: any;
  private connected = false;
  private ready = false;

  constructor(options: WebSocketClientOptions) {
    super();
    
    this.options = options;
    this.restClient = options.restClient;

    // Initialize shard manager
    const shardManagerOptions: ShardManagerOptions = {
      token: options.token,
      intents: options.intents,
      shardCount: options.shardCount,
      shardIds: options.shardIds,
      gatewayURL: options.gatewayURL,
      version: options.version,
      encoding: options.encoding,
      compress: options.compress,
      largeThreshold: options.largeThreshold,
      presence: options.presence,
      spawnDelay: options.spawnDelay,
      spawnTimeout: options.spawnTimeout,
    };

    this.shardManager = new ShardManager(shardManagerOptions);

    // Initialize event handler
    const eventHandlerOptions: EventHandlerOptions = {
      validateEvents: options.validateEvents,
      debugMode: options.debugMode,
    };

    this.eventHandler = new EventHandler(eventHandlerOptions);

    this.setupEventHandlers();
    this.setMaxListeners(0);
  }

  /**
   * Connect to Discord gateway
   */
  async connect(): Promise<void> {
    if (this.connected) {
      throw new Error('WebSocket client is already connected');
    }

    try {
      // Fetch gateway info and spawn shards
      await this.shardManager.fetchGatewayInfo();
      await this.shardManager.spawnAll();
      
      this.connected = true;
      this.emit('connect');
      this.emit('debug', 'WebSocket client connected');
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from Discord gateway
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      await this.shardManager.disconnectAll();
      this.connected = false;
      this.ready = false;
      
      this.emit('disconnect');
      this.emit('debug', 'WebSocket client disconnected');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Check if client is ready (all shards ready)
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Get client status
   */
  getStatus(): WebSocketClientStatus {
    return {
      connected: this.connected,
      ready: this.ready,
      shardManager: this.shardManager.getStatus(),
      eventStats: this.eventHandler.getEventStats(),
      totalEvents: this.eventHandler.getTotalEvents(),
      eventsPerSecond: this.eventHandler.getEventsPerSecond(),
    };
  }

  /**
   * Get shard manager
   */
  getShardManager(): ShardManager {
    return this.shardManager;
  }

  /**
   * Get event handler
   */
  getEventHandler(): EventHandler {
    return this.eventHandler;
  }

  /**
   * Send payload to all shards
   */
  broadcast(payload: any): number {
    return this.shardManager.broadcast(payload);
  }

  /**
   * Send payload to specific shard
   */
  sendToShard(shardId: number, payload: any): void {
    const shard = this.shardManager.getShard(shardId);
    if (!shard) {
      throw new Error(`Shard ${shardId} not found`);
    }

    shard.send(payload);
  }

  /**
   * Update presence on all shards
   */
  updatePresence(presence: {
    activities?: any[];
    status?: 'online' | 'dnd' | 'idle' | 'invisible';
    afk?: boolean;
    since?: number | null;
  }): number {
    const payload = {
      op: 3, // PRESENCE_UPDATE
      d: presence,
    };

    return this.broadcast(payload);
  }

  /**
   * Request guild members for a guild
   */
  requestGuildMembers(guildId: string, options: {
    query?: string;
    limit?: number;
    presences?: boolean;
    user_ids?: string[];
    nonce?: string;
  } = {}): void {
    const payload = {
      op: 8, // REQUEST_GUILD_MEMBERS
      d: {
        guild_id: guildId,
        query: options.query || '',
        limit: options.limit || 0,
        presences: options.presences || false,
        user_ids: options.user_ids,
        nonce: options.nonce,
      },
    };

    // Send to all shards that might have this guild
    this.broadcast(payload);
  }

  /**
   * Update voice state
   */
  updateVoiceState(guildId: string, channelId: string | null, options: {
    selfMute?: boolean;
    selfDeaf?: boolean;
  } = {}): void {
    const payload = {
      op: 4, // VOICE_STATE_UPDATE
      d: {
        guild_id: guildId,
        channel_id: channelId,
        self_mute: options.selfMute || false,
        self_deaf: options.selfDeaf || false,
      },
    };

    this.broadcast(payload);
  }

  /**
   * Get gateway information
   */
  async getGatewayInfo(): Promise<GatewayInfo> {
    return this.shardManager.fetchGatewayInfo();
  }

  /**
   * Restart a specific shard
   */
  async restartShard(shardId: number): Promise<void> {
    await this.shardManager.restartShard(shardId);
  }

  /**
   * Restart all shards
   */
  async restartAll(): Promise<void> {
    this.emit('debug', 'Restarting all shards');
    
    const shards = Array.from(this.shardManager.getShards().keys());
    
    for (const shardId of shards) {
      await this.restartShard(shardId);
      // Add delay between restarts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Get detailed statistics
   */
  getDetailedStats(): {
    client: WebSocketClientStatus;
    topEvents: Array<{ type: string; count: number }>;
    shardDetails: any[];
  } {
    const status = this.getStatus();
    const topEvents = this.eventHandler.getTopEvents();
    const shardDetails = status.shardManager.shards;

    return {
      client: status,
      topEvents,
      shardDetails,
    };
  }

  /**
   * Setup event handlers for shard manager and event handler
   */
  private setupEventHandlers(): void {
    // Shard manager events
    this.shardManager.on('ready', () => {
      this.ready = true;
      this.emit('ready');
      this.emit('debug', 'All shards ready');
    });

    this.shardManager.on('shardReady', (shardId, data) => {
      this.emit('shardReady', shardId, data);
      this.emit('debug', `Shard ${shardId} ready`);
    });

    this.shardManager.on('shardResumed', (shardId) => {
      this.emit('shardResumed', shardId);
      this.emit('debug', `Shard ${shardId} resumed`);
    });

    this.shardManager.on('shardDisconnect', (shardId, code, reason) => {
      this.emit('shardDisconnect', shardId, code, reason);
      this.emit('debug', `Shard ${shardId} disconnected: ${code} ${reason}`);
    });

    this.shardManager.on('shardError', (shardId, error) => {
      this.emit('shardError', shardId, error);
      this.emit('error', new Error(`Shard ${shardId} error: ${error.message}`));
    });

    this.shardManager.on('shardStateChange', (shardId, newState, oldState) => {
      this.emit('shardStateChange', shardId, newState, oldState);
      this.emit('debug', `Shard ${shardId} state: ${oldState} -> ${newState}`);
    });

    this.shardManager.on('dispatch', (shardId, payload) => {
      // Process the event through the event handler
      const processedEvent = this.eventHandler.processEvent(shardId, payload);
      
      if (processedEvent) {
        // Emit the processed event
        this.emit('event', processedEvent);
        this.emit(processedEvent.type.toLowerCase(), processedEvent);
      }
    });

    this.shardManager.on('debug', (message) => {
      this.emit('debug', message);
    });

    // Event handler events
    this.eventHandler.on('error', (error) => {
      this.emit('error', error);
    });

    this.eventHandler.on('debug', (message) => {
      this.emit('debug', message);
    });
  }

  /**
   * Add event listener with type safety
   */
  on<T extends keyof WebSocketClientEvents>(event: T, listener: WebSocketClientEvents[T]): this {
    return super.on(event, listener);
  }

  /**
   * Add one-time event listener with type safety
   */
  once<T extends keyof WebSocketClientEvents>(event: T, listener: WebSocketClientEvents[T]): this {
    return super.once(event, listener);
  }

  /**
   * Emit event with type safety
   */
  emit<T extends keyof WebSocketClientEvents>(event: T, ...args: Parameters<WebSocketClientEvents[T]>): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Destroy the WebSocket client
   */
  async destroy(): Promise<void> {
    await this.disconnect();
    await this.shardManager.destroy();
    this.eventHandler.destroy();
    this.removeAllListeners();
    
    this.emit('debug', 'WebSocket client destroyed');
  }
}

/**
 * WebSocket client event interface for type safety
 */
export interface WebSocketClientEvents {
  connect: () => void;
  disconnect: () => void;
  ready: () => void;
  shardReady: (shardId: number, data: any) => void;
  shardResumed: (shardId: number) => void;
  shardDisconnect: (shardId: number, code: number, reason: string) => void;
  shardError: (shardId: number, error: Error) => void;
  shardStateChange: (shardId: number, newState: string, oldState: string) => void;
  event: (event: ProcessedEvent) => void;
  error: (error: Error) => void;
  debug: (message: string) => void;
  
  // Discord events (lowercase)
  ready: (event: ProcessedEvent) => void;
  resumed: (event: ProcessedEvent) => void;
  guild_create: (event: ProcessedEvent) => void;
  guild_update: (event: ProcessedEvent) => void;
  guild_delete: (event: ProcessedEvent) => void;
  message_create: (event: ProcessedEvent) => void;
  message_update: (event: ProcessedEvent) => void;
  message_delete: (event: ProcessedEvent) => void;
  // ... add more Discord events as needed
}