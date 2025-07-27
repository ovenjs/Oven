/**
 * Utility types for OvenJS
 */

/**
 * Base structure options
 */
export interface BaseStructureOptions {
  client: any; // Will be typed as OvenClient when available
}

/**
 * Awaitable type - can be a value or Promise of value
 */
export type Awaitable<T> = T | Promise<T>;

/**
 * Make properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Extract property types
 */
export type PropertyType<T, K extends keyof T> = T[K];

/**
 * JSON serializable type
 */
export type JSONSerializable = 
  | string 
  | number 
  | boolean 
  | null 
  | JSONSerializable[] 
  | { [key: string]: JSONSerializable };