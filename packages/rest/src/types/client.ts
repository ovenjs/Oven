/**
 * Client type definitions for the enhanced REST client
 *
 * This file contains type definitions specific to the REST client implementation,
 * including configuration options, request/response types, and client interfaces.
 */

import * as Discord from 'discord-api-types/v10';
import type {
  APIRequest,
  APIResponse,
  RateLimitInfo,
  BucketInfo,
  MiddlewareContext
} from './api';

// Import common types
import type {
  RequestPriority,
  CacheStrategy,
  ErrorType
} from './common';

// REST Client types
export interface RESTClient {
  /**
   * The finalized REST options after validation.
   */
  readonly options: Readonly<RESTOptions>;

  /**
   * Make a request to the Discord API
   */
  request<T = unknown>(request: APIRequest): Promise<APIResponse<T>>;

  /**
   * Make a GET request to the Discord API
   */
  get<T = unknown>(path: string, options?: Omit<APIRequest, 'method' | 'path'>): Promise<APIResponse<T>>;

  /**
   * Make a POST request to the Discord API
   */
  post<T = unknown>(path: string, options?: Omit<APIRequest, 'method' | 'path'>): Promise<APIResponse<T>>;

  /**
   * Make a PUT request to the Discord API
   */
  put<T = unknown>(path: string, options?: Omit<APIRequest, 'method' | 'path'>): Promise<APIResponse<T>>;

  /**
   * Make a PATCH request to the Discord API
   */
  patch<T = unknown>(path: string, options?: Omit<APIRequest, 'method' | 'path'>): Promise<APIResponse<T>>;

  /**
   * Make a DELETE request to the Discord API
   */
  delete<T = unknown>(path: string, options?: Omit<APIRequest, 'method' | 'path'>): Promise<APIResponse<T>>;

  /**
   * Set the authentication token
   */
  setToken(token: string): this;

  /**
   * Get the current rate limit status for a specific route
   */
  getRateLimitStatus(route: string, method: string): RateLimitInfo;

  /**
   * Get the global rate limit status
   */
  getGlobalRateLimitStatus(): { isRateLimited: boolean; resetAfter: number };

  /**
   * Get the current bucket information
   */
  getBucketInfo(route: string, method: string): BucketInfo | null;

  /**
   * Add a request middleware
   */
  useRequest(middleware: RequestMiddleware): this;

  /**
   * Add a response middleware
   */
  useResponse(middleware: ResponseMiddleware): this;

  /**
   * Add an error middleware
   */
  useError(middleware: ErrorMiddleware): this;

  /**
   * Remove a middleware
   */
  removeMiddleware(middleware: RequestMiddleware | ResponseMiddleware | ErrorMiddleware): this;

  /**
   * Add an event listener
   */
  on<K extends keyof RESTEventMap>(event: K, listener: (...args: RESTEventMap[K]) => void): this;

  /**
   * Add a one-time event listener
   */
  once<K extends keyof RESTEventMap>(event: K, listener: (...args: RESTEventMap[K]) => void): this;

  /**
   * Remove an event listener
   */
  off<K extends keyof RESTEventMap>(event: K, listener: (...args: RESTEventMap[K]) => void): this;

  /**
   * Remove all event listeners or listeners for a specific event
   */
  removeAllListeners<K extends keyof RESTEventMap>(event?: K): this;

  /**
   * Emit an event
   */
  emit<K extends keyof RESTEventMap>(event: K, ...args: RESTEventMap[K]): boolean;

  /**
   * Get the current metrics
   */
  getMetrics(): ClientMetrics;

  /**
   * Get the cache statistics
   */
  getCacheStats(): CacheStats;

  /**
   * Clear the cache
   */
  clearCache(): this;

  /**
   * Destroy the client and clean up resources
   */
  destroy(): void;
}

// Event map for the REST client
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
  ready: [];
  destroy: [];
}

// Event types
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
  request?: {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    priority: RequestPriority;
  };
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

// Middleware types
export interface RequestMiddleware {
  (context: MiddlewareContext, next: () => Promise<APIResponse>): Promise<APIResponse>;
}

export interface ResponseMiddleware {
  (context: MiddlewareContext, next: () => Promise<APIResponse>): Promise<APIResponse>;
}

export interface ErrorMiddleware {
  (context: MiddlewareContext, next: () => Promise<APIResponse>): Promise<APIResponse>;
}

// Metrics types
export interface ClientMetrics {
  uptime: number;
  requests: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
    rate: number; // requests per second
  };
  performance: {
    averageRequestTime: number;
    minRequestTime: number;
    maxRequestTime: number;
    p95RequestTime: number;
    p99RequestTime: number;
  };
  rateLimits: {
    globalHits: number;
    bucketHits: number;
    averageWaitTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
    memoryUsage: number;
  };
  errors: {
    total: number;
    byType: Record<ErrorType, number>;
    byStatusCode: Record<number, number>;
  };
  connections: {
    active: number;
    idle: number;
    total: number;
  };
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  averageAccessTime: number;
  memoryUsage: number;
  entries: {
    oldest: number;
    newest: number;
    averageTTL: number;
  };
}

// Enhanced REST options with defaults
export interface RESTOptions {
  /**
   * The bot token used for authentication
   */
  token?: string;

  /**
   * The Discord API version to use
   * @default 10
   */
  version?: number;

  /**
   * Request timeout in milliseconds
   * @default 15000
   */
  timeout?: number;

