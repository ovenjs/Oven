import { setTimeout } from 'node:timers/promises';
import { Dispatcher } from 'undici';
import { DiscordAPIError, DiscordHTTPError } from './error/index.js';
import { RESTOptions, RequestOptions, RouteData } from './types/index.js';
import { BucketManager } from './rate-limit/index.js';
import { Cache } from './cache/index.js';
import { ConnectionPool } from './connection/index.js';
import { HttpClient, HttpMethod, HttpResponse } from './connection/HttpClient.js';
import { BatchProcessor } from './batch/index.js';
import { ErrorHandler } from './error/index.js';
import { EventManager } from './events/index.js';
import { Logger } from './logger/index.js';
import {
  MiddlewarePipeline,
  MiddlewareRegistry,
  RequestMiddleware,
  ErrorMiddleware,
} from './middleware/index.js';
import { PerformanceMonitor } from './monitoring/index.js';
import { MetricsReporter } from './monitoring/MetricsReporter.js';
import { TransformerManager } from './transform/index.js';
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
   * The HTTP client for making requests.
   */
  public httpClient: HttpClient;

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
   * The metrics reporter for reporting metrics.
   */
  public metricsReporter: MetricsReporter;

  /**
   * The transformer for transforming requests and responses.
   */
  public transformer: TransformerManager;

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
    // Apply default options with proper merging
    const defaultOptions: RESTOptions = {
      agent: null,
      api: 'https://discord.com/api',
      apiVersion: '10',
      version: 10,
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
      cache: {
        enabled: true,
        ttl: 300_000, // 5 minutes
        strategy: 'memory' as const,
        staleWhileRevalidate: false,
      },
      retry: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
        maxRetryDelay: 30_000,
        retryableStatusCodes: [429, 500, 502, 503, 504],
      },
      rateLimit: {
        enabled: true,
        maxConcurrent: 50,
        maxRequestsPerSecond: 50,
        burstRatio: 1.5,
        predictiveMode: true,
        jitter: true,
      },
      events: {
        enabled: true,
        maxListeners: 100,
        captureRejections: false,
        batchSize: 10,
        batchTimeout: 100,
      },
      metrics: {
        enabled: true,
        interval: 60_000, // 1 minute
        retentionPeriod: 3_600_000, // 1 hour
        reporting: {
          enabled: true,
          format: 'console' as const, // 'json', 'prometheus', 'influxdb', 'console'
          destination: 'console' as const, // 'console', 'file', 'http', 'webhook'
          interval: 300_000, // 5 minutes
          includeMetadata: true,
          includeHistograms: true,
          includeTimers: true,
          maxMetricsPerReport: 1000,
        },
      },
      debug: false,
      connection: {
        maxConnections: 100,
        maxFreeConnections: 10,
        connectionTimeout: 5_000,
        keepAlive: true,
        keepAliveTimeout: 30_000,
      },
      batch: {
        enabled: true,
        maxSize: 100,
        flushInterval: 100,
      },
      error: {},
      logger: {},
      monitoring: {},
      transform: {},
      ...options,
    };

    this.options = defaultOptions;
    this.agent = this.options.agent ?? (new Dispatcher() as Dispatcher);
    this.apiVersion = String(this.options.version ?? 10);
    this.baseURL = `${this.options.api}/${this.options.versionPrefix}${this.apiVersion}`;
    this.cdn = this.options.cdn ?? 'https://cdn.discordapp.com';

    // Initialize components in the correct order
    this.logger = new Logger(this.options.logger ?? {});
    this.performanceMonitor = new PerformanceMonitor(
      this.options.monitoring ?? {},
      this.logger
    );
    this.errorHandler = new ErrorHandler(
      this.options.error ?? {},
      this.performanceMonitor,
      this.logger
    );

    // Initialize middleware pipeline with default middlewares
    this.middleware = new MiddlewarePipeline(new MiddlewareRegistry(), {});

    this.bucketManager = new BucketManager({
      maxBuckets: 100,
      defaultLimit: 5,
      defaultWindow: 5000,
      enablePredictive: this.options.rateLimit?.predictiveMode,
      safetyMargin: 100,
      maxBurst: 5,
      enableAdaptiveQueue: true,
      logger: this.logger,
      enableCleanup: true,
      cleanupInterval: 60000,
      maxInactiveTime: 300000,
    });
    this.cache = new Cache(this.options.cache ?? {});
    this.connectionPool = new ConnectionPool(this.options.connection ?? {});
    this.httpClient = new HttpClient(
      {
        baseUrl: this.baseURL,
        defaultHeaders: {
          'User-Agent': `DiscordBot (${this.options.userAgentAppendix})`,
        },
        defaultTimeout: this.options.timeout,
        connectionPool: {
          ...this.options.connection,
          enabled: true,
          reuseConnections: true,
          keepAlive: true,
        },
        enableConnectionPool: true,
        enableCompression: true,
        followRedirects: true,
        maxRedirects: 5,
        validateSSL: true,
      },
      this.performanceMonitor
    );
    this.batchProcessor = new BatchProcessor(this.options.batch ?? {});
    this.eventManager = new EventManager(this.options.events ?? {});
    this.transformer = new TransformerManager(
      this.options.transform ?? {},
      this.logger,
      this.performanceMonitor
    );

    // Initialize metrics reporter if enabled
    const reportingConfig = this.options.metrics?.reporting;
    this.metricsReporter = new MetricsReporter(
      {
        enabled: reportingConfig?.enabled,
        format: reportingConfig?.format as any,
        destination: reportingConfig?.destination as any,
        interval: reportingConfig?.interval,
        endpoint: reportingConfig?.endpoint,
        headers: reportingConfig?.headers,
        filename: reportingConfig?.filename,
        includeMetadata: reportingConfig?.includeMetadata,
        includeHistograms: reportingConfig?.includeHistograms,
        includeTimers: reportingConfig?.includeTimers,
        maxMetricsPerReport: reportingConfig?.maxMetricsPerReport,
      },
      this.logger,
      this.performanceMonitor
    );

    // Setup default middlewares after all components are initialized
    this.setupDefaultMiddlewares();

    // Set request executor for bucket manager
    this.bucketManager.setRequestExecutor(async (request: any) => {
      // Make the actual request
      const response = await this.makeRequest(request.options);

      // Process the response
      const result = await this.processResponse(response, request.options);

      return result;
    });

    // Log initialization
    this.logger.info('REST client initialized with enhanced features', {
      version: this.apiVersion,
      cacheEnabled: this.options.cache?.enabled,
      rateLimitEnabled: this.options.rateLimit?.enabled,
      retryEnabled: this.options.retry?.maxRetries !== 0,
      metricsEnabled: this.options.metrics?.enabled,
    });
  }

  /**
   * Set up default middlewares for common functionality
   */
  private setupDefaultMiddlewares(): void {
    // Add authentication middleware
    class AuthMiddleware extends RequestMiddleware {
      constructor(private rest: REST) {
        super({
          name: 'auth',
          enabled: true,
          priority: 100, // Highest priority - should run first
        });
      }

      async processRequest(context: any, next: () => Promise<any>): Promise<any> {
        const middlewareStartTime = Date.now();
        const middlewareId = `auth-${Date.now()}`;

        // Record middleware before execution event
        this.rest.performanceMonitor.recordEvent({
          eventType:
            this.rest.performanceMonitor.constructor.name === 'PerformanceMonitor'
              ? (this.rest.performanceMonitor as any).PerformanceEventType
                  ?.INTERCEPTOR_BEFORE
              : 'INTERCEPTOR_BEFORE',
          requestId: context.request.id,
          interceptorName: 'auth',
          metadata: { middlewareId },
        });

        try {
          if (this.rest.token || context.request.options?.auth) {
            const token = context.request.options?.auth
              ? this.rest.token
              : context.request.options?.auth;
            if (token) {
              context.request.headers = {
                ...context.request.headers,
                Authorization: `${this.rest.options.authPrefix} ${token}`,
              };
            }
          }

          const result = await next();

          // Record middleware after execution event
          this.rest.performanceMonitor.recordEvent({
            eventType:
              this.rest.performanceMonitor.constructor.name === 'PerformanceMonitor'
                ? (this.rest.performanceMonitor as any).PerformanceEventType
                    ?.INTERCEPTOR_AFTER
                : 'INTERCEPTOR_AFTER',
            requestId: context.request.id,
            interceptorName: 'auth',
            metadata: {
              middlewareId,
              duration: Date.now() - middlewareStartTime,
            },
          });

          return result;
        } catch (error) {
          // Record middleware error event
          this.rest.performanceMonitor.recordEvent({
            eventType:
              this.rest.performanceMonitor.constructor.name === 'PerformanceMonitor'
                ? (this.rest.performanceMonitor as any).PerformanceEventType
                    ?.ERROR_OCCURRED
                : 'ERROR_OCCURRED',
            requestId: context.request.id,
            interceptorName: 'auth',
            errorType: error instanceof Error ? error.name : 'UnknownError',
            metadata: {
              middlewareId,
              duration: Date.now() - middlewareStartTime,
            },
          });

          throw error;
        }
      }
    }

    // Add retry middleware
    class RetryMiddleware extends ErrorMiddleware {
      constructor(private rest: REST) {
        super({
          name: 'retry',
          enabled: true,
          priority: 0, // Lowest priority - should run last for error handling
        });
      }

      async handleError(context: any, next: () => Promise<any>): Promise<any> {
        const middlewareStartTime = Date.now();
        const middlewareId = `retry-${Date.now()}`;

        // Record middleware before execution event
        this.rest.performanceMonitor.recordEvent({
          eventType:
            this.rest.performanceMonitor.constructor.name === 'PerformanceMonitor'
              ? (this.rest.performanceMonitor as any).PerformanceEventType
                  ?.INTERCEPTOR_BEFORE
              : 'INTERCEPTOR_BEFORE',
          requestId: context.request.id,
          interceptorName: 'retry',
          metadata: { middlewareId },
        });

        try {
          if (context.error && this.rest.options.retry) {
            const {
              maxRetries = 3,
              retryDelay = 1000,
              backoffMultiplier = 2,
            } = this.rest.options.retry;
            let retryCount = context.request.retryCount || 0;

            if (
              retryCount < maxRetries &&
              this.rest.shouldRetry(context.error, context.request)
            ) {
              retryCount++;
              const delay = retryDelay * Math.pow(backoffMultiplier, retryCount - 1);

              this.rest.logger.debug(
                `Retrying request (attempt ${retryCount}/${maxRetries}) after ${delay}ms`,
                {
                  error: context.error.message,
                  path: context.request.path,
                }
              );

              // Record retry event
              this.rest.performanceMonitor.recordEvent({
                eventType:
                  this.rest.performanceMonitor.constructor.name === 'PerformanceMonitor'
                    ? (this.rest.performanceMonitor as any).PerformanceEventType
                        ?.ERROR_RETRY
                    : 'ERROR_RETRY',
                requestId: context.request.id,
                interceptorName: 'retry',
                errorType:
                  context.error instanceof Error ? context.error.name : 'UnknownError',
                metadata: {
                  middlewareId,
                  retryCount,
                  delay,
                },
              });

              await setTimeout(delay);
              context.request.retryCount = retryCount;
              return next();
            }
          }

          const result = await next();

          // Record middleware after execution event
          this.rest.performanceMonitor.recordEvent({
            eventType:
              this.rest.performanceMonitor.constructor.name === 'PerformanceMonitor'
                ? (this.rest.performanceMonitor as any).PerformanceEventType
                    ?.INTERCEPTOR_AFTER
                : 'INTERCEPTOR_AFTER',
            requestId: context.request.id,
            interceptorName: 'retry',
            metadata: {
              middlewareId,
              duration: Date.now() - middlewareStartTime,
            },
          });

          return result;
        } catch (error) {
          // Record middleware error event
          this.rest.performanceMonitor.recordEvent({
            eventType:
              this.rest.performanceMonitor.constructor.name === 'PerformanceMonitor'
                ? (this.rest.performanceMonitor as any).PerformanceEventType
                    ?.ERROR_OCCURRED
                : 'ERROR_OCCURRED',
            requestId: context.request.id,
            interceptorName: 'retry',
            errorType: error instanceof Error ? error.name : 'UnknownError',
            metadata: {
              middlewareId,
              duration: Date.now() - middlewareStartTime,
            },
          });

          throw error;
        }
      }
    }

    // Add rate limit middleware with predictive capabilities
    class RateLimitMiddleware extends RequestMiddleware {
      constructor(private rest: REST) {
        super({
          name: 'rateLimit',
          enabled: true,
          priority: 75, // High priority - should run after auth but before request
        });
      }

      async processRequest(context: any, next: () => Promise<any>): Promise<any> {
        const middlewareStartTime = Date.now();
        const middlewareId = `rateLimit-${Date.now()}`;

        // Record middleware before execution event
        this.rest.performanceMonitor.recordEvent({
          eventType:
            this.rest.performanceMonitor.constructor.name === 'PerformanceMonitor'
              ? (this.rest.performanceMonitor as any).PerformanceEventType
                  ?.INTERCEPTOR_BEFORE
              : 'INTERCEPTOR_BEFORE',
          requestId: context.request.id,
          interceptorName: 'rateLimit',
          metadata: { middlewareId },
        });

        try {
          const routeData: RouteData = {
            majorParameter: 'global',
            bucketId: context.request.path,
            endpoint: context.request.path,
            method: context.request.method,
          };

          // Predictive rate limiting: check if we're approaching limits
          if (this.rest.options.rateLimit?.predictiveMode) {
            const prediction = this.rest.predictRateLimit(routeData);
            if (prediction.shouldWait) {
              this.rest.logger.debug('Predictive rate limit triggered, waiting', {
                waitTime: prediction.waitTime,
                bucketId: routeData.bucketId,
              });

              // Record rate limit event
              this.rest.performanceMonitor.recordEvent({
                eventType:
                  this.rest.performanceMonitor.constructor.name === 'PerformanceMonitor'
                    ? (this.rest.performanceMonitor as any).PerformanceEventType
                        ?.RATE_LIMIT_EXCEEDED
                    : 'RATE_LIMIT_EXCEEDED',
                requestId: context.request.id,
                interceptorName: 'rateLimit',
                metadata: {
                  middlewareId,
                  waitTime: prediction.waitTime,
                  bucketId: routeData.bucketId,
                },
              });

              await setTimeout(prediction.waitTime);
            }
          }

          const result = await next();

          // Record middleware after execution event
          this.rest.performanceMonitor.recordEvent({
            eventType:
              this.rest.performanceMonitor.constructor.name === 'PerformanceMonitor'
                ? (this.rest.performanceMonitor as any).PerformanceEventType
                    ?.INTERCEPTOR_AFTER
                : 'INTERCEPTOR_AFTER',
            requestId: context.request.id,
            interceptorName: 'rateLimit',
            metadata: {
              middlewareId,
              duration: Date.now() - middlewareStartTime,
            },
          });

          return result;
        } catch (error) {
          // Record middleware error event
          this.rest.performanceMonitor.recordEvent({
            eventType:
              this.rest.performanceMonitor.constructor.name === 'PerformanceMonitor'
                ? (this.rest.performanceMonitor as any).PerformanceEventType
                    ?.ERROR_OCCURRED
                : 'ERROR_OCCURRED',
            requestId: context.request.id,
            interceptorName: 'rateLimit',
            errorType: error instanceof Error ? error.name : 'UnknownError',
            metadata: {
              middlewareId,
              duration: Date.now() - middlewareStartTime,
            },
          });

          throw error;
        }
      }
    }

    // Add error handling middleware
    class ErrorHandlingMiddleware extends ErrorMiddleware {
      constructor(private rest: REST) {
        super({
          name: 'errorHandling',
          enabled: true,
          priority: 50, // Medium priority - should run after rate limiting
        });
      }

      async handleError(context: any, next: () => Promise<any>): Promise<any> {
        const middlewareStartTime = Date.now();
        const middlewareId = `errorHandling-${Date.now()}`;

        // Record middleware before execution event
        this.rest.performanceMonitor.recordEvent({
          eventType:
            this.rest.performanceMonitor.constructor.name === 'PerformanceMonitor'
              ? (this.rest.performanceMonitor as any).PerformanceEventType
                  ?.INTERCEPTOR_BEFORE
              : 'INTERCEPTOR_BEFORE',
          requestId: context.request.id,
          interceptorName: 'errorHandling',
          metadata: { middlewareId },
        });

        try {
          // Use the ErrorHandler to handle the error
          const result = await this.rest.errorHandler.handleError(
            context.error,
            async () => {
              // If the error is retryable, try the operation again
              return next();
            },
            {
              url: context.request.url,
              method: context.request.method,
              timestamp: Date.now(),
            }
          );

          // Record middleware after execution event
          this.rest.performanceMonitor.recordEvent({
            eventType:
              this.rest.performanceMonitor.constructor.name === 'PerformanceMonitor'
                ? (this.rest.performanceMonitor as any).PerformanceEventType
                    ?.INTERCEPTOR_AFTER
                : 'INTERCEPTOR_AFTER',
            requestId: context.request.id,
            interceptorName: 'errorHandling',
            metadata: {
              middlewareId,
              duration: Date.now() - middlewareStartTime,
            },
          });

          return result;
        } catch (error) {
          // Record middleware error event
          this.rest.performanceMonitor.recordEvent({
            eventType:
              this.rest.performanceMonitor.constructor.name === 'PerformanceMonitor'
                ? (this.rest.performanceMonitor as any).PerformanceEventType
                    ?.ERROR_OCCURRED
                : 'ERROR_OCCURRED',
            requestId: context.request.id,
            interceptorName: 'errorHandling',
            errorType: error instanceof Error ? error.name : 'UnknownError',
            metadata: {
              middlewareId,
              duration: Date.now() - middlewareStartTime,
            },
          });

          throw error;
        }
      }
    }

    // Register the middlewares
    this.middleware.registry.register(new AuthMiddleware(this));
    this.middleware.registry.register(new RetryMiddleware(this));
    this.middleware.registry.register(new RateLimitMiddleware(this));
    this.middleware.registry.register(new ErrorHandlingMiddleware(this));
  }

  /**
   * Determine if a request should be retried based on the error
   */
  private shouldRetry(error: Error, _request: any): boolean {
    if (!this.options.retry) return false;

    const { retryableStatusCodes = [429, 500, 502, 503, 504] } = this.options.retry;

    // Check if error is an HTTP error with retryable status code
    if (error.name === 'DiscordHTTPError') {
      return retryableStatusCodes.includes((error as any).status);
    }

    // Check if error is a rate limit error
    if (error.name === 'DiscordAPIError' && (error as any).code === 0) {
      // RATE_LIMIT code
      return true;
    }

    // Check if error is a network error
    if (
      error.name === 'Error' &&
      (error.message.includes('ECONNRESET') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT'))
    ) {
      return true;
    }

    return false;
  }

  /**
   * Predict rate limit and determine if we should wait before making a request
   */
  private predictRateLimit(_routeData: RouteData): {
    shouldWait: boolean;
    waitTime: number;
  } {
    if (!this.options.rateLimit) {
      return { shouldWait: false, waitTime: 0 };
    }

    const { maxRequestsPerSecond = 50, burstRatio = 1.5 } = this.options.rateLimit;

    // Simple prediction: if we've used more than 70% of our limit, wait a bit
    const usageRatio = Math.random() * burstRatio; // Simulated usage

    if (usageRatio > 0.7) {
      const waitTime = (usageRatio - 0.7) * 1000; // Wait up to 300ms
      return { shouldWait: true, waitTime };
    }

    return { shouldWait: false, waitTime: 0 };
  }

  /**
   * Determine if a request can be batched
   * @param options Request options
   */
  private canBatchRequest(options: RequestOptions): boolean {
    // Only batch GET requests for now
    if (options.method !== 'GET') {
      return false;
    }

    // Don't batch requests with files
    if (options.files && options.files.length > 0) {
      return false;
    }

    // Don't batch requests that explicitly disable batching
    if (options.disableBatching) {
      return false;
    }

    // Batch requests to certain endpoints
    const batchableEndpoints = ['/channels', '/guilds', '/users', '/webhooks'];

    return batchableEndpoints.some(endpoint => options.endpoint.startsWith(endpoint));
  }

  /**
   * Get the batch priority for a request
   * @param options Request options
   */
  private getBatchPriority(options: RequestOptions): number {
    // Higher priority for certain endpoints
    if (options.endpoint.includes('/messages')) {
      return 3; // Critical
    }

    if (options.endpoint.includes('/channels') || options.endpoint.includes('/guilds')) {
      return 2; // High
    }

    // Default priority
    return 1; // Normal
  }

  /**
   * Generate a cache key for the given request options
   */
  private generateCacheKey(options: RequestOptions): string | null {
    if (!options || !options.endpoint) {
      return null;
    }

    const { method, endpoint, query, headers } = options;

    // Create a deterministic string from the request parameters
    const keyParts = [
      method,
      endpoint,
      query ? JSON.stringify(query.sort()) : '',
      headers ? JSON.stringify(Object.keys(headers).sort()) : '',
    ];

    return `cache:${keyParts.join(':')}`;
  }

  /**
   * Clear all cached responses
   */
  public clearCache(): void {
    if (this.cache.clear) {
      this.cache.clear();
      this.logger.info('Cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): any {
    if (this.cache.getStats) {
      return this.cache.getStats();
    }
    return { hits: 0, misses: 0, size: 0 };
  }

  /**
   * Get the current circuit breaker state
   */
  public getCircuitBreakerState(): 'open' | 'half_open' | 'closed' {
    return this.errorHandler.getCircuitState();
  }

  /**
   * Reset the circuit breaker
   */
  public resetCircuitBreaker(): void {
    const previousState = this.errorHandler.getCircuitState();
    this.errorHandler.resetCircuitBreaker();

    // Record circuit breaker state change event
    this.performanceMonitor.recordEvent({
      eventType:
        this.performanceMonitor.constructor.name === 'PerformanceMonitor'
          ? (this.performanceMonitor as any).PerformanceEventType?.CIRCUIT_BREAKER_CLOSED
          : 'CIRCUIT_BREAKER_CLOSED',
      requestId: 'system',
      metadata: {
        previousState,
        newState: 'closed',
        action: 'reset',
      },
    });

    this.logger.info('Circuit breaker has been reset');
  }

  /**
   * Get current metrics report
   */
  public getMetricsReport(): any {
    return this.metricsReporter.generateReport();
  }

  /**
   * Generate and send metrics report immediately
   */
  public async sendMetricsReport(): Promise<void> {
    await this.metricsReporter.generateAndSendReport();
  }

  /**
   * Start metrics reporting
   */
  public startMetricsReporting(): void {
    this.metricsReporter.startReporting();
  }

  /**
   * Stop metrics reporting
   */
  public stopMetricsReporting(): void {
    this.metricsReporter.stopReporting();
  }

  /**
   * Update metrics reporting configuration
   */
  public updateMetricsReporting(config: any): void {
    this.metricsReporter.updateConfig(config);
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
  public get<T = any>(
    endpoint: string,
    options: Omit<RequestOptions, 'method' | 'endpoint'> = {}
  ): Promise<T> {
    return this.request({ ...options, method: 'GET', endpoint });
  }

  /**
   * Runs a post request from the API.
   * @param endpoint The endpoint to run the request on.
   * @param options The options for the request.
   */
  public post<T = any>(
    endpoint: string,
    options: Omit<RequestOptions, 'method' | 'endpoint'> = {}
  ): Promise<T> {
    return this.request({ ...options, method: 'POST', endpoint });
  }

  /**
   * Runs a delete request from the API.
   * @param endpoint The endpoint to run the request on.
   * @param options The options for the request.
   */
  public delete<T = any>(
    endpoint: string,
    options: Omit<RequestOptions, 'method' | 'endpoint'> = {}
  ): Promise<T> {
    return this.request({ ...options, method: 'DELETE', endpoint });
  }

  /**
   * Runs a patch request from the API.
   * @param endpoint The endpoint to run the request on.
   * @param options The options for the request.
   */
  public patch<T = any>(
    endpoint: string,
    options: Omit<RequestOptions, 'method' | 'endpoint'> = {}
  ): Promise<T> {
    return this.request({ ...options, method: 'PATCH', endpoint });
  }

  /**
   * Runs a put request from the API.
   * @param endpoint The endpoint to run the request on.
   * @param options The options for the request.
   */
  public put<T = any>(
    endpoint: string,
    options: Omit<RequestOptions, 'method' | 'endpoint'> = {}
  ): Promise<T> {
    return this.request({ ...options, method: 'PUT', endpoint });
  }

  /**
   * Makes an API request.
   * @param options The options for the request.
   */
  public async request<T = any>(options: RequestOptions): Promise<T> {
    const { endpoint, method /*auth, body, headers, query, files, reason*/ } = options;

    // Start performance monitoring for the entire request lifecycle
    const requestStartTime = Date.now();
    const perfId = 'req-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Record request initialization event
    this.performanceMonitor.recordEvent({
      eventType:
        this.performanceMonitor.constructor.name === 'PerformanceMonitor'
          ? (this.performanceMonitor as any).PerformanceEventType?.REQUEST_STARTED
          : 'REQUEST_STARTED',
      requestId: perfId,
      url: this.baseURL + endpoint,
      method,
    });

    // Create API request object with ID for middleware
    const apiRequest = {
      id: perfId,
      method,
      path: endpoint,
      url: this.baseURL + endpoint,
      options,
      headers: options.headers || {},
      body: options.body,
      query: options.query,
      timestamp: Date.now(),
    };

    // Execute the middleware pipeline
    console.log('DEBUG: Executing middleware pipeline...');
    return this.middleware
      .execute<any>(this as any, apiRequest, async context => {
        console.log('DEBUG: Middleware request handler called');
        // Generate cache key for GET requests
        let cacheKey: string | null = null;
        if (method === 'GET' && this.options.cache?.enabled) {
          cacheKey = this.generateCacheKey(options);
          if (cacheKey) {
            console.log('DEBUG: Checking cache for key:', cacheKey);
            const cachedResponse = (await this.cache.get(cacheKey)) as any;
            if (cachedResponse) {
              console.log('DEBUG: Cache hit found');
              // Record cache hit event
              this.performanceMonitor.recordEvent({
                eventType:
                  this.performanceMonitor.constructor.name === 'PerformanceMonitor'
                    ? (this.performanceMonitor as any).PerformanceEventType?.CACHE_HIT
                    : 'CACHE_HIT',
                requestId: perfId,
                cacheKey,
              });

              // Record request completed event for cache hit
              this.performanceMonitor.recordEvent({
                eventType:
                  this.performanceMonitor.constructor.name === 'PerformanceMonitor'
                    ? (this.performanceMonitor as any).PerformanceEventType
                        ?.REQUEST_COMPLETED
                    : 'REQUEST_COMPLETED',
                requestId: perfId,
                url: this.baseURL + endpoint,
                method,
                statusCode: 200,
                duration: Date.now() - requestStartTime,
              });

              this.eventManager.emit('cacheHit', { cacheKey, response: cachedResponse });
              this.logger.debug('Cache hit', { cacheKey, endpoint });
              return {
                status: 200,
                statusText: 'OK',
                headers: {},
                data: cachedResponse,
                cached: true,
                requestTime: Date.now() - requestStartTime,
                timestamp: Date.now(),
              };
            }

            console.log('DEBUG: Cache miss');
            // Record cache miss event
            this.performanceMonitor.recordEvent({
              eventType:
                this.performanceMonitor.constructor.name === 'PerformanceMonitor'
                  ? (this.performanceMonitor as any).PerformanceEventType?.CACHE_MISS
                  : 'CACHE_MISS',
              requestId: perfId,
              cacheKey,
            });
            this.logger.debug('Cache miss', { cacheKey, endpoint });
          }
        }

        // Check if this request can be batched
        if (this.options.batch?.enabled && this.canBatchRequest(options)) {
          // Record batch processing started event
          const batchId = 'batch-' + Date.now();
          this.performanceMonitor.recordEvent({
            eventType:
              this.performanceMonitor.constructor.name === 'PerformanceMonitor'
                ? (this.performanceMonitor as any).PerformanceEventType
                    ?.BATCH_PROCESSING_STARTED
                : 'BATCH_PROCESSING_STARTED',
            requestId: perfId,
            batchId,
          });

          // Add request to batch processor
          return this.batchProcessor
            .add(
              options,
              async (requestOptions: RequestOptions) => {
                // Record batch item processing started event
                const batchItemId = 'batch-item-' + Date.now();
                this.performanceMonitor.recordEvent({
                  eventType:
                    this.performanceMonitor.constructor.name === 'PerformanceMonitor'
                      ? (this.performanceMonitor as any).PerformanceEventType
                          ?.BATCH_ITEM_PROCESSED
                      : 'BATCH_ITEM_PROCESSED',
                  requestId: perfId,
                  batchId,
                  itemId: batchItemId,
                });

                // Make the actual request
                const response = await this.makeRequest(requestOptions, perfId);

                // Process the response
                const result = await this.processResponse(
                  response,
                  requestOptions,
                  perfId
                );

                return {
                  status: 200,
                  statusText: 'OK',
                  headers: {},
                  data: result,
                  cached: false,
                  requestTime: Date.now() - requestStartTime,
                  timestamp: Date.now(),
                };
              },
              {
                priority: this.getBatchPriority(options),
                timeout: this.options.timeout,
              }
            )
            .then(result => {
              // Record batch processing completed event
              this.performanceMonitor.recordEvent({
                eventType:
                  this.performanceMonitor.constructor.name === 'PerformanceMonitor'
                    ? (this.performanceMonitor as any).PerformanceEventType
                        ?.BATCH_PROCESSING_COMPLETED
                    : 'BATCH_PROCESSING_COMPLETED',
                requestId: perfId,
                batchId,
                duration: Date.now() - requestStartTime,
              });

              // Record request completed event for batch processing
              this.performanceMonitor.recordEvent({
                eventType:
                  this.performanceMonitor.constructor.name === 'PerformanceMonitor'
                    ? (this.performanceMonitor as any).PerformanceEventType
                        ?.REQUEST_COMPLETED
                    : 'REQUEST_COMPLETED',
                requestId: perfId,
                url: this.baseURL + endpoint,
                method,
                statusCode: 200,
                duration: Date.now() - requestStartTime,
              });

              return result;
            })
            .catch(error => {
              // Record batch processing failed event
              this.performanceMonitor.recordEvent({
                eventType:
                  this.performanceMonitor.constructor.name === 'PerformanceMonitor'
                    ? (this.performanceMonitor as any).PerformanceEventType
                        ?.REQUEST_FAILED
                    : 'REQUEST_FAILED',
                requestId: perfId,
                batchId,
                url: this.baseURL + endpoint,
                method,
                errorType: error.name || 'BatchError',
                duration: Date.now() - requestStartTime,
              });

              throw error;
            });
        }

        // Create API request object for bucket manager
        const bucketApiRequest = {
          method,
          path: endpoint,
          options,
        };

        // Record rate limit check event
        this.performanceMonitor.recordEvent({
          eventType:
            this.performanceMonitor.constructor.name === 'PerformanceMonitor'
              ? (this.performanceMonitor as any).PerformanceEventType?.RATE_LIMIT_CHECK
              : 'RATE_LIMIT_CHECK',
          requestId: perfId,
          url: this.baseURL + endpoint,
          method,
        });

        // Add request to bucket manager for rate limiting
        const result = await this.bucketManager.addRequest<T>(
          bucketApiRequest,
          'normal',
          3,
          1000,
          false
        );

        // If we got a result from the bucket manager, return it
        if (result !== undefined) {
          // Cache GET requests
          if (method === 'GET' && cacheKey && this.options.cache?.enabled) {
            this.cache.set(cacheKey, result);
          }

          // Record request completed event
          this.performanceMonitor.recordEvent({
            eventType:
              this.performanceMonitor.constructor.name === 'PerformanceMonitor'
                ? (this.performanceMonitor as any).PerformanceEventType?.REQUEST_COMPLETED
                : 'REQUEST_COMPLETED',
            requestId: perfId,
            url: this.baseURL + endpoint,
            method,
            statusCode: 200,
            duration: Date.now() - requestStartTime,
          });

          return {
            status: 200,
            statusText: 'OK',
            headers: {},
            data: result,
            cached: false,
            requestTime: Date.now() - requestStartTime,
            timestamp: Date.now(),
          };
        }

        // If no result from bucket manager, make the request directly
        try {
          // Make the actual request
          const response = await this.makeRequest(options, perfId);

          // Process the response
          const processedResult = await this.processResponse(response, options, perfId);

          // Cache GET requests
          if (method === 'GET' && cacheKey && this.options.cache?.enabled) {
            this.cache.set(cacheKey, processedResult);
          }

          // Record request completed event
          this.performanceMonitor.recordEvent({
            eventType:
              this.performanceMonitor.constructor.name === 'PerformanceMonitor'
                ? (this.performanceMonitor as any).PerformanceEventType?.REQUEST_COMPLETED
                : 'REQUEST_COMPLETED',
            requestId: perfId,
            url: this.baseURL + endpoint,
            method,
            statusCode: 200,
            duration: Date.now() - requestStartTime,
          });

          return {
            status: 200,
            statusText: 'OK',
            headers: {},
            data: processedResult,
            cached: false,
            requestTime: Date.now() - requestStartTime,
            timestamp: Date.now(),
          };
        } catch (error) {
          // Record request failed event
          this.performanceMonitor.recordEvent({
            eventType:
              this.performanceMonitor.constructor.name === 'PerformanceMonitor'
                ? (this.performanceMonitor as any).PerformanceEventType?.REQUEST_FAILED
                : 'REQUEST_FAILED',
            requestId: perfId,
            url: this.baseURL + endpoint,
            method,
            errorType: error instanceof Error ? error.name : 'UnknownError',
            duration: Date.now() - requestStartTime,
          });

          // Handle errors using the ErrorHandler
          return this.errorHandler.handleError(
            error,
            async () => {
              // Record retry attempt event
              this.performanceMonitor.recordEvent({
                eventType:
                  this.performanceMonitor.constructor.name === 'PerformanceMonitor'
                    ? (this.performanceMonitor as any).PerformanceEventType?.ERROR_RETRY
                    : 'ERROR_RETRY',
                requestId: perfId,
                url: this.baseURL + endpoint,
                method,
                errorType: error instanceof Error ? error.name : 'UnknownError',
              });

              // Make the actual request
              const response = await this.makeRequest(options, perfId);

              // Process the response
              const processedResult = await this.processResponse(
                response,
                options,
                perfId
              );

              // Cache GET requests
              if (method === 'GET' && cacheKey && this.options.cache?.enabled) {
                this.cache.set(cacheKey, processedResult);
              }

              // Record request completed event after retry
              this.performanceMonitor.recordEvent({
                eventType:
                  this.performanceMonitor.constructor.name === 'PerformanceMonitor'
                    ? (this.performanceMonitor as any).PerformanceEventType
                        ?.REQUEST_COMPLETED
                    : 'REQUEST_COMPLETED',
                requestId: perfId,
                url: this.baseURL + endpoint,
                method,
                statusCode: 200,
                duration: Date.now() - requestStartTime,
              });

              return {
                status: 200,
                statusText: 'OK',
                headers: {},
                data: processedResult,
                cached: false,
                requestTime: Date.now() - requestStartTime,
                timestamp: Date.now(),
              };
            },
            {
              url: `${this.baseURL}${options.endpoint}`,
              method: options.method,
              timestamp: Date.now(),
            }
          );
        }
      })
      .then(response => {
        console.log('DEBUG: Middleware pipeline response:', response);
        console.log('DEBUG: Response type:', typeof response);
        console.log(
          'DEBUG: Response keys:',
          response ? Object.keys(response) : 'undefined'
        );
        // Extract the data from the middleware response
        return response.data as T;
      })
      .catch(error => {
        console.log('DEBUG: Middleware pipeline error:', error);
        // Re-throw the error
        throw error;
      });
  }

  /**
   * Makes the actual HTTP request.
   * @param options The options for the request.
   */
  private async makeRequest(
    options: RequestOptions,
    requestId?: string
  ): Promise<HttpResponse> {
    const { endpoint, method /*auth, body, headers, query, files, reason*/ } = options;

    // Generate request ID if not provided
    const reqId =
      requestId || 'req-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Record request start event
    this.performanceMonitor.recordEvent({
      eventType:
        this.performanceMonitor.constructor.name === 'PerformanceMonitor'
          ? (this.performanceMonitor as any).PerformanceEventType?.REQUEST_STARTED
          : 'REQUEST_STARTED',
      requestId: reqId,
      url: this.baseURL + endpoint,
      method,
    });

    // Build URL
    let url = endpoint;
    if (options.query) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.query)) {
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
      ...this.options.headers,
      ...options.headers,
    };

    // Add authorization
    if (this.token || options.auth) {
      const token = options.auth ?? this.token;
      if (token) {
        requestHeaders.Authorization = `${this.options.authPrefix} ${token}`;
      }
    }

    // Add reason for audit logs
    if (options.reason) {
      requestHeaders['X-Audit-Log-Reason'] = encodeURIComponent(options.reason);
    }

    // Prepare body
    let requestBody: any;
    if (options.files && options.files.length > 0) {
      // Handle multipart/form-data for file uploads
      const formData = new FormData();
      for (const file of options.files) {
        formData.append(file.key, file.data, file.name);
      }
      if (options.body) {
        formData.append('payload_json', JSON.stringify(options.body));
      }
      requestBody = formData as any;
    } else if (options.body) {
      // Handle JSON body
      requestBody = JSON.stringify(options.body);
      requestHeaders['Content-Type'] = 'application/json';
    }

    // Convert method to HttpMethod enum
    const httpMethod = method.toUpperCase() as HttpMethod;

    // Make the request using HttpClient
    const response = await this.httpClient.request({
      method: httpMethod,
      url,
      headers: requestHeaders,
      body: requestBody,
      timeout: this.options.timeout,
    });

    // Record request completed event
    this.performanceMonitor.recordEvent({
      eventType:
        this.performanceMonitor.constructor.name === 'PerformanceMonitor'
          ? (this.performanceMonitor as any).PerformanceEventType?.REQUEST_COMPLETED
          : 'REQUEST_COMPLETED',
      requestId: reqId,
      url: this.baseURL + endpoint,
      method,
      statusCode: response.status,
      duration: Date.now() - parseInt(reqId.split('-')[1]),
    });

    return response;
  }

  /**
   * Processes the response from the API.
   * @param response The response from the API.
   * @param options The options for the request.
   */
  private async processResponse(
    response: HttpResponse,
    options: RequestOptions,
    requestId?: string
  ): Promise<any> {
    const { endpoint, method } = options;

    // Normalize headers
    const headers = normalizeHeaders(response.headers);

    // Check for rate limits
    if (
      headers['x-ratelimit-limit'] ||
      headers['x-ratelimit-remaining'] ||
      headers['x-ratelimit-reset']
    ) {
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
    if (response.status >= 400) {
      let errorData;
      try {
        errorData =
          typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
      } catch {
        errorData = { message: 'Unknown error' };
      }

      if (response.status >= 500 && response.status < 600) {
        // Record request failed event
        this.performanceMonitor.recordEvent({
          eventType:
            this.performanceMonitor.constructor.name === 'PerformanceMonitor'
              ? (this.performanceMonitor as any).PerformanceEventType?.REQUEST_FAILED
              : 'REQUEST_FAILED',
          requestId: requestId || 'unknown',
          url: this.baseURL + endpoint,
          method,
          statusCode: response.status,
          errorType: 'DiscordHTTPError',
        });
        throw new DiscordHTTPError(
          errorData.message,
          response.status,
          method,
          endpoint,
          headers
        );
      } else {
        // Record request failed event
        this.performanceMonitor.recordEvent({
          eventType:
            this.performanceMonitor.constructor.name === 'PerformanceMonitor'
              ? (this.performanceMonitor as any).PerformanceEventType?.REQUEST_FAILED
              : 'REQUEST_FAILED',
          requestId: requestId || 'unknown',
          url: this.baseURL + endpoint,
          method,
          statusCode: response.status,
          errorType: 'DiscordAPIError',
        });
        throw new DiscordAPIError(errorData, response.status, method, endpoint, headers);
      }
    }

    // Parse response body
    if (response.status === 204) {
      return null;
    }

    try {
      return typeof response.body === 'string'
        ? JSON.parse(response.body)
        : response.body;
    } catch {
      return null;
    }
  }

  /**
   * Adds an event listener for the specified event.
   * @param event - The name of the event to listen for.
   * @param listener - The callback function to execute when the event is emitted.
   * @param options - Optional configuration for the listener.
   * @param options.priority - The priority of the listener (higher numbers = higher priority). Default: 0.
   * @param options.once - Whether the listener should only be called once. Default: false.
   * @param options.maxCalls - Maximum number of times this listener can be called.
   * @returns The REST instance for chaining.
   * @example
   * ```typescript
   * rest.on('request', (data) => {
   *   console.log('Request made:', data);
   * });
   * ```
   */
  public on(
    event: string,
    listener: (...args: any[]) => void | Promise<void>,
    options: {
      priority?: number;
      once?: boolean;
      maxCalls?: number;
    } = {}
  ): this {
    this.eventManager.on(event, listener, options);
    return this;
  }

  /**
   * Adds a one-time event listener for the specified event.
   * The listener will be automatically removed after the first execution.
   * @param event - The name of the event to listen for.
   * @param listener - The callback function to execute when the event is emitted.
   * @param options - Optional configuration for the listener.
   * @param options.priority - The priority of the listener (higher numbers = higher priority). Default: 0.
   * @returns The REST instance for chaining.
   * @example
   * ```typescript
   * rest.once('ready', () => {
   *   console.log('REST client is ready!');
   * });
   * ```
   */
  public once(
    event: string,
    listener: (...args: any[]) => void | Promise<void>,
    options: {
      priority?: number;
    } = {}
  ): this {
    this.eventManager.once(event, listener, options);
    return this;
  }

  /**
   * Adds an event listener with high priority for the specified event.
   * High priority listeners are executed before regular listeners.
   * @param event - The name of the event to listen for.
   * @param listener - The callback function to execute when the event is emitted.
   * @param options - Optional configuration for the listener.
   * @param options.once - Whether the listener should only be called once. Default: false.
   * @param options.maxCalls - Maximum number of times this listener can be called.
   * @returns The REST instance for chaining.
   * @example
   * ```typescript
   * rest.prependListener('error', (error) => {
   *   console.error('Error occurred:', error);
   * });
   * ```
   */
  public prependListener(
    event: string,
    listener: (...args: any[]) => void | Promise<void>,
    options: {
      once?: boolean;
      maxCalls?: number;
    } = {}
  ): this {
    this.eventManager.prependListener(event, listener, options);
    return this;
  }

  /**
   * Adds a one-time event listener with high priority for the specified event.
   * The listener will be automatically removed after the first execution and will be executed before regular listeners.
   * @param event - The name of the event to listen for.
   * @param listener - The callback function to execute when the event is emitted.
   * @returns The REST instance for chaining.
   * @example
   * ```typescript
   * rest.prependOnceListener('ready', () => {
   *   console.log('REST client is ready (high priority)!');
   * });
   * ```
   */
  public prependOnceListener(
    event: string,
    listener: (...args: any[]) => void | Promise<void>
  ): this {
    this.eventManager.prependOnceListener(event, listener);
    return this;
  }

  /**
   * Removes an event listener for the specified event.
   * @param event - The name of the event.
   * @param listener - The callback function to remove.
   * @returns The REST instance for chaining.
   * @example
   * ```typescript
   * const listener = (data) => console.log(data);
   * rest.on('event', listener);
   * // Later...
   * rest.off('event', listener);
   * ```
   */
  public off(event: string, listener: (...args: any[]) => void | Promise<void>): this {
    this.eventManager.off(event, listener);
    return this;
  }

  /**
   * Removes all listeners for the specified event, or all listeners if no event is specified.
   * @param event - Optional. The name of the event. If not provided, all listeners for all events are removed.
   * @returns The REST instance for chaining.
   * @example
   * ```typescript
   * // Remove all listeners for a specific event
   * rest.removeAllListeners('request');
   *
   * // Remove all listeners for all events
   * rest.removeAllListeners();
   * ```
   */
  public removeAllListeners(event?: string): this {
    this.eventManager.removeAllListeners(event);
    return this;
  }

  /**
   * Gets all active listeners for the specified event.
   * @param event - The name of the event.
   * @returns An array of listener metadata objects.
   * @example
   * ```typescript
   * const listeners = rest.getListeners('request');
   * console.log(`There are ${listeners.length} listeners for the 'request' event`);
   * ```
   */
  public getListeners(event: string): any[] {
    return this.eventManager.getListeners(event);
  }

  /**
   * Gets the number of active listeners for the specified event.
   * @param event - The name of the event.
   * @returns The number of listeners.
   * @example
   * ```typescript
   * const count = rest.listenerCount('request');
   * console.log(`There are ${count} listeners for the 'request' event`);
   * ```
   */
  public listenerCount(event: string): number {
    return this.eventManager.listenerCount(event);
  }

  /**
   * Gets an array of all event names that have at least one listener.
   * @returns An array of event names.
   * @example
   * ```typescript
   * const events = rest.eventNames();
   * console.log('Active events:', events);
   * ```
   */
  public eventNames(): string[] {
    return this.eventManager.eventNames();
  }

  /**
   * Sets the maximum number of listeners for a specific event.
   * When the limit is exceeded, a warning will be logged or an error will be thrown based on configuration.
   * @param event - The name of the event.
   * @param count - The maximum number of listeners allowed.
   * @returns The REST instance for chaining.
   * @example
   * ```typescript
   * rest.setMaxListeners('request', 20);
   * ```
   */
  public setMaxListeners(event: string, count: number): this {
    this.eventManager.setMaxListeners(event, count);
    return this;
  }

  /**
   * Gets the maximum number of listeners allowed for a specific event.
   * @param event - The name of the event.
   * @returns The maximum number of listeners allowed.
   * @example
   * ```typescript
   * const maxListeners = rest.getMaxListeners('request');
   * console.log(`Max listeners for 'request' event: ${maxListeners}`);
   * ```
   */
  public getMaxListeners(event: string): number {
    return this.eventManager.getMaxListeners(event);
  }

  /**
   * Emits an event asynchronously, executing all registered listeners with the provided arguments.
   * @param event - The name of the event to emit.
   * @param args - Arguments to pass to the event listeners.
   * @returns A promise that resolves to true if the event had listeners, false otherwise.
   * @example
   * ```typescript
   * await rest.emit('customEvent', { data: 'some data' });
   * ```
   */
  public async emit(event: string, ...args: any[]): Promise<boolean> {
    return this.eventManager.emit(event, ...args);
  }

  /**
   * Emits an event synchronously, executing all registered listeners with the provided arguments.
   * @param event - The name of the event to emit.
   * @param args - Arguments to pass to the event listeners.
   * @returns True if the event had listeners, false otherwise.
   * @example
   * ```typescript
   * rest.emitSync('customEvent', { data: 'some data' });
   * ```
   */
  public emitSync(event: string, ...args: any[]): boolean {
    return this.eventManager.emitSync(event, ...args);
  }

  /**
   * Gets statistics for a specific event, including emit count, listener call count, and execution times.
   * @param event - The name of the event.
   * @returns Event statistics object or undefined if the event doesn't exist.
   * @example
   * ```typescript
   * const stats = rest.getEventStatistics('request');
   * if (stats) {
   *   console.log(`Event emitted ${stats.emitCount} times`);
   * }
   * ```
   */
  public getEventStatistics(event: string): any {
    return this.eventManager.getEventStatistics(event);
  }

  /**
   * Gets statistics for all events, including emit count, listener call count, and execution times.
   * @returns A Map containing event names as keys and statistics objects as values.
   * @example
   * ```typescript
   * const allStats = rest.getAllEventStatistics();
   * for (const [eventName, stats] of allStats) {
   *   console.log(`${eventName}: ${stats.emitCount} emits`);
   * }
   * ```
   */
  public getAllEventStatistics(): Map<string, any> {
    return this.eventManager.getAllEventStatistics();
  }

  /**
   * Gets the event history, which contains a record of past events.
   * @param type - Optional. The type of event to filter by. If not provided, all event types are included.
   * @param limit - The maximum number of events to return. Default: 100.
   * @returns An array of event history objects.
   * @example
   * ```typescript
   * // Get all event history (limited to 100 events)
   * const history = rest.getEventHistory();
   *
   * // Get history for a specific event type
   * const requestHistory = rest.getEventHistory('request', 50);
   * ```
   */
  public getEventHistory(type?: string, limit = 100): any[] {
    return this.eventManager.getEventHistory(type, limit);
  }

  /**
   * Clears the event history.
   * @returns The REST instance for chaining.
   * @example
   * ```typescript
   * rest.clearEventHistory();
   * ```
   */
  public clearEventHistory(): this {
    this.eventManager.clearEventHistory();
    return this;
  }

  /**
   * Sets the maximum size of the event history.
   * When the history exceeds this size, older events will be removed.
   * @param size - The maximum number of events to keep in history.
   * @returns The REST instance for chaining.
   * @example
   * ```typescript
   * rest.setMaxEventHistorySize(500);
   * ```
   */
  public setMaxEventHistorySize(size: number): this {
    this.eventManager.setMaxEventHistorySize(size);
    return this;
  }

  /**
   * Gets the current event batch if event batching is enabled.
   * @returns The current event batch object or null if batching is disabled.
   * @example
   * ```typescript
   * const batch = rest.getEventBatch();
   * if (batch) {
   *   console.log(`Current batch has ${batch.events.length} events`);
   * }
   * ```
   */
  public getEventBatch(): any {
    return this.eventManager.getEventBatch();
  }

  /**
   * Flushes the current event batch, emitting all events in the batch immediately.
   * This method is only relevant when event batching is enabled.
   * @returns A promise that resolves when the batch has been flushed.
   * @example
   * ```typescript
   * await rest.flushEventBatch();
   * ```
   */
  public async flushEventBatch(): Promise<void> {
    return this.eventManager.flushEventBatch();
  }

  /**
   * Destroys this REST manager.
   */
  public destroy(): void {
    this.connectionPool.destroy();
    this.httpClient.destroy();
    this.batchProcessor.destroy();
    this.eventManager.removeAllListeners();
    this.performanceMonitor.destroy();
    this.metricsReporter.destroy();
  }
}
