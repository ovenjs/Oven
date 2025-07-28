import { RequestInit } from 'undici';

// Constant Variable.
export const API_BASE_URL = 'https://discord.com/api';

export interface RestEvents {
  restDebug: [debug: string];
  restResponse: [response: string];
}

export interface RESTOptions {
  /**
   * The bot token
   */
  token?: string;

  /**
   * The API version
   * @default 10
   */
  version?: number;

  /**
   * The time to wait before aborting a request
   * @default 15000 - MS
   */
  timeout?: number;
}

export interface RESTRequest {
  /**
   * The HTTP method to use for this request
   */
  method: string;

  /**
   * The path to make the request to
   */
  path: string;

  /**
   * The request data
   */
  data?: any;

  /**
   * The request options
   */
  options?: Omit<
    RequestInit,
    | 'body'
    | 'dispatcher'
    | 'keepalive'
    | 'integrity'
    | 'duplex'
    | 'mode'
    | 'method'
    | 'referrer'
    | 'referrerPolicy'
    | 'redirect'
    | 'window'
    | 'signal'
  >;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  resetAfter: number;
  bucket?: string;
  global?: boolean;
  retryAfter?: number;
}

export interface APIError {
  code: number;
  message: string;
  errors?: any;
}
