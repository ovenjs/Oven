/**
 * Shard manager for handling multiple WebSocket connections
 * Manages Discord gateway sharding with automatic scaling
 */
import { EventEmitter } from 'events';
import type { BotToken, GatewayInfo } from '@ovenjs/types';
import { Shard, ShardStatus } from './Shard.js';
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
export declare class ShardManager extends EventEmitter {
    private readonly options;
    private readonly shards;
    private gatewayInfo?;
    private spawnQueue;
    private spawning;
    constructor(options: ShardManagerOptions);
    /**
     * Calculate the recommended number of shards
     */
    calculateShards(): Promise<number>;
    /**
     * Fetch gateway information from Discord
     */
    fetchGatewayInfo(): Promise<GatewayInfo>;
    /**
     * Spawn all shards
     */
    spawnAll(): Promise<void>;
    /**
     * Spawn a specific shard
     */
    spawnShard(id: number, totalShards?: number): Promise<Shard>;
    /**
     * Kill a specific shard
     */
    killShard(id: number): Promise<void>;
    /**
     * Restart a specific shard
     */
    restartShard(id: number): Promise<void>;
    /**
     * Get a specific shard
     */
    getShard(id: number): Shard | undefined;
    /**
     * Get all shards
     */
    getShards(): Map<number, Shard>;
    /**
     * Connect all shards
     */
    connectAll(): Promise<void>;
    /**
     * Disconnect all shards
     */
    disconnectAll(): Promise<void>;
    /**
     * Get manager status
     */
    getStatus(): ShardManagerStatus;
    /**
     * Broadcast a payload to all ready shards
     */
    broadcast(payload: any): number;
    /**
     * Check if all shards are ready
     */
    isReady(): boolean;
    /**
     * Get the first ready shard (for single-shard operations)
     */
    getFirstShard(): Shard | undefined;
    /**
     * Process the spawn queue with proper rate limiting
     */
    private processSpawnQueue;
    /**
     * Wait for a shard to become ready
     */
    private waitForShardReady;
    /**
     * Setup event handlers for a shard
     */
    private setupShardEvents;
    /**
     * Destroy the shard manager
     */
    destroy(): Promise<void>;
}
//# sourceMappingURL=ShardManager.d.ts.map