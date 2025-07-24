import fetch, { RequestInit, Response } from 'node-fetch';
import type { APIRequest, APIResponse, RateLimitData } from '@ovenjs/types';
import { 
  BASE_URL, 
  USER_AGENT, 
  RATE_LIMIT_RESET_AFTER, 
  RATE_LIMIT_REMAINING, 
  RATE_LIMIT_LIMIT, 
  RATE_LIMIT_BUCKET,
  RATE_LIMIT_GLOBAL,
  RETRY_AFTER 
} from './constants';

export interface RequestHandlerOptions {
  token?: string;
  timeout?: number;
  retries?: number;
  userAgent?: string;
}

export class RequestHandler {
  private token?: string;
  private timeout: number;
  private retries: number;
  private userAgent: string;
  private globalRateLimit: { reset: number; limit: number } | null = null;
  private bucketRateLimits = new Map<string, { reset: number; remaining: number; limit: number }>();

  constructor(options: RequestHandlerOptions = {}) {
    this.token = options.token;
    this.timeout = options.timeout ?? 15000;
    this.retries = options.retries ?? 3;
    this.userAgent = options.userAgent ?? USER_AGENT;
  }

  public setToken(token: string): void {
    this.token = token;
  }

  public async request(request: APIRequest): Promise<APIResponse> {
    const url = BASE_URL + request.path;
    
    // Check rate limits
    await this.checkRateLimits(request);

    const requestOptions: RequestInit = {
      method: request.method,
      headers: {
        'User-Agent': this.userAgent,
        'Content-Type': 'application/json',
        ...request.options.headers,
      },
      signal: AbortSignal.timeout(this.timeout),
    };

    // Add authorization header if token is available
    if (this.token) {
      (requestOptions.headers as any)['Authorization'] = `Bot ${this.token}`;
    }

    // Add body if present
    if (request.data) {
      if (request.files && request.files.length > 0) {
        // Handle multipart/form-data for file uploads
        const formData = new FormData();
        
        if (request.data) {
          formData.append('payload_json', JSON.stringify(request.data));
        }
        
        request.files.forEach((file, index) => {
          const blob = new Blob([file.data], { type: file.contentType });
          formData.append(`files[${index}]`, blob, file.name);
        });
        
        requestOptions.body = formData as any;
        delete (requestOptions.headers as any)['Content-Type']; // Let fetch set it
      } else {
        requestOptions.body = JSON.stringify(request.data);
      }
    }

    let response: Response;
    let attempts = 0;

    while (attempts <= this.retries) {
      try {
        response = await fetch(url, requestOptions);
        
        // Handle rate limiting
        await this.handleRateLimit(response, request);
        
        if (response.status === 429) {
          attempts++;
          continue; // Retry after rate limit handling
        }

        const responseData = await this.parseResponse(response);
        
        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          headers: this.parseHeaders(response.headers),
        };
      } catch (error) {
        attempts++;
        if (attempts > this.retries) {
          throw error;
        }
        
        // Wait before retry
        await this.sleep(Math.pow(2, attempts) * 1000);
      }
    }

    throw new Error('Max retries exceeded');
  }

  private async checkRateLimits(request: APIRequest): Promise<void> {
    const now = Date.now();

    // Check global rate limit
    if (this.globalRateLimit && now < this.globalRateLimit.reset) {
      const waitTime = this.globalRateLimit.reset - now;
      await this.sleep(waitTime);
    }

    // Check bucket-specific rate limit
    const bucket = this.getBucket(request);
    const bucketLimit = this.bucketRateLimits.get(bucket);
    
    if (bucketLimit && bucketLimit.remaining <= 0 && now < bucketLimit.reset) {
      const waitTime = bucketLimit.reset - now;
      await this.sleep(waitTime);
    }
  }

  private async handleRateLimit(response: Response, request: APIRequest): Promise<void> {
    const bucket = this.getBucket(request);
    const now = Date.now();

    // Handle global rate limit
    const globalHeader = response.headers.get(RATE_LIMIT_GLOBAL);
    if (globalHeader === 'true') {
      const retryAfter = parseInt(response.headers.get(RETRY_AFTER) || '1', 10) * 1000;
      this.globalRateLimit = {
        reset: now + retryAfter,
        limit: 50, // Discord's global rate limit
      };
    }

    // Handle bucket-specific rate limit
    const remaining = parseInt(response.headers.get(RATE_LIMIT_REMAINING) || '1', 10);
    const limit = parseInt(response.headers.get(RATE_LIMIT_LIMIT) || '1', 10);
    const resetAfter = parseFloat(response.headers.get(RATE_LIMIT_RESET_AFTER) || '1') * 1000;

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get(RETRY_AFTER) || '1', 10) * 1000;
      await this.sleep(retryAfter);
    }

    // Update bucket rate limit info
    this.bucketRateLimits.set(bucket, {
      remaining,
      limit,
      reset: now + resetAfter,
    });
  }

  private getBucket(request: APIRequest): string {
    // Simplified bucket detection - in a real implementation,
    // this would be more sophisticated
    return `${request.method}:${request.path.split('/').slice(0, 3).join('/')}`;
  }

  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  private parseHeaders(headers: any): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, value] of headers) {
      result[key] = value;
    }
    
    return result;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}