/**
 * Base route class for Discord API endpoints
 * Provides common functionality for all API routes
 */
import type { RequestOptions, HTTPMethod } from '@ovenjs/types';
export interface RouteOptions {
    baseURL: string;
    token: string;
    version: number;
}
/**
 * Base class for all Discord API routes
 */
export declare abstract class BaseRoute {
    protected readonly baseURL: string;
    protected readonly token: string;
    protected readonly version: number;
    constructor(options: RouteOptions);
    /**
     * Build full URL for an endpoint
     */
    protected buildURL(endpoint: string): string;
    /**
     * Create request options with common headers
     */
    protected createRequestOptions(method: HTTPMethod, path: string, options?: Partial<RequestOptions>): RequestOptions;
    /**
     * Validate snowflake ID format
     */
    protected validateSnowflake(id: string, name?: string): void;
    /**
     * Validate required parameters
     */
    protected validateRequired<T>(value: T | undefined | null, name: string): asserts value is T;
    /**
     * Sanitize reason for audit logs
     */
    protected sanitizeReason(reason?: string): string | undefined;
    /**
     * Build query parameters string
     */
    protected buildQuery(params: Record<string, any>): string;
    /**
     * Format endpoint with parameters
     */
    protected formatEndpoint(template: string, params: Record<string, string>): string;
}
//# sourceMappingURL=BaseRoute.d.ts.map