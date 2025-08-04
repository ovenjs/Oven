/**
 * Enhanced Error Handling and Retry System
 *
 * This module provides a comprehensive error handling and retry mechanism for the REST client,
 * with support for intelligent retry policies, circuit breakers, and error classification.
 *
 * @module
 */

import { EventEmitter } from 'events';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';
import { Logger } from '../logger/Logger';

/**
 * Error severity levels that indicate the impact of an error on the application.
 *
 * These levels help determine how errors should be handled, logged, and reported.
 *
 * @example
 * ```typescript
 * // Log errors based on severity
 * if (error.severity === ErrorSeverity.CRITICAL) {
 *   logger.error('Critical error occurred:', error);
 *   // Send alert to monitoring system
 * } else if (error.severity === ErrorSeverity.LOW) {
 *   logger.debug('Minor error occurred:', error);
 * }
 * ```
 */
export enum ErrorSeverity {
  /** Low severity errors that don't impact functionality */
  LOW = 'low',
  /** Medium severity errors that may impact some functionality */
  MEDIUM = 'medium',
  /** High severity errors that significantly impact functionality */
  HIGH = 'high',
  /** Critical errors that cause complete failure */
  CRITICAL = 'critical',
}

/**
 * Error categories that classify errors based on their source and nature.
 *
 * These categories help in applying appropriate handling strategies and routing
 * errors to the correct recovery mechanisms.
 *
 * @example
 * ```typescript
 * // Handle errors based on category
 * switch (error.category) {
 *   case ErrorCategory.NETWORK:
 *     // Implement network recovery logic
 *     break;
 *   case ErrorCategory.RATE_LIMIT:
 *     // Implement rate limit handling
 *     break;
 * }
 * ```
 */
export enum ErrorCategory {
  /** Network-related errors (connection issues, DNS failures, etc.) */
  NETWORK = 'network',
  /** Timeout-related errors (request timeouts, response timeouts, etc.) */
  TIMEOUT = 'timeout',
  /** Rate limiting errors (API rate limits exceeded) */
  RATE_LIMIT = 'rate_limit',
  /** Server-side errors (5xx status codes, server failures) */
  SERVER = 'server',
  /** Client-side errors (4xx status codes, client failures) */
  CLIENT = 'client',
  /** Authentication errors (invalid credentials, authentication failures) */
  AUTHENTICATION = 'authentication',
  /** Authorization errors (insufficient permissions, access denied) */
  AUTHORIZATION = 'authorization',
  /** Validation errors (invalid input, malformed requests) */
  VALIDATION = 'validation',
  /** Unknown or uncategorized errors */
  UNKNOWN = 'unknown',
}

/**
 * Error types with specific handling rules and retry behaviors.
 *
 * These types provide fine-grained control over error handling and determine
 * whether an error should be retried and how it should be processed.
 *
 * @example
 * ```typescript
 * // Check if an error type is retryable
 * const retryableErrorTypes = [
 *   ErrorType.NETWORK_ERROR,
 *   ErrorType.TIMEOUT_ERROR,
 *   ErrorType.RATE_LIMIT_ERROR,
 *   ErrorType.SERVER_ERROR
 * ];
 *
 * if (retryableErrorTypes.includes(error.type)) {
 *   // Retry the request
 * }
 * ```
 */
export enum ErrorType {
  /** Network-related errors (connection failures, DNS issues) */
  NETWORK_ERROR = 'NetworkError',
  /** Timeout-related errors (request or response timeouts) */
  TIMEOUT_ERROR = 'TimeoutError',
  /** Rate limiting errors (API rate limits exceeded) */
  RATE_LIMIT_ERROR = 'RateLimitError',
  /** Server-side errors (5xx status codes) */
  SERVER_ERROR = 'ServerError',
  /** Client-side errors (4xx status codes) */
  CLIENT_ERROR = 'ClientError',
  /** Authentication errors (invalid credentials) */
  AUTHENTICATION_ERROR = 'AuthenticationError',
  /** Authorization errors (insufficient permissions) */
  AUTHORIZATION_ERROR = 'AuthorizationError',
  /** Validation errors (invalid input, malformed requests) */
  VALIDATION_ERROR = 'ValidationError',
  /** Unknown or uncategorized errors */
  UNKNOWN_ERROR = 'UnknownError',
}

