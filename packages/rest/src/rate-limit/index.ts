/**
 * Rate Limiting Module
 *
 * This module provides advanced rate limiting capabilities with intelligent bucket management,
 * predictive handling, and global rate limiting. It ensures that API requests comply with
 * Discord's rate limits while optimizing request throughput.
 *
 * @packageDocumentation
 * @module @ovendjs/rest/rate-limit
 *
 * @example
 * ```typescript
 * import { BucketManager } from '@ovendjs/rest/rate-limit';
 *
 * const bucketManager = new BucketManager({
 *   maxBuckets: 100,
 *   defaultLimit: 5,
 *   defaultWindow: 5000,
 *   enablePredictive: true,
 * });
 *
 * // Add a request to the bucket manager
 * const result = await bucketManager.addRequest({
 *   method: 'GET',
 *   path: '/users/@me',
 * }, 'normal', 3, 1000, false);
 * ```
 */

/**
 * Represents a single rate limit bucket that manages requests for a specific endpoint.
 * Each bucket tracks its own rate limit state and handles request queuing.
 *
 * @example
 * ```typescript
 * const bucket = new Bucket({
 *   id: 'global',
 *   limit: 5,
 *   remaining: 5,
 *   reset: Date.now() + 5000,
 *   resetAfter: 5000,
 * });
 * ```
 */
export { Bucket } from './Bucket';

/**
 * Manages multiple rate limit buckets and provides intelligent request routing.
 * The BucketManager handles global rate limits, predictive rate limiting, and
 * automatic request distribution across buckets.
 *
 * @example
 * ```typescript
 * const bucketManager = new BucketManager({
 *   maxBuckets: 100,
 *   defaultLimit: 5,
 *   defaultWindow: 5000,
 *   enablePredictive: true,
 * });
 *
 * // Set a custom request executor
 * bucketManager.setRequestExecutor(async (request) => {
 *   // Make the actual HTTP request
 *   return await makeRequest(request);
 * });
 * ```
 */
export { BucketManager } from './BucketManager';

/**
 * Configuration options for creating a Bucket instance.
 * These options define the behavior and limits of a rate limit bucket.
 */
export type { BucketOptions } from './Bucket';

/**
 * Represents a request that has been queued in a bucket.
 * Contains information about the request and its execution state.
 */
export type { QueuedRequest } from './Bucket';

/**
 * Metrics and statistics for a single bucket.
 * Provides information about the bucket's performance and usage.
 */
export type { BucketMetrics } from './Bucket';

/**
 * Configuration options for creating a BucketManager instance.
 * These options define the global behavior of the rate limiting system.
 */
export type { BucketManagerOptions } from './BucketManager';

/**
 * Metrics and statistics for the BucketManager.
 * Provides information about the overall performance of the rate limiting system.
 */
export type { BucketManagerMetrics } from './BucketManager';
