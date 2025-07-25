/**
 * Main WebSocket client for Discord gateway
 * Orchestrates sharding, event handling, and connection management
 */
import { EventEmitter } from 'events';
import type { BotToken, GatewayInfo } from '@ovenjs/types';
import { ShardManager, ShardManagerStatus } from '../sharding/index.js';
import { EventHandler, ProcessedEvent } from '../handlers/index.js';
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
    restClient?: any;
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
export declare class WebSocketClient extends EventEmitter {
    private readonly options;
    private readonly shardManager;
    private readonly eventHandler;
    private readonly restClient?;
    private connected;
    private ready;
    constructor(options: WebSocketClientOptions);
    /**
     * Connect to Discord gateway
     */
    connect(): Promise<void>;
    /**
     * Disconnect from Discord gateway
     */
    disconnect(): Promise<void>;
    /**
     * Check if client is connected
     */
    isConnected(): boolean;
    /**
     * Check if client is ready (all shards ready)
     */
    isReady(): boolean;
    /**
     * Get client status
     */
    getStatus(): WebSocketClientStatus;
    /**
     * Get shard manager
     */
    getShardManager(): ShardManager;
    /**
     * Get event handler
     */
    getEventHandler(): EventHandler;
    /**
     * Send payload to all shards
     */
    broadcast(payload: any): number;
    /**
     * Send payload to specific shard
     */
    sendToShard(shardId: number, payload: any): void;
    /**
     * Update presence on all shards
     */
    updatePresence(presence: {
        activities?: any[];
        status?: 'online' | 'dnd' | 'idle' | 'invisible';
        afk?: boolean;
        since?: number | null;
    }): number;
    /**
     * Request guild members for a guild
     */
    requestGuildMembers(guildId: string, options?: {
        query?: string;
        limit?: number;
        presences?: boolean;
        user_ids?: string[];
        nonce?: string;
    }): void;
    /**
     * Update voice state
     */
    updateVoiceState(guildId: string, channelId: string | null, options?: {
        selfMute?: boolean;
        selfDeaf?: boolean;
    }): void;
    /**
     * Get gateway information
     */
    getGatewayInfo(): Promise<GatewayInfo>;
    /**
     * Restart a specific shard
     */
    restartShard(shardId: number): Promise<void>;
    /**
     * Restart all shards
     */
    restartAll(): Promise<void>;
    /**
     * Get detailed statistics
     */
    getDetailedStats(): {
        client: WebSocketClientStatus;
        topEvents: Array<{
            type: string;
            count: number;
        }>;
        shardDetails: any[];
    };
    /**
     * Setup event handlers for shard manager and event handler
     */
    private setupEventHandlers;
    /**
     * Add event listener with type safety
     */
    on<T extends keyof WebSocketClientEvents>(event: T, listener: WebSocketClientEvents[T]): this;
    /**
     * Add one-time event listener with type safety
     */
    once<T extends keyof WebSocketClientEvents>(event: T, listener: WebSocketClientEvents[T]): this;
    /**
     * Emit event with type safety
     */
    emit<T extends keyof WebSocketClientEvents>(event: T, ...args: Parameters<WebSocketClientEvents[T]>): boolean;
    /**
     * Destroy the WebSocket client
     */
    destroy(): Promise<void>;
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
    resumed: (event: ProcessedEvent) => void;
    guild_create: (event: ProcessedEvent) => void;
    guild_update: (event: ProcessedEvent) => void;
    guild_delete: (event: ProcessedEvent) => void;
    message_create: (event: ProcessedEvent) => void;
    message_update: (event: ProcessedEvent) => void;
    message_delete: (event: ProcessedEvent) => void;
}
//# sourceMappingURL=WebSocketClient.d.ts.map