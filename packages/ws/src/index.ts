/**
 * OvenJS WebSocket - Discord WebSocket client with comprehensive gateway management
 * 
 * This package provides a robust WebSocket client for Discord's gateway API with:
 * - Automatic shard management and scaling
 * - Event processing and validation
 * - Connection health monitoring
 * - Type-safe event handling
 * - Comprehensive Discord event support
 * 
 * @example
 * ```typescript
 * import { WebSocketClient } from '@ovenjs/ws';
 * import { GatewayIntentBits } from '@ovenjs/types';
 * 
 * const client = new WebSocketClient({
 *   token: 'Bot YOUR_BOT_TOKEN' as BotToken,
 *   intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMessages
 * });
 * 
 * client.on('ready', () => console.log('Connected!'));
 * client.on('guild_create', (event) => console.log(`Joined ${event.data.name}`));
 * 
 * await client.connect();
 * ```
 * 
 * @author OvenJS Team
 * @since 0.1.0
 */

// Main exports
export { WebSocketClient } from './client/index.js';
export type { WebSocketClientEvents } from './client/index.js';

// Component exports for advanced usage
export { Shard, ShardManager } from './sharding/index.js';
export { EventHandler } from './handlers/index.js';
export { HeartbeatManager } from './heartbeat/index.js';

// Version info
export const VERSION = '0.1.0' as const;

// Re-export common types from @ovenjs/types for convenience
export type {
  // WebSocket client types
  WebSocketClientOptions,
  WebSocketClientStatus,
  
  // Shard management types
  ShardOptions,
  ShardStatus,
  ShardManagerOptions,
  ShardManagerStatus,
  ShardState,
  
  // Event handling types
  EventHandlerOptions,
  ProcessedEvent,
  
  // Heartbeat types
  HeartbeatOptions,
  ConnectionHealth,
  
  // Gateway types
  GatewayInfo,
  PresenceUpdateData,
  
  // Primitive types
  BotToken,
  HeartbeatInterval
} from '@ovenjs/types';