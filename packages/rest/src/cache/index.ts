/**
 * Request Caching and Response Deduplication
 * 
 * This module provides a high-performance caching system for HTTP requests and responses,
 * with support for cache invalidation, TTL, and intelligent deduplication.
 */

export { 
	Cache,
	CacheStatus,
	CacheEntry,
	CacheEntryMetadata,
	CacheConfig,
	CacheStats,
	CacheEventType,
	CacheEventData,
} from './Cache';

export type {
	CacheEntry as ICacheEntry,
	CacheEntryMetadata as ICacheEntryMetadata,
	CacheConfig as ICacheConfig,
	CacheStats as ICacheStats,
	CacheEventData as ICacheEventData,
} from './Cache';