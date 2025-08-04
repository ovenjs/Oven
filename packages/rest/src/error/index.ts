/**
 * Error Handling and Retry System
 * 
 * This module provides a comprehensive error handling and retry mechanism for the enhanced REST client,
 * with support for intelligent retry policies, circuit breakers, and error classification.
 */

export {
	RestError,
	ErrorHandler,
	ErrorSeverity,
	ErrorCategory,
	ErrorType,
} from './ErrorHandler';

export { DiscordAPIError } from './DiscordAPIError.js';
export { DiscordHTTPError } from './DiscordHTTPError.js';

export type {
	EnhancedError,
	ErrorMetadata,
	RetryStrategy,
	CircuitBreakerConfig,
	ErrorHandlerConfig,
	ErrorEventData,
} from './ErrorHandler';