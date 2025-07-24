/**
 * @fileoverview Advanced TypeScript definitions for OvenJS Discord API wrapper
 * Provides sophisticated type system with brand types, phantom types, and advanced generics
 */

// Export all core types
export * from './primitives/index.js';
export * from './discord/index.js';
export * from './advanced/index.js';
export * from './utils/index.js';

// Re-export for convenience
export type {
  // Brand types
  Snowflake,
  BrandedId,
  
  // Advanced generics
  DeepReadonly,
  DeepPartial,
  StrictOmit,
  StrictPick,
  
  // Discord API types
  APIUser,
  APIGuild,
  APIChannel,
  APIMessage,
  
  // Utility types
  ExtractEventData,
  InferManagerType,
  PluginConfiguration
} from './advanced/index.js';