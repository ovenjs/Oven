/**
 * Optimized HTTP Client with Connection Pooling
 *
 * This module provides a high-performance HTTP client with connection pooling,
 * keep-alive support, and intelligent resource management.
 */

import {
  ConnectionPool,
  ConnectionPoolConfig,
  ConnectionMetadata,
} from './ConnectionPool';
import { EventEmitter } from '../events/EventEmitter';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';
import { request, Dispatcher } from 'undici';

/**
 * HTTP method types
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

/**
 * HTTP request options
 */
export interface HttpRequestOptions {
  /** Request method */
  method: HttpMethod;
  /** Request URL */
  url: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: any;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to use connection pooling */
  useConnectionPool?: boolean;
  /** Whether to follow redirects */
  followRedirects?: boolean;
  /** Maximum number of redirects */
  maxRedirects?: number;
  /** Whether to validate SSL certificates */
  validateSSL?: boolean;
  /** Request compression */
  compression?: boolean;
  /** Additional request options */
  options?: Record<string, any>;
}

/**
 * HTTP response
 */
export interface HttpResponse {
  /** Response status code */
  status: number;
  /** Response status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body */
  body?: any;
  /** Response URL (may be different from request URL due to redirects) */
  url: string;
  /** Request duration in milliseconds */
  duration: number;
  /** Connection ID */
  connectionId?: string;
  /** Additional response metadata */
  metadata?: Record<string, any>;
}

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  /** Base URL for all requests */
  baseUrl?: string;
  /** Default request headers */
  defaultHeaders?: Record<string, string>;
  /** Default request timeout in milliseconds */
  defaultTimeout?: number;
  /** Connection pool configuration */
  connectionPool?: ConnectionPoolConfig;
  /** Whether to enable connection pooling */
  enableConnectionPool?: boolean;
  /** Whether to enable request compression */
  enableCompression?: boolean;
  /** Whether to follow redirects */
  followRedirects?: boolean;
  /** Maximum number of redirects */
  maxRedirects?: number;
  /** Whether to validate SSL certificates */
  validateSSL?: boolean;
  /** Additional client configuration */
  options?: Record<string, any>;
}

/**
 * HTTP client statistics
 */
export interface HttpClientStats {
  /** Total number of requests */
  totalRequests: number;
  /** Total number of successful responses */
  successfulResponses: number;
  /** Total number of failed responses */
  failedResponses: number;
  /** Total request time in milliseconds */
  totalRequestTime: number;
  /** Average request time in milliseconds */
  averageRequestTime: number;
  /** Maximum request time in milliseconds */
  maxRequestTime: number;
  /** Minimum request time in milliseconds */
  minRequestTime: number;
  /** Total number of redirects */
  totalRedirects: number;
  /** Total number of timeouts */
  totalTimeouts: number;
  /** Total number of connection errors */
  totalConnectionErrors: number;
  /** Client creation timestamp */
  createdAt: number;
  /** Last statistics update timestamp */
  lastUpdatedAt: number;
}

/**
 * HTTP client event types
 */
export enum HttpClientEventType {
  /** Request started */
  REQUEST_STARTED = 'request.started',
  /** Request completed */
  REQUEST_COMPLETED = 'request.completed',
  /** Request failed */
  REQUEST_FAILED = 'request.failed',
  /** Request timed out */
  REQUEST_TIMEOUT = 'request.timeout',
  /** Redirect occurred */
  REDIRECT_OCCURRED = 'redirect.occurred',
  /** Connection acquired */
  CONNECTION_ACQUIRED = 'connection.acquired',
  /** Connection released */
  CONNECTION_RELEASED = 'connection.released',
  /** Client statistics updated */
  CLIENT_STATS_UPDATED = 'client.statsUpdated',
}

/**
 * HTTP Client Event Data
 */
export interface HttpClientEventData {
  /** Request ID */
  requestId?: string;
  /** Request method */
  method?: HttpMethod;
  /** Request URL */
  url?: string;
  /** Response status */
  status?: number;
  /** Error message */
  error?: string;
  /** Request duration in milliseconds */
  duration?: number;
  /** Connection ID */
  connectionId?: string;
  /** Timestamp */
  timestamp: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * High-performance HTTP Client with Connection Pooling
 */
export class HttpClient extends EventEmitter {
  /** HTTP client configuration */
  private config: HttpClientConfig;

