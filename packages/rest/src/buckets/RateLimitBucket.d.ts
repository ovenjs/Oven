/**
 * Rate limit bucket implementation
 * Handles Discord's per-route rate limiting
 */
import type { Milliseconds } from '@ovenjs/types';
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
    timeout?: NodeJS.Timeout;
}
/**
 * Rate limit bucket for managing request queues per Discord API route
 */
export declare class RateLimitBucket {
    private readonly id;
    private limit;
    private remaining;
    private reset;
    private resetAfter;
    private queue;
    private processing;
    private globalTimeout?;
    constructor(id: string);
    /**
     * Get bucket identifier
     */
    getId(): string;
    /**
     * Update bucket state from Discord response headers
     */
    updateFromHeaders(headers: Headers): void;
    /**
     * Queue a request to be executed when rate limits allow
     */
    queueRequest(request: () => Promise<Response>): Promise<Response>;
    /**
     * Check if bucket is currently rate limited
     */
    isRateLimited(): boolean;
    /**
     * Get time until rate limit resets
     */
    getResetTime(): Milliseconds;
    /**
     * Get current bucket state
     */
    getState(): BucketInfo;
    /**
     * Process the request queue
     */
    private processQueue;
    /**
     * Remove a specific request from the queue
     */
    private removeFromQueue;
    /**
     * Set global rate limit timeout
     */
    private setGlobalTimeout;
    /**
     * Wait for specified duration
     */
    private wait;
    /**
     * Clear all queued requests and timeouts
     */
    destroy(): void;
}
//# sourceMappingURL=RateLimitBucket.d.ts.map