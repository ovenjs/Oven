/**
 * Enhanced Bucket Manager implementation
 *
 * This file contains the advanced bucket manager that handles multiple rate limit buckets
 * with intelligent routing, predictive handling, and global rate limiting.
 */

import { EventEmitter } from 'events';
import { Snowflake } from 'discord-api-types/v10';
import { RequestPriority } from '../types/common';
import { APIRequest } from '../types/api';
import { Bucket } from './Bucket';

export interface BucketManagerOptions {
  /**
   * The maximum number of buckets to cache
   */
  maxBuckets?: number;

  /**
   * The default bucket limit if not specified
   */
  defaultLimit?: number;

  /**
   * The default bucket window in milliseconds if not specified
   */
  defaultWindow?: number;

  /**
   * Whether to enable predictive rate limiting
   */
  enablePredictive?: boolean;

  /**
   * The safety margin to add to rate limits (in milliseconds)
   */
  safetyMargin?: number;

  /**
   * The maximum burst size allowed
   */
  maxBurst?: number;

  /**
   * Whether to enable adaptive queuing
   */
  enableAdaptiveQueue?: boolean;

  /**
   * The logger instance to use
   */
  logger?: any;

  /**
   * Whether to enable bucket cleanup
   */
  enableCleanup?: boolean;

  /**
   * The interval for bucket cleanup in milliseconds
   */
  cleanupInterval?: number;

  /**
   * The maximum age for inactive buckets in milliseconds
   */
  maxInactiveTime?: number;
}

export interface BucketManagerMetrics {
  /**
   * The total number of buckets
   */
  totalBuckets: number;

  /**
   * The number of active buckets
   */
  activeBuckets: number;

  /**
   * The number of inactive buckets
   */
  inactiveBuckets: number;

  /**
   * The total number of requests processed
   */
  totalRequests: number;

  /**
   * The number of requests that were rate limited
   */
  rateLimitedRequests: number;

  /**
   * The number of requests that were retried
   */
  retriedRequests: number;

  /**
   * The number of requests that failed
   */
  failedRequests: number;

  /**
   * The average processing time in milliseconds
   */
  averageProcessingTime: number;

  /**
   * The total queue size across all buckets
   */
  totalQueueSize: number;

  /**
   * The number of active requests across all buckets
   */
  totalActiveRequests: number;

  /**
   * The global rate limit status
   */
  globalRateLimit: {
    isRateLimited: boolean;
    resetAfter: number;
  };

  /**
   * The bucket utilization statistics
   */
  bucketUtilization: {
    min: number;
    max: number;
    average: number;
  };
}

/**
 * Enhanced bucket manager with intelligent routing and global rate limiting
 */
export class BucketManager extends EventEmitter {
  /**
   * The buckets managed by this manager
   */
  private readonly _buckets = new Map<string, Bucket>();

  /**
   * The global bucket for handling global rate limits
   */
  private readonly _globalBucket: Bucket;

  /**
   * The options for this bucket manager
   */
  private readonly _options: Required<BucketManagerOptions>;

  /**
   * The request executor function
   */
  private _requestExecutor?: (request: any) => Promise<any>;

  /**
   * The metrics for this bucket manager
   */
  private _metrics: BucketManagerMetrics = {
    totalBuckets: 0,
    activeBuckets: 0,
    inactiveBuckets: 0,
    totalRequests: 0,
    rateLimitedRequests: 0,
    retriedRequests: 0,
    failedRequests: 0,
    averageProcessingTime: 0,
    totalQueueSize: 0,
    totalActiveRequests: 0,
    globalRateLimit: {
      isRateLimited: false,
      resetAfter: 0,
    },
    bucketUtilization: {
      min: 0,
      max: 0,
      average: 0,
    },
  };

  /**
   * The cleanup interval ID
   */
  private _cleanupInterval?: NodeJS.Timeout;

  /**
   * The last cleanup timestamp
   */
  private _lastCleanup = 0;

