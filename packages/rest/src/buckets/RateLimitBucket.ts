/**
 * Rate limit bucket implementation
 * Handles Discord's per-route rate limiting
 */

import type { Milliseconds } from '@ovenjs/types';
import { ms, DISCORD_TIMEOUTS } from '@ovenjs/types';

export interface BucketInfo {
  limit: number;
  remaining: number;
  reset: number;
  resetAfter: number;
  global: boolean;
}

export interface QueuedRequest {
  id: string;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
  request: () => Promise<Response>;
  timeout?: NodeJS.Timeout | undefined;
}

/**
 * Rate limit bucket for managing request queues per Discord API route
 */
export class RateLimitBucket {
  private readonly id: string;
  private limit = -1;
  private remaining = 1;
  private reset = -1;
  private resetAfter = -1;
  private queue: QueuedRequest[] = [];
  private processing = false;
  private globalTimeout: NodeJS.Timeout | undefined = undefined;

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Get bucket identifier
   */
  getId(): string {
    return this.id;
  }

  /**
   * Update bucket state from Discord response headers
   */
  updateFromHeaders(headers: Headers): void {
    const limit = headers.get('x-ratelimit-limit');
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    const resetAfter = headers.get('x-ratelimit-reset-after');
    const retryAfter = headers.get('retry-after');

    if (limit !== null) this.limit = parseInt(limit, 10);
    if (remaining !== null) this.remaining = parseInt(remaining, 10);
    if (reset !== null) this.reset = parseFloat(reset) * 1000;
    if (resetAfter !== null) this.resetAfter = parseFloat(resetAfter) * 1000;

    // Handle global rate limit
    if (retryAfter !== null) {
      const retryAfterMs = parseFloat(retryAfter) * 1000;
      this.setGlobalTimeout(ms(retryAfterMs));
    }
  }

  /**
   * Queue a request to be executed when rate limits allow
   */
  queueRequest(request: () => Promise<Response>): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(7);
      
      const queuedRequest: QueuedRequest = {
        id: requestId,
        resolve,
        reject,
        request,
        timeout: setTimeout(() => {
          this.removeFromQueue(requestId);
          reject(new Error('Request timeout'));
        }, DISCORD_TIMEOUTS.REQUEST_TIMEOUT),
      };

      this.queue.push(queuedRequest);
      this.processQueue();
    });
  }

  /**
   * Check if bucket is currently rate limited
   */
  isRateLimited(): boolean {
    if (this.globalTimeout) return true;
    if (this.remaining <= 0 && Date.now() < this.reset) return true;
    return false;
  }

  /**
   * Get time until rate limit resets
   */
  getResetTime(): Milliseconds {
    if (this.globalTimeout) {
      return ms(Math.max(0, this.reset - Date.now()));
    }
    return ms(Math.max(0, this.reset - Date.now()));
  }

  /**
   * Get current bucket state
   */
  getState(): BucketInfo {
    return {
      limit: this.limit,
      remaining: this.remaining,
      reset: this.reset,
      resetAfter: this.resetAfter,
      global: !!this.globalTimeout,
    };
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;

    while (this.queue.length > 0) {
      if (this.isRateLimited()) {
        const resetTime = this.getResetTime();
        await this.wait(resetTime);
      }

      const queuedRequest = this.queue.shift();
      if (!queuedRequest) continue;

      try {
        // Clear the timeout since we're processing the request
        if (queuedRequest.timeout) {
          clearTimeout(queuedRequest.timeout);
        }

        const response = await queuedRequest.request();
        
        // Update bucket state from response headers
        this.updateFromHeaders(response.headers);
        
        queuedRequest.resolve(response);
      } catch (error) {
        queuedRequest.reject(error as Error);
      }
    }

    this.processing = false;
  }

  /**
   * Remove a specific request from the queue
   */
  private removeFromQueue(requestId: string): void {
    const index = this.queue.findIndex(req => req.id === requestId);
    if (index !== -1) {
      const removed = this.queue.splice(index, 1)[0];
      if (removed?.timeout) {
        clearTimeout(removed.timeout);
      }
    }
  }

  /**
   * Set global rate limit timeout
   */
  private setGlobalTimeout(duration: Milliseconds): void {
    if (this.globalTimeout) {
      clearTimeout(this.globalTimeout);
    }

    this.globalTimeout = setTimeout(() => {
      this.globalTimeout = undefined;
      this.processQueue();
    }, duration);
  }

  /**
   * Wait for specified duration
   */
  private wait(duration: Milliseconds): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Clear all queued requests and timeouts
   */
  destroy(): void {
    // Clear all request timeouts
    this.queue.forEach(req => {
      if (req.timeout) clearTimeout(req.timeout);
      req.reject(new Error('Bucket destroyed'));
    });
    
    this.queue = [];
    
    if (this.globalTimeout) {
      clearTimeout(this.globalTimeout);
      this.globalTimeout = undefined;
    }
    
    this.processing = false;
  }
}