/**
 * Error metadata that provides additional context about an error.
 *
 * This metadata helps in debugging, monitoring, and understanding the circumstances
 * under which an error occurred.
 *
 * @example
 * ```typescript
 * const errorMetadata: ErrorMetadata = {
 *   url: 'https://api.example.com/users',
 *   method: 'GET',
 *   statusCode: 500,
 *   requestId: 'req_123456',
 *   timestamp: Date.now(),
 *   duration: 1500,
 *   attempt: 1,
 *   maxAttempts: 3,
 *   retryAfter: 5000,
 *   additionalData: {
 *     userId: '12345',
 *     endpoint: '/users'
 *   }
 * };
 * ```
 */
export interface ErrorMetadata {
  /** The URL that was being accessed when the error occurred */
  url?: string;
  /** The HTTP method being used when the error occurred */
  method?: string;
  /** The HTTP status code received, if applicable */
  statusCode?: number;
  /** A unique identifier for the request */
  requestId?: string;
  /** The timestamp when the error occurred */
  timestamp?: number;
  /** The duration of the request in milliseconds */
  duration?: number;
  /** The current retry attempt number */
  attempt?: number;
  /** The maximum number of retry attempts allowed */
  maxAttempts?: number;
  /** The number of milliseconds to wait before retrying */
  retryAfter?: number;
  /** Additional contextual data about the error */
  additionalData?: Record<string, any>;
  /** The original error that caused this error, if any */
  originalError?: any;
}

/**
 * Enhanced error interface that extends the standard Error interface.
 *
 * This interface provides additional properties for error classification,
 * metadata, and retry behavior.
 *
 * @example
 * ```typescript
 * const enhancedError: EnhancedError = {
 *   name: 'NetworkError',
 *   message: 'Connection timeout',
 *   stack: 'Error: Connection timeout\n    at ...',
 *   severity: ErrorSeverity.HIGH,
 *   category: ErrorCategory.NETWORK,
 *   type: ErrorType.NETWORK_ERROR,
 *   metadata: {
 *     url: 'https://api.example.com/data',
 *     method: 'GET',
 *     timestamp: Date.now()
 *   },
 *   retryable: true
 * };
 * ```
 */
export interface EnhancedError extends Error {
  /** The name of the error */
  name: string;
  /** The error message */
  message: string;
  /** The stack trace of the error */
  stack?: string;
  /** The severity level of the error */
  severity: ErrorSeverity;
  /** The category of the error */
  category: ErrorCategory;
  /** The type of the error */
  type: ErrorType;
  /** Additional metadata about the error */
  metadata: ErrorMetadata;
  /** The original error that caused this error, if any */
  originalError?: any;
  /** Whether the error is retryable */
  retryable: boolean;
}

/**
 * Retry strategy configuration that defines how failed requests should be retried.
 *
 * This configuration allows for fine-tuning of retry behavior including the number
 * of attempts, delay calculation, and which errors should be retried.
 *
 * @example
 * ```typescript
 * const retryStrategy: RetryStrategy = {
 *   maxAttempts: 5,
 *   baseDelay: 1000,
 *   maxDelay: 30000,
 *   backoffFactor: 2,
 *   jitter: true,
 *   jitterFactor: 0.1,
 *   retryableErrors: [
 *     ErrorType.NETWORK_ERROR,
 *     ErrorType.TIMEOUT_ERROR,
 *     ErrorType.RATE_LIMIT_ERROR,
 *     ErrorType.SERVER_ERROR
 *   ],
 *   retryableStatusCodes: [408, 429, 500, 502, 503, 504]
 * };
 * ```
 */
export interface RetryStrategy {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Base delay in milliseconds for the first retry */
  baseDelay: number;
  /** Maximum delay in milliseconds between retries */
  maxDelay: number;
  /** Factor for exponential backoff calculation */
  backoffFactor: number;
  /** Whether to add jitter to retry delays */
  jitter: boolean;
  /** Factor for jitter calculation (0-1) */
  jitterFactor: number;
  /** Array of error types that should be retried */
  retryableErrors: ErrorType[];
  /** Array of HTTP status codes that should be retried */
  retryableStatusCodes: number[];
}

/**
 * Circuit breaker configuration that defines the behavior of the circuit breaker.
 *
 * The circuit breaker prevents cascading failures by temporarily stopping requests
 * to an endpoint when it detects that the endpoint is consistently failing.
 *
 * @example
 * ```typescript
 * const circuitBreakerConfig: CircuitBreakerConfig = {
 *   enabled: true,
 *   failureThreshold: 5,
 *   resetTimeout: 60000,
 *   monitoringPeriod: 60000,
 *   expectedExceptionTypes: [
 *     ErrorType.NETWORK_ERROR,
 *     ErrorType.TIMEOUT_ERROR,
 *     ErrorType.SERVER_ERROR
 *   ]
 * };
 * ```
 */
