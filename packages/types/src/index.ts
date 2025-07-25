/**
 * OvenJS Types - Main package exports
 * Advanced TypeScript definitions for OvenJS Discord API wrapper
 */

// Primitive types
export * from './primitives/index.js';

// Discord API types
export * from './discord/index.js';

// Advanced TypeScript utilities
export * from './advanced/index.js';

// Utility functions and type guards
export * from './utils/index.js';

// Plugin system types
export * from './plugins.js';

// Version info
export const VERSION = '0.1.0' as const;
export const API_SUPPORT = {
  DISCORD_API_VERSION: 10,
  GATEWAY_VERSION: 10,
} as const;