/**
 * Phantom types for compile-time type checking
 * Useful for ensuring type safety without runtime overhead
 */

declare const __phantom: unique symbol;

/**
 * Phantom type utility for compile-time constraints
 * @template T - The base type  
 * @template P - The phantom constraint
 */
export type Phantom<T, P> = T & { readonly [__phantom]: P };

/**
 * Creates a phantom type value
 * @template T - The base type
 * @template P - The phantom constraint
 * @param value - The value to apply phantom type to
 * @returns The phantom typed value
 */
export const phantom = <T, P>(value: T): Phantom<T, P> => value as Phantom<T, P>;

// Phantom types for Discord permissions
export type ReadPermission = Phantom<number, 'ReadPermission'>;
export type WritePermission = Phantom<number, 'WritePermission'>;
export type AdminPermission = Phantom<number, 'AdminPermission'>;

// Phantom types for validation states
export type Validated<T> = Phantom<T, 'Validated'>;
export type Sanitized<T> = Phantom<T, 'Sanitized'>;
export type Encrypted<T> = Phantom<T, 'Encrypted'>;

// Phantom types for Discord API versions
export type APIVersion10 = Phantom<string, 'APIVersion10'>;
export type APIVersion9 = Phantom<string, 'APIVersion9'>;

// Phantom types for rate limit buckets
export type GlobalBucket = Phantom<string, 'GlobalBucket'>;
export type GuildBucket = Phantom<string, 'GuildBucket'>;
export type ChannelBucket = Phantom<string, 'ChannelBucket'>;