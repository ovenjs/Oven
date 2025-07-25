/**
 * Main REST client for Discord API
 * Orchestrates rate limiting, request handling, and API routes
 */
import { ms } from '@ovenjs/types';
import { BucketManager } from '../buckets/index.js';
import { RequestHandler, ResponseHandler } from '../handlers/index.js';
import { GuildRoutes, ChannelRoutes, UserRoutes } from '../routes/index.js';
/**
 * Main REST client for Discord API interactions
 */
export class RESTClient {
    options;
    bucketManager;
    requestHandler;
    responseHandler;
    // API route instances
    guilds;
    channels;
    users;
    constructor(options) {
        // Set default options
        this.options = {
            token: options.token,
            version: options.version ?? 10,
            baseURL: options.baseURL ?? 'https://discord.com/api',
            timeout: options.timeout ?? ms(15000),
            retries: options.retries ?? 3,
            rateLimitOffset: options.rateLimitOffset ?? 50,
            globalRequestsPerSecond: options.globalRequestsPerSecond ?? 50,
            userAgent: options.userAgent ?? 'OvenJS/0.1.0 (https://github.com/ovenjs/oven)',
        };
        // Validate token
        if (!this.options.token) {
            throw new Error('Bot token is required');
        }
        // Initialize core components
        this.bucketManager = new BucketManager();
        this.requestHandler = new RequestHandler({
            timeout: this.options.timeout,
            retries: this.options.retries,
            userAgent: this.options.userAgent,
        });
        this.responseHandler = new ResponseHandler();
        // Initialize API routes
        const routeOptions = {
            baseURL: `${this.options.baseURL}/v${this.options.version}`,
            token: this.options.token,
            version: this.options.version,
        };
        this.guilds = new GuildRoutes(routeOptions);
        this.channels = new ChannelRoutes(routeOptions);
        this.users = new UserRoutes(routeOptions);
    }
    /**
     * Execute a request with rate limiting and error handling
     */
    async request(options) {
        const url = this.buildURL(options.path);
        const bucket = this.bucketManager.getBucket(options.method, options.path);
        // Queue the request through the rate limit bucket
        const response = await bucket.queueRequest(async () => {
            return this.requestHandler.executeRequest(url, options);
        });
        // Update bucket mapping if Discord provided a bucket header
        const bucketHeader = response.headers.get('x-ratelimit-bucket');
        if (bucketHeader) {
            this.bucketManager.updateBucketMapping(options.method, options.path, bucketHeader);
        }
        // Process the response
        return this.responseHandler.processResponse(response, options.method, options.path, options.body);
    }
    /**
     * Execute multiple requests in batch
     */
    async batchRequest(requests) {
        const batchData = requests.map(req => ({
            url: this.buildURL(req.path),
            options: req,
            key: `${req.method}:${req.path}`,
        }));
        const results = await this.requestHandler.batchRequests(batchData);
        return results.map((result, index) => {
            const request = requests[index];
            if (result.success) {
                return {
                    data: result.data,
                    status: result.status,
                    headers: result.headers,
                    rateLimit: this.extractRateLimitFromHeaders(result.headers),
                };
            }
            else {
                throw result.error;
            }
        });
    }
    /**
     * Get rate limit information for debugging
     */
    getRateLimitInfo() {
        return this.bucketManager.getBucketInfo();
    }
    /**
     * Get statistics about API usage
     */
    getStatistics() {
        return {
            buckets: this.bucketManager.getStatistics(),
            config: { ...this.options },
        };
    }
    /**
     * Clear all rate limit buckets
     */
    clearBuckets() {
        this.bucketManager.clear();
    }
    /**
     * Update client configuration
     */
    updateConfig(options) {
        Object.assign(this.options, options);
        // Update request handler config
        if (options.timeout || options.retries || options.userAgent) {
            this.requestHandler.updateConfig({
                timeout: options.timeout ? ms(options.timeout) : undefined,
                retries: options.retries,
                userAgent: options.userAgent,
            });
        }
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.options };
    }
    /**
     * Build full URL for a path
     */
    buildURL(path) {
        // Remove leading slash if present to avoid double slashes
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `${this.options.baseURL}/v${this.options.version}/${cleanPath}`;
    }
    /**
     * Extract rate limit data from headers object
     */
    extractRateLimitFromHeaders(headers) {
        const limit = headers['x-ratelimit-limit'];
        const remaining = headers['x-ratelimit-remaining'];
        const reset = headers['x-ratelimit-reset'];
        const resetAfter = headers['x-ratelimit-reset-after'];
        const bucket = headers['x-ratelimit-bucket'];
        const global = headers['x-ratelimit-global'];
        const scope = headers['x-ratelimit-scope'];
        if (!limit || !remaining || !reset || !resetAfter || !bucket) {
            return undefined;
        }
        return {
            limit: parseInt(limit, 10),
            remaining: parseInt(remaining, 10),
            reset: parseFloat(reset) * 1000,
            resetAfter: parseFloat(resetAfter) * 1000,
            bucket,
            global: global === 'true',
            scope: scope || 'user',
        };
    }
    /**
     * Destroy the client and clean up resources
     */
    destroy() {
        this.bucketManager.clear();
    }
}
//# sourceMappingURL=RESTClient.js.map