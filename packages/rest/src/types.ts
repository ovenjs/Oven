import { RequestInit } from 'undici';

/**
 * The base URL for the Discord API.
 * @remarks
 * This is used as the root endpoint for all REST requests made by the client.
 * Trailing slashes are normalized internally.
 * @example
 * ```ts
 * `${API_BASE_URL}/v10/users/@me`
 * ```
 */
export const API_BASE_URL = 'https://discord.com/api';

/**
 * Event definitions for the REST manager.
 *
 * @remarks
 * These events can be listened to using an EventEmitter pattern.
 * They provide insight into internal REST operations, useful for debugging and monitoring.
 *
 * @eventGroup REST Events
 */
export interface RESTEvents {
  /**
   * Emitted when debug information is available about a REST operation.
   *
   * @param debug - A human-readable string containing debug details such as request timing, rate limits, or retry attempts.
   *
   * @example
   * ```ts
   * rest.on('restDebug', (debug) => {
   *   console.log(`[REST Debug] ${debug}`);
   * });
   * ```
   */
  restDebug: [debug: string];

  /**
   * Emitted whenever a response is received from the Discord API.
   *
   * @param response - A stringified summary of the HTTP response (e.g., status code, path, timing).
   *
   * @example
   * ```ts
   * rest.on('restResponse', (response) => {
   *   console.log(`[REST Response] ${response}`);
   * });
   * ```
   */
  restResponse: [response: string];
}

/**
 * Enum representing the event names emitted by the REST manager.
 *
 * @remarks
 * These map directly to the keys in the `RESTEvents` interface and are used to standardize event listening/handling.
 *
 * @see {@link RESTEvents} for event parameter details.
 */
export enum RestEvents {
  /**
   * Event fired when debug information is generated during a REST request.
   */
  debug = 'restDebug',

  /**
   * Event fired when a response is received from the Discord API.
   */
  response = 'restResponse',
}

/**
 * Options used to configure the REST client behavior.
 *
 * @remarks
 * This configuration object allows customization of how requests are sent to the Discord API.
 */
export interface RESTOptions {
  /**
   * The bot token used for authentication with the Discord API.
   *
   * @remarks
   * If not provided, requests that require authorization will fail.
   *
   * @example
   * ```ts
   * const options = { token: 'your-bot-token' };
   * // or
   * <REST>.setToken("your-bot-token");
   * ```
   */
  token?: string;

  /**
   * The Discord API version to target in requests.
   *
   * @defaultValue 10
   *
   * @remarks
   * Version `10` is currently the latest stable version.
   * Changing this may affect payload structure and available endpoints.
   *
   * @example
   * ```ts
   * const options = { version: 10 };
   * ```
   */
  version?: number;

  /**
   * The maximum time (in milliseconds) to wait before aborting a request.
   *
   * @defaultValue 15000 // 15 seconds
   *
   * @remarks
   * This timeout applies per request and uses an internal `AbortSignal`.
   * Useful for preventing hanging requests in poor network conditions.
   *
   * @example
   * ```ts
   * const options = { timeout: 30_000 }; // 30 second timeout
   * ```
   */
  timeout?: number;
}

/**
 * Represents a single REST request to be sent to the Discord API.
 *
 * @remarks
 * This object encapsulates all necessary data for making an HTTP call.
 * Used internally by the REST manager to queue and execute requests.
 */
export interface RESTRequest {
  /**
   * The HTTP method to use for the request.
   *
   * @example
   * 'GET', 'POST', 'PATCH', 'DELETE'
   */
  method: string;

  /**
   * The API path to make the request to (without the base URL or version prefix).
   *
   * @remarks
   * The full URL will be constructed as `${API_BASE_URL}/v{version}/${path}`.
   *
   * @example
   * '/users/@me/guilds'
   */
  path: string;

  /**
   * Optional payload data to send in the body of the request.
   *
   * @remarks
   * This is typically used with `POST`, `PUT`, and `PATCH` methods.
   * Will be serialized to JSON automatically unless overridden via headers.
   */
  data?: any;

  /**
   * Additional fetch-like options to apply to the request.
   *
   * @remarks
   * Subset of `undici.RequestInit`, excluding properties managed internally
   * (like `method`, `body`, `signal`, etc.) to prevent conflicts.
   *
   * Use this to set custom headers, query parameters (via `url` manipulation), or other fetch options.
   *
   * @see https://github.com/nodejs/undici#requestinit for full details on supported options.
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

/**
 * Interface representing the headers related to rate limiting.
 */
export interface RateLimitHeaders {
  /**
   * The maximum number of requests that can be made in a given time frame.
   */
  'x-ratelimit-limit'?: string;

  /**
   * The number of requests remaining in the current time frame.
   */
  'x-ratelimit-remaining'?: string;

  /**
   * The time at which the current rate limit resets, in epoch time.
   */
  'x-ratelimit-reset'?: string;

  /**
   * The time remaining until the rate limit resets, in seconds.
   */
  'x-ratelimit-reset-after'?: string;

  /**
   * The identifier for the rate limit bucket.
   */
  'x-ratelimit-bucket'?: string;

  /**
   * Indicates whether the rate limit is global across all endpoints.
   */
  'x-ratelimit-global'?: string;

  /**
   * The time to wait before making another request, in seconds.
   */
  'retry-after'?: string;
}

/**
 * Interface representing the information about rate limits.
 */
export interface RateLimitInfo {
  /**
   * The maximum number of requests allowed in the current time frame.
   */
  limit: number;

  /**
   * The number of requests remaining in the current time frame.
   */
  remaining: number;

  /**
   * The time at which the current rate limit resets, in epoch time.
   */
  reset: number;

  /**
   * The time remaining until the rate limit resets, in seconds.
   */
  resetAfter: number;

  /**
   * The identifier for the rate limit bucket, if applicable.
   */
  bucket?: string;

  /**
   * Indicates whether the rate limit is global across all endpoints.
   */
  global?: boolean;

  /**
   * The time to wait before making another request, in seconds.
   */
  retryAfter?: number;
}

/**
 * Interface representing information about a specific rate limit bucket.
 */
export interface BucketInfo {
  /**
   * The unique identifier for the bucket.
   */
  id: string;

  /**
   * The maximum number of requests allowed in the current time frame for this bucket.
   */
  limit: number;

  /**
   * The number of requests remaining in the current time frame for this bucket.
   */
  remaining: number;

  /**
   * The time at which the current rate limit for this bucket resets, in epoch time.
   */
  reset: number;
}

/**
 * Structure representing an error response from the Discord API.
 *
 * @remarks
 * Returned when a request fails with a non-2xx status code.
 * Conforms to Discord's standard API error format.
 *
 * @see https://discord.com/developers/docs/reference#errors
 */
export interface DiscordAPIError {
  /**
   * Discord-specific error code.
   *
   * @remarks
   * Not all errors have numeric codes; some generic responses may use 0 or null.
   */
  code: number;

  /**
   * Human-readable error message.
   *
   * @example
   * "Invalid form body"
   * "You are being rate limited"
   */
  message: string;

  /**
   * @remarks
   * Present in validation errors. Describes which fields failed and why.
   *
   * @example
   * ```json
   * {
   *   "name": {
   *     "code": "BASE_TYPE_BAD_LENGTH",
   *     "message": "Must be between 1 and 100 characters."
   *   }
   * }
   * ```
   */
  errors?: any;
}
