/**
 * Request Caching and Response Deduplication
 *
 * This module provides a high-performance caching system for HTTP requests and responses,
 * with support for cache invalidation, TTL, and intelligent deduplication.
 */

import { EventEmitter } from '../events/EventEmitter';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';

/**
 * Cache entry status
 */
export enum CacheStatus {
  /** Cache entry is fresh and valid */
  FRESH = 'fresh',
  /** Cache entry is stale but can be used */
  STALE = 'stale',
  /** Cache entry has expired */
  EXPIRED = 'expired',
  /** Cache entry is invalid */
  INVALID = 'invalid',
}

/**
 * Cache entry metadata
 */
export interface CacheEntryMetadata {
  /** Cache key */
  key: string;
  /** Cache entry status */
  status: CacheStatus;
  /** Cache entry creation timestamp */
  createdAt: number;
  /** Cache entry expiration timestamp */
  expiresAt: number;
  /** Cache entry last accessed timestamp */
  lastAccessedAt: number;
  /** Number of times this entry has been accessed */
  accessCount: number;
  /** Cache entry size in bytes */
  size: number;
  /** Cache entry tags */
  tags: string[];
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Cache entry
 */
export interface CacheEntry<T = any> {
  /** Cache entry data */
  data: T;
  /** Cache entry metadata */
  metadata: CacheEntryMetadata;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Maximum number of entries in the cache */
  maxEntries?: number;
  /** Default time-to-live in milliseconds */
  defaultTTL?: number;
  /** Whether to enable stale-while-revalidate */
  staleWhileRevalidate?: boolean;
  /** Stale-while-revalidate time in milliseconds */
  staleWhileRevalidateTTL?: number;
  /** Whether to enable cache compression */
  compression?: boolean;
  /** Cache eviction strategy */
  evictionStrategy?: 'lru' | 'lfu' | 'fifo';
  /** Whether to enable cache persistence */
  persistence?: boolean;
  /** Cache persistence key */
  persistenceKey?: string;
  /** Additional configuration options */
  options?: Record<string, any>;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total number of entries in the cache */
  totalEntries: number;
  /** Number of fresh entries */
  freshEntries: number;
  /** Number of stale entries */
  staleEntries: number;
  /** Number of expired entries */
  expiredEntries: number;
  /** Number of invalid entries */
  invalidEntries: number;
  /** Total cache size in bytes */
  totalSize: number;
  /** Total number of cache hits */
  cacheHits: number;
  /** Total number of cache misses */
  cacheMisses: number;
  /** Cache hit rate */
  hitRate: number;
  /** Total number of cache evictions */
  evictions: number;
  /** Cache creation timestamp */
  createdAt: number;
  /** Last statistics update timestamp */
  lastUpdatedAt: number;
}

/**
 * Cache event types
 */
export enum CacheEventType {
  /** Cache entry created */
  ENTRY_CREATED = 'entry.created',
  /** Cache entry accessed */
  ENTRY_ACCESSED = 'entry.accessed',
  /** Cache entry updated */
  ENTRY_UPDATED = 'entry.updated',
  /** Cache entry deleted */
  ENTRY_DELETED = 'entry.deleted',
  /** Cache entry expired */
  ENTRY_EXPIRED = 'entry.expired',
  /** Cache entry evicted */
  ENTRY_EVICTED = 'entry.evicted',
  /** Cache cleared */
  CACHE_CLEARED = 'cache.cleared',
  /** Cache statistics updated */
  CACHE_STATS_UPDATED = 'cache.statsUpdated',
}

/**
 * Cache Event Data
 */
export interface CacheEventData {
  /** Cache key */
  key?: string;
  /** Cache entry status */
  status?: CacheStatus;
  /** Cache entry size */
  size?: number;
  /** Cache hit or miss */
  hit?: boolean;
  /** Timestamp */
  timestamp: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * High-performance Cache for HTTP Requests and Responses
 */
export class Cache<T = any> extends EventEmitter {
  /** Cache configuration */
  private config: CacheConfig;

  /** Cache storage */
  private cache: Map<string, CacheEntry<T>> = new Map();

  /** Cache statistics */
  private stats: CacheStats;

