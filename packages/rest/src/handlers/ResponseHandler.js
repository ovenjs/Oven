/**
 * Response handler for processing Discord API responses
 * Handles response parsing, error handling, and rate limit information
 */
export class DiscordAPIError extends Error {
    code;
    method;
    path;
    status;
    requestData;
    constructor(rawError, method, path, status, requestData) {
        super(rawError.message);
        this.name = 'DiscordAPIError';
        this.code = rawError.code;
        this.method = method;
        this.path = path;
        this.status = status;
        this.requestData = requestData;
    }
}
export class HTTPError extends Error {
    status;
    method;
    path;
    requestData;
    constructor(message, status, method, path, requestData) {
        super(message);
        this.name = 'HTTPError';
        this.status = status;
        this.method = method;
        this.path = path;
        this.requestData = requestData;
    }
}
/**
 * Handles Discord API response processing
 */
export class ResponseHandler {
    /**
     * Process a Discord API response
     */
    async processResponse(response, method, path, requestData) {
        const status = response.status;
        const headers = this.extractHeaders(response.headers);
        const rateLimit = this.extractRateLimitData(response.headers);
        let data;
        try {
            // Handle different response types
            if (status === 204 || !response.headers.get('content-type')) {
                data = undefined;
            }
            else if (response.headers.get('content-type')?.includes('application/json')) {
                const text = await response.text();
                data = text ? JSON.parse(text) : undefined;
            }
            else {
                data = (await response.text());
            }
        }
        catch (error) {
            throw new HTTPError(`Failed to parse response body: ${error.message}`, status, method, path, requestData);
        }
        // Handle error responses
        if (status >= 400) {
            await this.handleErrorResponse(data, method, path, status, requestData);
        }
        return {
            data,
            status,
            headers,
            rateLimit,
        };
    }
    /**
     * Handle error responses from Discord API
     */
    async handleErrorResponse(data, method, path, status, requestData) {
        // Rate limit error (429)
        if (status === 429) {
            const retryAfter = data?.retry_after || 1;
            throw new DiscordAPIError({
                message: `Rate limited. Retry after ${retryAfter}s`,
                code: 0,
                retry_after: retryAfter,
                global: data?.global || false,
            }, method, path, status, requestData);
        }
        // Discord API error with structured response
        if (data && typeof data === 'object' && ('code' in data || 'message' in data)) {
            throw new DiscordAPIError(data, method, path, status, requestData);
        }
        // Generic HTTP error
        const message = this.getHTTPErrorMessage(status);
        throw new HTTPError(message, status, method, path, requestData);
    }
    /**
     * Extract rate limit data from response headers
     */
    extractRateLimitData(headers) {
        const limit = headers.get('x-ratelimit-limit');
        const remaining = headers.get('x-ratelimit-remaining');
        const reset = headers.get('x-ratelimit-reset');
        const resetAfter = headers.get('x-ratelimit-reset-after');
        const bucket = headers.get('x-ratelimit-bucket');
        const global = headers.get('x-ratelimit-global');
        const scope = headers.get('x-ratelimit-scope');
        if (!limit || !remaining || !reset || !resetAfter || !bucket) {
            return undefined;
        }
        return {
            limit: parseInt(limit, 10),
            remaining: parseInt(remaining, 10),
            reset: parseFloat(reset) * 1000, // Convert to milliseconds
            resetAfter: parseFloat(resetAfter) * 1000, // Convert to milliseconds
            bucket,
            global: global === 'true',
            scope: scope || 'user',
        };
    }
    /**
     * Extract relevant headers from response
     */
    extractHeaders(headers) {
        const extracted = {};
        // Common headers we care about
        const importantHeaders = [
            'content-type',
            'x-ratelimit-limit',
            'x-ratelimit-remaining',
            'x-ratelimit-reset',
            'x-ratelimit-reset-after',
            'x-ratelimit-bucket',
            'x-ratelimit-global',
            'x-ratelimit-scope',
            'retry-after',
            'via',
            'cloudflare-ray-id',
        ];
        for (const header of importantHeaders) {
            const value = headers.get(header);
            if (value !== null) {
                extracted[header] = value;
            }
        }
        return extracted;
    }
    /**
     * Get human-readable error message for HTTP status codes
     */
    getHTTPErrorMessage(status) {
        switch (status) {
            case 400:
                return 'Bad Request - The request was malformed';
            case 401:
                return 'Unauthorized - Invalid authentication credentials';
            case 403:
                return 'Forbidden - Missing permissions for this action';
            case 404:
                return 'Not Found - The requested resource does not exist';
            case 405:
                return 'Method Not Allowed - HTTP method not supported for this endpoint';
            case 429:
                return 'Too Many Requests - Rate limit exceeded';
            case 500:
                return 'Internal Server Error - Discord server error';
            case 502:
                return 'Bad Gateway - Discord server is down or being updated';
            case 503:
                return 'Service Unavailable - Discord server is temporarily unavailable';
            case 504:
                return 'Gateway Timeout - Discord server took too long to respond';
            default:
                return `HTTP Error ${status}`;
        }
    }
    /**
     * Check if an error is retryable
     */
    isRetryableError(error) {
        if (error instanceof HTTPError) {
            // Retry on server errors (5xx) but not client errors (4xx)
            return error.status >= 500;
        }
        if (error instanceof DiscordAPIError) {
            // Don't retry on rate limits (handled by buckets) or client errors
            return false;
        }
        // Retry on network errors and other unexpected errors
        return true;
    }
    /**
     * Get retry delay for retryable errors
     */
    getRetryDelay(error, attempt) {
        if (error instanceof HTTPError && error.status >= 500) {
            // Exponential backoff for server errors
            return Math.min(1000 * Math.pow(2, attempt), 30000);
        }
        // Default exponential backoff
        return Math.min(1000 * Math.pow(2, attempt), 10000);
    }
}
//# sourceMappingURL=ResponseHandler.js.map