export interface CircuitBreakerConfig {
  /** Whether the circuit breaker is enabled */
  enabled: boolean;
  /** Number of failures required to trip the circuit breaker */
  failureThreshold: number;
  /** Time in milliseconds to wait before attempting to reset the circuit breaker */
  resetTimeout: number;
  /** Time period in milliseconds to monitor for failures */
  monitoringPeriod: number;
  /** Array of error types that should trigger the circuit breaker */
  expectedExceptionTypes: ErrorType[];
}

/**
 * Error handler configuration that combines retry strategy and circuit breaker settings.
 *
 * This configuration provides a comprehensive set of options for controlling how
 * errors are handled, logged, and retried.
 *
 * @example
 * ```typescript
 * const errorHandlerConfig: ErrorHandlerConfig = {
 *   retryStrategy: {
 *     maxAttempts: 3,
 *     baseDelay: 1000,
 *     maxDelay: 30000,
 *     backoffFactor: 2,
 *     jitter: true,
 *     jitterFactor: 0.1,
 *     retryableErrors: [ErrorType.NETWORK_ERROR, ErrorType.TIMEOUT_ERROR],
 *     retryableStatusCodes: [408, 429, 500, 502, 503, 504]
 *   },
 *   circuitBreaker: {
 *     enabled: true,
 *     failureThreshold: 5,
 *     resetTimeout: 60000,
 *     monitoringPeriod: 60000,
 *     expectedExceptionTypes: [ErrorType.NETWORK_ERROR, ErrorType.SERVER_ERROR]
 *   },
 *   defaultSeverity: ErrorSeverity.MEDIUM,
 *   logErrors: true,
 *   throwOnUnretryable: true
 * };
 * ```
 */
export interface ErrorHandlerConfig {
  /** Retry strategy configuration */
  retryStrategy: RetryStrategy;
  /** Circuit breaker configuration */
  circuitBreaker: CircuitBreakerConfig;
  /** Default severity level for errors */
  defaultSeverity: ErrorSeverity;
  /** Whether to log errors */
  logErrors: boolean;
  /** Whether to throw errors that are not retryable */
  throwOnUnretryable: boolean;
}

/**
 * Error event types that are emitted by the error handler.
 *
 * These events allow for monitoring and reacting to different stages of error handling.
 *
 * @example
 * ```typescript
 * errorHandler.on(ErrorEventType.ERROR_OCCURRED, (eventData) => {
 *   console.log('Error occurred:', eventData.error.message);
 * });
 *
 * errorHandler.on(ErrorEventType.ERROR_RETRY, (eventData) => {
 *   console.log('Retrying request, attempt:', eventData.attempt);
 * });
 *
 * errorHandler.on(ErrorEventType.CIRCUIT_BREAKER_OPEN, (eventData) => {
 *   console.log('Circuit breaker opened, requests paused');
 * });
 * ```
 */
export enum ErrorEventType {
  /** Emitted when an error occurs */
  ERROR_OCCURRED = 'errorOccurred',
  /** Emitted when an error is being retried */
  ERROR_RETRY = 'errorRetry',
  /** Emitted when all retry attempts have failed */
  ERROR_FAILED = 'errorFailed',
  /** Emitted when an error has been handled */
  ERROR_HANDLED = 'errorHandled',
  /** Emitted when the circuit breaker opens */
  CIRCUIT_BREAKER_OPEN = 'circuitBreakerOpen',
  /** Emitted when the circuit breaker transitions to half-open state */
  CIRCUIT_BREAKER_HALF_OPEN = 'circuitBreakerHalfOpen',
  /** Emitted when the circuit breaker closes */
  CIRCUIT_BREAKER_CLOSED = 'circuitBreakerClosed',
}

/**
 * Error event data that is emitted with error events.
 *
 * This data provides context about the error and the current state of the error handler.
 *
 * @example
 * ```typescript
 * // Handling error events
 * errorHandler.on(ErrorEventType.ERROR_RETRY, (eventData: ErrorEventData) => {
 *   console.log(`Retrying request (${eventData.attempt}/${eventData.maxAttempts}): ${eventData.error.message}`);
 *   console.log('Circuit state:', eventData.circuitState);
 * });
 * ```
 */
export interface ErrorEventData {
  /** The type of error event */
  eventType: ErrorEventType;
  /** The error that occurred */
  error: EnhancedError;
  /** The timestamp when the event occurred */
  timestamp: number;
  /** The current retry attempt number, if applicable */
  attempt?: number;
  /** The maximum number of retry attempts, if applicable */
  maxAttempts?: number;
  /** The current state of the circuit breaker, if applicable */
  circuitState?: 'open' | 'half_open' | 'closed';
}