  /**
   * @param options The options for this bucket manager
   */
  public constructor(options: BucketManagerOptions = {}) {
    super();

    this._options = {
      maxBuckets: options.maxBuckets ?? 100,
      defaultLimit: options.defaultLimit ?? 5,
      defaultWindow: options.defaultWindow ?? 5000,
      enablePredictive: options.enablePredictive ?? true,
      safetyMargin: options.safetyMargin ?? 100,
      maxBurst: options.maxBurst ?? 5,
      enableAdaptiveQueue: options.enableAdaptiveQueue ?? true,
      logger: options.logger ?? console,
      enableCleanup: options.enableCleanup ?? true,
      cleanupInterval: options.cleanupInterval ?? 60000,
      maxInactiveTime: options.maxInactiveTime ?? 300000,
    };

    // Create the global bucket
    this._globalBucket = new Bucket({
      id: 'global',
      limit: 50, // Discord's global rate limit
      window: 1000, // 1 second window
      route: 'global',
      global: true,
      logger: this._options.logger,
      enablePredictive: this._options.enablePredictive,
      safetyMargin: this._options.safetyMargin,
      maxBurst: this._options.maxBurst,
      enableAdaptiveQueue: this._options.enableAdaptiveQueue,
    });

    // Set up event listeners for the global bucket
    this._setupBucketEventListeners(this._globalBucket);

    // Start cleanup if enabled
    if (this._options.enableCleanup) {
      this._startCleanup();
    }
  }

  /**
   * Gets the current metrics for this bucket manager
   */
  public get metrics(): BucketManagerMetrics {
    return { ...this._metrics };
  }

  /**
   * Gets the global bucket
   */
  public get globalBucket(): Bucket {
    return this._globalBucket;
  }

  /**
   * Gets a bucket by its ID
   * @param bucketId The ID of the bucket to get
   */
  public getBucket(bucketId: string): Bucket | undefined {
    return this._buckets.get(bucketId);
  }

  /**
   * Gets all buckets
   */
  public getAllBuckets(): Bucket[] {
    return Array.from(this._buckets.values());
  }

  /**
   * Gets or creates a bucket for the specified route and major parameters
   * @param route The route for the bucket
   * @param majorParameters The major parameters for the bucket
   * @param limit The limit for the bucket
   * @param window The window for the bucket
   */
  public getOrCreateBucket(
    route: string,
    majorParameters?: Record<string, Snowflake>,
    limit?: number,
    window?: number
  ): Bucket {
    // Generate bucket ID
    const bucketId = this._generateBucketId(route, majorParameters);

    // Check if bucket already exists
    let bucket = this._buckets.get(bucketId);
    if (bucket) {
      return bucket;
    }

    // Create new bucket if it doesn't exist
    bucket = new Bucket({
      id: bucketId,
      limit: limit ?? this._options.defaultLimit,
      window: window ?? this._options.defaultWindow,
      route,
      majorParameters,
      logger: this._options.logger,
      enablePredictive: this._options.enablePredictive,
      safetyMargin: this._options.safetyMargin,
      maxBurst: this._options.maxBurst,
      enableAdaptiveQueue: this._options.enableAdaptiveQueue,
    });

    // Set request executor if available
    if (this._requestExecutor) {
      bucket.setRequestExecutor(this._requestExecutor);
    }

    // Set up event listeners for the bucket
    this._setupBucketEventListeners(bucket);

    // Add bucket to manager
    this._buckets.set(bucketId, bucket);

    // Update metrics
    this._metrics.totalBuckets = this._buckets.size;
    this._metrics.activeBuckets++;

    // Check if we need to clean up buckets
    if (this._buckets.size > this._options.maxBuckets) {
      this._cleanupBuckets();
    }

    return bucket;
  }

