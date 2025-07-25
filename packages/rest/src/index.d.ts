/**
 * OvenJS REST - Discord REST API client
 * Advanced REST client with intelligent rate limiting and request optimization
 */
export { RESTClient } from './client/index.js';
export { RateLimitBucket, BucketManager } from './buckets/index.js';
export type { BucketInfo, QueuedRequest } from './buckets/index.js';
export { RequestHandler, ResponseHandler, DiscordAPIError, HTTPError } from './handlers/index.js';
export type { RequestConfig, BatchRequestResult } from './handlers/index.js';
export { BaseRoute, GuildRoutes, ChannelRoutes, UserRoutes } from './routes/index.js';
export type { RouteOptions } from './routes/index.js';
export declare const VERSION: "0.1.0";
//# sourceMappingURL=index.d.ts.map