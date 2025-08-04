/**
 * Enhanced rate limiting bucket implementation
 *
 * This file contains the advanced bucket implementation with intelligent rate limiting features
 * including predictive handling, adaptive queuing, and burst management.
 */

import { EventEmitter } from 'events';
import { RequestPriority } from '../types/common';
import { RateLimitInfo, APIRequest } from '../types/api';
import { Snowflake } from 'discord-api-types/v10';

export interface BucketOptions {
  /**
   * The identifier for this bucket
   */
  id: string;

  /**
   * The maximum number of requests allowed in the window
   */
  limit: number;

  /**
   * The time window in milliseconds
   */
  window: number;

  /**
   * The route this bucket is for
   */
  route: string;

  /**
   * The major parameters for this bucket (e.g., guild ID)
   */
  majorParameters?: Record<string, Snowflake>;

  /**
   * Whether this bucket is a global bucket
   */
  global?: boolean;

  /**
   * The logger instance to use
   */
  logger?: any;

  /**
   * Whether to enable predictive rate limiting
   */
  enablePredictive?: boolean;

  /**
   * The safety margin to add to rate limits (in milliseconds)
   * This helps prevent hitting rate limits due to clock drift
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
}

export interface QueuedRequest {
  /**
   * The request to be executed
   */
  request: APIRequest;

  /**
   * The priority of the request
   */
  priority: RequestPriority;

  /**
   * The timestamp when the request was queued
   */
  queuedAt: number;

  /**
   * The resolve function for the request promise
   */
  resolve: (value: any) => void;

  /**
   * The reject function for the request promise
   */
  reject: (reason?: any) => void;

  /**
   * The timeout ID for the request
   */
  timeoutId?: NodeJS.Timeout;

  /**
   * The number of retries attempted
   */
  retries: number;

  /**
   * The maximum number of retries allowed
   */
  maxRetries: number;

  /**
   * The retry delay in milliseconds
   */
  retryDelay: number;

  /**
   * Whether the request is a burst request
   */
  isBurst?: boolean;
}

export interface BucketMetrics {
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
   * The current queue size
   */
  queueSize: number;

  /**
   * The number of active requests
   */
  activeRequests: number;

  /**
   * The estimated time until the next request can be processed
   */
  timeToNextRequest: number;

  /**
   * The bucket utilization percentage
   */
  utilization: number;
}

/**
 * Enhanced rate limiting bucket with intelligent management
 */
export class Bucket extends EventEmitter {
  /**
   * The identifier for this bucket
   */
  public readonly id: string;

  /**
   * The maximum number of requests allowed in the window
   */
  public limit: number;

  /**
   * The time window in milliseconds
   */
  public window: number;

  /**
   * The route this bucket is for
   */
  public readonly route: string;

  /**
   * The major parameters for this bucket
   */
  public readonly majorParameters?: Record<string, Snowflake>;

  /**
   * Whether this bucket is a global bucket
   */
  public readonly global: boolean;

  /**
   * The logger instance
   */
  private readonly _logger: any;

  /**
   * Whether predictive rate limiting is enabled
   */
  private readonly _enablePredictive: boolean;

  /**
   * The safety margin for rate limits
   */
  private readonly _safetyMargin: number;

  /**
   * The maximum burst size
   */
  private readonly _maxBurst: number;

  /**
   * Whether adaptive queuing is enabled
   */
  private readonly _enableAdaptiveQueue: boolean;

  /**
   * The request executor function
   */
  private _requestExecutor?: (request: any) => Promise<any>;

  /**
   * The queue of pending requests
   */
  private readonly _queue: QueuedRequest[] = [];

  /**
   * The active requests being processed
   */
  private readonly _activeRequests: Set<QueuedRequest> = new Set();

  /**
   * The number of requests remaining in the current window
   */
  private _remaining: number;

  /**
   * The timestamp when the current window resets
   */
  private _resetAt: number;

  /**
   * The timestamp when the last request was processed
   */
  private _lastProcessed: number;

