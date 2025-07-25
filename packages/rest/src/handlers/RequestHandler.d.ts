/**
 * Request handler with optimization and retry logic
 * Handles HTTP requests with intelligent batching and retries
 */
import type { RequestOptions, Milliseconds } from '@ovenjs/types';
export interface RequestConfig {
    timeout?: Milliseconds;
    retries?: number;
    retryDelay?: Milliseconds;
    userAgent?: string;
}
export interface BatchRequestResult<T = any> {
    success: boolean;
    data?: T;
    error?: Error;
    status: number;
    headers: Record<string, string>;
}
/**
 * Handles HTTP requests with optimization and retry logic
 */
export declare class RequestHandler {
    private readonly config;
    private readonly pendingBatches;
    constructor(config?: RequestConfig);
    /**
     * Execute a single HTTP request with retry logic
     */
    executeRequest(url: string, options: RequestOptions): Promise<Response>;
    /**
     * Batch similar requests for efficiency
     */
    batchRequests<T = any>(requests: Array<{
        url: string;
        options: RequestOptions;
        key?: string;
    }>): Promise<BatchRequestResult<T>[]>;
    /**
     * Perform the actual HTTP request
     */
    private performRequest;
    /**
     * Parse response based on content type
     */
    private parseResponse;
    /**
     * Convert Headers object to plain object
     */
    private headersToObject;
    /**
     * Group requests by similarity for batching
     */
    private groupRequests;
    /**
     * Wait for specified duration
     */
    private wait;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<RequestConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): RequestConfig;
}
//# sourceMappingURL=RequestHandler.d.ts.map