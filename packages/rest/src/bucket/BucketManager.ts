// packages/rest/src/bucket/BucketManager.ts
import type { RateLimitHeaders } from '../types';

import { Bucket } from './Bucket';

export class BucketManager {
  private buckets: Map<string, Bucket> = new Map();
  private globalReset: number = 0;
  private cleanupInterval?: NodeJS.Timeout;

  getBucket(route: string, method: string): Bucket {
    const bucketId = this.generateBucketId(route, method);

    if (!this.buckets.has(bucketId)) {
      // Default values - will be updated from actual rate limit headers
      this.buckets.set(bucketId, new Bucket(bucketId, 1, 1, Date.now() + 1000));
    }

    return this.buckets.get(bucketId)!;
  }

  updateFromHeaders(route: string, method: string, headers: RateLimitHeaders): void {
    const limit = parseInt(headers['x-ratelimit-limit'] || '1');
    const remaining = parseInt(headers['x-ratelimit-remaining'] || '1');
    const resetAfter = parseFloat(headers['x-ratelimit-reset-after'] || '0');
    const reset = Date.now() + resetAfter * 1000;

    // Use the bucket ID from headers if provided, otherwise generate from route
    const bucketId =
      headers['x-ratelimit-bucket'] || this.generateBucketId(route, method);

    if (!this.buckets.has(bucketId)) {
      this.buckets.set(bucketId, new Bucket(bucketId, limit, remaining, reset));
    } else {
      this.buckets.get(bucketId)!.update(limit, remaining, reset);
    }
  }

  isGlobalRateLimited(): boolean {
    return Date.now() < this.globalReset;
  }

  async handleGlobalRateLimit(retryAfter: number): Promise<void> {
    this.globalReset = Date.now() + retryAfter * 1000;
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  }

  private generateBucketId(route: string, method: string): string {
    // Extract major parameters that affect rate limiting
    const majorParams = this.extractMajorParameters(route);

    // Create bucket key based on method and major parameters
    // This ensures routes with same major params share buckets
    const basePath = this.getBaseRoute(route);

    return `${method}:${basePath}${majorParams ? `:${majorParams}` : ''}`;
  }

  private getBaseRoute(route: string): string {
    // Remove IDs and other variable parts to get the base route
    return route
      .replace(/\/\d+/g, '/:id')
      .replace(/\/channels\/:id\/messages\/:id/, '/channels/:id/messages') // Special case for channel messages
      .replace(/\/channels\/:id/, '/channels/:id')
      .replace(/\/guilds\/:id/, '/guilds/:id')
      .replace(/\/users\/:id/, '/users/:id');
  }

  private extractMajorParameters(route: string): string {
    // Extract actual IDs that are major rate limit parameters
    const majorParamRegex = /\/(\d+)\//g;
    const matches = [];
    let match;

    while ((match = majorParamRegex.exec(route)) !== null) {
      // Only consider certain IDs as major parameters
      const fullPath = route.substring(0, match.index + match[0].length);
      if (this.isMajorParameterPath(fullPath)) {
        matches.push(match[1] as never);
      }
    }

    return matches.join(':');
  }

  private isMajorParameterPath(path: string): boolean {
    // These paths have major parameters that affect rate limiting
    const majorParameterPaths = [
      '/channels/', // channel ID is major
      '/guilds/', // guild ID is major
      '/users/', // user ID is major
      '/webhooks/', // webhook ID is major
    ];

    return majorParameterPaths.some(majorPath => path.includes(majorPath));
  }

  /**
   * Clean up expired buckets to prevent memory leaks
   */
  private cleanupExpiredBuckets(): void {
    const now = Date.now();
    const expiredBuckets: string[] = [];

    for (const [id, bucket] of this.buckets) {
      // Remove buckets that have been inactive for more than 5 minutes
      if (now - bucket.reset > 300000) {
        expiredBuckets.push(id);
      }
    }

    for (const id of expiredBuckets) {
      this.buckets.delete(id);
    }
  }

  /**
   * Start the automatic cleanup interval
   */
  public startCleanup(): void {
    if (this.cleanupInterval) return;

    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredBuckets();
    }, 300000);
  }

  /**
   * Stop the automatic cleanup interval
   */
  public stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Get the global reset timestamp
   * @returns The timestamp when the global rate limit resets
   */
  public getGlobalResetTime(): number {
    return this.globalReset;
  }
}
