/**
 * Middleware Pipeline Implementation
 * 
 * This file contains the middleware pipeline that orchestrates the execution
 * of middleware in the correct order and handles the flow of requests and responses.
 */

import { APIRequest, APIResponse, MiddlewareContext, RESTClient } from '../types/api';
import { 
	IRequestMiddleware, 
	IResponseMiddleware, 
	IErrorMiddleware,
	MiddlewareRegistry,
	MiddlewareType} from './Middleware';

/**
 * Pipeline execution options
 */
export interface PipelineOptions {
	/**
	 * Whether to enable error recovery
	 */
	enableErrorRecovery?: boolean;

	/**
	 * The maximum number of middleware that can be executed
	 */
	maxMiddleware?: number;

	/**
	 * Whether to enable execution timing
	 */
	enableTiming?: boolean;

	/**
	 * Whether to enable debug logging
	 */
	enableDebugLogging?: boolean;

	/**
	 * The logger instance to use
	 */
	logger?: any;
}

/**
 * Pipeline execution metrics
 */
export interface PipelineMetrics {
	/**
	 * The total number of requests processed
	 */
	totalRequests: number;

	/**
	 * The total number of successful requests
	 */
	successfulRequests: number;

	/**
	 * The total number of failed requests
	 */
	failedRequests: number;

	/**
	 * The average execution time in milliseconds
	 */
	averageExecutionTime: number;

	/**
	 * The minimum execution time in milliseconds
	 */
	minExecutionTime: number;

	/**
	 * The maximum execution time in milliseconds
	 */
	maxExecutionTime: number;

	/**
	 * The number of middleware executed on average
	 */
	averageMiddlewareCount: number;

	/**
	 * The number of errors recovered
	 */
	errorsRecovered: number;

	/**
	 * The number of times the pipeline was short-circuited
	 */
	shortCircuits: number;
}

/**
 * Middleware execution context
 */
export interface ExecutionContext extends MiddlewareContext {
	/**
	 * The pipeline executing this context
	 */
	pipeline: MiddlewarePipeline;

	/**
	 * The execution start time
	 */
	startTime: number;

	/**
	 * The execution end time
	 */
	endTime?: number;

	/**
	 * The execution duration in milliseconds
	 */
	duration?: number;

	/**
	 * Whether the execution was short-circuited
	 */
	shortCircuited: boolean;

	/**
	 * The error that occurred during execution
	 */
	error?: Error;

	/**
	 * The middleware that were executed
	 */
	executedMiddleware: string[];

	/**
	 * The middleware that were skipped
	 */
	skippedMiddleware: string[];

	/**
	 * Additional execution metadata
	 */
	[key: string]: any;
}

/**
 * Enhanced middleware pipeline for orchestrating middleware execution
 */
export class MiddlewarePipeline {
	/**
	 * The middleware registry
	 */
	private readonly _registry: MiddlewareRegistry;

	/**
	 * The pipeline options
	 */
	private readonly _options: Required<PipelineOptions>;

	/**
	 * The pipeline metrics
	 */
	private _metrics: PipelineMetrics = {
		totalRequests: 0,
		successfulRequests: 0,
		failedRequests: 0,
		averageExecutionTime: 0,
		minExecutionTime: Number.MAX_SAFE_INTEGER,
		maxExecutionTime: 0,
		averageMiddlewareCount: 0,
		errorsRecovered: 0,
		shortCircuits: 0,
	};

	/**
	 * The execution time history
	 */
	private readonly _executionTimeHistory: number[] = [];

	/**
	 * The maximum size of the execution time history
	 */
	private readonly _maxExecutionTimeHistory = 1000;

	/**
	 * @param registry The middleware registry to use
	 * @param options The pipeline options
	 */
	constructor(registry: MiddlewareRegistry, options: PipelineOptions = {}) {
		this._registry = registry;
		this._options = {
			enableErrorRecovery: options.enableErrorRecovery ?? true,
			maxMiddleware: options.maxMiddleware ?? 50,
			enableTiming: options.enableTiming ?? true,
			enableDebugLogging: options.enableDebugLogging ?? false,
			logger: options.logger ?? console,
		};
	}

	/**
	 * Gets the current metrics for this pipeline
	 */
	public get metrics(): PipelineMetrics {
		return { ...this._metrics };
	}

	/**
	 * Gets the middleware registry used by this pipeline
	 */
	public get registry(): MiddlewareRegistry {
		return this._registry;
	}