/**
 * Circuit breaker states that determine the current behavior of the circuit breaker.
 *
 * The circuit breaker has three states that control whether requests are allowed,
 * blocked, or conditionally allowed based on recent failure patterns.
 *
 * @internal
 */
enum CircuitState {
  /** Circuit is closed, allowing all requests to pass through */
  CLOSED = 'closed',
  /** Circuit is open, blocking all requests to prevent cascading failures */
  OPEN = 'open',
  /** Circuit is half-open, allowing a limited number of requests to test if the endpoint has recovered */
  HALF_OPEN = 'half_open',
}

/**
 * Enhanced Error class that extends the standard Error class with additional properties
 * for error classification, metadata, and retry behavior.
 *
 * This class provides a comprehensive error representation that includes severity levels,
 * categories, types, and metadata to support advanced error handling and recovery strategies.
 *
 * @example
 * ```typescript
 * // Create a network error
 * const networkError = RestError.network(
 *   'Connection timeout',
 *   { url: 'https://api.example.com/data', method: 'GET' },
 *   originalError
 * );
 *
 * // Create a rate limit error
 * const rateLimitError = RestError.rateLimit(
 *   'Rate limit exceeded',
 *   {
 *     url: 'https://api.example.com/users',
 *     method: 'GET',
 *     statusCode: 429,
 *     retryAfter: 5000
 *   }
 * );
 *
 * // Create a validation error
 * const validationError = RestError.validation(
 *   'Invalid user ID',
 *   {
 *     url: 'https://api.example.com/users/invalid',
 *     method: 'GET',
 *     additionalData: { userId: 'invalid' }
 *   }
 * );
 * ```
 */
export class RestError extends Error implements EnhancedError {
  /** The severity level of the error */
  public readonly severity: ErrorSeverity;
  /** The category of the error */
  public readonly category: ErrorCategory;
  /** The type of the error */
  public readonly type: ErrorType;
  /** Additional metadata about the error */
  public readonly metadata: ErrorMetadata;
  /** The original error that caused this error, if any */
  public readonly originalError?: any;
  /** Whether the error is retryable */
  public readonly retryable: boolean;

