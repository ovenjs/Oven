/**
 * @fileoverview Phantom types for compile-time constraints and validation
 */

import type { Phantom } from '../primitives/brand.js';

/**
 * Phantom type for validated data
 */
export type Validated<T, TConstraint extends string> = Phantom<T, `Validated<${TConstraint}>`>;

/**
 * Phantom type for sanitized data
 */
export type Sanitized<T> = Phantom<T, 'Sanitized'>;

/**
 * Phantom type for encrypted data
 */
export type Encrypted<T> = Phantom<string, `Encrypted<${string & T}>`>;

/**
 * Phantom type for hashed data
 */
export type Hashed<T> = Phantom<string, `Hashed<${string & T}>`>;

/**
 * Phantom type for normalized data
 */
export type Normalized<T> = Phantom<T, 'Normalized'>;

/**
 * Phantom type for authenticated context
 */
export type Authenticated<T> = Phantom<T, 'Authenticated'>;

/**
 * Phantom type for authorized operations
 */
export type Authorized<T, TPermission extends string> = Phantom<T, `Authorized<${TPermission}>`>;

/**
 * Phantom type for rate-limited operations
 */
export type RateLimited<T> = Phantom<T, 'RateLimited'>;

/**
 * Phantom type for cached data with TTL
 */
export type Cached<T, TTTL extends number> = Phantom<T, `Cached<${TTTL}>`>;

/**
 * Phantom type for versioned data
 */
export type Versioned<T, TVersion extends string | number> = Phantom<T, `Versioned<${TVersion}>`>;

/**
 * Phantom type for paginated data
 */
export type Paginated<T> = Phantom<T, 'Paginated'>;

/**
 * Phantom type for sorted data
 */
export type Sorted<T, TSortKey extends string> = Phantom<T, `Sorted<${TSortKey}>`>;

/**
 * Phantom type for filtered data
 */
export type Filtered<T, TFilter extends string> = Phantom<T, `Filtered<${TFilter}>`>;

/**
 * Phantom type for transformed data
 */
export type Transformed<T, TTransform extends string> = Phantom<T, `Transformed<${TTransform}>`>;

/**
 * Phantom type for serialized data
 */
export type Serialized<T> = Phantom<string, `Serialized<${string & T}>`>;

/**
 * Phantom type for compressed data
 */
export type Compressed<T> = Phantom<string, `Compressed<${string & T}>`>;

/**
 * Phantom type for debounced operations
 */
export type Debounced<T> = Phantom<T, 'Debounced'>;

/**
 * Phantom type for throttled operations
 */
export type Throttled<T> = Phantom<T, 'Throttled'>;

/**
 * Phantom type for memoized functions
 */
export type Memoized<T extends (...args: any[]) => any> = Phantom<T, 'Memoized'>;

/**
 * Phantom type for immutable data
 */
export type Immutable<T> = Phantom<T, 'Immutable'>;

/**
 * Phantom type for observable data
 */
export type Observable<T> = Phantom<T, 'Observable'>;

/**
 * Phantom type for reactive data
 */
export type Reactive<T> = Phantom<T, 'Reactive'>;

/**
 * Phantom type for traced operations
 */
export type Traced<T, TTraceId extends string> = Phantom<T, `Traced<${TTraceId}>`>;

/**
 * Phantom type for logged operations
 */
export type Logged<T> = Phantom<T, 'Logged'>;

/**
 * Phantom type for monitored operations
 */
export type Monitored<T> = Phantom<T, 'Monitored'>;

/**
 * Phantom type for persisted data
 */
export type Persisted<T> = Phantom<T, 'Persisted'>;

/**
 * Phantom type for transactional operations
 */
export type Transactional<T> = Phantom<T, 'Transactional'>;

/**
 * Phantom type for idempotent operations
 */
export type Idempotent<T> = Phantom<T, 'Idempotent'>;

/**
 * Phantom type for atomic operations
 */
export type Atomic<T> = Phantom<T, 'Atomic'>;

/**
 * Phantom type for linearizable operations
 */
export type Linearizable<T> = Phantom<T, 'Linearizable'>;

/**
 * Phantom type for eventually consistent data
 */
export type EventuallyConsistent<T> = Phantom<T, 'EventuallyConsistent'>;

/**
 * Phantom type for strongly consistent data
 */
export type StronglyConsistent<T> = Phantom<T, 'StronglyConsistent'>;

/**
 * Phantom type for distributed data
 */
export type Distributed<T> = Phantom<T, 'Distributed'>;

/**
 * Phantom type for replicated data
 */
export type Replicated<T, TReplicas extends number> = Phantom<T, `Replicated<${TReplicas}>`>;

/**
 * Phantom type for sharded data
 */
export type Sharded<T, TShardKey extends string> = Phantom<T, `Sharded<${TShardKey}>`>;

/**
 * Phantom type for partitioned data
 */
export type Partitioned<T, TPartitionKey extends string> = Phantom<T, `Partitioned<${TPartitionKey}>`>;

/**
 * Phantom type for indexed data
 */
export type Indexed<T, TIndex extends string> = Phantom<T, `Indexed<${TIndex}>`>;

/**
 * Phantom type for optimized data structures
 */
export type Optimized<T, TOptimization extends string> = Phantom<T, `Optimized<${TOptimization}>`>;

/**
 * Phantom type for benchmarked operations
 */
export type Benchmarked<T> = Phantom<T, 'Benchmarked'>;

/**
 * Phantom type for profiled operations
 */
export type Profiled<T> = Phantom<T, 'Profiled'>;

/**
 * Phantom type for tested code
 */
export type Tested<T, TCoverage extends number> = Phantom<T, `Tested<${TCoverage}>`>;

/**
 * Phantom type for documented code
 */
export type Documented<T> = Phantom<T, 'Documented'>;

/**
 * Phantom type for reviewed code
 */
export type Reviewed<T, TReviewer extends string> = Phantom<T, `Reviewed<${TReviewer}>`>;

/**
 * Phantom type for deployed code
 */
export type Deployed<T, TEnvironment extends string> = Phantom<T, `Deployed<${TEnvironment}>`>;

/**
 * Advanced phantom type combinators
 */
export type Combine<T, P1, P2> = T extends Phantom<infer U, infer Ph1>
  ? T extends Phantom<U, infer Ph2>
    ? U extends infer Base
      ? Phantom<Base, `${string & Ph1}&${string & Ph2}`>
      : never
    : never
  : never;

/**
 * Extract phantom constraint from type
 */
export type ExtractPhantom<T> = T extends Phantom<any, infer P> ? P : never;

/**
 * Check if type has phantom constraint
 */
export type HasPhantom<T, P extends string> = T extends Phantom<any, P> ? true : false;

/**
 * Remove phantom constraint from type
 */
export type Unphantom<T> = T extends Phantom<infer U, any> ? U : T;

/**
 * Apply phantom constraint to type
 */
export type ApplyPhantom<T, P extends string> = Phantom<T, P>;

/**
 * Conditional phantom application
 */
export type ConditionalPhantom<T, C extends boolean, P extends string> = C extends true
  ? Phantom<T, P>
  : T;