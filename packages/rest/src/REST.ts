import { Buffer } from 'node:buffer';
import { setTimeout } from 'node:timers/promises';
import { Dispatcher, request } from 'undici';
import { DiscordAPIError, DiscordHTTPError } from './error/index.js';
import { RESTOptions, RequestOptions, RouteData } from './types/index.js';
import { BucketManager } from './rate-limit/index.js';
import { Cache } from './cache/index.js';
import { ConnectionPool } from './connection/index.js';
import { BatchProcessor } from './batch/index.js';
import { ErrorHandler } from './error/index.js';
import { EventManager } from './events/index.js';
import { Logger } from './logger/index.js';
import { MiddlewarePipeline } from './middleware/index.js';
import { PerformanceMonitor } from './monitoring/index.js';
import { Transformer } from './transform/index.js';
import { normalizeHeaders } from './utils/index.js';

/**
 * Represents a REST manager for handling API requests to Discord.
 */
export class REST {
  /**
   * The options for this REST manager.
   */
  public options: RESTOptions;

  /**
   * The bucket manager for handling rate limits.
   */
  public bucketManager: BucketManager;

  /**
   * The cache for storing responses.
   */
  public cache: Cache;

  /**
   * The connection pool for HTTP connections.
   */
  public connectionPool: ConnectionPool;

  /**
   * The batch processor for handling batched requests.
   */
  public batchProcessor: BatchProcessor;

  /**
   * The error handler for handling errors.
   */
  public errorHandler: ErrorHandler;

  /**
   * The event manager for handling events.
   */
  public eventManager: EventManager;

  /**
   * The logger for logging messages.
   */
  public logger: Logger;

  /**
   * The middleware pipeline for handling middleware.
   */
  public middleware: MiddlewarePipeline;

  /**
   * The performance monitor for monitoring performance.
   */
  public performanceMonitor: PerformanceMonitor;

  /**
   * The transformer for transforming requests and responses.
   */
  public transformer: Transformer;

  /**
   * The agent used for requests.
   */
  public agent: Dispatcher;

  /**
   * The API version to use.
   */
  public apiVersion: string;

  /**
   * The base URL for the API.
   */
  public baseURL: string;

  /**
   * The hash of the current CDN.
   */
  public cdn: string;

  /**
   * The token to use for authorization.
   */
  public token: string | null = null;

  /**
   * @param options The options for this REST manager.
   */
  public constructor(options: RESTOptions = {}) {
    this.options = {
      agent: options.agent ?? null,
      api: `https://discord.com/api`,
      apiVersion: '10',
      authPrefix: 'Bearer',
      cdn: 'https://cdn.discordapp.com',
      headers: {},
      invalidRequestWarningInterval: 0,
      globalRequestsPerSecond: 50,
      offset: 50,
      rejectOnRateLimit: null,
      retries: 3,
      timeout: 15_000,
      userAgentAppendix: `Node.js ${process.version}`,
      versionPrefix: 'v',
      ...options,
    };

    this.agent = this.options.agent ?? new Dispatcher();
    this.apiVersion = String(this.options.version ?? 10);
    this.baseURL = `${this.options.api}/${this.options.versionPrefix}${this.apiVersion}`;
    this.cdn = this.options.cdn ?? 'https://cdn.discordapp.com';

    // Initialize components
    this.bucketManager = new BucketManager(this);
    this.cache = new Cache(this.options.cache ?? {});
    this.connectionPool = new ConnectionPool(this.options.connection ?? {});
    this.batchProcessor = new BatchProcessor(this.options.batch ?? {});
    this.errorHandler = new ErrorHandler(this.options.error ?? {});
    this.eventManager = new EventManager(this.options.events ?? {});
    this.logger = new Logger(this.options.logger ?? {});
    this.middleware = new MiddlewarePipeline();
    this.performanceMonitor = new PerformanceMonitor(this.options.monitoring ?? {});
    this.transformer = new Transformer(this.options.transform ?? {});
  }

  /**
   * Sets the default authorization token for all requests.
   * @param token The authorization token to use
   */
  public setToken(token: string): this {
    this.token = token;
    return this;
  }

  /**
   * Runs a get request from the API.
   * @param endpoint The endpoint to run the request on.
   * @param options The options for the request.
   */
  public get<T = any>(endpoint: string, options: Omit<RequestOptions, 'method' | 'endpoint'> = {}): Promise<T> {
    return this.request({ ...options, method: 'GET', endpoint });
  }

  /**
   * Runs a post request from the API.
   * @param endpoint The endpoint to run the request on.
   * @param options The options for the request.
   */
  public post<T = any>(endpoint: string, options: Omit<RequestOptions, 'method' | 'endpoint'> = {}): Promise<T> {
    return this.request({ ...options, method: 'POST', endpoint });
  }

  /**
   * Runs a delete request from the API.
   * @param endpoint The endpoint to run the request on.
   * @param options The options for the request.
   */
  public delete<T = any>(endpoint: string, options: Omit<RequestOptions, 'method' | 'endpoint'> = {}): Promise<T> {
    return this.request({ ...options, method: 'DELETE', endpoint });
  }

  /**
   * Runs a patch request from the API.
   * @param endpoint The endpoint to run the request on.
   * @param options The options for the request.
   */
  public patch<T = any>(endpoint: string, options: Omit<RequestOptions, 'method' | 'endpoint'> = {}): Promise<T> {
    return this.request({ ...options, method: 'PATCH', endpoint });
  }

  /**
   * Runs a put request from the API.
   * @param endpoint The endpoint to run the request on.
   * @param options The options for the request.
   */
  public put<T = any>(endpoint: string, options: Omit<RequestOptions, 'method' | 'endpoint'> = {}): Promise<T> {
    return this.request({ ...options, method: 'PUT', endpoint });
  }