  /**
   * Creates a new RestError instance.
   *
   * @param message - The error message
   * @param type - The type of the error
   * @param severity - The severity level of the error (default: MEDIUM)
   * @param category - The category of the error (default: UNKNOWN)
   * @param metadata - Additional metadata about the error (default: {})
   * @param originalError - The original error that caused this error, if any
   * @param retryable - Whether the error is retryable (default: false)
   */
  constructor(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    metadata: ErrorMetadata = {},
    originalError?: any,
    retryable: boolean = false
  ) {
    super(message);
    this.name = type;
    this.severity = severity;
    this.category = category;
    this.type = type;
    this.metadata = {
      timestamp: Date.now(),
      ...metadata,
    };
    this.originalError = originalError;
    this.retryable = retryable;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RestError);
    }
  }

  /**
   * Creates a network error.
   *
   * Network errors are typically caused by connection issues, DNS failures,
   * or other network-related problems. They are considered retryable.
   *
   * @param message - The error message
   * @param metadata - Additional metadata about the error (default: {})
   * @param originalError - The original error that caused this error, if any
   * @returns A new RestError instance with network error properties
   *
   * @example
   * ```typescript
   * const error = RestError.network(
   *   'Connection timeout',
   *   { url: 'https://api.example.com/data', method: 'GET' },
   *   originalError
   * );
   * ```
   */
  static network(
    message: string,
    metadata: ErrorMetadata = {},
    originalError?: any
  ): RestError {
    return new RestError(
      message,
      ErrorType.NETWORK_ERROR,
      ErrorSeverity.HIGH,
      ErrorCategory.NETWORK,
      metadata,
      originalError,
      true
    );
  }

  /**
   * Creates a timeout error.
   *
   * Timeout errors occur when a request or response takes too long to complete.
   * They are considered retryable as the issue might be temporary.
   *
   * @param message - The error message
   * @param metadata - Additional metadata about the error (default: {})
   * @param originalError - The original error that caused this error, if any
   * @returns A new RestError instance with timeout error properties
   *
   * @example
   * ```typescript
   * const error = RestError.timeout(
   *   'Request timed out after 30 seconds',
   *   {
   *     url: 'https://api.example.com/data',
   *     method: 'GET',
   *     duration: 30000
   *   },
   *   originalError
   * );
   * ```
   */
  static timeout(
    message: string,
    metadata: ErrorMetadata = {},
    originalError?: any
  ): RestError {
    return new RestError(
      message,
      ErrorType.TIMEOUT_ERROR,
      ErrorSeverity.MEDIUM,
      ErrorCategory.TIMEOUT,
      metadata,
      originalError,
      true
    );
  }

  /**
   * Creates a rate limit error.
   *
   * Rate limit errors occur when the API rate limit is exceeded.
   * They are considered retryable after the specified retry-after delay.
   *
   * @param message - The error message
   * @param metadata - Additional metadata about the error (default: {})
   * @param originalError - The original error that caused this error, if any
   * @returns A new RestError instance with rate limit error properties
   *
   * @example
   * ```typescript
   * const error = RestError.rateLimit(
   *   'Rate limit exceeded',
   *   {
   *     url: 'https://api.example.com/users',
   *     method: 'GET',
   *     statusCode: 429,
   *     retryAfter: 5000
   *   },
   *   originalError
   * );
   * ```
   */
  static rateLimit(
    message: string,
    metadata: ErrorMetadata = {},
    originalError?: any
  ): RestError {
    return new RestError(
      message,
      ErrorType.RATE_LIMIT_ERROR,
      ErrorSeverity.MEDIUM,
      ErrorCategory.RATE_LIMIT,
      metadata,
      originalError,
      true
    );
  }

  /**
   * Creates a server error.
   *
   * Server errors occur when the server returns a 5xx status code.
   * They are considered retryable as they might be temporary server issues.
   *
   * @param message - The error message
   * @param metadata - Additional metadata about the error (default: {})
   * @param originalError - The original error that caused this error, if any
   * @returns A new RestError instance with server error properties
   *
   * @example
   * ```typescript
   * const error = RestError.server(
   *   'Internal server error',
   *   {
   *     url: 'https://api.example.com/data',
   *     method: 'GET',
   *     statusCode: 500
   *   },
   *   originalError
   * );
   * ```
   */
  static server(
    message: string,
    metadata: ErrorMetadata = {},
    originalError?: any
  ): RestError {
    return new RestError(
      message,
      ErrorType.SERVER_ERROR,
      ErrorSeverity.HIGH,
      ErrorCategory.SERVER,
      metadata,
      originalError,
      true
    );
  }

  /**
   * Creates a client error.
   *
   * Client errors occur when the server returns a 4xx status code (excluding 401, 403, and 429).
   * They are not considered retryable as they typically indicate issues with the request.
   *
   * @param message - The error message
   * @param metadata - Additional metadata about the error (default: {})
   * @param originalError - The original error that caused this error, if any
   * @returns A new RestError instance with client error properties
   *
   * @example
   * ```typescript
   * const error = RestError.client(
   *   'Bad request',
   *   {
   *     url: 'https://api.example.com/users',
   *     method: 'POST',
   *     statusCode: 400
   *   },
   *   originalError
   * );
   * ```
   */
  static client(
    message: string,
    metadata: ErrorMetadata = {},
    originalError?: any
  ): RestError {
    return new RestError(
      message,
      ErrorType.CLIENT_ERROR,
      ErrorSeverity.MEDIUM,
      ErrorCategory.CLIENT,
      metadata,
      originalError,
      false
    );
  }

  /**
   * Creates an authentication error.
   *
   * Authentication errors occur when the server returns a 401 status code.
   * They are not considered retryable as they typically require new credentials.
   *
   * @param message - The error message
   * @param metadata - Additional metadata about the error (default: {})
   * @param originalError - The original error that caused this error, if any
   * @returns A new RestError instance with authentication error properties
   *
   * @example
   * ```typescript
   * const error = RestError.authentication(
   *   'Invalid authentication token',
   *   {
   *     url: 'https://api.example.com/users',
   *     method: 'GET',
   *     statusCode: 401
   *   },
   *   originalError
   * );
   * ```
   */
  static authentication(
    message: string,
    metadata: ErrorMetadata = {},
    originalError?: any
  ): RestError {
    return new RestError(
      message,
      ErrorType.AUTHENTICATION_ERROR,
      ErrorSeverity.HIGH,
      ErrorCategory.AUTHENTICATION,
      metadata,
      originalError,
      false
    );
  }

  /**
   * Creates an authorization error.
   *
   * Authorization errors occur when the server returns a 403 status code.
   * They are not considered retryable as they typically require different permissions.
   *
   * @param message - The error message
   * @param metadata - Additional metadata about the error (default: {})
   * @param originalError - The original error that caused this error, if any
   * @returns A new RestError instance with authorization error properties
   *
   * @example
   * ```typescript
   * const error = RestError.authorization(
   *   'Insufficient permissions',
   *   {
   *     url: 'https://api.example.com/admin/users',
   *     method: 'GET',
   *     statusCode: 403
   *   },
   *   originalError
   * );
   * ```
   */
  static authorization(
    message: string,
    metadata: ErrorMetadata = {},
    originalError?: any
  ): RestError {
    return new RestError(
      message,
      ErrorType.AUTHORIZATION_ERROR,
      ErrorSeverity.HIGH,
      ErrorCategory.AUTHORIZATION,
      metadata,
      originalError,
      false
    );
  }

  /**
   * Creates a validation error.
   *
   * Validation errors occur when the request data is invalid or malformed.
   * They are not considered retryable as they typically require fixing the request data.
   *
   * @param message - The error message
   * @param metadata - Additional metadata about the error (default: {})
   * @param originalError - The original error that caused this error, if any
   * @returns A new RestError instance with validation error properties
   *
   * @example
   * ```typescript
   * const error = RestError.validation(
   *   'Invalid user ID',
   *   {
   *     url: 'https://api.example.com/users/invalid',
   *     method: 'GET',
   *     additionalData: { userId: 'invalid' }
   *   },
   *   originalError
   * );
   * ```
   */
  static validation(
    message: string,
    metadata: ErrorMetadata = {},
    originalError?: any
  ): RestError {
    return new RestError(
      message,
      ErrorType.VALIDATION_ERROR,
      ErrorSeverity.LOW,
      ErrorCategory.VALIDATION,
      metadata,
      originalError,
      false
    );
  }

  /**
   * Creates an unknown error.
   *
   * Unknown errors are used for errors that don't fit into other categories.
   * They are not considered retryable by default.
   *
   * @param message - The error message
   * @param metadata - Additional metadata about the error (default: {})
   * @param originalError - The original error that caused this error, if any
   * @returns A new RestError instance with unknown error properties
   *
   * @example
   * ```typescript
   * const error = RestError.unknown(
   *   'An unknown error occurred',
   *   {
   *     url: 'https://api.example.com/data',
   *     method: 'GET'
   *   },
   *   originalError
   * );
   * ```
   */
  static unknown(
    message: string,
    metadata: ErrorMetadata = {},
    originalError?: any
  ): RestError {
    return new RestError(
      message,
      ErrorType.UNKNOWN_ERROR,
      ErrorSeverity.MEDIUM,
      ErrorCategory.UNKNOWN,
      metadata,
      originalError,
      false
    );
  }
}

