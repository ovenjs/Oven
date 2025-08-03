/**
 * Interface for cache adapters.
 *
 * @remarks
 * This interface defines the contract for cache implementations.
 * Any cache implementation must implement these methods.
 */
export interface CacheAdapter {
  /**
   * Gets a value from the cache.
   *
   * @param key - The key to get.
   * @returns A promise that resolves with the cached value, or null if not found.
   */
  get<T = any>(key: string): Promise<T | null>;

  /**
   * Sets a value in the cache.
   *
   * @param key - The key to set.
   * @param value - The value to set.
   * @param ttl - The time-to-live in milliseconds.
   * @returns A promise that resolves when the value is set.
   */
  set<T = any>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Deletes a value from the cache.
   *
   * @param key - The key to delete.
   * @returns A promise that resolves when the value is deleted.
   */
  delete(key: string): Promise<void>;

  /**
   * Checks if a key exists in the cache.
   *
   * @param key - The key to check.
   * @returns A promise that resolves with true if the key exists, false otherwise.
   */
  has(key: string): Promise<boolean>;

  /**
   * Clears all values from the cache.
   *
   * @returns A promise that resolves when the cache is cleared.
   */
  clear(): Promise<void>;
}