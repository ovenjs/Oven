/**
 * Advanced Debugging and Logging System
 *
 * This module provides comprehensive logging and debugging capabilities for the enhanced REST client,
 * with support for structured logging, log levels, filtering, and debugging utilities.
 */

import { EventEmitter } from 'events';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';

/**
 * Log levels for severity filtering
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  SILENT = 5,
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  levelName: string;
  message: string;
  timestamp: number;
  requestId?: string;
  context?: string;
  meta?: Record<string, any>;
  stackTrace?: string;
  error?: any;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  enableStructuredLogging: boolean;
  enableRequestIdTracking: boolean;
  enableContextTracking: boolean;
  maxLogSize: number;
  retentionPeriod: number;
  enablePerformanceTracking: boolean;
}

/**
 * Log filter function type
 */
export type LogFilter = (entry: LogEntry) => boolean;

/**
 * Log formatter function type
 */
export type LogFormatter = (entry: LogEntry) => string;

/**
 * Debug session configuration
 */
export interface DebugSessionConfig {
  enabled: boolean;
  filter?: LogFilter;
  breakOnError: boolean;
  breakOnWarning: boolean;
  captureStackTraces: boolean;
  maxEntries: number;
  includeNetworkLogs: boolean;
  includeCacheLogs: boolean;
  includeBatchLogs: boolean;
  includeErrorLogs: boolean;
}

/**
 * Debug session data
 */
export interface DebugSession {
  id: string;
  startTime: number;
  endTime?: number;
  entries: LogEntry[];
  config: DebugSessionConfig;
  stats: {
    totalEntries: number;
    entriesByLevel: Record<LogLevel, number>;
    errorCount: number;
    warningCount: number;
  };
}

/**
 * Advanced Logger implementation
 */
export class Logger extends EventEmitter {
  private config: LoggerConfig;
  private currentLevel: LogLevel;
  private performanceMonitor?: PerformanceMonitor;
  private debugSessions: Map<string, DebugSession> = new Map();
  private activeDebugSession?: DebugSession;
  private logFilters: LogFilter[] = [];
  private logFormatters: LogFormatter[] = [];

  constructor(
    config: Partial<LoggerConfig> = {},
    performanceMonitor?: PerformanceMonitor
  ) {
    super();
    this.performanceMonitor = performanceMonitor;

    // Set default configuration
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableStructuredLogging: true,
      enableRequestIdTracking: true,
      enableContextTracking: true,
      maxLogSize: 10000,
      retentionPeriod: 86400000, // 24 hours
      enablePerformanceTracking: true,
      ...config,
    };

    this.currentLevel = this.config.level;