	/**
	 * Executes the middleware pipeline for a request
	 * @param client The REST client
	 * @param request The request to process
	 * @param requestHandler The function that handles the actual request
	 */
	public async execute<T = any>(
		client: RESTClient,
		request: APIRequest,
		requestHandler: (context: ExecutionContext) => Promise<APIResponse<T>>,
	): Promise<APIResponse<T>> {
		const startTime = Date.now();
		const executedMiddleware: string[] = [];
		const skippedMiddleware: string[] = [];

		// Create execution context
		const context: ExecutionContext = {
			request,
			client,
			pipeline: this,
			timestamp: startTime,
			startTime,
			shortCircuited: false,
			executedMiddleware,
			skippedMiddleware,
		};

		if (this._options.enableDebugLogging) {
			this._options.logger.debug(`[Pipeline] Starting execution for ${request.method} ${request.path}`);
		}

		try {
			// Get all enabled middleware sorted by priority
			const allMiddleware = this._registry.getAllSorted();

			// Limit the number of middleware to execute
			const middlewareToExecute = allMiddleware.slice(0, this._options.maxMiddleware);

			// Create the execution chain
			let chainIndex = 0;
			const executeNext = async (): Promise<APIResponse<T>> => {
				// Check if we've executed all middleware
				if (chainIndex >= middlewareToExecute.length) {
					// All middleware executed, handle the request
					if (this._options.enableDebugLogging) {
						this._options.logger.debug(`[Pipeline] All middleware executed, handling request`);
					}
					return requestHandler(context);
				}

				// Get the next middleware
				const middleware = middlewareToExecute[chainIndex++];
				const middlewareName = middleware.metadata.name;

				// Check if middleware is enabled
				if (!middleware.metadata.enabled) {
					skippedMiddleware.push(middlewareName);
					return executeNext();
				}

				// Execute the middleware
				if (this._options.enableDebugLogging) {
					this._options.logger.debug(`[Pipeline] Executing middleware: ${middlewareName}`);
				}

				executedMiddleware.push(middlewareName);

				try {
					const result = await middleware.execute(context, executeNext);

					// Check if the middleware short-circuited the pipeline
					if (context.shortCircuited) {
						this._metrics.shortCircuits++;
						if (this._options.enableDebugLogging) {
							this._options.logger.debug(`[Pipeline] Pipeline short-circuited by ${middlewareName}`);
						}
					}

					return result as APIResponse<T>;
				} catch (error) {
					if (this._options.enableDebugLogging) {
						this._options.logger.debug(`[Pipeline] Middleware ${middlewareName} failed:`, error);
					}

					// If error recovery is enabled, try to recover
					if (this._options.enableErrorRecovery) {
						// Find error middleware that can handle this error
						const errorMiddleware = this._registry.getByType(MiddlewareType.Error);
						for (const errorMW of errorMiddleware) {
							if (errorMW.metadata.enabled) {
								try {
									const errorContext = { ...context, error: error as Error };
									const result = await errorMW.execute(errorContext, () => {
										throw error;
									});

									// Error was recovered
									this._metrics.errorsRecovered++;
									if (this._options.enableDebugLogging) {
										this._options.logger.debug(`[Pipeline] Error recovered by ${errorMW.metadata.name}`);
									}
									return result as APIResponse<T>;
								} catch (recoveryError) {
									// Error recovery failed, continue to next error middleware
									if (this._options.enableDebugLogging) {
										this._options.logger.debug(`[Pipeline] Error recovery failed for ${errorMW.metadata.name}:`, recoveryError);
									}
								}
							}
						}
					}

					// No error recovery or recovery failed, rethrow the error
					throw error;
				}
			};

			// Start the execution chain
			const response = await executeNext();

			// Update metrics
			this._updateMetrics(startTime, executedMiddleware.length, true);

			return response;
		} catch (error) {
			// Update metrics
			this._updateMetrics(startTime, executedMiddleware.length, false);

			// Re-throw the error
			throw error;
		}
	}

	/**
	 * Executes only request middleware
	 * @param client The REST client
	 * @param request The request to process
	 */
	public async executeRequestMiddleware(
		client: RESTClient,
		request: APIRequest,
	): Promise<APIRequest> {
		const requestMiddleware = this._registry.getByType(MiddlewareType.Request);
		let currentRequest = request;

		for (const middleware of requestMiddleware) {
			if (!middleware.metadata.enabled) continue;

			const requestMW = middleware as IRequestMiddleware;
			if (requestMW.processRequest) {
				currentRequest = await this._executeRequestMiddlewareWrapper(
					requestMW,
					{ request: currentRequest, client, timestamp: Date.now() },
					() => Promise.resolve(currentRequest),
				);
			}
		}

		return currentRequest;
	}

	/**
	 * Executes only response middleware
	 * @param client The REST client
	 * @param response The response to process
	 * @param request The original request
	 */
	public async executeResponseMiddleware<T = any>(
		client: RESTClient,
		response: APIResponse<T>,
		request: APIRequest,
	): Promise<APIResponse<T>> {
		const responseMiddleware = this._registry.getByType(MiddlewareType.Response);
		let currentResponse = response;

		for (const middleware of responseMiddleware) {
			if (!middleware.metadata.enabled) continue;

			const responseMW = middleware as IResponseMiddleware;
			if (responseMW.processResponse) {
				currentResponse = await this._executeResponseMiddlewareWrapper(
					responseMW,
					{ request, response: currentResponse, client, timestamp: Date.now() },
					() => Promise.resolve(currentResponse),
				);
			}
		}

		return currentResponse;
	}

