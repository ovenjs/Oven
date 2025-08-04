/**
 * Advanced Debugging and Logging System
 *
 * This module provides comprehensive logging and debugging capabilities for the enhanced REST client,
 * with support for structured logging, log levels, filtering, and debugging utilities.
 *
 * @packageDocumentation
 *
 * ## Overview
 *
 * The logger module provides a single main component:
 *
 * - **Logger**: An advanced logging system with structured logging, log levels, filtering, and debugging utilities
 *
 * ## Features
 *
 * - Multiple log levels (TRACE, DEBUG, INFO, WARN, ERROR, SILENT)
 * - Structured logging with metadata support
 * - Request ID tracking for correlating logs with requests
 * - Context tracking for organizing logs by component or feature
 * - Custom log filters and formatters
 * - Debug sessions with configurable capture options
 * - Performance tracking integration
 * - Console and file output support
 * - Child loggers with inherited context
 *
 * ## Usage
 *
 * ```typescript
 * import { Logger, LogLevel } from '@your-package/logger';
 *
 * // Create a logger
 * const logger = new Logger({
 *   level: LogLevel.INFO,
 *   enableConsole: true,
 *   enableStructuredLogging: true,
 *   enableRequestIdTracking: true,
 * });
 *
 * // Log messages at different levels
 * logger.trace('Detailed trace information');
 * logger.debug('Debug information');
 * logger.info('General information');
 * logger.warn('Warning message');
 * logger.error('Error message', { error: new Error('Something went wrong') });
 *
 * // Start a debug session
 * const sessionId = logger.startDebugSession({
 *   breakOnError: true,
 *   captureStackTraces: true,
 *   includeNetworkLogs: true,
 * });
 *
 * // Create a child logger with context
 * const childLogger = logger.child('api-client');
 * childLogger.info('This log will have the "api-client" context');
 * ```
 */

export {
  /**
   * Advanced Logger implementation with structured logging and debugging capabilities
   * @see Logger
   */
  Logger,
} from './Logger';

export type {
  /**
   * Enumeration of log levels for severity filtering
   * @see LogLevel
   */
  LogLevel,
  /**
   * Interface representing a log entry structure
   * @see LogEntry
   */
  LogEntry,
  /**
   * Interface representing logger configuration
   * @see LoggerConfig
   */
  LoggerConfig,
  /**
   * Type alias for log filter function
   * @see LogFilter
   */
  LogFilter,
  /**
   * Type alias for log formatter function
   * @see LogFormatter
   */
  LogFormatter,
  /**
   * Interface representing debug session configuration
   * @see DebugSessionConfig
   */
  DebugSessionConfig,
  /**
   * Interface representing debug session data
   * @see DebugSession
   */
  DebugSession,
} from './Logger';
