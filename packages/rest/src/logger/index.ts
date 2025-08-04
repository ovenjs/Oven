/**
 * Advanced Debugging and Logging System
 *
 * This module provides comprehensive logging and debugging capabilities for the enhanced REST client,
 * with support for structured logging, log levels, filtering, and debugging utilities.
 */

export { Logger } from './Logger';

export type {
	LogLevel,
	LogEntry,
	LoggerConfig,
	LogFilter,
	LogFormatter,
	DebugSessionConfig,
	DebugSession,
} from './Logger';