/**
 * @packageDocumentation
 * @module @ovendjs/rest/types
 * @summary
 * Comprehensive type definitions for the enhanced REST client.
 *
 * This module provides all type definitions needed for interacting with the Discord API
 * using the enhanced REST client with full type safety and advanced features.
 */

// Main type exports
export * from './api';
export * from './common';

// Explicitly export client types to avoid conflicts
export type {
  RESTOptions as ClientRESTOptions,
  RESTRequest,
  RESTResponse,
  RESTClient,
  RESTEventMap as ClientRESTEventMap,
  RequestEvent as ClientRequestEvent,
  ResponseEvent as ClientResponseEvent,
  ErrorEvent as ClientErrorEvent,
  RateLimitEvent as ClientRateLimitEvent,
  DebugEvent as ClientDebugEvent,
  CacheEvent as ClientCacheEvent,
  QueueEvent as ClientQueueEvent,
  MetricsEvent as ClientMetricsEvent,
  ClientMetrics,
  CacheStats as ClientCacheStats,
  RequestMiddleware as ClientRequestMiddleware,
  ResponseMiddleware as ClientResponseMiddleware,
  ErrorMiddleware as ClientErrorMiddleware,
} from './client';

// Re-export from api to avoid conflicts
export type {
  RateLimitInfo,
  BucketInfo,
} from './api';

// Export the main RESTOptions type from api.ts
export type { RESTOptions } from './api';

// Export the main RESTEventMap type from api.ts
export type { RESTEventMap } from './api';

// TODO: Create these files when implementing those features
// export * from './events';
// export * from './middleware';
// export * from './internal';

// Constants
export const API_BASE_URL = 'https://discord.com/api';

// Version information
export const SUPPORTED_API_VERSIONS = [9, 10] as const;
export type SupportedAPIVersion = typeof SUPPORTED_API_VERSIONS[number];

// HTTP Methods
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type HTTPMethod = typeof HTTP_METHODS[number];

// Request priorities
export const REQUEST_PRIORITIES = ['low', 'normal', 'high', 'critical'] as const;
export type RequestPriority = typeof REQUEST_PRIORITIES[number];

// Cache strategies
export const CACHE_STRATEGIES = ['memory', 'persistent', 'hybrid'] as const;
export type CacheStrategy = typeof CACHE_STRATEGIES[number];

// Error types
export const ERROR_TYPES = [
  'DiscordAPIError',
  'RateLimitError',
  'ValidationError',
  'NetworkError',
  'TimeoutError',
  'RetryError',
  'CacheError',
] as const;
export type ErrorType = typeof ERROR_TYPES[number];