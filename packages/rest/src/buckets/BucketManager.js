/**
 * Bucket manager for handling multiple rate limit buckets
 * Manages rate limit buckets across different Discord API routes
 */
import { RateLimitBucket } from './RateLimitBucket.js';
/**
 * Manages rate limit buckets for Discord API routes
 */
export class BucketManager {
    buckets = new Map();
    routeToBucket = new Map();
    /**
     * Get or create a bucket for a route
     */
    getBucket(method, route) {
        const routeKey = this.getRouteKey(method, route);
        // Check if we already know which bucket this route belongs to
        const bucketId = this.routeToBucket.get(routeKey);
        if (bucketId) {
            const bucket = this.buckets.get(bucketId);
            if (bucket)
                return bucket;
        }
        // Create a new bucket with the route as the initial ID
        const newBucketId = routeKey;
        const bucket = new RateLimitBucket(newBucketId);
        this.buckets.set(newBucketId, bucket);
        this.routeToBucket.set(routeKey, newBucketId);
        return bucket;
    }
    /**
     * Update bucket mapping based on Discord's bucket header
     */
    updateBucketMapping(method, route, bucketHeader) {
        const routeKey = this.getRouteKey(method, route);
        const currentBucketId = this.routeToBucket.get(routeKey);
        // If this route is already mapped to the correct bucket, no action needed
        if (currentBucketId === bucketHeader)
            return;
        // Remove old mapping
        if (currentBucketId) {
            this.routeToBucket.delete(routeKey);
            // Check if any other routes use this bucket
            const hasOtherRoutes = Array.from(this.routeToBucket.values()).includes(currentBucketId);
            if (!hasOtherRoutes) {
                const oldBucket = this.buckets.get(currentBucketId);
                if (oldBucket) {
                    oldBucket.destroy();
                    this.buckets.delete(currentBucketId);
                }
            }
        }
        // Create new bucket if it doesn't exist
        if (!this.buckets.has(bucketHeader)) {
            this.buckets.set(bucketHeader, new RateLimitBucket(bucketHeader));
        }
        // Update mapping
        this.routeToBucket.set(routeKey, bucketHeader);
    }
    /**
     * Get bucket by ID
     */
    getBucketById(bucketId) {
        return this.buckets.get(bucketId);
    }
    /**
     * Get all active buckets
     */
    getAllBuckets() {
        return new Map(this.buckets);
    }
    /**
     * Get bucket information for debugging
     */
    getBucketInfo() {
        const info = {};
        for (const [bucketId, bucket] of this.buckets) {
            info[bucketId] = {
                state: bucket.getState(),
                queueSize: bucket.queue?.length || 0, // Access private property for debugging
            };
        }
        return info;
    }
    /**
     * Clear all buckets and reset mappings
     */
    clear() {
        // Destroy all buckets
        for (const bucket of this.buckets.values()) {
            bucket.destroy();
        }
        this.buckets.clear();
        this.routeToBucket.clear();
    }
    /**
     * Generate a route key for bucket mapping
     */
    getRouteKey(method, route) {
        // Normalize route by replacing dynamic segments with placeholders
        const normalizedRoute = route
            .replace(/\/\d{17,19}/g, '/{id}') // Replace snowflakes with {id}
            .replace(/\/reactions\/[^/]+/g, '/reactions/{emoji}') // Replace emoji reactions
            .replace(/\/webhooks\/\d{17,19}\/[^/]+/g, '/webhooks/{id}/{token}'); // Replace webhook tokens
        return `${method}:${normalizedRoute}`;
    }
    /**
     * Get statistics about bucket usage
     */
    getStatistics() {
        const bucketToRoutes = new Map();
        // Build reverse mapping
        for (const [route, bucketId] of this.routeToBucket) {
            if (!bucketToRoutes.has(bucketId)) {
                bucketToRoutes.set(bucketId, []);
            }
            bucketToRoutes.get(bucketId).push(route);
        }
        const bucketDetails = Array.from(this.buckets.entries()).map(([id, bucket]) => ({
            id,
            routes: bucketToRoutes.get(id) || [],
            state: bucket.getState(),
        }));
        return {
            totalBuckets: this.buckets.size,
            totalRoutes: this.routeToBucket.size,
            bucketDetails,
        };
    }
}
//# sourceMappingURL=BucketManager.js.map