  /**
   * Maximum number of retries for failed requests
   * @default 3
   */
  retries?: number;

  /**
   * User agent string for requests
   * @default 'OvenJS (https://github.com/ovenjs, 0.0.0)'
   */
  userAgent?: string;

  /**
   * Base URL for the Discord API
   * @default 'https://discord.com/api'
   */
  baseURL?: string;

  /**
   * Default headers to include in all requests
   */
  headers?: Record<string, string>;

  /**
   * Cache configuration
   */
  cache?: {
    /**
     * Enable caching
     * @default true
     */
    enabled?: boolean;

    /**
     * Cache strategy to use
     * @default 'memory'
     */
    strategy?: CacheStrategy;

    /**
     * Default TTL for cache entries in milliseconds
     * @default 300000 (5 minutes)
     */
    ttl?: number;

    /**
     * Maximum cache size
     * @default 1000
     */
    maxSize?: number;

    /**
     * Enable stale-while-revalidate
     * @default false
     */
    staleWhileRevalidate?: boolean;
  };

  /**
   * Retry configuration
   */
  retry?: {
    /**
     * Enable automatic retries
     * @default true
     */
    enabled?: boolean;

    /**
     * Maximum number of retries
     * @default 3
     */
    maxRetries?: number;

    /**
     * Base delay for retries in milliseconds
     * @default 1000
     */
    baseDelay?: number;

    /**
     * Maximum delay for retries in milliseconds
     * @default 30000
     */
    maxDelay?: number;

    /**
     * Backoff multiplier
     * @default 2
     */
    backoffMultiplier?: number;

    /**
     * Enable jitter in retry delays
     * @default true
     */
    jitter?: boolean;

    /**
     * HTTP status codes to retry on
     * @default [429, 500, 502, 503, 504]
     */
    retryableStatusCodes?: number[];

    /**
     * Discord error codes to retry on
     */
    retryableErrorCodes?: Discord.RESTJSONErrorCodes[];
  };

  /**
   * Rate limiting configuration
   */
  rateLimit?: {
    /**
     * Enable rate limiting
     * @default true
     */
    enabled?: boolean;

    /**
     * Maximum concurrent requests
     * @default 50
     */
    maxConcurrent?: number;

    /**
     * Maximum requests per second
     * @default 50
     */
    maxRequestsPerSecond?: number;

    /**
     * Burst ratio for rate limiting
     * @default 1.5
     */
    burstRatio?: number;

    /**
     * Enable predictive rate limiting
     * @default true
     */
    predictiveMode?: boolean;

    /**
     * Enable jitter in rate limit delays
     * @default true
     */
    jitter?: boolean;
  };

  /**
   * Event system configuration
   */
  events?: {
    /**
     * Enable event system
     * @default true
     */
    enabled?: boolean;

    /**
     * Maximum number of event listeners
     * @default 100
     */
    maxListeners?: number;

    /**
     * Enable error capture for event listeners
     * @default false
     */
    captureRejections?: boolean;

    /**
     * Event batch size for performance optimization
     * @default 10
     */
    batchSize?: number;

    /**
     * Event batch timeout in milliseconds
     * @default 100
     */
    batchTimeout?: number;
  };

  /**
   * Metrics configuration
   */
  metrics?: {
    /**
     * Enable metrics collection
     * @default true
     */
    enabled?: boolean;

    /**
     * Metrics collection interval in milliseconds
     * @default 60000 (1 minute)
     */
    interval?: number;

    /**
     * Metrics retention period in milliseconds
     * @default 3600000 (1 hour)
     */
    retentionPeriod?: number;

    /**
     * Custom metrics to track
     */
    customMetrics?: Record<string, any>;
  };

  /**
   * Debug mode configuration
   */
  debug?: boolean | {
    /**
     * Enable debug mode
     * @default false
     */
    enabled?: boolean;

    /**
     * Debug log level
     * @default 'info'
     */
    level?: 'debug' | 'info' | 'warn' | 'error';

    /**
     * Enable detailed request logging
     * @default false
     */
    requests?: boolean;

    /**
     * Enable detailed response logging
     * @default false
     */
    responses?: boolean;

    /**
     * Enable detailed rate limit logging
     * @default false
     */
    rateLimits?: boolean;

    /**
     * Enable detailed cache logging
     * @default false
     */
    cache?: boolean;
  };
}

// Request and response types
export interface RESTRequest<T = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  data?: T;
  options?: {
    headers?: Record<string, string>;
    timeout?: number;
    signal?: AbortSignal;
  };
  priority?: RequestPriority;
  cacheKey?: string;
  retryCount?: number;
}

export interface RESTResponse<T = unknown> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  cached: boolean;
  requestTime: number;
  timestamp: number;
  rateLimitInfo?: RateLimitInfo;
}

// Utility types
export type RESTRequestOptions = Omit<RESTRequest, 'method' | 'path'>;


// Type guards
export function isRESTRequest(value: any): value is RESTRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.method === 'string' &&
    typeof value.path === 'string' &&
    ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(value.method)
  );
}

export function isRESTResponse(value: any): value is RESTResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.status === 'number' &&
    typeof value.statusText === 'string' &&
    typeof value.headers === 'object' &&
    typeof value.cached === 'boolean' &&
    typeof value.requestTime === 'number' &&
    typeof value.timestamp === 'number'
  );
}