/**
 * Circuit Breaker implementation that prevents cascading failures by temporarily
 * stopping requests to an endpoint when it detects that the endpoint is consistently failing.
 *
 * The circuit breaker has three states:
 * - CLOSED: Allows all requests to pass through
 * - OPEN: Blocks all requests to prevent cascading failures
 * - HALF_OPEN: Allows a limited number of requests to test if the endpoint has recovered
 *
 * @internal
 */
class CircuitBreaker {
  /** The current state of the circuit breaker */
  private state: CircuitState = CircuitState.CLOSED;
  /** The number of consecutive failures */
  private failureCount: number = 0;
  /** The timestamp of the last failure */
  private lastFailureTime: number = 0;
  /** The timestamp when the next attempt is allowed */
  private nextAttemptTime: number = 0;
  /** The circuit breaker configuration */
  private config: CircuitBreakerConfig;

  /**
   * Creates a new CircuitBreaker instance.
   *
   * @param config - The circuit breaker configuration
   */
  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  /**
   * Records a successful call.
   *
   * This method resets the failure count and, if the circuit was in HALF_OPEN state,
   * transitions it to CLOSED state.
   */
  recordSuccess(): void {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.setState(CircuitState.CLOSED);
    }
  }

  /**
   * Records a failed call.
   *
   * This method increments the failure count and, if the failure threshold is exceeded,
   * transitions the circuit to OPEN state.
   *
   * @param error - The error that caused the failure
   */
  recordFailure(error: EnhancedError): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.shouldOpenCircuit(error)) {
      this.setState(CircuitState.OPEN);
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
    }
  }

  /**
   * Checks if the circuit allows calls.
   *
   * This method returns true if the circuit is CLOSED or HALF_OPEN, or if the circuit
   * is OPEN but the reset timeout has expired (in which case it transitions to HALF_OPEN).
   *
   * @returns True if calls are allowed, false otherwise
   */
  allowCall(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      if (Date.now() >= this.nextAttemptTime) {
        this.setState(CircuitState.HALF_OPEN);
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow a single call to test
    return true;
  }

  /**
   * Gets the current circuit state.
   *
   * @returns The current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Determines if the circuit should be opened based on the error and configuration.
   *
   * @param error - The error that caused the failure
   * @returns True if the circuit should be opened, false otherwise
   */
  private shouldOpenCircuit(error: EnhancedError): boolean {
    if (this.state === CircuitState.OPEN) {
      return false;
    }

    // Check if the error type is expected
    if (!this.config.expectedExceptionTypes.includes(error.type)) {
      return false;
    }

    // Check if we've exceeded the failure threshold within the monitoring period
    if (this.failureCount < this.config.failureThreshold) {
      return false;
    }

    // Check if failures occurred within the monitoring period
    return Date.now() - this.lastFailureTime <= this.config.monitoringPeriod;
  }

  /**
   * Sets the circuit state.
   *
   * @param newState - The new circuit state
   */
  private setState(newState: CircuitState): void {
    if (this.state !== newState) {
      this.state = newState;
    }
  }
}

