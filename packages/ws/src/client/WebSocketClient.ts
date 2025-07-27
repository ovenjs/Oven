/**
 * Main WebSocket client for Discord gateway connections
 * Orchestrates sharding, event handling, and connection management with comprehensive features
 * 
 * @author OvenJS Team
 * @since 0.1.0
 */

import { EventEmitter } from 'events';
import type { 
  GatewayInfo,
  WebSocketClientOptions,
  WebSocketClientStatus,
  ShardManagerOptions,
  ShardManagerStatus,
  EventHandlerOptions,
  ProcessedEvent 
} from '@ovenjs/types';
import { ShardManager } from '../sharding/index.js';
import { EventHandler } from '../handlers/index.js';

/**
 * Event interface for WebSocket client with comprehensive Discord event coverage
 */
export interface WebSocketClientEvents {
  // Connection events
  connect: () => void;
  disconnect: () => void;
  ready: () => void;
  
  // Shard management events
  shardReady: (shardId: number, data: any) => void;
  shardResumed: (shardId: number) => void;
  shardDisconnect: (shardId: number, code: number, reason: string) => void;
  shardError: (shardId: number, error: Error) => void;
  shardStateChange: (shardId: number, newState: string, oldState: string) => void;
  
  // Event processing
  event: (event: ProcessedEvent) => void;
  error: (error: Error) => void;
  debug: (message: string) => void;
  
  // Discord gateway events (lowercase for consistency)
  resumed: (event: ProcessedEvent) => void;
  guild_create: (event: ProcessedEvent) => void;
  guild_update: (event: ProcessedEvent) => void;
  guild_delete: (event: ProcessedEvent) => void;
  guild_ban_add: (event: ProcessedEvent) => void;
  guild_ban_remove: (event: ProcessedEvent) => void;
  guild_emojis_update: (event: ProcessedEvent) => void;
  guild_integrations_update: (event: ProcessedEvent) => void;
  guild_member_add: (event: ProcessedEvent) => void;
  guild_member_remove: (event: ProcessedEvent) => void;
  guild_member_update: (event: ProcessedEvent) => void;
  guild_members_chunk: (event: ProcessedEvent) => void;
  guild_role_create: (event: ProcessedEvent) => void;
  guild_role_update: (event: ProcessedEvent) => void;
  guild_role_delete: (event: ProcessedEvent) => void;
  invite_create: (event: ProcessedEvent) => void;
  invite_delete: (event: ProcessedEvent) => void;
  message_create: (event: ProcessedEvent) => void;
  message_update: (event: ProcessedEvent) => void;
  message_delete: (event: ProcessedEvent) => void;
  message_delete_bulk: (event: ProcessedEvent) => void;
  message_reaction_add: (event: ProcessedEvent) => void;
  message_reaction_remove: (event: ProcessedEvent) => void;
  message_reaction_remove_all: (event: ProcessedEvent) => void;
  message_reaction_remove_emoji: (event: ProcessedEvent) => void;
  presence_update: (event: ProcessedEvent) => void;
  typing_start: (event: ProcessedEvent) => void;
  user_update: (event: ProcessedEvent) => void;
  voice_state_update: (event: ProcessedEvent) => void;
  voice_server_update: (event: ProcessedEvent) => void;
  webhooks_update: (event: ProcessedEvent) => void;
  channel_create: (event: ProcessedEvent) => void;
  channel_update: (event: ProcessedEvent) => void;
  channel_delete: (event: ProcessedEvent) => void;
  channel_pins_update: (event: ProcessedEvent) => void;
  thread_create: (event: ProcessedEvent) => void;
  thread_update: (event: ProcessedEvent) => void;
  thread_delete: (event: ProcessedEvent) => void;
  thread_list_sync: (event: ProcessedEvent) => void;
  thread_member_update: (event: ProcessedEvent) => void;
  thread_members_update: (event: ProcessedEvent) => void;
  stage_instance_create: (event: ProcessedEvent) => void;
  stage_instance_update: (event: ProcessedEvent) => void;
  stage_instance_delete: (event: ProcessedEvent) => void;
  interaction_create: (event: ProcessedEvent) => void;
  application_command_permissions_update: (event: ProcessedEvent) => void;
  auto_moderation_rule_create: (event: ProcessedEvent) => void;
  auto_moderation_rule_update: (event: ProcessedEvent) => void;
  auto_moderation_rule_delete: (event: ProcessedEvent) => void;
  auto_moderation_action_execution: (event: ProcessedEvent) => void;
}

