/**
 * @fileoverview Advanced TypeScript definitions for OvenJS Discord API wrapper
 * Provides sophisticated type system with brand types, phantom types, and advanced generics
 */

// Export primitive types
export * from './primitives/index.js';

// Export advanced types (selective to avoid conflicts)
export type {
  DeepReadonly,
  DeepPartial,
  StrictOmit,
  StrictPick,
  RequiredKeys,
  OptionalKeys,
  Prettify,
  ValueOf
} from './primitives/utility.js';

export type {
  Phantom,
  Brand,
  Validated,
  Sanitized,
  Encrypted
} from './primitives/brand.js';

// Export core Discord types
export type {
  APIUser,
  APIGuild,
  APIChannel,
  APIMessage,
  BotUser,
  RegularUser,
  SystemUser,
  WebhookUser,
  GuildTextChannel,
  ChannelType,
  MessageType
} from './discord/entities.js';

// Export advanced generics
export type {
  DiscordEntity,
  Repository,
  TypedEventEmitter,
  Manager,
  Plugin,
  PluginContext,
  CacheManager,
  Logger
} from './advanced/generics.js';

// Export utilities
export type {
  TypeGuard,
  CompoundTypeGuard
} from './utils/guards.js';

export {
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isSnowflake,
  isAPIUser,
  isAPIGuild,
  isAPIChannel,
  isAPIMessage,
  createTypeGuard
} from './utils/guards.js';