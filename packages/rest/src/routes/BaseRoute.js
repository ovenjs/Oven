/**
 * Base route class for Discord API endpoints
 * Provides common functionality for all API routes
 */
/**
 * Base class for all Discord API routes
 */
export class BaseRoute {
    baseURL;
    token;
    version;
    constructor(options) {
        this.baseURL = options.baseURL;
        this.token = options.token;
        this.version = options.version;
    }
    /**
     * Build full URL for an endpoint
     */
    buildURL(endpoint) {
        return `${this.baseURL}${endpoint}`;
    }
    /**
     * Create request options with common headers
     */
    createRequestOptions(method, path, options = {}) {
        return {
            method,
            path,
            headers: {
                'Authorization': `Bot ${this.token}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };
    }
    /**
     * Validate snowflake ID format
     */
    validateSnowflake(id, name = 'ID') {
        if (!/^\d{17,19}$/.test(id)) {
            throw new Error(`Invalid ${name}: ${id}. Must be a valid Discord snowflake.`);
        }
    }
    /**
     * Validate required parameters
     */
    validateRequired(value, name) {
        if (value === undefined || value === null) {
            throw new Error(`Missing required parameter: ${name}`);
        }
    }
    /**
     * Sanitize reason for audit logs
     */
    sanitizeReason(reason) {
        if (!reason)
            return undefined;
        // Discord has a 512 character limit for audit log reasons
        const sanitized = reason.slice(0, 512);
        // Remove any characters that might break the header
        return sanitized.replace(/[\r\n\t]/g, ' ').trim();
    }
    /**
     * Build query parameters string
     */
    buildQuery(params) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(item => searchParams.append(key, String(item)));
                }
                else {
                    searchParams.append(key, String(value));
                }
            }
        }
        const query = searchParams.toString();
        return query ? `?${query}` : '';
    }
    /**
     * Format endpoint with parameters
     */
    formatEndpoint(template, params) {
        let endpoint = template;
        for (const [key, value] of Object.entries(params)) {
            endpoint = endpoint.replace(`{${key}}`, value);
        }
        return endpoint;
    }
}
//# sourceMappingURL=BaseRoute.js.map