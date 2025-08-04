/**
 * @packageDocumentation
 * @module @ovendjs/rest/types
 * @summary
 * Comprehensive type definitions for the enhanced REST client.
 *
 * This module provides all type definitions needed for interacting with the Discord API
 * using the enhanced REST client with full type safety and advanced features.
 */

// Export only common types first
export * from './common';

// Export specific types from api.ts to avoid conflicts
export type {
  APIRequest,
  APIResponse,
  RequestOptions,
  RetryOptions,
  CacheOptions,
  RateLimitInfo,
  BucketInfo,
  QueuedRequest,
  RESTEventMap,
  RequestEvent,
  ResponseEvent,
  ErrorEvent,
  RateLimitEvent,
  DebugEvent,
  CacheEvent,
  QueueEvent,
  MetricsEvent,
  RouteData,
  RESTOptions,
  RateLimitOptions,
  EventOptions,
  MetricsOptions,
  MiddlewareContext,
  RequestMiddleware,
  ResponseMiddleware,
  ErrorMiddleware,
  CacheEntry,
  CacheStats,
  ConnectionPoolOptions,
  ConnectionStats,
} from './api';

// Export only specific types from client.ts that don't conflict
export type { RESTClient, ClientMetrics } from './client';

// Export constants
export const API_BASE_URL = 'https://discord.com/api';

// Version information
export const SUPPORTED_API_VERSIONS = [9, 10] as const;
export type SupportedAPIVersion = (typeof SUPPORTED_API_VERSIONS)[number];

// HTTP Methods
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type HTTPMethod = (typeof HTTP_METHODS)[number];

// Request priorities
export const REQUEST_PRIORITIES = ['low', 'normal', 'high', 'critical'] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

// Cache strategies
export const CACHE_STRATEGIES = ['memory', 'persistent', 'hybrid'] as const;
export type CacheStrategy = (typeof CACHE_STRATEGIES)[number];

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
export type ErrorType = (typeof ERROR_TYPES)[number];
