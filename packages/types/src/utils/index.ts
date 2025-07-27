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

/**
 * Utility function to check if a value is an object
 * @param value - Value to check
 * @returns True if the value is an object
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Utility function to check if a value is a string
 * @param value - Value to check
 * @returns True if the value is a string
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Utility function to check if a value is a number
 * @param value - Value to check
 * @returns True if the value is a number
 */
export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};