/**
 * Enhanced Error Handler with retry and circuit breaker capabilities
 */
export class ErrorHandler extends EventEmitter {
  private config: ErrorHandlerConfig;
  private circuitBreaker: CircuitBreaker;
  private performanceMonitor: PerformanceMonitor;
  private logger: Logger;

  constructor(
    config: Partial<ErrorHandlerConfig> = {},
    performanceMonitor: PerformanceMonitor,
    logger: Logger
  ) {
    super();
    this.performanceMonitor = performanceMonitor;
    this.logger = logger;

    // Set default configuration
    this.config = {
      retryStrategy: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffFactor: 2,
        jitter: true,
        jitterFactor: 0.1,
        retryableErrors: [
          ErrorType.NETWORK_ERROR,
          ErrorType.TIMEOUT_ERROR,
          ErrorType.RATE_LIMIT_ERROR,
          ErrorType.SERVER_ERROR,
        ],
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
        ...config.retryStrategy,
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 60000,
        expectedExceptionTypes: [
          ErrorType.NETWORK_ERROR,
          ErrorType.TIMEOUT_ERROR,
          ErrorType.SERVER_ERROR,
        ],
        ...config.circuitBreaker,
      },
      defaultSeverity: ErrorSeverity.MEDIUM,
      logErrors: true,
      throwOnUnretryable: true,
      ...config,
    };