  /** Cache ID */
  private id: string;

  /** Pending requests for deduplication */
  private pendingRequests: Map<string, Promise<any>> = new Map();

  constructor(config: CacheConfig = {}, performanceMonitor?: PerformanceMonitor) {
    super(performanceMonitor);

    this.id = `cache-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.config = {
      maxEntries: 1000,
      defaultTTL: 60000, // 1 minute
      staleWhileRevalidate: true,
      staleWhileRevalidateTTL: 30000, // 30 seconds
      compression: false,
      evictionStrategy: 'lru',
      persistence: false,
      persistenceKey: 'rest-client-cache',
      ...config,
    };

    this.stats = {
      totalEntries: 0,
      freshEntries: 0,
      staleEntries: 0,
      expiredEntries: 0,
      invalidEntries: 0,
      totalSize: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      evictions: 0,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };

    // Load persisted cache if enabled
    if (this.config.persistence) {
      this.loadPersistedCache();
    }
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   */
  async get(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);

    if (!entry) {
      // Cache miss
      this.stats.cacheMisses++;
      this.updateStats();

      // Emit cache miss event
      this.emit(CacheEventType.ENTRY_ACCESSED, {
        key,
        hit: false,
        timestamp: Date.now(),
      });

      return undefined;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now > entry.metadata.expiresAt) {
      // Entry has expired
      entry.metadata.status = CacheStatus.EXPIRED;
      this.stats.expiredEntries++;

      // Check if stale-while-revalidate is enabled
      if (
        this.config.staleWhileRevalidate &&
        now < entry.metadata.expiresAt + (this.config.staleWhileRevalidateTTL || 30000)
      ) {
        // Entry is stale but can be used
        entry.metadata.status = CacheStatus.STALE;
        this.stats.staleEntries++;

        // Update metadata
        entry.metadata.lastAccessedAt = now;
        entry.metadata.accessCount++;

        // Update statistics
        this.stats.cacheHits++;
        this.updateStats();

        // Emit cache hit event
        this.emit(CacheEventType.ENTRY_ACCESSED, {
          key,
          status: entry.metadata.status,
          hit: true,
          timestamp: Date.now(),
        });

        return entry.data;
      } else {
        // Entry is completely expired
        this.delete(key);
        this.stats.cacheMisses++;
        this.updateStats();

        // Emit cache miss event
        this.emit(CacheEventType.ENTRY_ACCESSED, {
          key,
          hit: false,
          timestamp: Date.now(),
        });

        return undefined;
      }
    }

    // Cache hit
    entry.metadata.lastAccessedAt = now;
    entry.metadata.accessCount++;

    // Update statistics
    this.stats.cacheHits++;
    this.updateStats();

    // Emit cache hit event
    this.emit(CacheEventType.ENTRY_ACCESSED, {
      key,
      status: entry.metadata.status,
      hit: true,
      timestamp: Date.now(),
    });

    return entry.data;
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param data Data to cache
   * @param options Cache options
   */
  async set(
    key: string,
    data: T,
    options: {
      ttl?: number;
      tags?: string[];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    const now = Date.now();
    const ttl = options.ttl || this.config.defaultTTL || 60000;
    const size = this.calculateSize(data);

    // Check if we need to evict entries
    if (this.cache.size >= (this.config.maxEntries || 1000)) {
      this.evictEntries();
    }

    // Create cache entry
    const entry: CacheEntry<T> = {
      data,
      metadata: {
        key,
        status: CacheStatus.FRESH,
        createdAt: now,
        expiresAt: now + ttl,
        lastAccessedAt: now,
        accessCount: 0,
        size,
        tags: options.tags || [],
        metadata: options.metadata,
      },
    };

    // Add to cache
    this.cache.set(key, entry);

    // Update statistics
    this.stats.totalEntries = this.cache.size;
    this.stats.freshEntries++;
    this.stats.totalSize += size;
    this.updateStats();

    // Persist cache if enabled
    if (this.config.persistence) {
      this.persistCache();
    }

    // Emit entry created event
    this.emit(CacheEventType.ENTRY_CREATED, {
      key,
      status: entry.metadata.status,
      size,
      timestamp: Date.now(),
    });
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Remove from cache
    this.cache.delete(key);

    // Update statistics
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSize -= entry.metadata.size;

    // Update entry status counts
    if (entry.metadata.status === CacheStatus.FRESH) {
      this.stats.freshEntries--;
    } else if (entry.metadata.status === CacheStatus.STALE) {
      this.stats.staleEntries--;
    } else if (entry.metadata.status === CacheStatus.EXPIRED) {
      this.stats.expiredEntries--;
    } else if (entry.metadata.status === CacheStatus.INVALID) {
      this.stats.invalidEntries--;
    }

    this.updateStats();

    // Persist cache if enabled
    if (this.config.persistence) {
      this.persistCache();
    }

    // Emit entry deleted event
    this.emit(CacheEventType.ENTRY_DELETED, {
      key,
      status: entry.metadata.status,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Clear all values from the cache
   */
  async clear(): Promise<void> {
    // Clear cache
    this.cache.clear();

    // Clear pending requests
    this.pendingRequests.clear();

    // Update statistics
    this.stats.totalEntries = 0;
    this.stats.freshEntries = 0;
    this.stats.staleEntries = 0;
    this.stats.expiredEntries = 0;
    this.stats.invalidEntries = 0;
    this.stats.totalSize = 0;
    this.updateStats();

    // Persist cache if enabled
    if (this.config.persistence) {
      this.persistCache();
    }

    // Emit cache cleared event
    this.emit(CacheEventType.CACHE_CLEARED, {
      timestamp: Date.now(),
    });
  }

  /**
   * Check if a key exists in the cache
   * @param key Cache key
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get all keys in the cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values in the cache
   */
  values(): T[] {
    return Array.from(this.cache.values()).map(entry => entry.data);
  }

  /**
   * Get all entries in the cache
   */
  entries(): Array<[string, CacheEntry<T>]> {
    return Array.from(this.cache.entries());
  }

  /**
   * Get the number of entries in the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get entries by tag
   * @param tag Tag to filter by
   */
  getEntriesByTag(tag: string): Array<[string, CacheEntry<T>]> {
    return Array.from(this.cache.entries()).filter(([_, entry]) =>
      entry.metadata.tags.includes(tag)
    );
  }

  /**
   * Delete entries by tag
   * @param tag Tag to filter by
   */
  async deleteByTag(tag: string): Promise<number> {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    }

    let deletedCount = 0;
    for (const key of keysToDelete) {
      if (await this.delete(key)) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Deduplicate a request
   * @param key Cache key
   * @param requestFn Function to execute if cache miss
   */
  async deduplicate<R = T>(key: string, requestFn: () => Promise<R>): Promise<R> {
    // Check if there's already a pending request for this key
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<R>;
    }

    // Check cache first
    const cachedValue = await this.get(key);
    if (cachedValue !== undefined) {
      return cachedValue as R;
    }

    // Create new request
    const requestPromise = requestFn()
      .then(async result => {
        // Cache the result
        await this.set(key, result as any);

        // Remove from pending requests
        this.pendingRequests.delete(key);

        return result;
      })
      .catch(async error => {
        // Remove from pending requests
        this.pendingRequests.delete(key);

        // Re-throw the error
        throw error;
      });

    // Add to pending requests
    this.pendingRequests.set(key, requestPromise);

    return requestPromise;
  }

  /**
   * Destroy the cache
   */
  destroy(): void {
    // Clear cache
    this.clear();

    // Remove all event listeners
    this.removeAllListeners();
  }

  /**
   * Calculate the size of data in bytes
   * @param data Data to calculate size for
   */
  private calculateSize(data: any): number {
    // This is a simplified size calculation
    // In a real implementation, you would use a more accurate method
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  /**
   * Evict entries based on the configured strategy
   */
  private evictEntries(): void {
    const strategy = this.config.evictionStrategy || 'lru';
    const entries = Array.from(this.cache.entries());

    if (entries.length === 0) {
      return;
    }

    let keysToDelete: string[] = [];

    switch (strategy) {
      case 'lru':
        // Least Recently Used
        keysToDelete = entries
          .sort((a, b) => a[1].metadata.lastAccessedAt - b[1].metadata.lastAccessedAt)
          .slice(0, Math.ceil(entries.length * 0.1)) // Evict 10% of entries
          .map(([key]) => key);
        break;

      case 'lfu':
        // Least Frequently Used
        keysToDelete = entries
          .sort((a, b) => a[1].metadata.accessCount - b[1].metadata.accessCount)
          .slice(0, Math.ceil(entries.length * 0.1)) // Evict 10% of entries
          .map(([key]) => key);
        break;

      case 'fifo':
        // First In, First Out
        keysToDelete = entries
          .sort((a, b) => a[1].metadata.createdAt - b[1].metadata.createdAt)
          .slice(0, Math.ceil(entries.length * 0.1)) // Evict 10% of entries
          .map(([key]) => key);
        break;
    }

    // Delete the selected entries
    for (const key of keysToDelete) {
      const entry = this.cache.get(key);
      if (entry) {
        this.cache.delete(key);

        // Update statistics
        this.stats.evictions++;
        this.stats.totalEntries = this.cache.size;
        this.stats.totalSize -= entry.metadata.size;

        // Update entry status counts
        if (entry.metadata.status === CacheStatus.FRESH) {
          this.stats.freshEntries--;
        } else if (entry.metadata.status === CacheStatus.STALE) {
          this.stats.staleEntries--;
        } else if (entry.metadata.status === CacheStatus.EXPIRED) {
          this.stats.expiredEntries--;
        } else if (entry.metadata.status === CacheStatus.INVALID) {
          this.stats.invalidEntries--;
        }

        // Emit entry evicted event
        this.emit(CacheEventType.ENTRY_EVICTED, {
          key,
          status: entry.metadata.status,
          timestamp: Date.now(),
        });
      }
    }

    this.updateStats();
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    // Update entry status counts
    this.stats.freshEntries = 0;
    this.stats.staleEntries = 0;
    this.stats.expiredEntries = 0;
    this.stats.invalidEntries = 0;

    for (const entry of this.cache.values()) {
      if (entry.metadata.status === CacheStatus.FRESH) {
        this.stats.freshEntries++;
      } else if (entry.metadata.status === CacheStatus.STALE) {
        this.stats.staleEntries++;
      } else if (entry.metadata.status === CacheStatus.EXPIRED) {
        this.stats.expiredEntries++;
      } else if (entry.metadata.status === CacheStatus.INVALID) {
        this.stats.invalidEntries++;
      }
    }

    // Calculate hit rate
    const totalRequests = this.stats.cacheHits + this.stats.cacheMisses;
    this.stats.hitRate = totalRequests > 0 ? this.stats.cacheHits / totalRequests : 0;

    this.stats.lastUpdatedAt = Date.now();

    // Emit cache stats updated event
    this.emit(CacheEventType.CACHE_STATS_UPDATED, {
      timestamp: Date.now(),
      metadata: {
        stats: this.stats,
      },
    });
  }

  /**
   * Persist cache to storage
   */
  private persistCache(): void {
    if (!this.config.persistence || !this.config.persistenceKey) {
      return;
    }

    try {
      const data = {
        cache: Array.from(this.cache.entries()),
        stats: this.stats,
        timestamp: Date.now(),
      };

      // Check if we're in a browser environment
      if (
        typeof globalThis !== 'undefined' &&
        typeof globalThis.localStorage !== 'undefined'
      ) {
        globalThis.localStorage.setItem(this.config.persistenceKey, JSON.stringify(data));
      }
    } catch (_error) {
      // Ignore persistence errors
    }
  }

  /**
   * Load persisted cache from storage
   */
  private loadPersistedCache(): void {
    if (!this.config.persistence || !this.config.persistenceKey) {
      return;
    }

    try {
      // Check if we're in a browser environment
      if (
        typeof globalThis !== 'undefined' &&
        typeof globalThis.localStorage !== 'undefined'
      ) {
        const data = globalThis.localStorage.getItem(this.config.persistenceKey);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.cache && Array.isArray(parsed.cache)) {
            this.cache = new Map(parsed.cache);
          }
          if (parsed.stats) {
            this.stats = parsed.stats;
          }
        }
      }
    } catch (_error) {
      // Ignore loading errors
    }
  }
}
