/**
 * Main REST client for Discord API
 * Orchestrates rate limiting, request handling, and API routes
 */
import type { RESTOptions, RequestOptions, APIResponse } from '@ovenjs/types';
import { GuildRoutes, ChannelRoutes, UserRoutes } from '../routes/index.js';
/**
 * Main REST client for Discord API interactions
 */
export declare class RESTClient {
    private readonly options;
    private readonly bucketManager;
    private readonly requestHandler;
    private readonly responseHandler;
    readonly guilds: GuildRoutes;
    readonly channels: ChannelRoutes;
    readonly users: UserRoutes;
    constructor(options: RESTOptions);
    /**
     * Execute a request with rate limiting and error handling
     */
    request<T = any>(options: RequestOptions): Promise<APIResponse<T>>;
    /**
     * Execute multiple requests in batch
     */
    batchRequest<T = any>(requests: RequestOptions[]): Promise<APIResponse<T>[]>;
    /**
     * Get rate limit information for debugging
     */
    getRateLimitInfo(): Record<string, any>;
    /**
     * Get statistics about API usage
     */
    getStatistics(): {
        buckets: any;
        config: RESTOptions;
    };
    /**
     * Clear all rate limit buckets
     */
    clearBuckets(): void;
    /**
     * Update client configuration
     */
    updateConfig(options: Partial<RESTOptions>): void;
    /**
     * Get current configuration
     */
    getConfig(): RESTOptions;
    /**
     * Build full URL for a path
     */
    private buildURL;
    /**
     * Extract rate limit data from headers object
     */
    private extractRateLimitFromHeaders;
    /**
     * Destroy the client and clean up resources
     */
    destroy(): void;
}
//# sourceMappingURL=RESTClient.d.ts.map