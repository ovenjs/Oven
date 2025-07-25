/**
 * Collection class for OvenJS
 * Enhanced Map with additional utility methods
 */

import type { CollectionOptions, SweepOptions } from '@ovenjs/types';

export class Collection<K, V> extends Map<K, V> {
  private _maxSize?: number;
  private _sweepInterval?: NodeJS.Timeout;
  private _lifetime?: number;
  private _timestamps = new Map<K, number>();

  constructor(options: CollectionOptions = {}) {
    super();
    
    this._maxSize = options.maxSize;
    this._lifetime = options.lifetime;
    
    if (options.sweepInterval) {
      this._sweepInterval = setInterval(() => {
        this.sweep();
      }, options.sweepInterval);
    }
  }

  override set(key: K, value: V): this {
    if (this._maxSize && this.size >= this._maxSize && !this.has(key)) {
      // Remove oldest entry if at max size
      const firstKey = this.keys().next().value;
      if (firstKey !== undefined) {
        this.delete(firstKey);
      }
    }

    this._timestamps.set(key, Date.now());
    return super.set(key, value);
  }

  override delete(key: K): boolean {
    this._timestamps.delete(key);
    return super.delete(key);
  }

  override clear(): void {
    this._timestamps.clear();
    super.clear();
  }

  /**
   * Get the first value in the collection
   */
  first(): V | undefined {
    return this.values().next().value;
  }

  /**
   * Get the first key in the collection
   */
  firstKey(): K | undefined {
    return this.keys().next().value;
  }

  /**
   * Get the last value in the collection
   */
  last(): V | undefined {
    return Array.from(this.values()).at(-1);
  }

  /**
   * Get the last key in the collection
   */
  lastKey(): K | undefined {
    return Array.from(this.keys()).at(-1);
  }

  /**
   * Get a random value from the collection
   */
  random(): V | undefined {
    const values = Array.from(this.values());
    return values[Math.floor(Math.random() * values.length)];
  }

  /**
   * Get a random key from the collection
   */
  randomKey(): K | undefined {
    const keys = Array.from(this.keys());
    return keys[Math.floor(Math.random() * keys.length)];
  }

  /**
   * Find a value that matches the provided function
   */
  find(fn: (value: V, key: K, collection: this) => boolean): V | undefined {
    for (const [key, value] of this) {
      if (fn(value, key, this)) {
        return value;
      }
    }
    return undefined;
  }

  /**
   * Find a key that matches the provided function
   */
  findKey(fn: (value: V, key: K, collection: this) => boolean): K | undefined {
    for (const [key, value] of this) {
      if (fn(value, key, this)) {
        return key;
      }
    }
    return undefined;
  }

  /**
   * Filter the collection
   */
  filter(fn: (value: V, key: K, collection: this) => boolean): Collection<K, V> {
    const filtered = new Collection<K, V>();
    for (const [key, value] of this) {
      if (fn(value, key, this)) {
        filtered.set(key, value);
      }
    }
    return filtered;
  }

  /**
   * Map the collection to a new collection
   */
  map<T>(fn: (value: V, key: K, collection: this) => T): Collection<K, T> {
    const mapped = new Collection<K, T>();
    for (const [key, value] of this) {
      mapped.set(key, fn(value, key, this));
    }
    return mapped;
  }

  /**
   * Check if some values match the provided function
   */
  some(fn: (value: V, key: K, collection: this) => boolean): boolean {
    for (const [key, value] of this) {
      if (fn(value, key, this)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if every value matches the provided function
   */
  every(fn: (value: V, key: K, collection: this) => boolean): boolean {
    for (const [key, value] of this) {
      if (!fn(value, key, this)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Reduce the collection to a single value
   */
  reduce<T>(fn: (accumulator: T, value: V, key: K, collection: this) => T, initialValue: T): T {
    let accumulator = initialValue;
    for (const [key, value] of this) {
      accumulator = fn(accumulator, value, key, this);
    }
    return accumulator;
  }

  /**
   * Convert the collection to an array
   */
  toArray(): V[] {
    return Array.from(this.values());
  }

  /**
   * Convert the collection keys to an array
   */
  keyArray(): K[] {
    return Array.from(this.keys());
  }

  /**
   * Convert the collection to JSON
   */
  toJSON(): Record<string, V> {
    const obj: Record<string, V> = {};
    for (const [key, value] of this) {
      obj[String(key)] = value;
    }
    return obj;
  }

  /**
   * Sweep expired entries
   */
  sweep(options: SweepOptions = {}): number {
    const now = Date.now();
    const lifetime = options.lifetime ?? this._lifetime;
    let sweeped = 0;

    for (const [key, timestamp] of this._timestamps) {
      const value = this.get(key);
      if (!value) {
        this._timestamps.delete(key);
        continue;
      }

      let shouldSweep = false;

      // Check custom filter
      if (options.filter && !options.filter(value, String(key))) {
        shouldSweep = true;
      }

      // Check lifetime
      if (lifetime && now - timestamp > lifetime) {
        shouldSweep = true;
      }

      if (shouldSweep) {
        this.delete(key);
        sweeped++;
      }
    }

    return sweeped;
  }

  /**
   * Clone the collection
   */
  clone(): Collection<K, V> {
    const cloned = new Collection<K, V>();
    for (const [key, value] of this) {
      cloned.set(key, value);
    }
    return cloned;
  }

  /**
   * Destroy the collection and clear timers
   */
  destroy(): void {
    if (this._sweepInterval) {
      clearInterval(this._sweepInterval);
    }
    this.clear();
  }
}