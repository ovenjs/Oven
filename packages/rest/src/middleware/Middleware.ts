/**
 * Middleware System Implementation
 * 
 * This file contains the core middleware system for the enhanced REST client,
 * including request interceptors, response processors, and error handlers.
 */

import { APIRequest, APIResponse, MiddlewareContext } from '../types/api';
import { RESTClient } from '../types/client';

/**
 * Middleware execution priority levels
 */
export enum MiddlewarePriority {
	/**
	 * Highest priority - runs first
	 */
	Highest = 100,

	/**
	 * High priority - runs early
	 */
	High = 75,

	/**
	 * Normal priority - default
	 */
	Normal = 50,

	/**
	 * Low priority - runs later
	 */
	Low = 25,

	/**
	 * Lowest priority - runs last
	 */
	Lowest = 0,
}

/**
 * Middleware type identifiers
 */
export enum MiddlewareType {
	/**
	 * Request middleware - runs before the request is sent
	 */
	Request = 'request',

	/**
	 * Response middleware - runs after the response is received
	 */
	Response = 'response',

	/**
	 * Error middleware - runs when an error occurs
	 */
	Error = 'error',
}

/**
 * Middleware metadata
 */
export interface MiddlewareMetadata {
	/**
	 * The name of the middleware
	 */
	name: string;

	/**
	 * The type of the middleware
	 */
	type: MiddlewareType;

	/**
	 * The priority of the middleware
	 */
	priority: MiddlewarePriority;

	/**
	 * Whether the middleware is enabled
	 */
	enabled: boolean;

	/**
	 * The version of the middleware
	 */
	version?: string;

	/**
	 * The description of the middleware
	 */
	description?: string;

	/**
	 * The author of the middleware
	 */
	author?: string;

	/**
	 * Additional metadata
	 */
	[key: string]: any;
}

/**
 * Base middleware interface
 */
export interface IMiddleware {
	/**
	 * The metadata for this middleware
	 */
	readonly metadata: MiddlewareMetadata;

	/**
	 * Executes the middleware
	 * @param context The middleware context
	 * @param next The next function to call
	 */
	execute(context: MiddlewareContext, next: () => Promise<APIResponse>): Promise<APIResponse>;

	/**
	 * Initializes the middleware
	 * @param client The REST client
	 */
	initialize?(client: RESTClient): Promise<void> | void;

	/**
	 * Destroys the middleware
	 */
	destroy?(): Promise<void> | void;
}

/**
 * Request middleware interface
 */
export interface IRequestMiddleware extends IMiddleware {
	/**
	 * Processes the request before it's sent
	 * @param context The middleware context
	 * @param next The next function to call
	 */
	processRequest?(context: MiddlewareContext, next: () => Promise<APIResponse>): Promise<APIResponse>;
}

/**
 * Response middleware interface
 */
export interface IResponseMiddleware extends IMiddleware {
	/**
	 * Processes the response after it's received
	 * @param context The middleware context
	 * @param next The next function to call
	 */
	processResponse?(context: MiddlewareContext, next: () => Promise<APIResponse>): Promise<APIResponse>;
}

/**
 * Error middleware interface
 */
export interface IErrorMiddleware extends IMiddleware {
	/**
	 * Handles errors that occur during request processing
	 * @param context The middleware context
	 * @param next The next function to call
	 */
	handleError?(context: MiddlewareContext, next: () => Promise<APIResponse>): Promise<APIResponse>;
}

/**
 * Middleware factory function type
 */
export type MiddlewareFactory<T extends IMiddleware = IMiddleware> = (...args: any[]) => T;

/**
 * Abstract base class for middleware
 */
export abstract class BaseMiddleware implements IMiddleware {
	/**
	 * The metadata for this middleware
	 */
	public readonly metadata: MiddlewareMetadata;

	/**
	 * @param metadata The metadata for this middleware
	 */
	constructor(metadata: MiddlewareMetadata) {
		this.metadata = metadata;
	}

	/**
	 * Executes the middleware
	 * @param context The middleware context
	 * @param next The next function to call
	 */
	public abstract execute(context: MiddlewareContext, next: () => Promise<APIResponse>): Promise<APIResponse>;

