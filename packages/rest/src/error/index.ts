/**
 * Error Handling and Retry System
 *
 * This module provides a comprehensive error handling and retry mechanism for the enhanced REST client,
 * with support for intelligent retry policies, circuit breakers, and error classification.
 *
 * @packageDocumentation
 *
 * The error handling system is designed to provide robust error management for REST API interactions,
 * with automatic retry logic, circuit breaker patterns, and detailed error classification.
 *
 * ## Features
 *
 * - **Enhanced Error Types**: Specialized error classes for different error scenarios
 * - **Retry Logic**: Configurable retry strategies with exponential backoff and jitter
 * - **Circuit Breaker**: Prevents cascading failures by temporarily stopping requests to failing endpoints
 * - **Error Classification**: Categorization of errors by type, severity, and category
 * - **Event System**: Events for error lifecycle monitoring and handling
 * - **Discord API Errors**: Specialized error classes for Discord API and HTTP errors
 *
 * ## Usage
 *
 * ```typescript
 * import { ErrorHandler, RestError, ErrorSeverity } from '@discordjs/rest/error';
 *
 * // Create an error handler with custom configuration
 * const errorHandler = new ErrorHandler(
 *   {
 *     retryStrategy: {
 *       maxAttempts: 5,
 *       baseDelay: 1000,
 *       maxDelay: 30000,
 *       backoffFactor: 2,
 *       jitter: true,
 *       jitterFactor: 0.1,
 *     },
 *     circuitBreaker: {
 *       enabled: true,
 *       failureThreshold: 5,
 *       resetTimeout: 60000,
 *       monitoringPeriod: 60000,
 *     },
 *   },
 *   performanceMonitor,
 *   logger
 * );
 *
 * // Handle an error with retry logic
 * try {
 *   await errorHandler.handleError(error, async () => {
 *     return await makeRequest();
 *   }, { url: 'https://api.example.com/data' });
 * } catch (error) {
 *   console.error('Request failed after retries:', error);
 * }
 *
 * // Create a custom error
 * const customError = RestError.network(
 *   'Network connection failed',
 *   { url: 'https://api.example.com/data' },
 *   originalError
 * );
 * ```
 */

export {
  /**
   * Enhanced error class with additional metadata and classification
   * @see RestError
   */
  RestError,
  /**
   * Main error handler class with retry and circuit breaker capabilities
   * @see ErrorHandler
   */
  ErrorHandler,
  /**
   * Error severity levels
   * @see ErrorSeverity
   */
  ErrorSeverity,
  /**
   * Error categories for classification
   * @see ErrorCategory
   */
  ErrorCategory,
  /**
   * Error types with specific handling rules
   * @see ErrorType
   */
  ErrorType,
} from './ErrorHandler';

export {
  /**
   * Error class for Discord API errors
   * @see DiscordAPIError
   */
  DiscordAPIError,
} from './DiscordAPIError.js';

export {
  /**
   * Error class for Discord HTTP errors
   * @see DiscordHTTPError
   */
  DiscordHTTPError,
} from './DiscordHTTPError.js';

export type {
  /**
   * Enhanced error interface
   * @see EnhancedError
   */
  EnhancedError,
  /**
   * Error metadata for additional context
   * @see ErrorMetadata
   */
  ErrorMetadata,
  /**
   * Retry strategy configuration
   * @see RetryStrategy
   */
  RetryStrategy,
  /**
   * Circuit breaker configuration
   * @see CircuitBreakerConfig
   */
  CircuitBreakerConfig,
  /**
   * Error handler configuration
   * @see ErrorHandlerConfig
   */
  ErrorHandlerConfig,
  /**
   * Error event data
   * @see ErrorEventData
   */
  ErrorEventData,
} from './ErrorHandler';
