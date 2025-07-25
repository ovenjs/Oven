/**
 * OvenJS WebSocket - Discord WebSocket client
 * Advanced WebSocket client with sharding and connection management
 */
// Main client
export { WebSocketClient } from './client/index.js';
// Sharding
export { Shard, ShardManager, ShardState } from './sharding/index.js';
// Event handling
export { EventHandler } from './handlers/index.js';
// Heartbeat management
export { HeartbeatManager } from './heartbeat/index.js';
// Version info
export const VERSION = '0.1.0';
//# sourceMappingURL=index.js.map