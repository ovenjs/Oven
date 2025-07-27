/**
 * Cache-specific types for OvenJS
 */

/**
 * Manager options
 */
export interface ManagerOptions {
  client: any; // Will be typed as OvenClient when available
  maxSize?: number;
  sweepInterval?: number;
}

/**
 * Collection options
 */
export interface CollectionOptions {
  maxSize?: number;
  sweepFilter?: (value: any, key: any) => boolean;
  sweepInterval?: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
}