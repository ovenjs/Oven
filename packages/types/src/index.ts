/**
 * OvenJS Types - Package-specific types and re-exports
 * Focused on internal package types and enhanced Discord API types
 */

// Re-export commonly used discord-api-types
export * from 'discord-api-types/v10';

// Package-specific types (avoiding conflicts)
export type {
  OvenClientOptions,
  ClientConfig,
  RESTConfig,
  WebSocketConfig,
  CacheConfig,
  PresenceData,
  ClientEvents,
  OvenClientError
} from './client/index.js';

export type {
  RESTOptions,
  HTTPMethod,
  RequestOptions,
  FileData,
  APIResponse,
  RateLimitData,
  RequestConfig,
  BatchRequestResult,
  RouteOptions,
  BucketInfo,
  QueuedRequest,
  APIErrorResponse,
  APIErrorDetail,
  RateLimitHeaders
} from './rest/index.js';

export type {
  GatewayInfo,
  ShardOptions,
  ShardStatus,
  ShardManagerOptions,
  ShardManagerStatus,
  EventHandlerOptions,
  ProcessedEvent,
  HeartbeatOptions,
  ConnectionHealth,
  PresenceUpdateData
} from './ws/index.js';

export type {
  ManagerOptions,
  CollectionOptions,
  CacheStats
} from './cache/index.js';

export type {
  BaseStructureOptions,
  Awaitable,
  PartialBy,
  RequiredBy,
  PropertyType,
  JSONSerializable
} from './utils/index.js';

// Constants
export {
  API_VERSION,
  API_BASE_URL,
  CDN_BASE_URL,
  GATEWAY_VERSION,
  DISCORD_TIMEOUTS,
  RATE_LIMIT
} from './constants/index.js';

export { ShardState } from './ws/index.js';

// Internal primitives (using aliases to avoid conflicts)
export type {
  Brand,
  BotToken,
  UserToken,
  ImageURL,
  WebhookURL,
  ISO8601Timestamp,
  UnixTimestamp
} from './primitives/brand.js';

export type {
  Milliseconds,
  Seconds,
  HeartbeatInterval
} from './primitives/time.js';

export { s, ms, m, h, d } from './primitives/time.js';