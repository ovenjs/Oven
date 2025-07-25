/**
 * Response handler for processing Discord API responses
 * Handles response parsing, error handling, and rate limit information
 */
import type { APIResponse, APIErrorResponse } from '@ovenjs/types';
export declare class DiscordAPIError extends Error {
    readonly code: number;
    readonly method: string;
    readonly path: string;
    readonly status: number;
    readonly requestData: any;
    constructor(rawError: APIErrorResponse, method: string, path: string, status: number, requestData?: any);
}
export declare class HTTPError extends Error {
    readonly status: number;
    readonly method: string;
    readonly path: string;
    readonly requestData: any;
    constructor(message: string, status: number, method: string, path: string, requestData?: any);
}
/**
 * Handles Discord API response processing
 */
export declare class ResponseHandler {
    /**
     * Process a Discord API response
     */
    processResponse<T = any>(response: Response, method: string, path: string, requestData?: any): Promise<APIResponse<T>>;
    /**
     * Handle error responses from Discord API
     */
    private handleErrorResponse;
    /**
     * Extract rate limit data from response headers
     */
    private extractRateLimitData;
    /**
     * Extract relevant headers from response
     */
    private extractHeaders;
    /**
     * Get human-readable error message for HTTP status codes
     */
    private getHTTPErrorMessage;
    /**
     * Check if an error is retryable
     */
    isRetryableError(error: Error): boolean;
    /**
     * Get retry delay for retryable errors
     */
    getRetryDelay(error: Error, attempt: number): number;
}
//# sourceMappingURL=ResponseHandler.d.ts.map