    // Setup default formatters
    this.setupDefaultFormatters();
  }

  /**
   * Log a trace message
   */
  trace(
    message: string,
    meta?: Record<string, any>,
    requestId?: string,
    context?: string
  ): void {
    this.log(LogLevel.TRACE, message, meta, requestId, context);
  }

  /**
   * Log a debug message
   */
  debug(
    message: string,
    meta?: Record<string, any>,
    requestId?: string,
    context?: string
  ): void {
    this.log(LogLevel.DEBUG, message, meta, requestId, context);
  }

  /**
   * Log an info message
   */
  info(
    message: string,
    meta?: Record<string, any>,
    requestId?: string,
    context?: string
  ): void {
    this.log(LogLevel.INFO, message, meta, requestId, context);
  }

  /**
   * Log a warning message
   */
  warn(
    message: string,
    meta?: Record<string, any>,
    requestId?: string,
    context?: string
  ): void {
    this.log(LogLevel.WARN, message, meta, requestId, context);
  }

  /**
   * Log an error message
   */
  error(
    message: string,
    meta?: Record<string, any>,
    requestId?: string,
    context?: string
  ): void {
    this.log(LogLevel.ERROR, message, meta, requestId, context);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    meta?: Record<string, any>,
    requestId?: string,
    context?: string
  ): void {
    // Check if we should log at this level
    if (level < this.currentLevel) {
      return;
    }

    // Create log entry
    const entry: LogEntry = {
      level,
      levelName: LogLevel[level],
      message,
      timestamp: Date.now(),
      meta,
      requestId: this.config.enableRequestIdTracking ? requestId : undefined,
      context: this.config.enableContextTracking ? context : undefined,
    };

    // Add stack trace for errors
    if (level === LogLevel.ERROR && meta?.error instanceof Error) {
      entry.stackTrace = meta.error.stack;
      entry.error = meta.error;
    }

    // Apply filters
    if (!this.applyFilters(entry)) {
      return;
    }

    // Add to active debug session
    if (this.activeDebugSession) {
      this.addToDebugSession(entry);
    }

    // Format and output
    const formattedMessage = this.formatMessage(entry);

    // Console output
    if (this.config.enableConsole) {
      this.writeToConsole(level, formattedMessage, entry);
    }

    // File output (simplified - in real implementation would use file system)
    if (this.config.enableFile && this.config.filePath) {
      this.writeToFile(formattedMessage);
    }

    // Track performance if enabled
    if (this.config.enablePerformanceTracking && this.performanceMonitor) {
      this.performanceMonitor.incrementCounter('logging.entries', 1, {
        level: LogLevel[level],
      });
    }

    // Emit log event
    this.emit('log', entry);
  }

  /**
   * Start a debug session
   */
  startDebugSession(config: Partial<DebugSessionConfig> = {}): string {
    const sessionId = this.generateSessionId();
    const sessionConfig: DebugSessionConfig = {
      enabled: true,
      breakOnError: false,
      breakOnWarning: false,
      captureStackTraces: true,
      maxEntries: 1000,
      includeNetworkLogs: true,
      includeCacheLogs: true,
      includeBatchLogs: true,
      includeErrorLogs: true,
      ...config,
    };

    const session: DebugSession = {
      id: sessionId,
      startTime: Date.now(),
      entries: [],
      config: sessionConfig,
      stats: {
        totalEntries: 0,
        entriesByLevel: {
          [LogLevel.TRACE]: 0,
          [LogLevel.DEBUG]: 0,
          [LogLevel.INFO]: 0,
          [LogLevel.WARN]: 0,
          [LogLevel.ERROR]: 0,
          [LogLevel.SILENT]: 0,
        },
        errorCount: 0,
        warningCount: 0,
      },
    };

    this.debugSessions.set(sessionId, session);
    this.activeDebugSession = session;

    // Add debug session filter
    this.addLogFilter(entry => {
      if (!sessionConfig.enabled) return false;

      // Filter by log type based on config
      if (entry.meta?.type === 'network' && !sessionConfig.includeNetworkLogs)
        return false;
      if (entry.meta?.type === 'cache' && !sessionConfig.includeCacheLogs) return false;
      if (entry.meta?.type === 'batch' && !sessionConfig.includeBatchLogs) return false;
      if (entry.level === LogLevel.ERROR && !sessionConfig.includeErrorLogs) return false;

      return true;
    });

    this.emit('debugSessionStarted', session);
    return sessionId;
  }

  /**
   * Stop a debug session
   */
  stopDebugSession(sessionId?: string): DebugSession | undefined {
    const id = sessionId || this.activeDebugSession?.id;
    if (!id) return undefined;

    const session = this.debugSessions.get(id);
    if (!session) return undefined;

    session.endTime = Date.now();

    if (this.activeDebugSession?.id === id) {
      this.activeDebugSession = undefined;
    }

    this.emit('debugSessionStopped', session);
    return session;
  }

  /**
   * Get a debug session
   */
  getDebugSession(sessionId: string): DebugSession | undefined {
    return this.debugSessions.get(sessionId);
  }

  /**
   * Get all debug sessions
   */
  getDebugSessions(): DebugSession[] {
    return Array.from(this.debugSessions.values());
  }

  /**
   * Clear all debug sessions
   */
  clearDebugSessions(): void {
    this.debugSessions.clear();
    this.activeDebugSession = undefined;
    this.emit('debugSessionsCleared');
  }

  /**
   * Add a log filter
   */
  addLogFilter(filter: LogFilter): void {
    this.logFilters.push(filter);
  }

  /**
   * Remove a log filter
   */
  removeLogFilter(filter: LogFilter): void {
    const index = this.logFilters.indexOf(filter);
    if (index > -1) {
      this.logFilters.splice(index, 1);
    }
  }

  /**
   * Add a log formatter
   */
  addLogFormatter(formatter: LogFormatter): void {
    this.logFormatters.push(formatter);
  }

  /**
   * Remove a log formatter
   */
  removeLogFormatter(formatter: LogFormatter): void {
    const index = this.logFormatters.indexOf(formatter);
    if (index > -1) {
      this.logFormatters.splice(index, 1);
    }
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
    this.emit('levelChanged', level);
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.currentLevel;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    this.currentLevel = this.config.level;
  }

  /**
   * Create child logger with context
   */
  child(context: string): Logger {
    const childLogger = new Logger(this.config, this.performanceMonitor);
    childLogger.addLogFilter(entry => {
      if (entry.context) {
        entry.context = `${context}:${entry.context}`;
      } else {
        entry.context = context;
      }
      return true;
    });
    return childLogger;
  }

  /**
   * Apply filters to log entry
   */
  private applyFilters(entry: LogEntry): boolean {
    return this.logFilters.every(filter => filter(entry));
  }

  /**
   * Format log message
   */
  private formatMessage(entry: LogEntry): string {
    let message = entry.message;

    // Apply custom formatters
    for (const formatter of this.logFormatters) {
      message = formatter(entry);
    }

    return message;
  }

  /**
   * Write to console
   */
  private writeToConsole(level: LogLevel, message: string, entry: LogEntry): void {
    const consoleMethod = this.getConsoleMethod(level);

    if (this.config.enableStructuredLogging) {
      consoleMethod.call(console, message, entry.meta || {});
    } else {
      consoleMethod.call(console, message);
    }

    // Break on error/warning if configured in debug session
    if (this.activeDebugSession) {
      const { breakOnError, breakOnWarning } = this.activeDebugSession.config;

      if (breakOnError && level === LogLevel.ERROR) {
        debugger; // eslint-disable-line no-debugger
      }

      if (breakOnWarning && level === LogLevel.WARN) {
        debugger; // eslint-disable-line no-debugger
      }
    }
  }

  /**
   * Write to file (simplified implementation)
   */
  private writeToFile(message: string): void {
    // In a real implementation, this would write to the file system
    // For now, we'll just emit an event
    this.emit('fileWrite', message);
  }

  /**
   * Get console method for log level
   */
  private getConsoleMethod(level: LogLevel): Console['log'] {
    switch (level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        // eslint-disable-next-line no-console
        return console.debug;
      case LogLevel.INFO:
        // eslint-disable-next-line no-console
        return console.info;
      case LogLevel.WARN:
        // eslint-disable-next-line no-console
        return console.warn;
      case LogLevel.ERROR:
        // eslint-disable-next-line no-console
        return console.error;
      default:
        // eslint-disable-next-line no-console
        return console.log;
    }
  }

  /**
   * Add entry to debug session
   */
  private addToDebugSession(entry: LogEntry): void {
    if (!this.activeDebugSession) return;

    const session = this.activeDebugSession;

    // Check max entries limit
    if (session.entries.length >= session.config.maxEntries) {
      session.entries.shift(); // Remove oldest entry
    }

    session.entries.push(entry);
    session.stats.totalEntries++;
    session.stats.entriesByLevel[entry.level]++;

    if (entry.level === LogLevel.ERROR) {
      session.stats.errorCount++;
    } else if (entry.level === LogLevel.WARN) {
      session.stats.warningCount++;
    }

    // Capture stack trace if configured
    if (session.config.captureStackTraces && !entry.stackTrace) {
      entry.stackTrace = new Error().stack;
    }

    this.emit('debugSessionEntry', session, entry);
  }

  /**
   * Setup default formatters
   */
  private setupDefaultFormatters(): void {
    // Default structured formatter
    this.addLogFormatter(entry => {
      const timestamp = new Date(entry.timestamp).toISOString();
      const parts = [`${timestamp} [${entry.levelName}]`];

      if (entry.requestId) {
        parts.push(`[${entry.requestId}]`);
      }

      if (entry.context) {
        parts.push(`[${entry.context}]`);
      }

      parts.push(entry.message);

      return parts.join(' ');
    });

    // JSON formatter for structured logging
    this.addLogFormatter(entry => {
      return JSON.stringify({
        timestamp: entry.timestamp,
        level: entry.levelName,
        message: entry.message,
        requestId: entry.requestId,
        context: entry.context,
        meta: entry.meta,
        stackTrace: entry.stackTrace,
      });
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
