import { AsyncEventEmitter } from '@vladfrangu/async_event_emitter';
import { request } from 'undici';

import { BucketManager } from './bucket/BucketManager';
import { API_BASE_URL, RESTEvents, RESTOptions, RESTRequest } from './types';
import { DiscordAPIError } from './utils/errors/DiscordAPIError';
import { RESTError } from './utils/errors/RESTError';
import { ValidationError } from './utils/errors/ValidationError';
import { normalizeHeaders } from './utils/util';
import { DiscordTokenSchema, RESTOptionsSchema } from './utils/zod';
import { fmt } from '@ovendjs/utils';

/**
 * REST client for interacting with the Discord API.
 *
 * @remarks
 * This class provides a structured, event-driven interface for making HTTP requests
 * to the Discord API. It handles authentication, URL construction, error parsing,
 * and emits debug/response events for observability.
 *
 * @example
 * ```ts
 * const rest = new REST({ version: 10 })
 *  .setToken('your-token');
 *
 * rest.on('restDebug', (info) => console.log(info));
 *
 * const user = await rest.get('/users/@me');
 * console.log(user.username);
 * ```
 */
export class REST extends AsyncEventEmitter<RESTEvents> {
  /**
   * The finalized REST options after validation.
   *
   * @internal
   */
  private readonly options: RESTOptions;

  /**
   * The base URL used for all API requests (e.g., `https://discord.com/api`).
   *
   * @internal
   * @see API_BASE_URL
   */
  private readonly baseURL: string = API_BASE_URL;

  private bucket: BucketManager;

  /**
   * Debug formatter using @ovendjs/utils
   *
   * @internal
   */
  private readonly debug = fmt({ name: 'rest', version: '0.0.1' });

  /**
   * Creates a new instance of the REST client.
   *
   * @param options - Configuration options for the REST client.
   * @throws {ValidationError} If the provided options fail schema validation.
   *
   * @example
   * ```ts
   * new REST({ token: 'abc123', version: 10, timeout: 15000 });
   * ```
   */
  constructor(options?: RESTOptions) {
    super();

    const res = RESTOptionsSchema.safeParse(options);
    if (!res.success) throw new ValidationError(res.error);

    this.options = res.data;
    this.bucket = new BucketManager();
    
    // Start automatic cleanup of expired buckets
    this.bucket.startCleanup();
  }

  /**
   * Sets the bot token used for authentication.
   *
   * @remarks
   * The token is automatically prefixed with `Bot ` when used in requests.
   * This method is chainable.
   *
   * @param token - The Discord bot token.
   * @returns The current instance for method chaining.
   * @throws {ValidationError} If the token format is invalid.
   *
   * @example
   * ```ts
   * rest.setToken('my-secret-token');
   * ```
   */
  setToken(token: string): this {
    const res = DiscordTokenSchema.safeParse(token);
    if (!res.success) throw new ValidationError(res.error);

    this.options.token = token;
    return this;
  }

  /**
   * Gets the full API endpoint root (including version).
   *
   * @returns The base URL with API version, e.g., `https://discord.com/api/v10`
   *
   * @example
   * ```ts
   * console.log(rest.endpoint); // "https://discord.com/api/v10"
   * ```
   */
  get endpoint(): string {
    return `${this.baseURL}/v${this.options.version}`;
  }