	/**
	 * Initializes the middleware
	 * @param client The REST client
	 */
	public initialize?(client: RESTClient): Promise<void> | void {
		// Default implementation does nothing
	}

	/**
	 * Destroys the middleware
	 */
	public destroy?(): Promise<void> | void {
		// Default implementation does nothing
	}

	/**
	 * Enables the middleware
	 */
	public enable(): void {
		this.metadata.enabled = true;
	}

	/**
	 * Disables the middleware
	 */
	public disable(): void {
		this.metadata.enabled = false;
	}

	/**
	 * Sets the priority of the middleware
	 * @param priority The new priority
	 */
	public setPriority(priority: MiddlewarePriority): void {
		this.metadata.priority = priority;
	}
}

/**
 * Abstract base class for request middleware
 */
export abstract class RequestMiddleware extends BaseMiddleware implements IRequestMiddleware {
	constructor(metadata: Omit<MiddlewareMetadata, 'type'>) {
		super({
			name: metadata.name,
			type: MiddlewareType.Request,
			enabled: metadata.enabled ?? true,
			priority: metadata.priority ?? MiddlewarePriority.Normal,
			version: metadata.version,
			description: metadata.description,
			author: metadata.author,
		});
	}

	/**
	 * Executes the middleware
	 * @param context The middleware context
	 * @param next The next function to call
	 */
	public async execute(context: MiddlewareContext, next: () => Promise<APIResponse>): Promise<APIResponse> {
		if (!this.metadata.enabled) {
			return next();
		}

		if (this.processRequest) {
			return this.processRequest(context, next);
		}

		return next();
	}

	/**
	 * Processes the request before it's sent
	 * @param context The middleware context
	 * @param next The next function to call
	 */
	public abstract processRequest(context: MiddlewareContext, next: () => Promise<APIResponse>): Promise<APIResponse>;
}

/**
 * Abstract base class for response middleware
 */
export abstract class ResponseMiddleware extends BaseMiddleware implements IResponseMiddleware {
	constructor(metadata: Omit<MiddlewareMetadata, 'type'>) {
		super({
			name: metadata.name,
			type: MiddlewareType.Response,
			enabled: metadata.enabled ?? true,
			priority: metadata.priority ?? MiddlewarePriority.Normal,
			version: metadata.version,
			description: metadata.description,
			author: metadata.author,
		});
	}

	/**
	 * Executes the middleware
	 * @param context The middleware context
	 * @param next The next function to call
	 */
	public async execute(context: MiddlewareContext, next: () => Promise<APIResponse>): Promise<APIResponse> {
		if (!this.metadata.enabled) {
			return next();
		}

		const response = await next();

		if (this.processResponse) {
			return this.processResponse({ ...context, response }, async () => response);
		}

		return response;
	}

	/**
	 * Processes the response after it's received
	 * @param context The middleware context
	 * @param next The next function to call
	 */
	public abstract processResponse(context: MiddlewareContext & { response: APIResponse }, next: () => Promise<APIResponse>): Promise<APIResponse>;
}

/**
 * Abstract base class for error middleware
 */
export abstract class ErrorMiddleware extends BaseMiddleware implements IErrorMiddleware {
	constructor(metadata: Omit<MiddlewareMetadata, 'type'>) {
		super({
			name: metadata.name,
			type: MiddlewareType.Error,
			enabled: metadata.enabled ?? true,
			priority: metadata.priority ?? MiddlewarePriority.Normal,
			version: metadata.version,
			description: metadata.description,
			author: metadata.author,
		});
	}

	/**
	 * Executes the middleware
	 * @param context The middleware context
	 * @param next The next function to call
	 */
	public async execute(context: MiddlewareContext, next: () => Promise<APIResponse>): Promise<APIResponse> {
		if (!this.metadata.enabled) {
			return next();
		}

		try {
			return await next();
		} catch (error) {
			if (this.handleError) {
				return this.handleError({ ...context, error: error as Error }, async () => {
					throw error;
				});
			}
			throw error;
		}
	}