	/**
	 * Executes only error middleware
	 * @param client The REST client
	 * @param error The error to handle
	 * @param request The original request
	 */
	public async executeErrorMiddleware(
		client: RESTClient,
		error: Error,
		request: APIRequest,
	): Promise<APIResponse> {
		const errorMiddleware = this._registry.getByType(MiddlewareType.Error);

		for (const middleware of errorMiddleware) {
			if (!middleware.metadata.enabled) continue;

			const errorMW = middleware as IErrorMiddleware;
			if (errorMW.handleError) {
				try {
					const result = await this._executeErrorMiddlewareWrapper(
						errorMW,
						{ request, error, client, timestamp: Date.now() },
						() => { throw error; },
					);
					return result;
				} catch (recoveryError) {
					// Error recovery failed, continue to next error middleware
					if (this._options.enableDebugLogging) {
						this._options.logger.debug(`[Pipeline] Error recovery failed for ${middleware.metadata.name}:`, recoveryError);
					}
				}
			}
		}

		// No error recovery or recovery failed, rethrow the error
		throw error;
	}

	/**
	 * Resets the pipeline metrics
	 */
	public resetMetrics(): void {
		this._metrics = {
			totalRequests: 0,
			successfulRequests: 0,
			failedRequests: 0,
			averageExecutionTime: 0,
			minExecutionTime: Number.MAX_SAFE_INTEGER,
			maxExecutionTime: 0,
			averageMiddlewareCount: 0,
			errorsRecovered: 0,
			shortCircuits: 0,
		};
		this._executionTimeHistory.length = 0;
	}

	/**
	 * Updates the pipeline metrics
	 * @param startTime The execution start time
	 * @param middlewareCount The number of middleware executed
	 * @param successful Whether the execution was successful
	 */
	private _updateMetrics(startTime: number, middlewareCount: number, successful: boolean): void {
		const endTime = Date.now();
		const duration = endTime - startTime;

		// Update basic metrics
		this._metrics.totalRequests++;
		if (successful) {
			this._metrics.successfulRequests++;
		} else {
			this._metrics.failedRequests++;
		}

		// Update execution time metrics
		this._executionTimeHistory.push(duration);
		if (this._executionTimeHistory.length > this._maxExecutionTimeHistory) {
			this._executionTimeHistory.shift();
		}

		this._metrics.averageExecutionTime = 
			this._executionTimeHistory.reduce((a, b) => a + b, 0) / this._executionTimeHistory.length;
		this._metrics.minExecutionTime = Math.min(this._metrics.minExecutionTime, duration);
		this._metrics.maxExecutionTime = Math.max(this._metrics.maxExecutionTime, duration);

		// Update middleware count metrics
		this._metrics.averageMiddlewareCount = 
			(this._metrics.averageMiddlewareCount * (this._metrics.totalRequests - 1) + middlewareCount) / this._metrics.totalRequests;
	}

	/**
	 * Wrapper for executing request middleware
	 * @param middleware The middleware to execute
	 * @param context The middleware context
	 * @param next The next function to call
	 */
	private async _executeRequestMiddlewareWrapper(
		middleware: IRequestMiddleware,
		context: MiddlewareContext,
		next: () => Promise<APIRequest>,
	): Promise<APIRequest> {
		return new Promise<APIRequest>((resolve, reject) => {
			const wrappedNext = async (): Promise<APIResponse> => {
				const request = await next();
				return {
					status: 200,
					statusText: 'OK',
					headers: {},
					data: request,
					cached: false,
					requestTime: 0,
					timestamp: Date.now(),
				};
			};

			middleware.execute(context, wrappedNext)
				.then(response => resolve(response.data as APIRequest))
				.catch(reject);
		});
	}

	/**
	 * Wrapper for executing response middleware
	 * @param middleware The middleware to execute
	 * @param context The middleware context with response
	 * @param next The next function to call
	 */
	private async _executeResponseMiddlewareWrapper<T = any>(
		middleware: IResponseMiddleware,
		context: MiddlewareContext & { response: APIResponse<T> },
		next: () => Promise<APIResponse<T>>,
	): Promise<APIResponse<T>> {
		return middleware.execute(context, next) as Promise<APIResponse<T>>;
	}

	/**
	 * Wrapper for executing error middleware
	 * @param middleware The middleware to execute
	 * @param context The middleware context with error
	 * @param next The next function to call
	 */
	private async _executeErrorMiddlewareWrapper(
		middleware: IErrorMiddleware,
		context: MiddlewareContext & { error: Error },
		next: () => Promise<APIResponse>,
	): Promise<APIResponse> {
		return middleware.execute(context, next);
	}
}