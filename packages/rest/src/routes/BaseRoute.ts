/**
 * Base route class for Discord API endpoints
 * Provides common functionality for all API routes
 */

import type { RequestOptions, HTTPMethod } from '@ovenjs/types';

export interface RouteOptions {
  baseURL: string;
  token: string;
  version: number;
}

/**
 * Base class for all Discord API routes
 */
export abstract class BaseRoute {
  protected readonly baseURL: string;
  protected readonly token: string;
  protected readonly version: number;

  constructor(options: RouteOptions) {
    this.baseURL = options.baseURL;
    this.token = options.token;
    this.version = options.version;
  }

  /**
   * Build full URL for an endpoint
   */
  protected buildURL(endpoint: string): string {
    return `${this.baseURL}${endpoint}`;
  }

  /**
   * Create request options with common headers
   */
  protected createRequestOptions(
    method: HTTPMethod,
    path: string,
    options: Partial<RequestOptions> = {}
  ): RequestOptions {
    return {
      method,
      path,
      headers: {
        'Authorization': `Bot ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };
  }

  /**
   * Validate snowflake ID format
   */
  protected validateSnowflake(id: string, name = 'ID'): void {
    if (!/^\d{17,19}$/.test(id)) {
      throw new Error(`Invalid ${name}: ${id}. Must be a valid Discord snowflake.`);
    }
  }

  /**
   * Validate required parameters
   */
  protected validateRequired<T>(value: T | undefined | null, name: string): asserts value is T {
    if (value === undefined || value === null) {
      throw new Error(`Missing required parameter: ${name}`);
    }
  }

  /**
   * Sanitize reason for audit logs
   */
  protected sanitizeReason(reason?: string): string | undefined {
    if (!reason) return undefined;
    
    // Discord has a 512 character limit for audit log reasons
    const sanitized = reason.slice(0, 512);
    
    // Remove any characters that might break the header
    return sanitized.replace(/[\r\n\t]/g, ' ').trim();
  }

  /**
   * Build query parameters string
   */
  protected buildQuery(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    }

    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }

  /**
   * Format endpoint with parameters
   */
  protected formatEndpoint(template: string, params: Record<string, string>): string {
    let endpoint = template;
    
    for (const [key, value] of Object.entries(params)) {
      endpoint = endpoint.replace(`{${key}}`, value);
    }
    
    return endpoint;
  }
}