	/**
	 * Handles errors that occur during request processing
	 * @param context The middleware context
	 * @param next The next function to call
	 */
	public abstract handleError(context: MiddlewareContext & { error: Error }, next: () => Promise<APIResponse>): Promise<APIResponse>;
}

/**
 * Middleware registry for managing middleware instances
 */
export class MiddlewareRegistry {
	/**
	 * The registered middleware instances
	 */
	private readonly _middleware = new Map<string, IMiddleware>();

	/**
	 * The middleware factories
	 */
	private readonly _factories = new Map<string, MiddlewareFactory>();

	/**
	 * Registers a middleware instance
	 * @param middleware The middleware to register
	 */
	public register(middleware: IMiddleware): void {
		this._middleware.set(middleware.metadata.name, middleware);
	}

	/**
	 * Registers a middleware factory
	 * @param name The name of the middleware
	 * @param factory The factory function
	 */
	public registerFactory(name: string, factory: MiddlewareFactory): void {
		this._factories.set(name, factory);
	}

	/**
	 * Gets a middleware instance by name
	 * @param name The name of the middleware
	 */
	public get(name: string): IMiddleware | undefined {
		return this._middleware.get(name);
	}

	/**
	 * Creates a middleware instance using a factory
	 * @param name The name of the middleware
	 * @param args The arguments to pass to the factory
	 */
	public create(name: string, ...args: any[]): IMiddleware | undefined {
		const factory = this._factories.get(name);
		if (!factory) {
			return undefined;
		}

		const middleware = factory(...args);
		this.register(middleware);
		return middleware;
	}

	/**
	 * Gets all middleware of a specific type
	 * @param type The type of middleware to get
	 */
	public getByType(type: MiddlewareType): IMiddleware[] {
		return Array.from(this._middleware.values())
			.filter(middleware => middleware.metadata.type === type && middleware.metadata.enabled)
			.sort((a, b) => b.metadata.priority - a.metadata.priority);
	}

	/**
	 * Gets all middleware sorted by priority
	 */
	public getAllSorted(): IMiddleware[] {
		return Array.from(this._middleware.values())
			.filter(middleware => middleware.metadata.enabled)
			.sort((a, b) => b.metadata.priority - a.metadata.priority);
	}

	/**
	 * Removes a middleware by name
	 * @param name The name of the middleware to remove
	 */
	public remove(name: string): boolean {
		const middleware = this._middleware.get(name);
		if (middleware) {
			if (middleware.destroy) {
				try {
					middleware.destroy();
				} catch (error) {
					// Ignore errors during destruction
				}
			}
			return this._middleware.delete(name);
		}
		return false;
	}

	/**
	 * Clears all middleware
	 */
	public clear(): void {
		for (const middleware of this._middleware.values()) {
			if (middleware.destroy) {
				try {
					middleware.destroy();
				} catch (error) {
					// Ignore errors during destruction
				}
			}
		}
		this._middleware.clear();
		this._factories.clear();
	}

	/**
	 * Gets the number of registered middleware
	 */
	public get size(): number {
		return this._middleware.size;
	}

	/**
	 * Checks if a middleware is registered
	 * @param name The name of the middleware
	 */
	public has(name: string): boolean {
		return this._middleware.has(name);
	}

	/**
	 * Enables a middleware
	 * @param name The name of the middleware
	 */
	public enable(name: string): boolean {
		const middleware = this._middleware.get(name);
		if (middleware) {
			(middleware as BaseMiddleware).enable();
			return true;
		}
		return false;
	}

	/**
	 * Disables a middleware
	 * @param name The name of the middleware
	 */
	public disable(name: string): boolean {
		const middleware = this._middleware.get(name);
		if (middleware) {
			(middleware as BaseMiddleware).disable();
			return true;
		}
		return false;
	}

	/**
	 * Sets the priority of a middleware
	 * @param name The name of the middleware
	 * @param priority The new priority
	 */
	public setPriority(name: string, priority: MiddlewarePriority): boolean {
		const middleware = this._middleware.get(name);
		if (middleware) {
			(middleware as BaseMiddleware).setPriority(priority);
			return true;
		}
		return false;
	}
}