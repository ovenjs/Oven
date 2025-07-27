/**
 * WebSocket-specific types for OvenJS
 * Consolidates all WebSocket-related interfaces and types
 */

import type { 
  GatewayPresenceUpdateData,
  GatewayActivity 
} from 'discord-api-types/v10';
import type { BotToken, HeartbeatInterval } from '../primitives/index.js';

/**
 * Gateway information from Discord API
 */
export interface GatewayInfo {
  /** The WebSocket URL for connecting to the gateway */
  url: string;
  /** The recommended number of shards to use when connecting */
  shards: number;
  /** Information about the session start limit */
  session_start_limit: {
    /** The total number of session starts the current user is allowed */
    total: number;
    /** The remaining number of session starts the current user is allowed */
    remaining: number;
    /** Milliseconds left until limit resets */
    reset_after: number;
    /** The number of identify requests allowed per 5 seconds */
    max_concurrency: number;
  };
}

/**
 * Individual shard configuration options
 */
export interface ShardOptions {
  /** Shard ID (0-based) */
  id: number;
  /** Total number of shards */
  count: number;
  /** Bot token for authentication */
  token: BotToken;
  /** Gateway intents bitfield */
  intents: number;
  /** Gateway URL to connect to */
  gatewayURL?: string;
  /** Gateway version to use */
  version?: number;
  /** Encoding format for payloads */
  encoding?: 'json' | 'etf';
  /** Whether to use compression */
  compress?: boolean;
  /** Threshold for large guild handling */
  largeThreshold?: number;
  /** Initial presence data */
  presence?: PresenceUpdateData;
}

/**
 * Current status of a shard
 */
export interface ShardStatus {
  /** Shard ID */
  id: number;
  /** Current shard state */
  state: ShardState;
  /** Current ping/latency in milliseconds */
  ping: number;
  /** Timestamp of last heartbeat sent */
  lastHeartbeat: Date;
  /** Timestamp of last heartbeat ACK received */
  lastHeartbeatAck: Date;
  /** Current session ID (if available) */
  sessionId?: string;
  /** Resume gateway URL (if available) */
  resumeGatewayURL?: string;
  /** Current sequence number */
  sequence?: number;
  /** Last close code received */
  closeCode?: number;
  /** Last close reason received */
  closeReason?: string;
}

/**
 * Possible states for a shard connection
 */
export enum ShardState {
  /** Shard is idle/not connected */
  IDLE = 'idle',
  /** Shard is connecting to gateway */
  CONNECTING = 'connecting',
  /** WebSocket connection established but not identified */
  CONNECTED = 'connected',
  /** Shard is identifying with Discord */
  IDENTIFYING = 'identifying',
  /** Shard is ready and receiving events */
  READY = 'ready',
  /** Shard is resuming a previous session */
  RESUMING = 'resuming',
  /** Shard is reconnecting after disconnect */
  RECONNECTING = 'reconnecting',
  /** Shard is disconnected */
  DISCONNECTED = 'disconnected',
  /** Shard connection is zombie (heartbeat issues) */
  ZOMBIE = 'zombie',
  /** Shard is destroyed and cannot be used */
  DESTROYED = 'destroyed'
}

/**
 * Shard manager configuration options
 */
export interface ShardManagerOptions {
  /** Bot token for authentication */
  token: BotToken;
  /** Gateway intents bitfield */
  intents: number;
  /** Number of shards to use ('auto' for Discord recommended) */
  shardCount?: number | 'auto';
  /** Specific shard IDs to spawn (defaults to all) */
  shardIds?: number[];
  /** Gateway URL override */
  gatewayURL?: string;
  /** Gateway version to use */
  version?: number;
  /** Encoding format for payloads */
  encoding?: 'json' | 'etf';
  /** Whether to use compression */
  compress?: boolean;
  /** Threshold for large guild handling */
  largeThreshold?: number;
  /** Initial presence data for all shards */
  presence?: PresenceUpdateData;
  /** Delay between spawning shards (ms) */
  spawnDelay?: number;
  /** Timeout for shard spawn process (ms) */
  spawnTimeout?: number;
}

