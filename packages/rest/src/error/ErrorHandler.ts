/**
 * Enhanced Error Handling and Retry System
 * 
 * This module provides a comprehensive error handling and retry mechanism for the REST client,
 * with support for intelligent retry policies, circuit breakers, and error classification.
 */

import { EventEmitter } from 'events';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';
import { Logger } from '../logger/Logger';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	CRITICAL = 'critical',
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
	NETWORK = 'network',
	TIMEOUT = 'timeout',
	RATE_LIMIT = 'rate_limit',
	SERVER = 'server',
	CLIENT = 'client',
	AUTHENTICATION = 'authentication',
	AUTHORIZATION = 'authorization',
	VALIDATION = 'validation',
	UNKNOWN = 'unknown',
}

/**
 * Error types with specific handling rules
 */
export enum ErrorType {
	NETWORK_ERROR = 'NetworkError',
	TIMEOUT_ERROR = 'TimeoutError',
	RATE_LIMIT_ERROR = 'RateLimitError',
	SERVER_ERROR = 'ServerError',
	CLIENT_ERROR = 'ClientError',
	AUTHENTICATION_ERROR = 'AuthenticationError',
	AUTHORIZATION_ERROR = 'AuthorizationError',
	VALIDATION_ERROR = 'ValidationError',
	UNKNOWN_ERROR = 'UnknownError',
}

/**
 * Error metadata for additional context
 */
export interface ErrorMetadata {
	url?: string;
	method?: string;
	statusCode?: number;
	requestId?: string;
	timestamp?: number;
	duration?: number;
	attempt?: number;
	maxAttempts?: number;
	retryAfter?: number;
	additionalData?: Record<string, any>;
	originalError?: any;
}

/**
 * Enhanced error interface
 */
export interface EnhancedError extends Error {
	name: string;
	message: string;
	stack?: string;
	severity: ErrorSeverity;
	category: ErrorCategory;
	type: ErrorType;
	metadata: ErrorMetadata;
	originalError?: any;
	retryable: boolean;
}

/**
 * Retry strategy configuration
 */
export interface RetryStrategy {
	maxAttempts: number;
	baseDelay: number;
	maxDelay: number;
	backoffFactor: number;
	jitter: boolean;
	jitterFactor: number;
	retryableErrors: ErrorType[];
	retryableStatusCodes: number[];
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
	enabled: boolean;
	failureThreshold: number;
	resetTimeout: number;
	monitoringPeriod: number;
	expectedExceptionTypes: ErrorType[];
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
	retryStrategy: RetryStrategy;
	circuitBreaker: CircuitBreakerConfig;
	defaultSeverity: ErrorSeverity;
	logErrors: boolean;
	throwOnUnretryable: boolean;
}

/**
 * Error event types
 */
export enum ErrorEventType {
	ERROR_OCCURRED = 'errorOccurred',
	ERROR_RETRY = 'errorRetry',
	ERROR_FAILED = 'errorFailed',
	ERROR_HANDLED = 'errorHandled',
	CIRCUIT_BREAKER_OPEN = 'circuitBreakerOpen',
	CIRCUIT_BREAKER_HALF_OPEN = 'circuitBreakerHalfOpen',
	CIRCUIT_BREAKER_CLOSED = 'circuitBreakerClosed',
}

/**
 * Error event data
 */
export interface ErrorEventData {
	eventType: ErrorEventType;
	error: EnhancedError;
	timestamp: number;
	attempt?: number;
	maxAttempts?: number;
	circuitState?: 'open' | 'half_open' | 'closed';
}

/**
 * Circuit breaker states
 */
enum CircuitState {
	CLOSED = 'closed',
	OPEN = 'open',
	HALF_OPEN = 'half_open',
}

/**
 * Enhanced Error class
 */
export class RestError extends Error implements EnhancedError {
	public readonly severity: ErrorSeverity;
	public readonly category: ErrorCategory;
	public readonly type: ErrorType;
	public readonly metadata: ErrorMetadata;
	public readonly originalError?: any;
	public readonly retryable: boolean;

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
	 * Create a network error
	 */
	static network(message: string, metadata: ErrorMetadata = {}, originalError?: any): RestError {
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
	 * Create a timeout error
	 */
	static timeout(message: string, metadata: ErrorMetadata = {}, originalError?: any): RestError {
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
	 * Create a rate limit error
	 */
	static rateLimit(message: string, metadata: ErrorMetadata = {}, originalError?: any): RestError {
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
	 * Create a server error
	 */
	static server(message: string, metadata: ErrorMetadata = {}, originalError?: any): RestError {
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
	 * Create a client error
	 */
	static client(message: string, metadata: ErrorMetadata = {}, originalError?: any): RestError {
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
	 * Create an authentication error
	 */
	static authentication(message: string, metadata: ErrorMetadata = {}, originalError?: any): RestError {
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
	 * Create an authorization error
	 */
	static authorization(message: string, metadata: ErrorMetadata = {}, originalError?: any): RestError {
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
	 * Create a validation error
	 */
	static validation(message: string, metadata: ErrorMetadata = {}, originalError?: any): RestError {
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
	 * Create an unknown error
	 */
	static unknown(message: string, metadata: ErrorMetadata = {}, originalError?: any): RestError {
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
 * Circuit Breaker implementation
 */
class CircuitBreaker {
	private state: CircuitState = CircuitState.CLOSED;
	private failureCount: number = 0;
	private lastFailureTime: number = 0;
	private nextAttemptTime: number = 0;
	private config: CircuitBreakerConfig;

	constructor(config: CircuitBreakerConfig) {
		this.config = config;
	}

	/**
	 * Record a successful call
	 */
	recordSuccess(): void {
		this.failureCount = 0;
		if (this.state === CircuitState.HALF_OPEN) {
			this.setState(CircuitState.CLOSED);
		}
	}

	/**
	 * Record a failed call
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
	 * Check if the circuit allows calls
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
	 * Get the current circuit state
	 */
	getState(): CircuitState {
		return this.state;
	}

	/**
	 * Determine if the circuit should be opened
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
	 * Set the circuit state and log the transition
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
				return RestError.rateLimit(message, { ...metadata, statusCode, retryAfter }, error);
			} else if (statusCode === 401) {
				return RestError.authentication(message, { ...metadata, statusCode }, error);
			} else if (statusCode === 403) {
				return RestError.authorization(message, { ...metadata, statusCode }, error);
			} else if (statusCode >= 400) {
				return RestError.client(message, { ...metadata, statusCode }, error);
			}
		}

		// Handle unknown error types
		return RestError.unknown(
			String(error),
			{ ...metadata, originalError: error },
			error
		);
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
		if (error.metadata.statusCode && this.config.retryStrategy.retryableStatusCodes.includes(error.metadata.statusCode)) {
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
		const { baseDelay, backoffFactor, maxDelay, jitter, jitterFactor } = this.config.retryStrategy;
		
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