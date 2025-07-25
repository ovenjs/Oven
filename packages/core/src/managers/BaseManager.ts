/**
 * Base manager class for OvenJS
 * Provides common functionality for all managers
 */

import type { BaseManagerOptions, FetchOptions } from '@ovenjs/types';
import type { Snowflake } from '@ovenjs/types';
import { Collection } from '../structures/Collection.js';

export abstract class BaseManager<K extends Snowflake, V> {
  protected client: any; // Will be OvenClient
  protected cache: Collection<K, V>;
  protected readonly maxSize?: number;
  protected readonly sweepInterval?: number;

  constructor(options: BaseManagerOptions) {
    this.client = options.client;
    this.maxSize = options.maxSize;
    this.sweepInterval = options.sweepInterval;
    
    this.cache = new Collection<K, V>({
      maxSize: this.maxSize,
      sweepInterval: this.sweepInterval,
    });
  }

  /**
   * Get an item from the cache
   */
  get(id: K): V | undefined {
    return this.cache.get(id);
  }

  /**
   * Check if an item exists in the cache
   */
  has(id: K): boolean {
    return this.cache.has(id);
  }

  /**
   * Set an item in the cache
   */
  set(id: K, value: V): this {
    this.cache.set(id, value);
    return this;
  }

  /**
   * Delete an item from the cache
   */
  delete(id: K): boolean {
    return this.cache.delete(id);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the size of the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all cached values
   */
  get values(): IterableIterator<V> {
    return this.cache.values();
  }

  /**
   * Get all cached keys
   */
  get keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Get all cached entries
   */
  get entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }

  /**
   * Find an item in the cache
   */
  find(fn: (value: V, key: K) => boolean): V | undefined {
    return this.cache.find(fn);
  }

  /**
   * Filter items in the cache
   */
  filter(fn: (value: V, key: K) => boolean): Collection<K, V> {
    return this.cache.filter(fn);
  }

  /**
   * Map items in the cache
   */
  map<T>(fn: (value: V, key: K) => T): Collection<K, T> {
    return this.cache.map(fn);
  }

  /**
   * Convert cache to array
   */
  toArray(): V[] {
    return this.cache.toArray();
  }

  /**
   * Sweep expired entries
   */
  sweep(filter?: (value: V, key: string) => boolean): number {
    return this.cache.sweep({ filter });
  }

  /**
   * Abstract method for fetching from API
   */
  abstract fetch(id: K, options?: FetchOptions): Promise<V>;

  /**
   * Resolve an item from cache or fetch from API
   */
  async resolve(id: K, options: FetchOptions = {}): Promise<V> {
    const cached = this.get(id);
    
    if (cached && !options.force) {
      return cached;
    }

    const fetched = await this.fetch(id, options);
    
    if (options.cache !== false) {
      this.set(id, fetched);
    }
    
    return fetched;
  }

  /**
   * Destroy the manager and clear cache
   */
  destroy(): void {
    this.cache.destroy();
  }
}