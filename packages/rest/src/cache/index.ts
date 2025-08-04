/**
 * Request Caching and Response Deduplication
 *
 * This module provides a high-performance caching system for HTTP requests and responses,
 * with support for cache invalidation, TTL, and intelligent deduplication. It helps
 * reduce API calls and improve response times for frequently accessed data.
 *
 * @packageDocumentation
 * @module @ovendjs/rest/cache
 *
 * @example
 * ```typescript
 * import { Cache } from '@ovendjs/rest/cache';
 *
 * const cache = new Cache({
 *   enabled: true,
 *   ttl: 300000, // 5 minutes
 *   strategy: 'memory',
 *   staleWhileRevalidate: false,
 * });
 *
 * // Store data in cache
 * await cache.set('user:123456789', userData);
 *
 * // Retrieve data from cache
 * const userData = await cache.get('user:123456789');
 *
 * // Check if data exists in cache
 * const hasUser = await cache.has('user:123456789');
 *
 * // Remove data from cache
 * await cache.delete('user:123456789');
 *
 * // Clear all cache entries
 * await cache.clear();
 *
 * // Get cache statistics
 * const stats = await cache.getStats();
 * ```
 */

/**
 * Main Cache class that provides caching functionality for HTTP requests and responses.
 * Supports multiple caching strategies, TTL-based expiration, and intelligent deduplication.
 *
 * @example
 * ```typescript
 * const cache = new Cache({
 *   enabled: true,
 *   ttl: 300000, // 5 minutes
 *   strategy: 'memory',
 *   staleWhileRevalidate: false,
 * });
 * ```
 */
export { Cache } from './Cache';

/**
 * Enumeration of possible cache statuses.
 * Used to indicate the current state of a cache entry or the cache system.
 */
export { CacheStatus } from './Cache';

/**
 * Represents a single entry in the cache.
 * Contains the cached value, metadata, and expiration information.
 */
export { CacheEntry } from './Cache';

/**
 * Metadata associated with a cache entry.
 * Includes information about creation time, access patterns, and other metrics.
 */
export { CacheEntryMetadata } from './Cache';

/**
 * Configuration options for the Cache instance.
 * Defines how the cache should behave, including TTL, strategy, and other settings.
 */
export { CacheConfig } from './Cache';

/**
 * Statistics and metrics about the cache performance.
 * Provides information about hit rates, memory usage, and other performance indicators.
 */
export { CacheStats } from './Cache';

/**
 * Enumeration of cache event types.
 * Used to identify different types of cache-related events.
 */
export { CacheEventType } from './Cache';

/**
 * Event data for cache-related events.
 * Contains information about cache operations and their results.
 */
export { CacheEventData } from './Cache';

/**
 * Interface for cache entries (alternative naming).
 * Provides type definitions for cache entry structures.
 */
export type { CacheEntry as ICacheEntry } from './Cache';

/**
 * Interface for cache entry metadata (alternative naming).
 * Provides type definitions for cache entry metadata structures.
 */
export type { CacheEntryMetadata as ICacheEntryMetadata } from './Cache';

/**
 * Interface for cache configuration (alternative naming).
 * Provides type definitions for cache configuration structures.
 */
export type { CacheConfig as ICacheConfig } from './Cache';

/**
 * Interface for cache statistics (alternative naming).
 * Provides type definitions for cache statistics structures.
 */
export type { CacheStats as ICacheStats } from './Cache';

/**
 * Interface for cache event data (alternative naming).
 * Provides type definitions for cache event data structures.
 */
export type { CacheEventData as ICacheEventData } from './Cache';
