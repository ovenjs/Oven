/**
 * Discord API type definitions
 *
 * This file extends the types from discord-api-types with additional
 * types specific to the enhanced REST client implementation.
 */

import * as Discord from 'discord-api-types/v10';
import type { Dispatcher } from 'undici';

// Re-export all discord-api-types for convenience
export * from 'discord-api-types/v10';

// Enhanced types that build on discord-api-types

// Import common types
import type { RequestPriority, CacheStrategy } from './common';

// Branded types for additional type safety
export type Snowflake = Discord.Snowflake & { readonly __snowflake__: unique symbol };

export type ISO8601Timestamp = string & { readonly __timestamp__: unique symbol };

// Enhanced request/response types
export interface APIRequest<T = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  data?: T;
  options?: RequestOptions;
  priority?: RequestPriority;
  cacheKey?: string;
  retryCount?: number;
}

export interface APIResponse<T = unknown> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  cached: boolean;
  requestTime: number;
  timestamp: number;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  auth?: boolean;
  body?: any;
  headers?: Record<string, string>;
  query?: Record<string, any>;
  files?: Array<{
    key: string;
    data: Buffer | string;
    name: string;
    contentType: string;
  }>;
  reason?: string;
  timeout?: number;
  signal?: AbortSignal;
  retryOptions?: RetryOptions;
  cacheOptions?: CacheOptions;
  disableBatching?: boolean;
}

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  maxRetryDelay?: number;
  retryableStatusCodes?: number[];
  retryableErrorCodes?: Discord.RESTJSONErrorCodes[];
}

export interface CacheOptions {
  enabled?: boolean;
  ttl?: number;
  strategy?: CacheStrategy;
  key?: string;
  forceRefresh?: boolean;
  staleWhileRevalidate?: boolean;
}

// Rate limiting types
export interface RateLimitInfo {
  global: boolean;
  bucketId?: string;
  limit: number;
  remaining: number;
  reset: number;
  resetAfter: number;
  retryAfter?: number;
  maxUses?: number;
}

export interface BucketInfo {
  id: string;
  limit: number;
  remaining: number;
  reset: number;
  resetAfter: number;
  requests: QueuedRequest[];
  processing: boolean;
  lastUsed: number;
}

export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  priority: RequestPriority;
  timestamp: number;
  resolve: (value: APIResponse) => void;
  reject: (reason: Error) => void;
  timeout?: NodeJS.Timeout;
}

// Event types
export interface RESTEventMap {
  request: [RequestEvent];
  response: [ResponseEvent];
  error: [ErrorEvent];
  rateLimit: [RateLimitEvent];
  debug: [DebugEvent];
  cacheHit: [CacheEvent];
  cacheMiss: [CacheEvent];
  queueAdd: [QueueEvent];
  queueProcess: [QueueEvent];
  metrics: [MetricsEvent];
}

export interface RequestEvent {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  timestamp: number;
  priority: RequestPriority;
  cached: boolean;
}

export interface ResponseEvent {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  status: number;
  requestTime: number;
  cached: boolean;
  rateLimitInfo?: RateLimitInfo;
}

export interface ErrorEvent {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  error: Error;
  timestamp: number;
  retryCount: number;
}

export interface RateLimitEvent {
  global: boolean;
  bucketId?: string;
  retryAfter: number;
  limit: number;
  remaining: number;
  reset: number;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

export interface DebugEvent {
  type: string;
  message: string;
  timestamp: number;
  data?: any;
}

export interface CacheEvent {
  key: string;
  timestamp: number;
  ttl?: number;
  hit: boolean;
  data?: any;
}

export interface QueueEvent {
  bucketId: string;
  queueSize: number;
  processing: boolean;
  request?: QueuedRequest;
}

export interface MetricsEvent {
  timestamp: number;
  requests: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
  };
  performance: {
    averageRequestTime: number;
    minRequestTime: number;
    maxRequestTime: number;
  };
  rateLimits: {
    globalHits: number;
    bucketHits: number;
  };
  cache: {
    hits: number;
    misses: number;
    size: number;
  };
}

// Client configuration types
export interface RESTOptions {
  agent?: Dispatcher | null;
  api?: string;
  apiVersion?: string | number;
  version?: number;
  authPrefix?: string;
  cdn?: string;
  headers?: Record<string, string>;
  invalidRequestWarningInterval?: number;
  globalRequestsPerSecond?: number;
  offset?: number;
  rejectOnRateLimit?: null | ((url: string) => boolean);
  retries?: number;
  timeout?: number;
  userAgentAppendix?: string;
  versionPrefix?: string;
  token?: string;
  baseURL?: string;
  cache?: CacheOptions;
  retry?: RetryOptions;
  rateLimit?: RateLimitOptions;
  events?: EventOptions;
  metrics?: MetricsOptions;
  debug?: boolean;
  connection?: any;
  batch?: any;
  error?: any;
  logger?: any;
  monitoring?: any;
  transform?: any;
}

