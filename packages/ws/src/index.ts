/**
 * OvenJS WebSocket - Discord WebSocket client
 * Advanced WebSocket client with sharding and connection management
 */

// Main client
export { WebSocketClient } from './client/index.js';
export type { WebSocketClientOptions, WebSocketClientStatus, WebSocketClientEvents } from './client/index.js';

// Sharding
export { Shard, ShardManager, ShardState } from './sharding/index.js';
export type { ShardOptions, ShardStatus, ShardManagerOptions, ShardManagerStatus } from './sharding/index.js';

// Event handling
export { EventHandler } from './handlers/index.js';
export type { EventHandlerOptions, ProcessedEvent } from './handlers/index.js';

// Heartbeat management
export { HeartbeatManager } from './heartbeat/index.js';
export type { HeartbeatOptions, ConnectionHealth } from './heartbeat/index.js';

// Version info
export const VERSION = '0.1.0' as const;