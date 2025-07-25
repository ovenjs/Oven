/**
 * OvenJS Core - Main Discord client
 * Orchestrates REST and WebSocket connections with comprehensive management
 */

// Main client
export { OvenClient } from './client/index.js';

// Structures
export { Base, Collection, User, Guild } from './structures/index.js';

// Managers
export { BaseManager, UserManager, GuildManager, ChannelManager } from './managers/index.js';

// Configuration
export { ConfigManager } from './config/index.js';

// Version info
export const VERSION = '0.1.0' as const;