  /**
   * Makes a raw HTTP request to the Discord API.
   *
   * @remarks
   * This is the core method used by all higher-level methods (`get`, `post`, etc.).
   * It emits debug events, constructs headers, handles errors, and parses responses.
   *
   * @template T - The expected type of the response body.
   * @param data - The request configuration.
   * @returns A promise that resolves to the parsed response body.
   * @throws {DiscordAPIError} If the API returns an error status (4xx/5xx).
   * @throws {RESTError} If an internal/network error occurs.
   *
   * @example
   * ```ts
   * const user = await rest.request<User>({ method: 'GET', path: '/users/@me' });
   * ```
   */
  async request<T = any>(data: RESTRequest): Promise<T> {
    const { method, path, data: body, options } = data;

    const debugEmit = (message: string) => {
      const formatted = this.debug.debug(message);
      this.emit('restDebug', typeof formatted === 'string' ? formatted : String(formatted));
    };

    debugEmit(`REST.request(): ${method} ${path}`);

    const _url = `${this.endpoint}${path.startsWith('/') ? path : `/${path}`}`;

    debugEmit(`REST.request(): URL -> ${_url}`);

    if (this.bucket.isGlobalRateLimited()) {
      debugEmit(`REST.request(): Hit global rate-limit. Waiting...`);
    }

    const bucket = this.bucket.getBucket(path, method);
    await bucket.wait();

    const _headers = {
      'User-Agent': 'OvenJS (https://github.com/ovenjs, 0.0.0)',
      ...options?.headers,
    };

    // Add Authorization header if token is available
    if (this.options.token) {
      _headers['Authorization'] = `Bot ${this.options.token}`;
    }

    // Set Content-Type to JSON if body is present and no Content-Type is set
    if (body && !_headers['Content-Type']) {
      _headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await request(_url, {
        method,
        headers: _headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout((this.options.timeout ??= 15000)),
      });

      const headers = normalizeHeaders(response.headers);
      this.bucket.updateFromHeaders(path, method, headers);

      if (headers['x-ratelimit-global']) {
        const tryAfter = parseFloat(headers['retry-after'] || '0');
        debugEmit(`REST.request(): Global Ratelimit hit. Try Again After: ${tryAfter}s`);
        await this.bucket.handleGlobalRateLimit(tryAfter);
        return this.request(data);
      }

      if (response.statusCode === 429) {
        const responseBody = (await response.body.json()) as { retry_after?; code? };
        const tryAfter =
          responseBody.retry_after || parseFloat(headers['retry-after'] || '0');
        debugEmit(`REST.request(): Ratelimit hit on ${method}:/${path}. Try After: ${tryAfter}s`);

        throw new DiscordAPIError(
          `Ratelimit hit on ${method}:/${path}`,
          responseBody.code ?? response.statusCode,
          response.statusCode,
          method,
          path,
          `Try Again After: ${tryAfter}s`
        );
      }

      // Handle non-2xx responses as API errors
      if (!response.statusCode.toString().startsWith('2')) {
        const _res_error = (await response.body.json()) as {
          message: string;
          code: number;
        };

        throw new DiscordAPIError(
          _res_error.message,
          _res_error.code ?? response.statusCode,
          response.statusCode,
          method,
          path
        );
      }

      // Parse and return the JSON response body
      const responseBody = await response.body.json();

      // Emit response event for successful requests
      this.emit('restResponse', `${method} ${path} - ${response.statusCode}`);

      return responseBody as T;
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        throw error;
      }

      // Emit debug event for non-DiscordAPI errors
      debugEmit(`REST.request(): Error occurred - ${error instanceof Error ? error.message : String(error)}`);

      throw new RESTError(`[REST] Error -> ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Sends a GET request to the specified route.
   *
   * @template T - Expected response type.
   * @param route - The API endpoint path (e.g., `/users/@me`).
   * @param options - Optional request overrides.
   * @returns The parsed response body.
   *
   * @example
   * ```ts
   * const guild = await rest.get<Guild>('/guilds/123456789');
   * ```
   */
  async get<T = any>(
    route: string,
    options?: Omit<RESTRequest, 'method' | 'path'>
  ): Promise<T> {
    return this.request({
      ...options,
      method: 'GET',
      path: route,
    });
  }

  /**
   * Sends a POST request to the specified route.
   *
   * @template T - Expected response type.
   * @param route - The API endpoint path.
   * @param options - Optional request overrides.
   * @returns The parsed response body.
   *
   * @example
   * ```ts
   * await rest.post('/channels/123456789/messages', { data: { content: 'Hello!' } });
   * ```
   */
  async post<T = any>(
    route: string,
    options?: Omit<RESTRequest, 'method' | 'path'>
  ): Promise<T> {
    return this.request({
      ...options,
      method: 'POST',
      path: route,
    });
  }

  /**
   * Sends a PUT request to the specified route.
   *
   * @template T - Expected response type.
   * @param route - The API endpoint path.
   * @param options - Optional request overrides.
   * @returns The parsed response body.
   *
   * @example
   * ```ts
   * // Used for upsert-style operations
   * await rest.put('/guilds/123456789/channels', { data: [...] });
   * ```
   */
  async put<T = any>(
    route: string,
    options?: Omit<RESTRequest, 'method' | 'path'>
  ): Promise<T> {
    return this.request({
      ...options,
      method: 'PUT',
      path: route,
    });
  }

  /**
   * Sends a PATCH request to the specified route.
   *
   * @template T - Expected response type.
   * @param route - The API endpoint path.
   * @param options - Optional request overrides.
   * @returns The parsed response body.
   *
   * @example
   * ```ts
   * await rest.patch('/users/@me', { data: { username: 'NewName' } });
   * ```
   */
  async patch<T = any>(
    route: string,
    options?: Omit<RESTRequest, 'method' | 'path'>
  ): Promise<T> {
    return this.request({
      ...options,
      method: 'PATCH',
      path: route,
    });
  }

  /**
   * Sends a DELETE request to the specified route.
   *
   * @template T - Expected response type.
   * @param route - The API endpoint path.
   * @param options - Optional request overrides.
   * @returns The parsed response body.
   *
   * @example
   * ```ts
   * await rest.delete('/channels/123456789');
   * ```
   */
  async delete<T = any>(
    route: string,
    options?: Omit<RESTRequest, 'method' | 'path'>
  ): Promise<T> {
    return this.request({
      ...options,
      method: 'DELETE',
      path: route,
    });
  }

  /**
   * Clean up resources and stop any running processes
   *
   * @remarks
   * This method should be called when the REST client is no longer needed
   * to prevent memory leaks and ensure proper cleanup.
   *
   * @example
   * ```ts
   * const rest = new REST({ token: 'abc123' });
   * // ... use the rest client
   * rest.destroy();
   * ```
   */
  public destroy(): void {
    // Stop the bucket cleanup interval
    this.bucket.stopCleanup();
    
    // Remove all event listeners
    this.removeAllListeners();
  }

  /**
   * Get the current rate limit status for a specific route
   *
   * @param route - The API endpoint path
   * @param method - The HTTP method
   * @returns Rate limit information including remaining requests, reset time, etc.
   *
   * @example
   * ```ts
   * const rateLimit = rest.getRateLimitStatus('/channels/123/messages', 'POST');
   * console.log(`Remaining requests: ${rateLimit.remaining}`);
   * console.log(`Resets at: ${new Date(rateLimit.reset)}`);
   * ```
   */
  public getRateLimitStatus(route: string, method: string): {
    remaining: number;
    limit: number;
    reset: number;
    resetAfter: number;
    isRateLimited: boolean;
  } {
    const bucket = this.bucket.getBucket(route, method);
    const now = Date.now();
    
    return {
      remaining: bucket.remaining,
      limit: bucket.limit,
      reset: bucket.reset,
      resetAfter: Math.max(0, bucket.reset - now),
      isRateLimited: bucket.remaining <= 0 && now < bucket.reset,
    };
  }

  /**
   * Check if the client is currently globally rate limited
   *
   * @returns Global rate limit status
   *
   * @example
   * ```ts
   * const globalStatus = rest.getGlobalRateLimitStatus();
   * if (globalStatus.isRateLimited) {
   *   console.log(`Globally rate limited for ${globalStatus.resetAfter}ms`);
   * }
   * ```
   */
  public getGlobalRateLimitStatus(): {
    isRateLimited: boolean;
    resetAfter: number;
  } {
    const now = Date.now();
    const isRateLimited = this.bucket.isGlobalRateLimited();
    
    return {
      isRateLimited,
      resetAfter: isRateLimited ? this.bucket.getGlobalResetTime() - now : 0,
    };
  }

  /**
   * Make a request with automatic retry on rate limits
   *
   * @template T - The expected type of the response body
   * @param data - The request configuration
   * @param options - Retry options
   * @returns A promise that resolves to the parsed response body
   *
   * @example
   * ```ts
   * const user = await rest.requestWithRetry<User>({
   *   method: 'GET',
   *   path: '/users/@me'
   * }, {
   *   maxRetries: 3,
   *   retryDelay: 1000
   * });
   * ```
   */
  public async requestWithRetry<T = any>(
    data: RESTRequest,
    options?: {
      maxRetries?: number;
      retryDelay?: number;
    }
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const retryDelay = options?.retryDelay ?? 1000;
    
    let lastError: Error | null = null;
    
    // Create debug emitter for this method
    const debugEmit = (message: string) => {
      const formatted = this.debug.debug(message);
      this.emit('restDebug', typeof formatted === 'string' ? formatted : String(formatted));
    };
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(data);
      } catch (error) {
        lastError = error as Error;
        
        // Only retry on rate limit errors
        if (error instanceof DiscordAPIError && error.httpStatus === 429 && attempt < maxRetries) {
              debugEmit(`REST.requestWithRetry(): Rate limited, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              continue;
        }

        
        // Re-throw if it's not a rate limit error or we've exhausted retries
        throw error;
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Unknown error occurred');
  }
}