    this.circuitBreaker = new CircuitBreaker(this.config.circuitBreaker);
  }

  /**
   * Handle an error with retry logic
   */
  async handleError<T>(
    error: any,
    operation: () => Promise<T>,
    metadata: ErrorMetadata = {}
  ): Promise<T> {
    const enhancedError = this.enhanceError(error, metadata);

    // Emit error event
    this.emitErrorEvent(ErrorEventType.ERROR_OCCURRED, enhancedError);

    // Log error if enabled
    if (this.config.logErrors) {
      this.logError(enhancedError);
    }

    // Check if circuit breaker allows the call
    if (!this.circuitBreaker.allowCall()) {
      this.emitErrorEvent(ErrorEventType.CIRCUIT_BREAKER_OPEN, enhancedError);
      throw RestError.unknown(
        'Circuit breaker is open - calls are temporarily disabled',
        { originalError: enhancedError },
        enhancedError
      );
    }

    // Check if error is retryable
    if (!this.isRetryable(enhancedError)) {
      if (this.config.throwOnUnretryable) {
        this.emitErrorEvent(ErrorEventType.ERROR_FAILED, enhancedError);
        throw enhancedError;
      }
      this.emitErrorEvent(ErrorEventType.ERROR_HANDLED, enhancedError);
      return Promise.reject(enhancedError);
    }

    // Retry logic
    return this.retryOperation(operation, enhancedError);
  }

  /**
   * Enhance a raw error into an EnhancedError
   */
  private enhanceError(error: any, metadata: ErrorMetadata): EnhancedError {
    if (error instanceof RestError) {
      return error;
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      return RestError.unknown(
        error.message,
        {
          ...metadata,
          originalError: error,
        },
        error
      );
    }

    // Handle HTTP response errors
    if (error && typeof error === 'object' && 'status' in error) {
      const statusCode = error.status as number;
      const message = (error as any).message || `HTTP Error ${statusCode}`;

      if (statusCode >= 500) {
        return RestError.server(message, { ...metadata, statusCode }, error);
      } else if (statusCode === 429) {
        const retryAfter = (error as any).headers?.['retry-after'];
        return RestError.rateLimit(
          message,
          { ...metadata, statusCode, retryAfter },
          error
        );
      } else if (statusCode === 401) {
        return RestError.authentication(message, { ...metadata, statusCode }, error);
      } else if (statusCode === 403) {
        return RestError.authorization(message, { ...metadata, statusCode }, error);
      } else if (statusCode >= 400) {
        return RestError.client(message, { ...metadata, statusCode }, error);
      }
    }

    // Handle unknown error types
    return RestError.unknown(String(error), { ...metadata, originalError: error }, error);
  }

  /**
   * Check if an error is retryable
   */
  private isRetryable(error: EnhancedError): boolean {
    if (!error.retryable) {
      return false;
    }

    // Check if error type is in retryable list
    if (this.config.retryStrategy.retryableErrors.includes(error.type)) {
      return true;
    }

    // Check if status code is in retryable list
    if (
      error.metadata.statusCode &&
      this.config.retryStrategy.retryableStatusCodes.includes(error.metadata.statusCode)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Retry an operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    error: EnhancedError
  ): Promise<T> {
    const maxAttempts = this.config.retryStrategy.maxAttempts;
    let attempt = (error.metadata.attempt || 0) + 1;

    while (attempt <= maxAttempts) {
      // Calculate delay with exponential backoff and jitter
      const delay = this.calculateDelay(attempt);

      // Wait before retrying
      await this.sleep(delay);

      try {
        // Update attempt count in metadata
        error.metadata.attempt = attempt;
        this.emitErrorEvent(ErrorEventType.ERROR_RETRY, error);

        // Attempt the operation
        const result = await operation();

        // Record success with circuit breaker
        this.circuitBreaker.recordSuccess();

        return result;
      } catch (retryError) {
        const enhancedRetryError = this.enhanceError(retryError, error.metadata);

        // Record failure with circuit breaker
        this.circuitBreaker.recordFailure(enhancedRetryError);

        // Log retry error if enabled
        if (this.config.logErrors) {
          this.logError(enhancedRetryError, `Retry attempt ${attempt} failed`);
        }

        // Check if we should continue retrying
        if (attempt === maxAttempts || !this.isRetryable(enhancedRetryError)) {
          this.emitErrorEvent(ErrorEventType.ERROR_FAILED, enhancedRetryError);
          throw enhancedRetryError;
        }

        attempt++;
      }
    }

    this.emitErrorEvent(ErrorEventType.ERROR_FAILED, error);
    throw error;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    const { baseDelay, backoffFactor, maxDelay, jitter, jitterFactor } =
      this.config.retryStrategy;

    // Calculate exponential backoff
    let delay = baseDelay * Math.pow(backoffFactor, attempt - 1);

    // Apply maximum delay cap
    delay = Math.min(delay, maxDelay);

    // Apply jitter if enabled
    if (jitter) {
      const jitterAmount = delay * jitterFactor;
      delay = delay - jitterAmount + Math.random() * (2 * jitterAmount);
    }

    return Math.max(0, Math.floor(delay));
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log an error
   */
  private logError(error: EnhancedError, prefix = 'Error occurred'): void {
    const logMethod = this.getLogMethod(error.severity);
    const message = `${prefix}: ${error.message}`;

    logMethod.call(this.logger, message, {
      error: {
        name: error.name,
        type: error.type,
        category: error.category,
        severity: error.severity,
        metadata: error.metadata,
        stack: error.stack,
      },
    });
  }

  /**
   * Get the appropriate log method based on error severity
   */
  private getLogMethod(severity: ErrorSeverity): (message: string, meta?: any) => void {
    switch (severity) {
      case ErrorSeverity.LOW:
        return this.logger.debug.bind(this.logger);
      case ErrorSeverity.MEDIUM:
        return this.logger.info.bind(this.logger);
      case ErrorSeverity.HIGH:
        return this.logger.warn.bind(this.logger);
      case ErrorSeverity.CRITICAL:
        return this.logger.error.bind(this.logger);
      default:
        return this.logger.info.bind(this.logger);
    }
  }

  /**
   * Emit an error event
   */
  private emitErrorEvent(eventType: ErrorEventType, error: EnhancedError): void {
    const eventData: ErrorEventData = {
      eventType,
      error,
      timestamp: Date.now(),
      attempt: error.metadata.attempt,
      maxAttempts: this.config.retryStrategy.maxAttempts,
      circuitState: this.circuitBreaker.getState() as any,
    };

    this.emit(eventType, eventData);
  }

  /**
   * Get the current circuit breaker state
   */
  getCircuitState(): 'open' | 'half_open' | 'closed' {
    return this.circuitBreaker.getState() as any;
  }

  /**
   * Reset the circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker = new CircuitBreaker(this.config.circuitBreaker);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
    this.circuitBreaker = new CircuitBreaker(this.config.circuitBreaker);
  }
}
