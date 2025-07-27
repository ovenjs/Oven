/**
 * REST-specific types for OvenJS
 */

import type { BotToken } from '../primitives/brand.js';
import type { Milliseconds } from '../primitives/time.js';

/**
 * REST client options
 */
export interface RESTOptions {
  /** Bot token */
  token: BotToken;
  
  /** API version */
  version?: number;
  
  /** Base URL for Discord API */
  baseURL?: string;
  
  /** Request timeout */
  timeout?: number;
  
  /** Number of retries */
  retries?: number;
  
  /** Rate limit offset */
  rateLimitOffset?: number;
  
  /** Global requests per second */
  globalRequestsPerSecond?: number;
  
  /** User agent string */
  userAgent?: string;
}

/**
 * HTTP methods
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Request options
 */
export interface RequestOptions {
  method: HTTPMethod;
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  files?: FileData[];
  reason?: string;
  timeout?: number;
}

/**
 * File data for requests
 */
export interface FileData {
  contentType?: string;
  name: string;
  data: Buffer | Uint8Array;
}

/**
 * API response wrapper
 */
export interface APIResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
  rateLimit?: RateLimitData | undefined;
}

/**
 * Rate limit information
 */
export interface RateLimitData {
  limit: number;
  remaining: number;
  reset: number;
  resetAfter: number;
  bucket: string;
  global: boolean;
  scope: 'user' | 'global' | 'shared';
}

/**
 * Request configuration for internal use
 */
export interface RequestConfig {
  timeout: Milliseconds;
  retries: number;
  userAgent: string;
}

/**
 * Batch request result
 */
export interface BatchRequestResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  status: number;
  headers: Record<string, string>;
}

/**
 * Route options
 */
export interface RouteOptions {
  baseURL: string;
  token: BotToken;
  version: number;
}

/**
 * Bucket information
 */
export interface BucketInfo {
  id: string;
  limit: number;
  remaining: number;
  reset: number;
  resetAfter: number;
}

/**
 * Queued request
 */
export interface QueuedRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  request: () => Promise<any>;
}