import type { RateLimitHeaders } from '../types';

import { Bucket } from './Bucket';

export class BucketManager {
  private buckets: Map<string, Bucket> = new Map();
  private globalReset: number = 0;

  getBucket(route: string, method: string): Bucket {
    // Simple route-based bucketing for now
    const bucketId = this.hashRoute(route, method);

    if (!this.buckets.has(bucketId)) {
      // Default values, will be updated from headers
      this.buckets.set(bucketId, new Bucket(bucketId, 1, 1, Date.now() + 1000));
    }

    return this.buckets.get(bucketId)!;
  }

  updateFromHeaders(route: string, method: string, headers: RateLimitHeaders): void {
    const limit = parseInt(headers['x-ratelimit-limit'] || '1');
    const remaining = parseInt(headers['x-ratelimit-remaining'] || '1');
    const resetAfter = parseFloat(headers['x-ratelimit-reset-after'] || '0');
    const reset = Date.now() + resetAfter * 1000;
    const bucketId = headers['x-ratelimit-bucket'] || this.hashRoute(route, method);

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

  private hashRoute(route: string, method: string): string {
    // Simple route hashing - major parameters matter for bucketing
    const majorParams = this.extractMajorParameters(route);
    return `${method}:${route
      .split('/')
      .filter(part => !part.startsWith(':') && !/^\d+$/.test(part))
      .join('/')}:${majorParams}`;
  }

  private extractMajorParameters(route: string): string {
    // Extract major parameters that affect rate limiting
    // e.g., /channels/{channel.id}/messages -> channel.id matters
    const matches = route.match(/\/(\d+)\/(?:messages|members|channels|roles|emojis)/g);
    return matches ? matches.join(':') : '';
  }
}