  /**
   * Makes an API request.
   * @param options The options for the request.
   */
  public async request<T = any>(options: RequestOptions): Promise<T> {
    const { endpoint, method, auth, body, headers, query, files, reason } = options;

    // Apply request middleware
    let processedOptions = await this.middleware.runRequestMiddleware(options);

    // Generate cache key for GET requests
    let cacheKey: string | null = null;
    if (method === 'GET' && this.options.cache?.enabled) {
      cacheKey = this.cache.generateCacheKey(processedOptions);
      const cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse) {
        this.eventManager.emit('cacheHit', { cacheKey, response: cachedResponse });
        return cachedResponse;
      }
    }

    // Check if this request can be batched
    if (this.options.batch?.enabled && this.batchProcessor.canBatch(processedOptions)) {
      return this.batchProcessor.addToBatch(processedOptions) as Promise<T>;
    }

    // Apply rate limiting
    const routeData: RouteData = {
      majorParameter: 'global',
      bucketId: endpoint,
      endpoint,
      method,
    };

    await this.bucketManager.waitForRequest(routeData);

    // Start performance monitoring
    const perfId = this.performanceMonitor.startRequest(processedOptions);

    try {
      // Make the actual request
      const response = await this.makeRequest(processedOptions);

      // Process the response
      const result = await this.processResponse(response, processedOptions);

      // Cache GET requests
      if (method === 'GET' && cacheKey && this.options.cache?.enabled) {
        this.cache.set(cacheKey, result);
      }

      // Apply response middleware
      const processedResult = await this.middleware.runResponseMiddleware(result, processedOptions, response);

      // End performance monitoring
      this.performanceMonitor.endRequest(perfId, true);

      return processedResult as T;
    } catch (error) {
      // Handle errors
      const processedError = await this.errorHandler.handle(error as Error, processedOptions);

      // End performance monitoring
      this.performanceMonitor.endRequest(perfId, false);

      // Apply error middleware
      await this.middleware.runErrorMiddleware(processedError, processedOptions);

      throw processedError;
    }
  }

  /**
   * Makes the actual HTTP request.
   * @param options The options for the request.
   */
  private async makeRequest(options: RequestOptions) {
    const { endpoint, method, auth, body, headers, query, files, reason } = options;

    // Build URL
    let url = `${this.baseURL}${endpoint}`;
    if (query) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Build headers
    const requestHeaders: Record<string, string> = {
      'User-Agent': `DiscordBot (${this.options.userAgentAppendix})`,
      ...this.options.headers,
      ...headers,
    };

    // Add authorization
    if (this.token || auth) {
      const token = auth ?? this.token;
      if (token) {
        requestHeaders.Authorization = `${this.options.authPrefix} ${token}`;
      }
    }

    // Add reason for audit logs
    if (reason) {
      requestHeaders['X-Audit-Log-Reason'] = encodeURIComponent(reason);
    }

    // Prepare body
    let requestBody: Dispatcher.BodyInit | undefined;
    if (files && files.length > 0) {
      // Handle multipart/form-data for file uploads
      const formData = new FormData();
      for (const file of files) {
        formData.append(file.key, file.data, file.name);
      }
      if (body) {
        formData.append('payload_json', JSON.stringify(body));
      }
      requestBody = formData as any;
    } else if (body) {
      // Handle JSON body
      requestBody = JSON.stringify(body);
      requestHeaders['Content-Type'] = 'application/json';
    }

    // Make the request
    const response = await request(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      dispatcher: this.agent,
      bodyTimeout: this.options.timeout,
      headersTimeout: this.options.timeout,
    });

    return response;
  }

  /**
   * Processes the response from the API.
   * @param response The response from the API.
   * @param options The options for the request.
   */
  private async processResponse(response: Dispatcher.ResponseData, options: RequestOptions) {
    const { endpoint, method } = options;

    // Normalize headers
    const headers = normalizeHeaders(response.headers);

    // Check for rate limits
    if (headers['x-ratelimit-limit'] || headers['x-ratelimit-remaining'] || headers['x-ratelimit-reset']) {
      const routeData: RouteData = {
        majorParameter: 'global',
        bucketId: endpoint,
        endpoint,
        method,
      };

      // Extract rate limit information from headers
      const remaining = parseInt(headers['x-ratelimit-remaining'] || '0', 10);
      const resetAfter = parseFloat(headers['x-ratelimit-reset-after'] || '0') * 1000;
      const limit = parseInt(headers['x-ratelimit-limit'] || '0', 10);
      
      // Update the bucket manager with the rate limit information
      this.bucketManager.updateRateLimit(
        routeData.bucketId,
        remaining,
        resetAfter,
        limit
      );
    }

    // Check for errors
    if (response.statusCode >= 400) {
      let errorData;
      try {
        errorData = await response.body.json();
      } catch {
        errorData = { message: 'Unknown error' };
      }

      if (response.statusCode >= 500 && response.statusCode < 600) {
        throw new DiscordHTTPError(errorData.message, response.statusCode, method, endpoint, headers);
      } else {
        throw new DiscordAPIError(errorData, response.statusCode, method, endpoint, headers);
      }
    }

    // Parse response body
    if (response.statusCode === 204) {
      return null;
    }

    try {
      return await response.body.json();
    } catch {
      return null;
    }
  }

  /**
   * Destroys this REST manager.
   */
  public destroy(): void {
    this.connectionPool.destroy();
    this.batchProcessor.destroy();
    this.eventManager.removeAllListeners();
    this.performanceMonitor.destroy();
  }
}