export interface RateLimitOptions {
  enabled?: boolean;
  maxConcurrent?: number;
  maxRequestsPerSecond?: number;
  burstRatio?: number;
  predictiveMode?: boolean;
  jitter?: boolean;
}

export interface EventOptions {
  enabled?: boolean;
  maxListeners?: number;
  captureRejections?: boolean;
  batchSize?: number;
  batchTimeout?: number;
}

export interface MetricsOptions {
  enabled?: boolean;
  interval?: number;
  retentionPeriod?: number;
  customMetrics?: Record<string, any>;
  reporting?: {
    enabled?: boolean;
    format?: 'json' | 'prometheus' | 'influxdb' | 'console';
    destination?: 'console' | 'file' | 'http' | 'webhook';
    interval?: number;
    endpoint?: string;
    headers?: Record<string, string>;
    filename?: string;
    includeMetadata?: boolean;
    includeHistograms?: boolean;
    includeTimers?: boolean;
    maxMetricsPerReport?: number;
  };
}

// Middleware types
export interface MiddlewareContext {
  request: APIRequest;
  response?: APIResponse;
  error?: Error;
  timestamp: number;
  client: RESTClient;
}

export interface RequestMiddleware {
  (context: MiddlewareContext, next: () => Promise<APIResponse>): Promise<APIResponse>;
}

export interface ResponseMiddleware {
  (context: MiddlewareContext, next: () => Promise<APIResponse>): Promise<APIResponse>;
}

export interface ErrorMiddleware {
  (context: MiddlewareContext, next: () => Promise<APIResponse>): Promise<APIResponse>;
}

// Cache types
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  metadata?: Record<string, any>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  averageAccessTime: number;
  memoryUsage: number;
}

// Connection pool types
export interface ConnectionPoolOptions {
  maxConnections?: number;
  maxFreeConnections?: number;
  connectionTimeout?: number;
  keepAlive?: boolean;
  keepAliveTimeout?: number;
  pipelining?: boolean;
}

export interface ConnectionStats {
  total: number;
  active: number;
  idle: number;
  pending: number;
  closed: number;
  errors: number;
}

// Utility types

// Type guards
export function isSnowflake(value: string): value is Snowflake {
  return /^\d{17,19}$/.test(value);
}

export function isISO8601Timestamp(value: string): value is ISO8601Timestamp {
  return !isNaN(Date.parse(value));
}

export function isAPIRequest(value: any): value is APIRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.method === 'string' &&
    typeof value.path === 'string'
  );
}

export function isAPIResponse(value: any): value is APIResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.status === 'number' &&
    typeof value.statusText === 'string' &&
    typeof value.headers === 'object'
  );
}

// Type utilities
export type ExtractAPIResponse<T extends APIRequest<any>> =
  T extends APIRequest<infer R> ? R : unknown;

export type WithPriority<T extends APIRequest<any>, P extends RequestPriority> = T & {
  priority: P;
};

export type WithCache<T extends APIRequest<any>, C extends CacheOptions> = T & {
  cacheOptions: C;
};

export type WithRetry<T extends APIRequest<any>, R extends RetryOptions> = T & {
  retryOptions: R;
};

// API route types
export type APIRoute =
  | '/users/@me'
  | `/users/${Discord.Snowflake}`
  | `/channels/${Discord.Snowflake}`
  | `/guilds/${Discord.Snowflake}`
  | `/messages/${Discord.Snowflake}`
  | `/webhooks/${Discord.Snowflake}`
  | `/emojis/${Discord.Snowflake}`
  | `/roles/${Discord.Snowflake}`
  | `/invites/${string}`
  | `/guilds/templates/${string}`
  | '/voice/regions'
  | `/applications/${Discord.Snowflake}`
  | `/guilds/${Discord.Snowflake}/audit-logs`
  | '/gateway/bot';

// Route data for rate limiting
export interface RouteData {
  /**
   * The major parameter for the route (e.g., guild ID, channel ID)
   */
  majorParameter: string;

  /**
   * The bucket ID for the route
   */
  bucketId: string;

  /**
   * The endpoint for the route
   */
  endpoint: string;

  /**
   * The HTTP method for the route
   */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

// REST client type (forward declaration)
export interface RESTClient {
  // This will be defined in the client types file
  readonly options: RESTOptions;
}
