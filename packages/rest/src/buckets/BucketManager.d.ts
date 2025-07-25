/**
 * Bucket manager for handling multiple rate limit buckets
 * Manages rate limit buckets across different Discord API routes
 */
import { RateLimitBucket } from './RateLimitBucket.js';
import type { HTTPMethod } from '@ovenjs/types';
/**
 * Manages rate limit buckets for Discord API routes
 */
export declare class BucketManager {
    private readonly buckets;
    private readonly routeToBucket;
    /**
     * Get or create a bucket for a route
     */
    getBucket(method: HTTPMethod, route: string): RateLimitBucket;
    /**
     * Update bucket mapping based on Discord's bucket header
     */
    updateBucketMapping(method: HTTPMethod, route: string, bucketHeader: string): void;
    /**
     * Get bucket by ID
     */
    getBucketById(bucketId: string): RateLimitBucket | undefined;
    /**
     * Get all active buckets
     */
    getAllBuckets(): Map<string, RateLimitBucket>;
    /**
     * Get bucket information for debugging
     */
    getBucketInfo(): Record<string, any>;
    /**
     * Clear all buckets and reset mappings
     */
    clear(): void;
    /**
     * Generate a route key for bucket mapping
     */
    private getRouteKey;
    /**
     * Get statistics about bucket usage
     */
    getStatistics(): {
        totalBuckets: number;
        totalRoutes: number;
        bucketDetails: Array<{
            id: string;
            routes: string[];
            state: any;
        }>;
    };
}
//# sourceMappingURL=BucketManager.d.ts.map