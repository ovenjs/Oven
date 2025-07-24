import type { Client } from '../Client';

export abstract class BaseManager<T = any> {
  protected client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Fetch an item by ID from the API
   */
  abstract fetch(id: string): Promise<T>;

  /**
   * Cache management (basic implementation)
   */
  protected cache = new Map<string, T>();

  /**
   * Get an item from cache
   */
  public get(id: string): T | undefined {
    return this.cache.get(id);
  }

  /**
   * Check if an item exists in cache
   */
  public has(id: string): boolean {
    return this.cache.has(id);
  }

  /**
   * Set an item in cache
   */
  protected set(id: string, item: T): void {
    this.cache.set(id, item);
  }

  /**
   * Delete an item from cache
   */
  protected delete(id: string): boolean {
    return this.cache.delete(id);
  }

  /**
   * Clear the cache
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  public get size(): number {
    return this.cache.size;
  }

  /**
   * Get all cached items
   */
  public values(): IterableIterator<T> {
    return this.cache.values();
  }

  /**
   * Get all cached IDs
   */
  public keys(): IterableIterator<string> {
    return this.cache.keys();
  }

  /**
   * Iterate over cache entries
   */
  public entries(): IterableIterator<[string, T]> {
    return this.cache.entries();
  }

  /**
   * Execute a function for each cached item
   */
  public forEach(fn: (value: T, key: string, map: Map<string, T>) => void): void {
    this.cache.forEach(fn);
  }
}