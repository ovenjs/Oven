import { AsyncEventEmitter } from '@vladfrangu/async_event_emitter';
import { request } from 'undici';

import { API_BASE_URL, RESTEvents, RESTOptions, RESTRequest } from './types';
import { DiscordAPIError } from './utils/errors/DiscordAPIError';
import { RESTError } from './utils/errors/RESTError';
import { ValidationError } from './utils/errors/ValidationError';
import { DiscordTokenSchema, RESTOptionsSchema } from './utils/zod';

export class REST extends AsyncEventEmitter<RESTEvents> {
  private readonly options: RESTOptions;
  private readonly baseURL: string = API_BASE_URL;

  constructor(options?: RESTOptions) {
    super();

    const res = RESTOptionsSchema.safeParse(options);
    if (!res.success) throw new ValidationError(res.error);

    this.options = res.data;
  }

  setToken(token: string): this {
    const res = DiscordTokenSchema.safeParse(token);
    if (!res.success) throw new ValidationError(res.error);

    this.options.token = token;
    return this;
  }

  get endpoint(): string {
    return `${this.baseURL}/v${this.options.version}`;
  }

  async request<T = any>(data: RESTRequest): Promise<T> {
    const { method, path, data: body, options } = data;

    this.emit('restDebug', `[REST]: REST.request(): ${method} ${path}`);

    const _url = `${this.endpoint}${path.startsWith('/') ? path : `/${path}`}`;

    this.emit('restDebug', `[REST]: REST.request(): URL -> ${_url}`);

    const _headers = {
      'User-Agent': 'OvenJS (https://github.com/ovenjs, 0.0.0)',
      ...options?.headers,
    };

    // If a token is present in the REST options,
    // Add the Authorization header.
    if (this.options.token) {
      _headers['Authorization'] = `Bot ${this.options.token}`;
    }

    // If a body is present and content-type header,
    // Is missing then set the content-type header.
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

      // Handle Discord API errors
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

      // Parse the response body.
      const responseBody = await response.body.json();

      return responseBody as T;
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        throw error;
      }

      throw new RESTError(`[REST] Error -> ${error}`);
    }
  }

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
}
