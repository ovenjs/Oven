import { AsyncEventEmitter } from '@vladfrangu/async_event_emitter';
import { request } from 'undici';

import { API_BASE_URL, RESTOptions, RESTRequest } from './types';

export class REST extends AsyncEventEmitter {
  private readonly options: RESTOptions;
  private readonly baseURL: string = API_BASE_URL;

  constructor(options?: RESTOptions) {
    super();
    options ??= { version: 10, timeout: 15000 };
    this.options = options;
  }

  setToken(token: string): this {
    this.options.token = token;
    return this;
  }

  get endpoint(): string {
    return `${this.baseURL}/v${this.options.version}`;
  }

  async request<T = any>(data: RESTRequest): Promise<T> {
    const { method, path, data: body, options } = data;
    const _url = `${this.endpoint}${path.startsWith('/') ? path : `/${path}`}`;

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

      // Handle empty responses
      if (response.statusCode === 204) {
        return undefined as T;
      }

      // Parse the response body.
      const responseBody = await response.body.json();

      return responseBody as T;
    } catch (error) {
      throw Error(`REST.request(): Error`, { cause: error });
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
