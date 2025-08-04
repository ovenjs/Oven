/**
 * Common type definitions used across the REST package
 *
 * This file contains shared types that are used by multiple modules
 * to avoid circular dependencies and provide type consistency.
 *
 * @module @ovendjs/rest/types/common
 */

/**
 * Priority levels for API requests.
 * Higher priority requests are processed before lower priority ones.
 *
 * @example
 * ```typescript
 * const priority: RequestPriority = 'high';
 * ```
 */
export type RequestPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Cache strategies for storing API responses.
 * Each strategy determines how and where cached data is stored.
 *
 * @example
 * ```typescript
 * const strategy: CacheStrategy = 'memory';
 * ```
 */
export type CacheStrategy = 'memory' | 'persistent' | 'hybrid';

/**
 * Types of errors that can occur in the REST client.
 * Each error type corresponds to a specific category of issues.
 *
 * @example
 * ```typescript
 * const errorType: ErrorType = 'RateLimitError';
 * ```
 */
export type ErrorType =
  | 'DiscordAPIError'
  | 'RateLimitError'
  | 'ValidationError'
  | 'NetworkError'
  | 'TimeoutError'
  | 'RetryError'
  | 'CacheError';

/**
 * Type guard function to check if a value is a valid RequestPriority.
 *
 * @param value - The value to check.
 * @returns True if the value is a valid RequestPriority, false otherwise.
 *
 * @example
 * ```typescript
 * if (isRequestPriority('high')) {
 *   // Value is a valid RequestPriority
 * }
 * ```
 */
export function isRequestPriority(value: string): value is RequestPriority {
  return ['low', 'normal', 'high', 'critical'].includes(value);
}

/**
 * Type guard function to check if a value is a valid CacheStrategy.
 *
 * @param value - The value to check.
 * @returns True if the value is a valid CacheStrategy, false otherwise.
 *
 * @example
 * ```typescript
 * if (isCacheStrategy('memory')) {
 *   // Value is a valid CacheStrategy
 * }
 * ```
 */
export function isCacheStrategy(value: string): value is CacheStrategy {
  return ['memory', 'persistent', 'hybrid'].includes(value);
}

/**
 * Type guard function to check if a value is a valid ErrorType.
 *
 * @param value - The value to check.
 * @returns True if the value is a valid ErrorType, false otherwise.
 *
 * @example
 * ```typescript
 * if (isErrorType('RateLimitError')) {
 *   // Value is a valid ErrorType
 * }
 * ```
 */
export function isErrorType(value: string): value is ErrorType {
  return [
    'DiscordAPIError',
    'RateLimitError',
    'ValidationError',
    'NetworkError',
    'TimeoutError',
    'RetryError',
    'CacheError',
  ].includes(value);
}
