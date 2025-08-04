/**
 * Common type definitions used across the REST package
 * 
 * This file contains shared types that are used by multiple modules
 * to avoid circular dependencies.
 */

// Request priority levels
export type RequestPriority = 'low' | 'normal' | 'high' | 'critical';

// Cache strategies
export type CacheStrategy = 'memory' | 'persistent' | 'hybrid';

// Error types
export type ErrorType = 'DiscordAPIError' | 'RateLimitError' | 'ValidationError' | 'NetworkError' | 'TimeoutError' | 'RetryError' | 'CacheError';

// Utility functions for type guards
export function isRequestPriority(value: string): value is RequestPriority {
  return ['low', 'normal', 'high', 'critical'].includes(value);
}

export function isCacheStrategy(value: string): value is CacheStrategy {
  return ['memory', 'persistent', 'hybrid'].includes(value);
}

export function isErrorType(value: string): value is ErrorType {
  return [
    'DiscordAPIError',
    'RateLimitError',
    'ValidationError',
    'NetworkError',
    'TimeoutError',
    'RetryError',
    'CacheError'
  ].includes(value);
}