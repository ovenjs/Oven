import type { CacheAdapter } from './CacheAdapter';

/**
 * In-memory cache implementation.
 *
 * @remarks
 * This class provides a simple in-memory cache implementation.
 * It stores data in a Map and supports TTL (time-to-live) for automatic expiration.
 */
export class MemoryCache implements CacheAdapter {
  /**
   * The underlying Map that stores the cache data.
   */
  private cache: Map<string, { value: any; expires?: number }>;

  /**
   * Creates a new MemoryCache instance.
   */
  constructor() {
    this.cache = new Map();
  }

  /**
   * Gets a value from the cache.
   *
   * @param key - The key to get.
   * @returns A promise that resolves with the cached value, or null if not found.
   */
  public async get<T = any>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if the item has expired
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Sets a value in the cache.
   *
   * @param key - The key to set.
   * @param value - The value to set.
   * @param ttl - The time-to-live in milliseconds.
   * @returns A promise that resolves when the value is set.
   */
  public async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    const item: { value: T; expires?: number } = { value };

    if (ttl) {
      item.expires = Date.now() + ttl;
    }

    this.cache.set(key, item);
  }

  /**
   * Deletes a value from the cache.
   *
   * @param key - The key to delete.
   * @returns A promise that resolves when the value is deleted.
   */
  public async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Checks if a key exists in the cache.
   *
   * @param key - The key to check.
   * @returns A promise that resolves with true if the key exists, false otherwise.
   */
  public async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if the item has expired
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clears all values from the cache.
   *
   * @returns A promise that resolves when the cache is cleared.
   */
  public async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Gets the number of items in the cache.
   *
   * @returns The number of items in the cache.
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Gets all keys in the cache.
   *
   * @returns An array of all keys in the cache.
   */
  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Gets all values in the cache.
   *
   * @returns An array of all values in the cache.
   */
  public values(): any[] {
    return Array.from(this.cache.values()).map(item => item.value);
  }

  /**
   * Cleans up expired items from the cache.
   *
   * @returns The number of items that were removed.
   */
  public cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expires && now > item.expires) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}