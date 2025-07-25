/**
 * Request handler with optimization and retry logic
 * Handles HTTP requests with intelligent batching and retries
 */

import { request } from 'undici';
import type { 
  RequestOptions, 
  HTTPMethod, 
  FileData, 
  APIErrorResponse,
  Milliseconds 
} from '@ovenjs/types';
import { ms } from '@ovenjs/types';

export interface RequestConfig {
  timeout?: Milliseconds;
  retries?: number;
  retryDelay?: Milliseconds;
  userAgent?: string;
}

export interface BatchRequestResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  status: number;
  headers: Record<string, string>;
}

/**
 * Handles HTTP requests with optimization and retry logic
 */
export class RequestHandler {
  private readonly config: Required<RequestConfig>;
  private readonly pendingBatches = new Map<string, Promise<any>>();

  constructor(config: RequestConfig = {}) {
    this.config = {
      timeout: config.timeout ?? ms(15_000),
      retries: config.retries ?? 3,
      retryDelay: config.retryDelay ?? ms(1_000),
      userAgent: config.userAgent ?? 'OvenJS/0.1.0 (https://github.com/ovenjs/oven)',
    };
  }

  /**
   * Execute a single HTTP request with retry logic
   */
  async executeRequest(url: string, options: RequestOptions): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await this.performRequest(url, options);
        
        // If we get a rate limit response, let the bucket handle it
        if (response.status === 429) {
          return response;
        }

        // If successful or client error (not server error), return immediately
        if (response.status < 500) {
          return response;
        }

        // Server error - retry if we have attempts left
        if (attempt < this.config.retries) {
          await this.wait(ms(this.config.retryDelay * (attempt + 1)));
          continue;
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        
        // If this is the last attempt, throw the error
        if (attempt === this.config.retries) {
          throw lastError;
        }

        // Wait before retrying with exponential backoff
        await this.wait(ms(this.config.retryDelay * Math.pow(2, attempt)));
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Batch similar requests for efficiency
   */
  async batchRequests<T = any>(requests: Array<{
    url: string;
    options: RequestOptions;
    key?: string;
  }>): Promise<BatchRequestResult<T>[]> {
    const results: BatchRequestResult<T>[] = [];

    // Group requests by similarity (same method, similar path structure)
    const groups = this.groupRequests(requests);

    for (const group of groups) {
      const groupResults = await Promise.allSettled(
        group.map(async req => {
          try {
            const response = await this.executeRequest(req.url, req.options);
            const data = await this.parseResponse<T>(response);
            
            return {
              success: true,
              data,
              status: response.status,
              headers: this.headersToObject(response.headers),
            };
          } catch (error) {
            return {
              success: false,
              error: error as Error,
              status: 0,
              headers: {},
            };
          }
        })
      );

      results.push(...groupResults.map(result => 
        result.status === 'fulfilled' ? result.value : {
          success: false,
          error: result.reason,
          status: 0,
          headers: {},
        }
      ));
    }

    return results;
  }

  /**
   * Perform the actual HTTP request
   */
  private async performRequest(url: string, options: RequestOptions): Promise<Response> {
    const headers: Record<string, string> = {
      'User-Agent': this.config.userAgent,
      ...options.headers,
    };

    let body: string | FormData | undefined;

    // Handle JSON body
    if (options.body && !options.files?.length) {
      headers['Content-Type'] = 'application/json';
      body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    // Handle multipart/form-data with files
    if (options.files?.length) {
      const formData = new FormData();
      
      // Add JSON payload
      if (options.body) {
        formData.append('payload_json', JSON.stringify(options.body));
      }

      // Add files
      options.files.forEach((file, index) => {
        const blob = new Blob([file.data], { type: file.contentType || 'application/octet-stream' });
        formData.append(`files[${index}]`, blob, file.name);
      });

      body = formData;
    }

    // Add audit log reason header
    if (options.reason) {
      headers['X-Audit-Log-Reason'] = encodeURIComponent(options.reason);
    }

    // Build query string
    let finalUrl = url;
    if (options.query) {
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.query)) {
        queryParams.append(key, String(value));
      }
      finalUrl += `?${queryParams.toString()}`;
    }

    const response = await request(finalUrl, {
      method: options.method,
      headers,
      body,
      timeout: options.timeout ?? this.config.timeout,
    });

    return response as unknown as Response;
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const text = await response.text();
      
      if (!text) {
        return undefined as T;
      }

      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`Failed to parse JSON response: ${text}`);
      }
    }

    if (contentType.includes('text/')) {
      return (await response.text()) as T;
    }

    // For other content types, return as buffer
    return (await response.arrayBuffer()) as T;
  }

  /**
   * Convert Headers object to plain object
   */
  private headersToObject(headers: Headers): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  /**
   * Group requests by similarity for batching
   */
  private groupRequests<T>(
    requests: Array<{ url: string; options: RequestOptions; key?: string }>
  ): Array<Array<{ url: string; options: RequestOptions; key?: string }>> {
    const groups = new Map<string, Array<{ url: string; options: RequestOptions; key?: string }>>();

    for (const request of requests) {
      // Group by HTTP method and base path structure
      const baseUrl = new URL(request.url);
      const pathSegments = baseUrl.pathname.split('/').slice(0, 3); // First 3 segments
      const groupKey = `${request.options.method}:${pathSegments.join('/')}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(request);
    }

    return Array.from(groups.values());
  }

  /**
   * Wait for specified duration
   */
  private wait(duration: Milliseconds): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RequestConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Get current configuration
   */
  getConfig(): RequestConfig {
    return { ...this.config };
  }
}