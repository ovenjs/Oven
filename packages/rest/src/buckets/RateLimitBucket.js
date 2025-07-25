/**
 * Rate limit bucket implementation
 * Handles Discord's per-route rate limiting
 */
import { ms, DISCORD_TIMEOUTS } from '@ovenjs/types';
/**
 * Rate limit bucket for managing request queues per Discord API route
 */
export class RateLimitBucket {
    id;
    limit = -1;
    remaining = 1;
    reset = -1;
    resetAfter = -1;
    queue = [];
    processing = false;
    globalTimeout;
    constructor(id) {
        this.id = id;
    }
    /**
     * Get bucket identifier
     */
    getId() {
        return this.id;
    }
    /**
     * Update bucket state from Discord response headers
     */
    updateFromHeaders(headers) {
        const limit = headers.get('x-ratelimit-limit');
        const remaining = headers.get('x-ratelimit-remaining');
        const reset = headers.get('x-ratelimit-reset');
        const resetAfter = headers.get('x-ratelimit-reset-after');
        const retryAfter = headers.get('retry-after');
        if (limit !== null)
            this.limit = parseInt(limit, 10);
        if (remaining !== null)
            this.remaining = parseInt(remaining, 10);
        if (reset !== null)
            this.reset = parseFloat(reset) * 1000;
        if (resetAfter !== null)
            this.resetAfter = parseFloat(resetAfter) * 1000;
        // Handle global rate limit
        if (retryAfter !== null) {
            const retryAfterMs = parseFloat(retryAfter) * 1000;
            this.setGlobalTimeout(ms(retryAfterMs));
        }
    }
    /**
     * Queue a request to be executed when rate limits allow
     */
    queueRequest(request) {
        return new Promise((resolve, reject) => {
            const requestId = Math.random().toString(36).substring(7);
            const queuedRequest = {
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
    isRateLimited() {
        if (this.globalTimeout)
            return true;
        if (this.remaining <= 0 && Date.now() < this.reset)
            return true;
        return false;
    }
    /**
     * Get time until rate limit resets
     */
    getResetTime() {
        if (this.globalTimeout) {
            return ms(Math.max(0, this.reset - Date.now()));
        }
        return ms(Math.max(0, this.reset - Date.now()));
    }
    /**
     * Get current bucket state
     */
    getState() {
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
    async processQueue() {
        if (this.processing || this.queue.length === 0)
            return;
        this.processing = true;
        while (this.queue.length > 0) {
            if (this.isRateLimited()) {
                const resetTime = this.getResetTime();
                await this.wait(resetTime);
            }
            const queuedRequest = this.queue.shift();
            if (!queuedRequest)
                continue;
            try {
                // Clear the timeout since we're processing the request
                if (queuedRequest.timeout) {
                    clearTimeout(queuedRequest.timeout);
                }
                const response = await queuedRequest.request();
                // Update bucket state from response headers
                this.updateFromHeaders(response.headers);
                queuedRequest.resolve(response);
            }
            catch (error) {
                queuedRequest.reject(error);
            }
        }
        this.processing = false;
    }
    /**
     * Remove a specific request from the queue
     */
    removeFromQueue(requestId) {
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
    setGlobalTimeout(duration) {
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
    wait(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }
    /**
     * Clear all queued requests and timeouts
     */
    destroy() {
        // Clear all request timeouts
        this.queue.forEach(req => {
            if (req.timeout)
                clearTimeout(req.timeout);
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
//# sourceMappingURL=RateLimitBucket.js.map