  /**
   * The processing time history for adaptive calculations
   */
  private readonly _processingTimeHistory: number[] = [];

  /**
   * The maximum size of the processing time history
   */
  private readonly _maxProcessingTimeHistory = 100;

  /**
   * The metrics for this bucket
   */
  private _metrics: BucketMetrics = {
    totalRequests: 0,
    rateLimitedRequests: 0,
    retriedRequests: 0,
    failedRequests: 0,
    averageProcessingTime: 0,
    queueSize: 0,
    activeRequests: 0,
    timeToNextRequest: 0,
    utilization: 0,
  };

  /**
   * The timeout ID for the next request processing
   */
  private _nextProcessTimeout?: NodeJS.Timeout;

  /**
   * Whether the bucket is currently processing requests
   */
  private _isProcessing = false;

  /**
   * The burst tokens available
   */
  private _burstTokens = 0;

  /**
   * The timestamp when burst tokens were last regenerated
   */
  private _lastBurstRegeneration = 0;

  /**
   * The adaptive delay multiplier based on recent rate limits
   */
  private _adaptiveDelayMultiplier = 1;

  /**
   * The number of consecutive rate limits encountered
   */
  private _consecutiveRateLimits = 0;

  /**
   * @param options The options for this bucket
   */
  public constructor(options: BucketOptions) {
    super();

    this.id = options.id;
    this.limit = options.limit;
    this.window = options.window;
    this.route = options.route;
    this.majorParameters = options.majorParameters;
    this.global = options.global ?? false;
    this._logger = options.logger ?? console;
    this._enablePredictive = options.enablePredictive ?? true;
    this._safetyMargin = options.safetyMargin ?? 100;
    this._maxBurst = options.maxBurst ?? 5;
    this._enableAdaptiveQueue = options.enableAdaptiveQueue ?? true;

    this._remaining = this.limit;
    this._resetAt = Date.now() + this.window;
    this._lastProcessed = 0;
    this._burstTokens = this._maxBurst;
    this._lastBurstRegeneration = Date.now();

    this._startBurstRegeneration();
  }

  /**
   * Gets the current rate limit information
   */
  public get rateLimitInfo(): RateLimitInfo {
    return {
      limit: this.limit,
      remaining: this._remaining,
      reset: this._resetAt,
      global: this.global,
      bucketId: this.id,
      resetAfter: this.timeToReset,
    };
  }

  /**
   * Gets the current metrics for this bucket
   */
  public get metrics(): BucketMetrics {
    return { ...this._metrics };
  }

  /**
   * Gets the number of requests in the queue
   */
  public get queueSize(): number {
    return this._queue.length;
  }

  /**
   * Gets the number of active requests
   */
  public get activeRequestsCount(): number {
    return this._activeRequests.size;
  }

  /**
   * Gets whether the bucket is currently rate limited
   */
  public get isRateLimited(): boolean {
    return this._remaining <= 0 && Date.now() < this._resetAt;
  }

  /**
   * Gets the time until the rate limit resets in milliseconds
   */
  public get timeToReset(): number {
    return Math.max(0, this._resetAt - Date.now());
  }

  /**
   * Gets the estimated time until the next request can be processed
   */
  public get timeToNextRequest(): number {
    if (this._remaining > 0) return 0;
    return this.timeToReset + this._safetyMargin;
  }

  /**
   * Adds a request to the bucket queue
   * @param request The request to add
   * @param priority The priority of the request
   * @param maxRetries The maximum number of retries
   * @param retryDelay The retry delay in milliseconds
   * @param isBurst Whether the request is a burst request
   */
  public async addRequest<T = any>(
    request: APIRequest,
    priority: RequestPriority = 'normal' as RequestPriority,
    maxRetries = 3,
    retryDelay = 1000,
    isBurst = false
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        request,
        priority,
        queuedAt: Date.now(),
        resolve,
        reject,
        retries: 0,
        maxRetries,
        retryDelay,
        isBurst,
      };