  /**
   * Adds a request to the appropriate bucket
   * @param request The request to add
   * @param priority The priority of the request
   * @param maxRetries The maximum number of retries
   * @param retryDelay The retry delay in milliseconds
   * @param isBurst Whether the request is a burst request
   */
  public async addRequest<T = any>(
    request: APIRequest,
    priority: RequestPriority = 'normal',
    maxRetries = 3,
    retryDelay = 1000,
    isBurst = false
  ): Promise<T> {
    // First check global rate limit
    if (this._globalBucket.isRateLimited) {
      // Wait for global rate limit to reset
      await new Promise(resolve =>
        setTimeout(resolve, this._globalBucket.timeToNextRequest)
      );
    }

    // Get or create bucket for this request
    const bucket = this.getOrCreateBucket(request.path);

    // Add request to bucket
    const result = await bucket.addRequest<T>(
      request,
      priority,
      maxRetries,
      retryDelay,
      isBurst
    );

    // Update metrics
    this._metrics.totalRequests++;
    this._updateMetrics();

    return result;
  }

  /**
   * Updates the rate limit information for a bucket
   * @param bucketId The ID of the bucket to update
   * @param remaining The number of requests remaining
   * @param resetAfter The time until the reset in milliseconds
   * @param limit The maximum number of requests
   * @param window The time window in milliseconds
   */
  public updateRateLimit(
    bucketId: string,
    remaining: number,
    resetAfter: number,
    limit?: number,
    window?: number
  ): void {
    if (bucketId === 'global') {
      this._globalBucket.updateRateLimit(remaining, resetAfter, limit, window);
      this._metrics.globalRateLimit = {
        isRateLimited: this._globalBucket.isRateLimited,
        resetAfter: this._globalBucket.timeToReset,
      };
    } else {
      const bucket = this._buckets.get(bucketId);
      if (bucket) {
        bucket.updateRateLimit(remaining, resetAfter, limit, window);
      }
    }
  }

  /**
   * Handles a global rate limit error
   * @param retryAfter The time to wait before retrying in milliseconds
   */
  public handleGlobalRateLimit(retryAfter: number): void {
    this._globalBucket.handleRateLimit(retryAfter, true);
    this._metrics.globalRateLimit = {
      isRateLimited: this._globalBucket.isRateLimited,
      resetAfter: this._globalBucket.timeToReset,
    };
  }

  /**
   * Pauses all buckets for the specified duration
   * @param duration The duration to pause in milliseconds
   */
  public pauseAll(duration: number): void {
    this._globalBucket.pause(duration);
    for (const bucket of this._buckets.values()) {
      bucket.pause(duration);
    }
  }

  /**
   * Resumes all buckets
   */
  public resumeAll(): void {
    this._globalBucket.resume();
    for (const bucket of this._buckets.values()) {
      bucket.resume();
    }
  }

  /**
   * Resets all buckets
   */
  public resetAll(): void {
    this._globalBucket.reset();
    for (const bucket of this._buckets.values()) {
      bucket.reset();
    }
  }

  /**
   * Clears all queued requests in all buckets
   * @param reason The reason for clearing the queues
   */
  public clearAllQueues(reason = 'All buckets cleared'): void {
    this._globalBucket.clearQueue(reason);
    for (const bucket of this._buckets.values()) {
      bucket.clearQueue(reason);
    }
  }

  /**
   * Sets the request executor function for all buckets
   * @param executor The function to execute requests
   */
  public setRequestExecutor(executor: (request: any) => Promise<any>): void {
    this._requestExecutor = executor;

    // Set executor for global bucket
    this._globalBucket.setRequestExecutor(executor);

    // Set executor for all existing buckets
    for (const bucket of this._buckets.values()) {
      bucket.setRequestExecutor(executor);
    }
  }

  /**
   * Destroys the bucket manager and all buckets
   */
  public destroy(): void {
    // Clear cleanup interval
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
    }

    // Destroy all buckets
    this._globalBucket.destroy();
    for (const bucket of this._buckets.values()) {
      bucket.destroy();
    }

    // Clear bucket map
    this._buckets.clear();