  /** Connection pool */
  private connectionPool: ConnectionPool;

  /** HTTP client statistics */
  private stats: HttpClientStats;

  /** Request ID counter */
  private requestIdCounter = 0;

  /** Active requests */
  private activeRequests: Map<
    string,
    {
      startTime: number;
      options: HttpRequestOptions;
      connection?: ConnectionMetadata;
    }
  > = new Map();

  constructor(config: HttpClientConfig = {}, performanceMonitor?: PerformanceMonitor) {
    super(performanceMonitor);

    this.config = {
      baseUrl: '',
      defaultHeaders: {
        'Content-Type': 'application/json',
        'User-Agent': 'Enhanced-REST-Client/1.0.0',
      },
      defaultTimeout: 30000,
      enableConnectionPool: true,
      enableCompression: true,
      followRedirects: true,
      maxRedirects: 5,
      validateSSL: true,
      ...config,
    };

    // Initialize connection pool
    this.connectionPool = new ConnectionPool(
      this.config.connectionPool,
      this.performanceMonitor
    );

    // Listen to connection pool events
    this.setupConnectionPoolEventListeners();

    this.stats = {
      totalRequests: 0,
      successfulResponses: 0,
      failedResponses: 0,
      totalRequestTime: 0,
      averageRequestTime: 0,
      maxRequestTime: 0,
      minRequestTime: Number.MAX_VALUE,
      totalRedirects: 0,
      totalTimeouts: 0,
      totalConnectionErrors: 0,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };
  }

  /**
   * Send an HTTP request
   * @param options Request options
   */
  async request(options: HttpRequestOptions): Promise<HttpResponse> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    // Prepare request options
    const preparedOptions = this.prepareRequestOptions(options);

    // Add to active requests
    this.activeRequests.set(requestId, {
      startTime,
      options: preparedOptions,
    });

    // Update statistics
    this.stats.totalRequests++;
    this.updateStats();

    // Emit request started event
    this.emit(HttpClientEventType.REQUEST_STARTED, {
      requestId,
      method: preparedOptions.method,
      url: preparedOptions.url,
      timestamp: Date.now(),
    });

