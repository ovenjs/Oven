/**
 * WebSocket-specific types for OvenJS
 */

import type { BotToken } from '../primitives/brand.js';

/**
 * Gateway information from Discord
 */
export interface GatewayInfo {
  url: string;
  shards: number;
  session_start_limit: {
    total: number;
    remaining: number;
    reset_after: number;
    max_concurrency: number;
  };
}

/**
 * Shard options
 */
export interface ShardOptions {
  id: number;
  total: number;
  token: BotToken;
  intents: number;
  gatewayURL?: string;
  version?: number;
  encoding?: 'json' | 'etf';
  compress?: boolean;
  largeThreshold?: number;
  presence?: PresenceUpdateData;
}

/**
 * Shard status
 */
export interface ShardStatus {
  id: number;
  state: ShardState;
  ping: number;
  lastHeartbeat: number;
  lastHeartbeatAck: number;
  sessionId?: string;
  resumeGatewayURL?: string;
  sequence?: number;
}

/**
 * Shard state enum
 */
export enum ShardState {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  READY = 'ready',
  RESUMING = 'resuming',
  DISCONNECTED = 'disconnected',
  DESTROYED = 'destroyed'
}

/**
 * Shard manager options
 */
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
  presence?: PresenceUpdateData;
  spawnDelay?: number;
  spawnTimeout?: number;
}

/**
 * Shard manager status
 */
export interface ShardManagerStatus {
  shards: ShardStatus[];
  totalShards: number;
  readyShards: number;
  connectedShards: number;
  averagePing: number;
}

/**
 * Event handler options
 */
export interface EventHandlerOptions {
  validateEvents?: boolean;
  debugMode?: boolean;
}

/**
 * Processed event
 */
export interface ProcessedEvent {
  type: string;
  data: any;
  shardId: number;
  timestamp: number;
  sequence?: number;
}

/**
 * Heartbeat options
 */
export interface HeartbeatOptions {
  interval: number;
  shardId: number;
}

/**
 * Connection health information
 */
export interface ConnectionHealth {
  ping: number;
  lastHeartbeat: number;
  lastHeartbeatAck: number;
  missedHeartbeats: number;
  isHealthy: boolean;
}

/**
 * Presence update data
 */
export interface PresenceUpdateData {
  activities?: any[]; // Use discord-api-types ActivityData
  status?: 'online' | 'dnd' | 'idle' | 'invisible';
  afk?: boolean;
  since?: number | null;
}