/**
 * Overall status of the shard manager
 */
export interface ShardManagerStatus {
  /** Total number of managed shards */
  totalShards: number;
  /** Number of shards in READY state */
  readyShards: number;
  /** Number of shards currently connecting */
  connectingShards: number;
  /** Number of disconnected shards */
  disconnectedShards: number;
  /** Status of individual shards */
  shards: ShardStatus[];
  /** Average ping across all shards */
  averagePing: number;
}

/**
 * Event handler configuration options
 */
export interface EventHandlerOptions {
  /** Whether to validate incoming events */
  validateEvents?: boolean;
  /** Whether to enable debug mode */
  debugMode?: boolean;
}

/**
 * A processed Discord gateway event
 */
export interface ProcessedEvent {
  /** Event type name */
  type: string;
  /** Event data payload */
  data: any;
  /** ID of shard that received the event */
  shardId: number;
  /** Gateway sequence number */
  sequence?: number;
  /** Timestamp when event was processed */
  timestamp: Date;
}

/**
 * Heartbeat manager configuration options
 */
export interface HeartbeatOptions {
  /** Heartbeat interval from Discord */
  interval: HeartbeatInterval;
  /** Callback when sending heartbeat */
  onHeartbeat: (sequence: number | null) => void;
  /** Callback when heartbeat is acknowledged */
  onHeartbeatAck: () => void;
  /** Callback when zombie connection is detected */
  onZombieConnection: () => void;
}

/**
 * Connection health information
 */
export interface ConnectionHealth {
  /** Whether the connection is considered alive */
  isAlive: boolean;
  /** Timestamp of last heartbeat sent */
  lastHeartbeat: Date;
  /** Timestamp of last heartbeat ACK received */
  lastHeartbeatAck: Date;
  /** Number of consecutive missed ACKs */
  missedAcks: number;
  /** Average latency over recent heartbeats */
  averageLatency: number;
  /** History of recent latency measurements */
  latencyHistory: number[];
}

/**
 * Presence update data for Discord
 */
export interface PresenceUpdateData {
  /** Array of activities */
  activities?: GatewayActivity[];
  /** Online status */
  status?: 'online' | 'dnd' | 'idle' | 'invisible';
  /** Whether user is AFK */
  afk?: boolean;
  /** Unix timestamp when user went AFK (null if not AFK) */
  since?: number | null;
}

/**
 * WebSocket client configuration options
 */
export interface WebSocketClientOptions {
  /** Bot token for authentication */
  token: BotToken;
  /** Gateway intents bitfield */
  intents: number;
  /** Number of shards to use */
  shardCount?: number | 'auto';
  /** Specific shard IDs to spawn */
  shardIds?: number[];
  /** Gateway URL override */
  gatewayURL?: string;
  /** Gateway version to use */
  version?: number;
  /** Encoding format for payloads */
  encoding?: 'json' | 'etf';
  /** Whether to use compression */
  compress?: boolean;
  /** Threshold for large guild handling */
  largeThreshold?: number;
  /** Initial presence data */
  presence?: PresenceUpdateData;
  /** Delay between spawning shards (ms) */
  spawnDelay?: number;
  /** Timeout for shard spawn process (ms) */
  spawnTimeout?: number;
  /** Whether to validate events */
  validateEvents?: boolean;
  /** Whether to enable debug mode */
  debugMode?: boolean;
  /** REST client instance (if available) */
  restClient?: any;
}

/**
 * Current status of the WebSocket client
 */
export interface WebSocketClientStatus {
  /** Whether client is connected */
  connected: boolean;
  /** Whether client is ready (all shards ready) */
  ready: boolean;
  /** Shard manager status */
  shardManager: ShardManagerStatus;
  /** Event processing statistics */
  eventStats: Record<string, number>;
  /** Total events processed */
  totalEvents: number;
  /** Current events per second rate */
  eventsPerSecond: number;
}