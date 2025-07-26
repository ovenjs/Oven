import { BotToken } from "../primitives/brand";
import { RateLimitData } from "./ratelimit";

/**
 * RESTOptions - Options for REST
 */
export interface RESTOptions {
    /**
     * Discord Bot Token
     * @link https://discord.com/developers/docs/reference#authentication
     */
    token:           BotToken;

    /**
     * The API Version Used By REST
     * @link https://discord.com/developers/docs/reference#api-versioning
     * @default "v10"
     */
    version:         number;

    rateLimitOffset: number | undefined;
    timeout:         number | undefined;
    retries:         number | undefined;
    userAgent:       string;
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * RestOptions - Request Data Options
 */
export interface RequestOptions {
    method:  HTTPMethod;
    path:    string;
    body:    unknown | undefined;
    query:   Record<string, string | number | boolean> | undefined;
    headers: Record<string, string> | undefined;
    files:   FileData[] | undefined;
    reason:  string | undefined;
    timeout: number | undefined;
}

export interface FileData {
    contentType: string | undefined;
    name:        string;
    data:        Buffer | Uint8Array;
}

export interface APIResponse<T = unknown> {
    data:       T;
    status:     number;
    headers:    Record<string, string>;
    rateLimit?: RateLimitData;
}

export interface APIError {
    code:    number;
    message: string;
    errors?: Record<string, APIErrorDetail>;
}

export interface APIErrorDetail {
    code:    string;
    message: string;
}

export interface APIErrorResponse {
    message:      string;
    code:         number;
    errors?:      Record<string, APIErrorDetail>;
    retry_after?: number;
    global?:      boolean;
}