    // Remove all event listeners
    this.removeAllListeners();
  }

  /**
   * Generates a bucket ID from a route and major parameters
   * @param route The route for the bucket
   * @param majorParameters The major parameters for the bucket
   */
  private _generateBucketId(
    route: string,
    majorParameters?: Record<string, Snowflake>
  ): string {
    if (!majorParameters || Object.keys(majorParameters).length === 0) {
      return route;
    }

    // Sort major parameters to ensure consistent bucket IDs
    const sortedParams = Object.entries(majorParameters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(',');

    return `${route}:${sortedParams}`;
  }

  /**
   * Sets up event listeners for a bucket
   * @param bucket The bucket to set up event listeners for
   */
  private _setupBucketEventListeners(bucket: Bucket): void {
    bucket.on('request', event => {
      this.emit('request', event);
    });

    bucket.on('response', event => {
      this.emit('response', event);
    });

    bucket.on('error', event => {
      this.emit('error', event);
    });

    bucket.on('rateLimit', rateLimitInfo => {
      this.emit('rateLimit', rateLimitInfo);
    });

    bucket.on('debug', message => {
      this.emit('debug', message);
    });
  }

  /**
   * Updates the metrics for this bucket manager
   */
  private _updateMetrics(): void {
    let totalQueueSize = 0;
    let totalActiveRequests = 0;
    let totalUtilization = 0;
    let minUtilization = 1;
    let maxUtilization = 0;
    let activeBuckets = 0;

    // Collect metrics from all buckets
    for (const bucket of this._buckets.values()) {
      const metrics = bucket.metrics;
      totalQueueSize += metrics.queueSize;
      totalActiveRequests += metrics.activeRequests;
      totalUtilization += metrics.utilization;
      minUtilization = Math.min(minUtilization, metrics.utilization);
      maxUtilization = Math.max(maxUtilization, metrics.utilization);

      if (metrics.queueSize > 0 || metrics.activeRequests > 0) {
        activeBuckets++;
      }
    }

    // Add global bucket metrics
    const globalMetrics = this._globalBucket.metrics;
    totalQueueSize += globalMetrics.queueSize;
    totalActiveRequests += globalMetrics.activeRequests;
    totalUtilization += globalMetrics.utilization;
    minUtilization = Math.min(minUtilization, globalMetrics.utilization);
    maxUtilization = Math.max(maxUtilization, globalMetrics.utilization);

    if (globalMetrics.queueSize > 0 || globalMetrics.activeRequests > 0) {
      activeBuckets++;
    }

    // Update metrics
    this._metrics.totalQueueSize = totalQueueSize;
    this._metrics.totalActiveRequests = totalActiveRequests;
    this._metrics.activeBuckets = activeBuckets;
    this._metrics.inactiveBuckets = this._buckets.size + 1 - activeBuckets;
    this._metrics.bucketUtilization = {
      min: minUtilization,
      max: maxUtilization,
      average: totalUtilization / (this._buckets.size + 1),
    };
  }

  /**
   * Starts the cleanup process
   */
  private _startCleanup(): void {
    this._cleanupInterval = setInterval(() => {
      this._cleanupBuckets();
    }, this._options.cleanupInterval);
  }

  /**
   * Cleans up inactive buckets
   */
  private _cleanupBuckets(): void {
    const now = Date.now();
    const bucketsToDelete: string[] = [];

    // Find inactive buckets
    for (const [bucketId, bucket] of this._buckets.entries()) {
      const metrics = bucket.metrics;
      const isActive = metrics.queueSize > 0 || metrics.activeRequests > 0;
      const lastActivity =
        bucket.metrics.queueSize > 0 || bucket.metrics.activeRequests > 0
          ? now
          : this._lastCleanup;

      if (!isActive && now - lastActivity > this._options.maxInactiveTime) {
        bucketsToDelete.push(bucketId);
      }
    }

    // Delete inactive buckets
    for (const bucketId of bucketsToDelete) {
      const bucket = this._buckets.get(bucketId);
      if (bucket) {
        bucket.destroy();
        this._buckets.delete(bucketId);
      }
    }

    // Update metrics
    this._metrics.totalBuckets = this._buckets.size;

    // Update last cleanup time
    this._lastCleanup = now;
  }
}
