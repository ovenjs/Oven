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
  Snowflake,
  UserSnowflake,
  GuildSnowflake,
  ChannelSnowflake,
  MessageSnowflake
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
  CacheManager,
  Logger
} from './advanced/generics.js';

// Export Phase 1.3: Advanced Compiler Features
export type {
  TransformerFactory,
  TransformerConfig,
  ClientExtensions,
  ChannelExtensions, 
  GuildExtensions,
  UserExtensions,
  MessageExtensions,
  EventMapExtensions,
  RESTEndpointExtensions,
  WebSocketEventExtensions,
  CacheExtensions,
  ConfigurationExtensions,
  FeatureFlag,
  RuntimeBehaviorConfig,
  Environment,
  PerformanceMode,
  BuildMode,
  Platform,
  TypeSafeConfig,
  ConditionalMethod,
  ConditionalReturn
} from './advanced/index.js';

export {
  optimizePropertyAccess,
  inlineSmallFunctions,
  constantFolding,
  stripDebugCode,
  optimizeTypeAssertions,
  generateTypeValidators,
  createTransformerProgram,
  applyMixins,
  ExtensionRegistry,
  Extension,
  createExtension,
  mergeExtensions,
  createRuntimeConfig,
  conditionalExecute
} from './advanced/index.js';

// Export Phase 2.1: Plugin Architecture System
export type {
  PluginManifest,
  PluginPermission,
  LoadedPlugin,
  PluginInstance,
  PluginContext,
  PluginLoader,
  DependencyGraph,
  DependencyInjector,
  PluginSandbox,
  PluginSystem,
  PluginSystemConfig,
  ResourceLimits,
  SandboxContext,
  SandboxResult,
  SecurityAuditResult
} from './plugins/index.js';

export {
  PluginStatus,
  createPluginLoader,
  createDependencyGraph,
  createDependencyInjector,
  createPluginSandbox,
  createPluginSystem
} from './plugins/index.js';

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