/**
 * Main WebSocket client for Discord gateway connections
 * 
 * This class provides:
 * - Comprehensive shard management with automatic scaling
 * - Event processing and validation
 * - Connection health monitoring
 * - Broadcasting capabilities
 * - Presence and voice state management
 * - Guild member requesting
 * - Detailed statistics and monitoring
 * 
 * @example
 * ```typescript
 * import { WebSocketClient } from '@ovenjs/ws';
 * import { GatewayIntentBits } from 'discord-api-types/v10';
 * 
 * const client = new WebSocketClient({
 *   token: 'Bot YOUR_BOT_TOKEN' as BotToken,
 *   intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMessages,
 *   shardCount: 'auto'
 * });
 * 
 * client.on('ready', () => {
 *   console.log('All shards ready!');
 * });
 * 
 * client.on('guild_create', (event) => {
 *   console.log(`Joined guild: ${event.data.name}`);
 * });
 * 
 * await client.connect();
 * ```
 */
export class WebSocketClient extends EventEmitter {
  private readonly options: WebSocketClientOptions;
  private readonly shardManager: ShardManager;
  private readonly eventHandler: EventHandler;
  private connected = false;
  private ready = false;

  /**
   * Creates a new WebSocketClient instance
   * 
   * @param options - Configuration options for the WebSocket client
   */
  constructor(options: WebSocketClientOptions) {
    super();
    
    this.options = options;

    // Initialize shard manager with appropriate options
    const shardManagerOptions: ShardManagerOptions = {
      token: this.options.token,
      intents: this.options.intents,
      shardCount: this.options.shardCount,
      shardIds: this.options.shardIds,
      gatewayURL: this.options.gatewayURL,
      version: this.options.version,
      encoding: options.encoding,
      compress: this.options.compress,
      largeThreshold: this.options.largeThreshold,
      presence: this.options.presence,
      spawnDelay: this.options.spawnDelay,
      spawnTimeout: this.options.spawnTimeout,
    };

    this.shardManager = new ShardManager(shardManagerOptions);

    // Initialize event handler
    const eventHandlerOptions: EventHandlerOptions = {
      validateEvents: this.options.validateEvents,
      debugMode: this.options.debugMode,
    };

    this.eventHandler = new EventHandler(eventHandlerOptions);

    this.setupEventHandlers();
    this.setMaxListeners(0);
  }

