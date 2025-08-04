/**
 * Enhanced REST Client Package
 *
 * This package provides a comprehensive REST client for interacting with the Discord API,
 * featuring advanced functionality such as rate limiting, caching, connection pooling,
 * request batching, error handling, performance monitoring, and event management.
 *
 * @packageDocumentation
 */

// Core exports
/**
 * The main REST client class for making API requests to Discord.
 * Provides a high-level interface for all HTTP operations with built-in
 * rate limiting, caching, and error handling.
 *
 * @example
 * ```typescript
 * import { REST } from '@discordjs/rest';
 *
 * const rest = new REST({ version: '10' }).setToken('your-token');
 *
 * // Make a GET request
 * const user = await rest.get('/users/@me');
 *
 * // Make a POST request
 * const channel = await rest.post('/channels', { name: 'new-channel' });
 * ```
 */
export { REST } from './REST.js';

// Type exports from types module (consolidated to avoid conflicts)
/**
 * Type definitions for the REST client configuration and API interactions.
 * These types provide type safety for all REST client operations.
 */
export type {
  /** Configuration options for the REST client */
  RESTOptions,
  /** Interface for the REST client */
  RESTClient,
  /** Mapping of REST event types to their data structures */
  RESTEventMap,
  /** Interface for API requests */
  APIRequest,
  /** Interface for API responses */
  APIResponse,
  /** Options for making API requests */
  RequestOptions,
  /** Information about rate limits */
  RateLimitInfo,
  /** Information about rate limit buckets */
  BucketInfo,
  /** Event data for API requests */
  RequestEvent,
  /** Event data for API responses */
  ResponseEvent,
  /** Event data for errors */
  ErrorEvent,
  /** Event data for rate limits */
  RateLimitEvent,
  /** Event data for debug messages */
  DebugEvent,
  /** Event data for cache operations */
  CacheEvent,
  /** Event data for queue operations */
  QueueEvent,
  /** Event data for metrics */
  MetricsEvent,
  /** Data for route identification */
  RouteData,
  /** Priority levels for requests */
  RequestPriority,
  /** Strategies for caching */
  CacheStrategy,
  /** Types of errors */
  ErrorType,
  /** Supported API versions */
  SupportedAPIVersion,
  /** HTTP methods */
  HTTPMethod,
} from './types/index.js';

// Component exports
/**
 * Rate limiting components for managing API request limits.
 * Provides bucket-based rate limiting with predictive capabilities.
 */
export {
  /** Individual rate limit bucket */
  Bucket,
  /** Manager for multiple rate limit buckets */
  BucketManager,
} from './rate-limit/index.js';

/**
 * Caching components for storing and retrieving API responses.
 * Provides configurable caching strategies with TTL support.
 */
export {
  /** Main cache implementation */
  Cache,
  /** Cache status enumeration */
  CacheStatus,
  /** Cache configuration interface */
  CacheConfig,
  /** Cache event types */
  CacheEventType,
} from './cache/index.js';

/**
 * Connection management components for HTTP connections.
 * Provides connection pooling and optimization for API requests.
 */
export {
  /** Pool for managing HTTP connections */
  ConnectionPool,
} from './connection/index.js';

/**
 * Batch processing components for optimizing multiple API requests.
 * Provides request batching for compatible endpoints.
 */
export {
  /** Processor for batching API requests */
  BatchProcessor,
} from './batch/index.js';

/**
 * Error handling components for managing API errors and retries.
 * Provides comprehensive error handling with retry logic and circuit breakers.
 */
export {
  /** Base error class for REST operations */
  RestError,
  /** Handler for managing errors and retries */
  ErrorHandler,
  /** Error for Discord API responses */
  DiscordAPIError,
  /** Error for HTTP responses */
  DiscordHTTPError,
  /** Severity levels for errors */
  ErrorSeverity,
  /** Categories for errors */
  ErrorCategory,
} from './error/index.js';

/**
 * Event management components for handling REST client events.
 * Provides a comprehensive event system with performance optimizations.
 */
export {
  /** Enhanced event emitter with performance optimizations */
  EventEmitter,
  /** Manager for REST client events */
  EventManager,
  /** Enumeration of REST event types */
  RestEventType,
} from './events/index.js';

/**
 * Logging components for REST client operations.
 * Provides structured logging with configurable levels.
 */
export {
  /** Logger for REST client operations */
  Logger,
} from './logger/index.js';

/**
 * Middleware components for request/response processing.
 * Provides a pipeline system for processing requests and responses.
 */
export {
  /** Pipeline for executing middleware */
  MiddlewarePipeline,
  /** Base class for middleware implementations */
  BaseMiddleware,
} from './middleware/index.js';

/**
 * Performance monitoring components for tracking REST client performance.
 * Provides metrics collection and performance analysis.
 */
export {
  /** Monitor for tracking REST client performance */
  PerformanceMonitor,
} from './monitoring/index.js';

/**
 * Data transformation components for request/response processing.
 * Provides transformation utilities for API data.
 */
export {
  /** Manager for data transformations */
  Transformer,
} from './transform/index.js';

/**
 * Utility functions for REST client operations.
 * Provides helper functions for common operations.
 */
export {
  /** Normalizes HTTP header names and values */
  normalizeHeaders,
} from './utils/index.js';