    try {
      // Acquire connection if connection pooling is enabled
      let connection: ConnectionMetadata | undefined;
      if (
        this.config.enableConnectionPool &&
        preparedOptions.useConnectionPool !== false
      ) {
        connection = await this.connectionPool.acquireConnection(preparedOptions.url);

        // Update active request with connection
        const activeRequest = this.activeRequests.get(requestId);
        if (activeRequest) {
          activeRequest.connection = connection;
        }

        // Emit connection acquired event
        this.emit(HttpClientEventType.CONNECTION_ACQUIRED, {
          requestId,
          connectionId: connection.id,
          timestamp: Date.now(),
        });
      }

      // Execute the request
      const response = await this.executeRequest(preparedOptions, connection);

      // Calculate request duration
      const duration = Date.now() - startTime;

      // Update response with metadata
      response.duration = duration;
      response.connectionId = connection?.id;

      // Update statistics
      this.stats.successfulResponses++;
      this.stats.totalRequestTime += duration;
      this.stats.averageRequestTime =
        this.stats.totalRequestTime / this.stats.successfulResponses;
      this.stats.maxRequestTime = Math.max(this.stats.maxRequestTime, duration);
      this.stats.minRequestTime = Math.min(this.stats.minRequestTime, duration);
      this.updateStats();

      // Release connection if acquired
      if (connection) {
        this.connectionPool.releaseConnection(connection);

        // Emit connection released event
        this.emit(HttpClientEventType.CONNECTION_RELEASED, {
          requestId,
          connectionId: connection.id,
          timestamp: Date.now(),
        });
      }

      // Remove from active requests
      this.activeRequests.delete(requestId);

      // Emit request completed event
      this.emit(HttpClientEventType.REQUEST_COMPLETED, {
        requestId,
        method: preparedOptions.method,
        url: preparedOptions.url,
        status: response.status,
        duration,
        connectionId: connection?.id,
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      // Calculate request duration
      const duration = Date.now() - startTime;

      // Update statistics
      this.stats.failedResponses++;
      this.stats.totalRequestTime += duration;
      this.stats.averageRequestTime =
        this.stats.totalRequestTime / this.stats.totalRequests;
      this.updateStats();

      // Remove from active requests
      this.activeRequests.delete(requestId);

      // Check if error is a timeout
      if (error instanceof Error && error.message.includes('timeout')) {
        this.stats.totalTimeouts++;

        // Emit request timeout event
        this.emit(HttpClientEventType.REQUEST_TIMEOUT, {
          requestId,
          method: preparedOptions.method,
          url: preparedOptions.url,
          duration,
          error: error.message,
          timestamp: Date.now(),
        });
      } else {
        // Check if error is a connection error
        if (
          error instanceof Error &&
          (error.message.includes('connection') ||
            error.message.includes('network') ||
            error.message.includes('ECONN'))
        ) {
          this.stats.totalConnectionErrors++;
        }

        // Emit request failed event
        this.emit(HttpClientEventType.REQUEST_FAILED, {
          requestId,
          method: preparedOptions.method,
          url: preparedOptions.url,
          duration,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
        });
      }

      throw error;
    }
  }

  /**
   * Send a GET request
   * @param url Request URL
   * @param options Request options
   */
  async get(
    url: string,
    options: Partial<HttpRequestOptions> = {}
  ): Promise<HttpResponse> {
    return this.request({
      ...options,
      method: HttpMethod.GET,
      url,
    });
  }

  /**
   * Send a POST request
   * @param url Request URL
   * @param body Request body
   * @param options Request options
   */
  async post(
    url: string,
    body?: any,
    options: Partial<HttpRequestOptions> = {}
  ): Promise<HttpResponse> {
    return this.request({
      ...options,
      method: HttpMethod.POST,
      url,
      body,
    });
  }

  /**
   * Send a PUT request
   * @param url Request URL
   * @param body Request body
   * @param options Request options
   */
  async put(
    url: string,
    body?: any,
    options: Partial<HttpRequestOptions> = {}
  ): Promise<HttpResponse> {
    return this.request({
      ...options,
      method: HttpMethod.PUT,
      url,
      body,
    });
  }

  /**
   * Send a DELETE request
   * @param url Request URL
   * @param options Request options
   */
  async delete(
    url: string,
    options: Partial<HttpRequestOptions> = {}
  ): Promise<HttpResponse> {
    return this.request({
      ...options,
      method: HttpMethod.DELETE,
      url,
    });
  }

  /**
   * Send a PATCH request
   * @param url Request URL
   * @param body Request body
   * @param options Request options
   */
  async patch(
    url: string,
    body?: any,
    options: Partial<HttpRequestOptions> = {}
  ): Promise<HttpResponse> {
    return this.request({
      ...options,
      method: HttpMethod.PATCH,
      url,
      body,
    });
  }

  /**
   * Send a HEAD request
   * @param url Request URL
   * @param options Request options
   */
  async head(
    url: string,
    options: Partial<HttpRequestOptions> = {}
  ): Promise<HttpResponse> {
    return this.request({
      ...options,
      method: HttpMethod.HEAD,
      url,
    });
  }

  /**
   * Send an OPTIONS request
   * @param url Request URL
   * @param requestOptions Request options
   */
  async optionsRequest(
    url: string,
    requestOptions: Partial<HttpRequestOptions> = {}
  ): Promise<HttpResponse> {
    return this.request({
      ...requestOptions,
      method: HttpMethod.OPTIONS,
      url,
    });
  }

  /**
   * Get HTTP client statistics
   */
  getStats(): HttpClientStats {
    return { ...this.stats };
  }

  /**
   * Get connection pool statistics
   */
  getConnectionPoolStats() {
    return this.connectionPool.getStats();
  }

  /**
   * Get active requests
   */
  getActiveRequests(): Array<{
    requestId: string;
    duration: number;
    options: HttpRequestOptions;
    connection?: ConnectionMetadata;
  }> {
    const now = Date.now();
    return Array.from(this.activeRequests.entries()).map(([requestId, request]) => ({
      requestId,
      duration: now - request.startTime,
      options: request.options,
      connection: request.connection,
    }));
  }

  /**
   * Clear all active requests
   */
  clearActiveRequests(): void {
    this.activeRequests.clear();
  }

  /**
   * Destroy the HTTP client
   */
  destroy(): void {
    // Clear active requests
    this.clearActiveRequests();

    // Destroy connection pool
    this.connectionPool.destroy();

    // Remove all event listeners
    this.removeAllListeners();
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req-${++this.requestIdCounter}-${Date.now()}`;
  }

  /**
   * Prepare request options
   * @param options Original request options
   */
  private prepareRequestOptions(options: HttpRequestOptions): HttpRequestOptions {
    const preparedOptions = { ...options };

    // Apply base URL if configured
    if (this.config.baseUrl && !preparedOptions.url.startsWith('http')) {
      preparedOptions.url = `${this.config.baseUrl}${preparedOptions.url}`;
    }

    // Apply default headers
    preparedOptions.headers = {
      ...this.config.defaultHeaders,
      ...preparedOptions.headers,
    };

    // Apply default timeout
    if (!preparedOptions.timeout) {
      preparedOptions.timeout = this.config.defaultTimeout;
    }

    // Apply connection pooling setting
    if (preparedOptions.useConnectionPool === undefined) {
      preparedOptions.useConnectionPool = this.config.enableConnectionPool;
    }

    // Apply other settings
    if (preparedOptions.followRedirects === undefined) {
      preparedOptions.followRedirects = this.config.followRedirects;
    }

    if (preparedOptions.maxRedirects === undefined) {
      preparedOptions.maxRedirects = this.config.maxRedirects;
    }

    if (preparedOptions.validateSSL === undefined) {
      preparedOptions.validateSSL = this.config.validateSSL;
    }

    if (preparedOptions.compression === undefined) {
      preparedOptions.compression = this.config.enableCompression;
    }

    return preparedOptions;
  }

  /**
   * Execute an HTTP request
   * @param options Request options
   * @param connection Connection to use (optional)
   */
  private async executeRequest(
    options: HttpRequestOptions,
    connection?: ConnectionMetadata
  ): Promise<HttpResponse> {
    const startTime = Date.now();

    try {
      // Parse URL to extract path for undici
      const url = new URL(options.url);

      // Prepare request options for undici
      const undiciOptions: Dispatcher.RequestOptions = {
        path: url.pathname + url.search,
        method: options.method,
        headers: options.headers as Record<string, string>,
        body: options.body,
        bodyTimeout: options.timeout,
        headersTimeout: options.timeout,
      };

      // Make the request using undici
      const response = await request(url.origin, undiciOptions);

      // Calculate request duration
      const duration = Date.now() - startTime;

      // Read response body
      let responseBody: any;
      if (response.headers['content-type']?.includes('application/json')) {
        try {
          responseBody = await response.body.json();
        } catch {
          // If JSON parsing fails, read as text
          responseBody = await response.body.text();
        }
      } else {
        responseBody = await response.body.text();
      }

      // Convert headers to Record<string, string>
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(response.headers)) {
        if (Array.isArray(value)) {
          headers[key] = value.join(', ');
        } else if (value !== undefined) {
          headers[key] = value;
        }
      }

      // Create HTTP response
      const httpResponse: HttpResponse = {
        status: response.statusCode,
        statusText: response.statusCode.toString(),
        headers,
        body: responseBody,
        url: options.url,
        duration,
        connectionId: connection?.id,
      };

      return httpResponse;
    } catch (error) {
      // Calculate request duration
      const duration = Date.now() - startTime;

      // Re-throw the error with additional context
      if (error instanceof Error) {
        throw new Error(`HTTP request failed: ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * Set up connection pool event listeners
   */
  private setupConnectionPoolEventListeners(): void {
    // Forward connection pool events
    // Note: In a real implementation, you would forward specific events
    // For now, we'll just listen to a few key events
    this.connectionPool.on('connection.created', (...args) => {
      this.emit('connection.created', ...args);
    });

    this.connectionPool.on('connection.acquired', (...args) => {
      this.emit('connection.acquired', ...args);
    });

    this.connectionPool.on('connection.released', (...args) => {
      this.emit('connection.released', ...args);
    });

    this.connectionPool.on('connection.closed', (...args) => {
      this.emit('connection.closed', ...args);
    });

    this.connectionPool.on('connection.error', (...args) => {
      this.emit('connection.error', ...args);
    });
  }

  /**
   * Update HTTP client statistics
   */
  private updateStats(): void {
    this.stats.lastUpdatedAt = Date.now();

    // Emit client stats updated event
    this.emit(HttpClientEventType.CLIENT_STATS_UPDATED, {
      timestamp: Date.now(),
      metadata: {
        stats: this.stats,
      },
    });
  }
}