  /**
   * Connects to Discord gateway and spawns all shards
   * 
   * @throws {Error} If client is already connected
   */
  async connect(): Promise<void> {
    if (this.connected) {
      throw new Error('WebSocket client is already connected');
    }

    try {
      // Fetch gateway information and spawn all shards
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
   * Disconnects from Discord gateway and stops all shards
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
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Checks if the client is connected to Discord
   * 
   * @returns True if connected to Discord
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Checks if all shards are ready and receiving events
   * 
   * @returns True if all shards are ready
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Gets comprehensive client status including shard and event statistics
   * 
   * @returns Complete client status information
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
   * Gets the underlying shard manager instance
   * 
   * @returns ShardManager instance for advanced shard operations
   */
  getShardManager(): ShardManager {
    return this.shardManager;
  }

  /**
   * Gets the event handler instance
   * 
   * @returns EventHandler instance for event processing control
   */
  getEventHandler(): EventHandler {
    return this.eventHandler;
  }

  /**
   * Broadcasts a payload to all ready shards
   * 
   * @param payload - Gateway payload to broadcast
   * @returns Number of shards that received the payload
   */
  broadcast(payload: any): number {
    return this.shardManager.broadcast(payload);
  }

  /**
   * Sends a payload to a specific shard
   * 
   * @param shardId - Target shard ID
   * @param payload - Gateway payload to send
   * @throws {Error} If shard is not found
   */
  sendToShard(shardId: number, payload: any): void {
    const shard = this.shardManager.getShard(shardId);
    if (!shard) {
      throw new Error(`Shard ${shardId} not found`);
    }

    shard.send(payload);
  }

  /**
   * Updates presence (status and activities) on all shards
   * 
   * @param presence - New presence data
   * @returns Number of shards that received the update
   */
  updatePresence(presence: {
    activities?: any[];
    status?: 'online' | 'dnd' | 'idle' | 'invisible';
    afk?: boolean;
    since?: number | null;
  }): number {
    const payload = {
      op: 3, // PRESENCE_UPDATE opcode
      d: presence,
    };

    return this.broadcast(payload);
  }

  /**
   * Requests guild members for a specific guild
   * 
   * Useful for getting member information when intents are limited
   * or for large guilds where not all members are initially provided.
   * 
   * @param guildId - Guild ID to request members for
   * @param options - Request options
   */
  requestGuildMembers(guildId: string, options: {
    /** Query string to match usernames against (leave empty for all) */
    query?: string;
    /** Maximum number of members to return (0 for all) */
    limit?: number;
    /** Whether to include presence data */
    presences?: boolean;
    /** Specific user IDs to request */
    user_ids?: string[];
    /** Nonce for request tracking */
    nonce?: string;
  } = {}): void {
    const payload = {
      op: 8, // REQUEST_GUILD_MEMBERS opcode
      d: {
        guild_id: guildId,
        query: options.query || '',
        limit: options.limit || 0,
        presences: options.presences || false,
        user_ids: options.user_ids,
        nonce: options.nonce,
      },
    };

    // Broadcast to all shards since we don't know which has the guild
    this.broadcast(payload);
  }

  /**
   * Updates voice state for joining/leaving voice channels
   * 
   * @param guildId - Guild ID where the voice channel is located
   * @param channelId - Voice channel ID (null to disconnect)
   * @param options - Voice state options
   */
  updateVoiceState(guildId: string, channelId: string | null, options: {
    /** Whether to mute microphone */
    selfMute?: boolean;
    /** Whether to deafen audio */
    selfDeaf?: boolean;
  } = {}): void {
    const payload = {
      op: 4, // VOICE_STATE_UPDATE opcode
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
   * Gets cached gateway information
   * 
   * @returns Gateway information including recommended shard count
   */
  async getGatewayInfo(): Promise<GatewayInfo> {
    return this.shardManager.fetchGatewayInfo();
  }

  /**
   * Restarts a specific shard with graceful reconnection
   * 
   * @param shardId - Shard ID to restart
   */
  async restartShard(shardId: number): Promise<void> {
    await this.shardManager.restartShard(shardId);
  }

  /**
   * Restarts all shards with staggered timing to prevent rate limits
   */
  async restartAll(): Promise<void> {
    this.emit('debug', 'Restarting all shards');
    
    const shards = Array.from(this.shardManager.getShards().keys());
    
    for (const shardId of shards) {
      await this.restartShard(shardId);
      // Add delay between restarts to prevent overwhelming Discord
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Gets detailed statistics including top events and shard information
   * 
   * @returns Comprehensive statistics object
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
   * Sets up event forwarding between components
   * 
   * @private
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
        this.emit(processedEvent.type.toLowerCase() as keyof WebSocketClientEvents, processedEvent);
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
   * Type-safe event listener registration
   * 
   * @param event - Event name to listen for
   * @param listener - Event handler function
   * @returns This instance for chaining
   */
  override on<T extends keyof WebSocketClientEvents>(event: T, listener: WebSocketClientEvents[T]): this {
    return super.on(event as string, listener);
  }

  /**
   * Type-safe one-time event listener registration
   * 
   * @param event - Event name to listen for once
   * @param listener - Event handler function
   * @returns This instance for chaining
   */
  override once<T extends keyof WebSocketClientEvents>(event: T, listener: WebSocketClientEvents[T]): this {
    return super.once(event as string, listener);
  }

  /**
   * Type-safe event emission
   * 
   * @param event - Event name to emit
   * @param args - Event arguments
   * @returns True if event had listeners
   */
  override emit<T extends keyof WebSocketClientEvents>(event: T, ...args: Parameters<WebSocketClientEvents[T]>): boolean {
    return super.emit(event as string, ...args);
  }

  /**
   * Destroys the WebSocket client and cleans up all resources
   * 
   * After calling this method, the client cannot be reused.
   */
  async destroy(): Promise<void> {
    await this.disconnect();
    await this.shardManager.destroy();
    this.eventHandler.destroy();
    this.removeAllListeners();
    
    this.emit('debug', 'WebSocket client destroyed');
  }
}