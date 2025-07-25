/**
 * OvenJS REST - Discord REST API client
 * Advanced REST client with intelligent rate limiting and request optimization
 */

// Main client
export { RESTClient } from './client/index.js';

// Rate limiting
export { RateLimitBucket, BucketManager } from './buckets/index.js';
export type { BucketInfo, QueuedRequest } from './buckets/index.js';

// Request/Response handling
export { RequestHandler, ResponseHandler, DiscordAPIError, HTTPError } from './handlers/index.js';
export type { RequestConfig, BatchRequestResult } from './handlers/index.js';

// API routes
export { BaseRoute, GuildRoutes, ChannelRoutes, UserRoutes } from './routes/index.js';
export type { RouteOptions } from './routes/index.js';

// Version info
export const VERSION = '0.1.0' as const;