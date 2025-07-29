import { AsyncEventEmitter } from '@vladfrangu/async_event_emitter';
import { request } from 'undici';

import { API_BASE_URL, RESTEvents, RESTOptions, RESTRequest } from './types';
import { DiscordAPIError } from './utils/errors/DiscordAPIError';
import { RESTError } from './utils/errors/RESTError';
import { ValidationError } from './utils/errors/ValidationError';
import { DiscordTokenSchema, RESTOptionsSchema } from './utils/zod';

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

    this.emit('restDebug', `[REST]: REST.request(): ${method} ${path}`);

    const _url = `${this.endpoint}${path.startsWith('/') ? path : `/${path}`}`;
    this.emit('restDebug', `[REST]: REST.request(): URL -> ${_url}`);

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

      return responseBody as T;
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        throw error;
      }

      throw new RESTError(`[REST] Error -> ${error}`);
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
  async get<T = any>(route: string, options?: Omit<RESTRequest, 'method' | 'path'>): Promise<T> {
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
  async post<T = any>(route: string, options?: Omit<RESTRequest, 'method' | 'path'>): Promise<T> {
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
  async put<T = any>(route: string, options?: Omit<RESTRequest, 'method' | 'path'>): Promise<T> {
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
  async patch<T = any>(route: string, options?: Omit<RESTRequest, 'method' | 'path'>): Promise<T> {
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
  async delete<T = any>(route: string, options?: Omit<RESTRequest, 'method' | 'path'>): Promise<T> {
    return this.request({
      ...options,
      method: 'DELETE',
      path: route,
    });
  }
}