      this._insertRequest(queuedRequest);
      this._updateMetrics();
      this._processQueue();
    });
  }

  /**
   * Updates the rate limit information from a response
   * @param remaining The number of requests remaining
   * @param resetAfter The time until the reset in milliseconds
   * @param limit The maximum number of requests
   * @param window The time window in milliseconds
   */
  public updateRateLimit(
    remaining: number,
    resetAfter: number,
    limit?: number,
    window?: number
  ): void {
    const now = Date.now();
    const wasRateLimited = this.isRateLimited;

    if (limit !== undefined) this.limit = limit;
    if (window !== undefined) this.window = window;

    this._remaining = remaining;
    this._resetAt = now + resetAfter;

    // Reset consecutive rate limits if we're no longer rate limited
    if (wasRateLimited && !this.isRateLimited) {
      this._consecutiveRateLimits = 0;
      this._adaptiveDelayMultiplier = Math.max(1, this._adaptiveDelayMultiplier * 0.9);
    }

    this.emit('rateLimit', this.rateLimitInfo);
  }

  /**
   * Handles a rate limit error
   * @param retryAfter The time to wait before retrying in milliseconds
   * @param global Whether this is a global rate limit
   */
  public handleRateLimit(retryAfter: number, global = false): void {
    this._consecutiveRateLimits++;
    this._metrics.rateLimitedRequests++;

    // Increase adaptive delay multiplier
    this._adaptiveDelayMultiplier = Math.min(5, this._adaptiveDelayMultiplier * 1.5);

    if (global) {
      this._resetAt = Date.now() + retryAfter;
      this._remaining = 0;
    } else {
      // Adjust reset time if the new retryAfter is longer
      const newResetAt = Date.now() + retryAfter;
      if (newResetAt > this._resetAt) {
        this._resetAt = newResetAt;
      }
    }

    this.emit('rateLimit', {
      global,
      bucketId: this.id,
      retryAfter,
      limit: this.limit,
      remaining: this._remaining,
      reset: this._resetAt,
      path: this.route,
      method: 'GET' as const, // Default method
    });
  }

  /**
   * Pauses the bucket for the specified duration
   * @param duration The duration to pause in milliseconds
   */
  public pause(duration: number): void {
    this._resetAt = Date.now() + duration;
    this._remaining = 0;
    this._processQueue();
  }

  /**
   * Resumes the bucket
   */
  public resume(): void {
    if (this._remaining <= 0) {
      this._remaining = Math.max(1, Math.floor(this.limit * 0.1));
    }
    this._processQueue();
  }

  /**
   * Resets the bucket's rate limit state
   */
  public reset(): void {
    this._remaining = this.limit;
    this._resetAt = Date.now() + this.window;
    this._consecutiveRateLimits = 0;
    this._adaptiveDelayMultiplier = 1;
    this._processQueue();
  }

  /**
   * Clears all queued requests
   * @param reason The reason for clearing the queue
   */
  public clearQueue(reason = 'Bucket cleared'): void {
    for (const request of this._queue) {
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
      }
      request.reject(new Error(reason));
    }
    this._queue.length = 0;
    this._updateMetrics();
  }

  /**
   * Sets the request executor function
   * @param executor The function to execute requests
   */
  public setRequestExecutor(executor: (request: any) => Promise<any>): void {
    this._requestExecutor = executor;
  }

  /**
   * Destroys the bucket and clears all resources
   */
  public destroy(): void {
    this.clearQueue('Bucket destroyed');
    if (this._nextProcessTimeout) {
      clearTimeout(this._nextProcessTimeout);
    }
    this.removeAllListeners();
  }

  /**
   * Inserts a request into the queue based on priority
   * @param queuedRequest The request to insert
   */
  private _insertRequest(queuedRequest: QueuedRequest): void {
    // Find the correct position based on priority
    let insertIndex = 0;
    for (let i = 0; i < this._queue.length; i++) {
      if (this._queue[i].priority <= queuedRequest.priority) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }

    this._queue.splice(insertIndex, 0, queuedRequest);
  }

  /**
   * Processes the request queue
   */
  private async _processQueue(): Promise<void> {
    if (this._isProcessing || this._queue.length === 0) return;

    this._isProcessing = true;

    try {
      while (this._queue.length > 0) {
        if (this.isRateLimited) {
          // Schedule next processing after reset
          this._scheduleNextProcess(this.timeToNextRequest);
          break;
        }

        const request = this._queue.shift()!;
        await this._processRequest(request);
      }
    } finally {
      this._isProcessing = false;
    }
  }

  /**
   * Processes a single request
   * @param queuedRequest The request to process
   */
  private async _processRequest(queuedRequest: QueuedRequest): Promise<void> {
    const { request, resolve, reject, isBurst } = queuedRequest;

    // Check if we can process this request
    if (this._remaining <= 0 && (!isBurst || this._burstTokens <= 0)) {
      // Re-queue the request
      this._queue.unshift(queuedRequest);
      this._scheduleNextProcess(this.timeToNextRequest);
      return;
    }

    // Use burst token if available and this is a burst request
    if (isBurst && this._burstTokens > 0) {
      this._burstTokens--;
    } else {
      this._remaining--;
    }

    this._activeRequests.add(queuedRequest);
    this._updateMetrics();

    const startTime = Date.now();

    try {
      // Set up timeout for the request
      const timeout = this._enableAdaptiveQueue
        ? this._calculateAdaptiveTimeout(request)
        : 30000; // 30 seconds default

      queuedRequest.timeoutId = setTimeout(() => {
        this._handleRequestTimeout(queuedRequest);
      }, timeout);

      // Emit request event
      this.emit('request', {
        id: Date.now().toString(),
        method: request.method,
        path: request.path,
        timestamp: Date.now(),
        priority: request.priority || ('normal' as RequestPriority),
        cached: false,
      });

      // Process the request
      const result = await this._executeRequest(request);

      // Clear timeout
      if (queuedRequest.timeoutId) {
        clearTimeout(queuedRequest.timeoutId);
      }

      // Update processing time
      const processingTime = Date.now() - startTime;
      this._updateProcessingTime(processingTime);

      // Resolve the request
      resolve(result);

      // Emit success event
      this.emit('response', {
        id: Date.now().toString(),
        method: request.method,
        path: request.path,
        status: 200,
        requestTime: processingTime,
        cached: false,
      });

      this._metrics.totalRequests++;
    } catch (error) {
      // Clear timeout
      if (queuedRequest.timeoutId) {
        clearTimeout(queuedRequest.timeoutId);
      }

      // Handle retry logic
      if (queuedRequest.retries < queuedRequest.maxRetries) {
        queuedRequest.retries++;
        this._metrics.retriedRequests++;

        // Calculate retry delay with exponential backoff and adaptive multiplier
        const retryDelay =
          queuedRequest.retryDelay *
          Math.pow(2, queuedRequest.retries) *
          this._adaptiveDelayMultiplier;

        // Re-queue the request after delay
        setTimeout(() => {
          this._insertRequest(queuedRequest);
          this._processQueue();
        }, retryDelay);
      } else {
        // Max retries exceeded
        this._metrics.failedRequests++;
        reject(error);
        this.emit('error', {
          id: Date.now().toString(),
          method: request.method,
          path: request.path,
          error,
          timestamp: Date.now(),
          retryCount: queuedRequest.retries,
        });
      }
    } finally {
      this._activeRequests.delete(queuedRequest);
      this._lastProcessed = Date.now();
      this._updateMetrics();
      this._processQueue();
    }
  }

  /**
   * Executes a request
   * @param request The request to execute
   */
  private async _executeRequest(request: APIRequest): Promise<any> {
    // Use the request executor if available
    if (this._requestExecutor) {
      try {
        const result = await this._requestExecutor(request);
        return result;
      } catch (error) {
        this.emit(
          'debug',
          `Request execution failed: ${request.method} ${request.path} - ${error}`
        );
        throw error;
      }
    }

    // Fallback: just emit an event and return a mock response
    this.emit('debug', `Executing request: ${request.method} ${request.path}`);
    return null;
  }

  /**
   * Handles a request timeout
   * @param queuedRequest The request that timed out
   */
  private _handleRequestTimeout(queuedRequest: QueuedRequest): void {
    this._activeRequests.delete(queuedRequest);
    this._metrics.failedRequests++;

    const error = new Error(
      `Request timeout: ${queuedRequest.request.method} ${queuedRequest.request.path}`
    );
    queuedRequest.reject(error);

    this.emit('error', {
      id: Date.now().toString(),
      method: queuedRequest.request.method,
      path: queuedRequest.request.path,
      error,
      timestamp: Date.now(),
      retryCount: queuedRequest.retries,
    });

    this._updateMetrics();
    this._processQueue();
  }

  /**
   * Calculates an adaptive timeout based on request characteristics and historical data
   * @param request The request to calculate timeout for
   */
  private _calculateAdaptiveTimeout(request: APIRequest): number {
    // Base timeout
    let timeout = 30000; // 30 seconds

    // Adjust based on request priority
    switch (request.priority) {
      case 'high':
        timeout *= 0.5; // Faster timeout for high priority
        break;
      case 'low':
        timeout *= 2; // Slower timeout for low priority
        break;
    }

    // Adjust based on historical processing times
    if (this._processingTimeHistory.length > 0) {
      const avgProcessingTime =
        this._processingTimeHistory.reduce((a, b) => a + b, 0) /
        this._processingTimeHistory.length;
      timeout = Math.max(timeout, avgProcessingTime * 3);
    }

    // Adjust based on current load
    if (this.queueSize > 10) {
      timeout *= 1.5;
    }

    // Apply adaptive delay multiplier
    timeout *= this._adaptiveDelayMultiplier;

    return Math.min(timeout, 120000); // Cap at 2 minutes
  }

  /**
   * Updates the processing time history
   * @param processingTime The processing time to add
   */
  private _updateProcessingTime(processingTime: number): void {
    this._processingTimeHistory.push(processingTime);

    // Keep history size limited
    if (this._processingTimeHistory.length > this._maxProcessingTimeHistory) {
      this._processingTimeHistory.shift();
    }

    // Update average processing time in metrics
    this._metrics.averageProcessingTime =
      this._processingTimeHistory.reduce((a, b) => a + b, 0) /
      this._processingTimeHistory.length;
  }

  /**
   * Updates the bucket metrics
   */
  private _updateMetrics(): void {
    this._metrics.queueSize = this.queueSize;
    this._metrics.activeRequests = this.activeRequestsCount;
    this._metrics.timeToNextRequest = this.timeToNextRequest;
    this._metrics.utilization =
      this._remaining > 0 ? 1 - this._remaining / this.limit : 1;
  }

  /**
   * Schedules the next queue processing
   * @param delay The delay before processing
   */
  private _scheduleNextProcess(delay: number): void {
    if (this._nextProcessTimeout) {
      clearTimeout(this._nextProcessTimeout);
    }

    this._nextProcessTimeout = setTimeout(() => {
      this._nextProcessTimeout = undefined;
      this._processQueue();
    }, delay);
  }

  /**
   * Starts the burst token regeneration
   */
  private _startBurstRegeneration(): void {
    setInterval(() => {
      const now = Date.now();
      const timeSinceLastRegeneration = now - this._lastBurstRegeneration;

      // Regenerate burst tokens based on time elapsed
      if (timeSinceLastRegeneration >= this.window) {
        this._burstTokens = Math.min(this._maxBurst, this._burstTokens + 1);
        this._lastBurstRegeneration = now;
      }
    }, 1000); // Check every second
  }
}
