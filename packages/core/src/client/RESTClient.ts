import { REST } from '@ovendjs/rest';

import { BaseClient } from './BaseClient';
import type { Bot } from '../Bot';
import type { RESTOptions } from '../types';

/**
 * Client for handling REST API requests.
 *
 * @remarks
 * This class wraps the REST client from @ovendjs/rest and provides
 * a simplified interface for the core package.
 */
export class RESTClient extends BaseClient {
  /**
   * The underlying REST instance.
   */
  private rest: REST | null = null;

  /**
   * Creates a new RESTClient instance.
   *
   * @param bot - The bot instance this client belongs to.
   * @param options - The options for the REST client.
   */
  constructor(bot: Bot, options: RESTOptions = {}) {
    super(bot);
    
    // Create the REST instance with the provided options
    this.rest = new REST(options);
  }

  /**
   * Sets the token for the REST client.
   *
   * @param token - The bot token to use for authentication.
   * @returns The REST client instance for chaining.
   */
  public setToken(token: string): this {
    if (!this.rest) {
      throw new Error('REST client is not initialized');
    }

    this.rest.setToken(token);
    return this;
  }

  /**
   * Makes a GET request to the Discord API.
   *
   * @param path - The API path to request.
   * @param options - Additional options for the request.
   * @returns A promise that resolves with the response data.
   */
  public async get<T = any>(path: string, options?: any): Promise<T> {
    if (!this.rest) {
      throw new Error('REST client is not initialized');
    }

    return this.rest.get<T>(path, options);
  }

  /**
   * Makes a POST request to the Discord API.
   *
   * @param path - The API path to request.
   * @param options - Additional options for the request.
   * @returns A promise that resolves with the response data.
   */
  public async post<T = any>(path: string, options?: any): Promise<T> {
    if (!this.rest) {
      throw new Error('REST client is not initialized');
    }

    return this.rest.post<T>(path, options);
  }

  /**
   * Makes a PUT request to the Discord API.
   *
   * @param path - The API path to request.
   * @param options - Additional options for the request.
   * @returns A promise that resolves with the response data.
   */
  public async put<T = any>(path: string, options?: any): Promise<T> {
    if (!this.rest) {
      throw new Error('REST client is not initialized');
    }

    return this.rest.put<T>(path, options);
  }

  /**
   * Makes a PATCH request to the Discord API.
   *
   * @param path - The API path to request.
   * @param options - Additional options for the request.
   * @returns A promise that resolves with the response data.
   */
  public async patch<T = any>(path: string, options?: any): Promise<T> {
    if (!this.rest) {
      throw new Error('REST client is not initialized');
    }

    return this.rest.patch<T>(path, options);
  }

  /**
   * Makes a DELETE request to the Discord API.
   *
   * @param path - The API path to request.
   * @param options - Additional options for the request.
   * @returns A promise that resolves with the response data.
   */
  public async delete<T = any>(path: string, options?: any): Promise<T> {
    if (!this.rest) {
      throw new Error('REST client is not initialized');
    }

    return this.rest.delete<T>(path, options);
  }

  /**
   * Makes a raw request to the Discord API.
   *
   * @param options - The request options.
   * @returns A promise that resolves with the response data.
   */
  public async request<T = any>(options: any): Promise<T> {
    if (!this.rest) {
      throw new Error('REST client is not initialized');
    }

    return this.rest.request<T>(options);
  }

  /**
   * Destroys the REST client and cleans up resources.
   */
  public destroy(): void {
    if (this.rest) {
      this.rest.destroy();
      this.rest = null;
    }
  }
}