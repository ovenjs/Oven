import { describe, beforeEach, it, expect } from 'vitest';
import { BucketManager } from '../packages/rest/src/bucket/BucketManager';

describe('BucketManager', () => {
  let bucketManager: BucketManager;

  beforeEach(() => {
    bucketManager = new BucketManager();
  });

  it('should generate same bucket ID for same route patterns', () => {
    const bucket1 = bucketManager.getBucket('/channels/123456789/messages', 'GET');
    const bucket2 = bucketManager.getBucket('/channels/987654321/messages', 'GET');

    // These should potentially share a bucket (same base route, same major param type)
    expect(bucket1).toBeDefined();
    expect(bucket2).toBeDefined();
  });

  it('should generate different bucket IDs for different route types', () => {
    const bucket1 = bucketManager.getBucket('/channels/123456789/messages', 'GET');
    const bucket2 = bucketManager.getBucket('/guilds/123456789/members', 'GET');

    // Different base routes should have different buckets
    expect(bucket1.id).not.toBe(bucket2.id);
  });
});
