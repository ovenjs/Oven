/**
 * Middleware System
 *
 * This module provides a comprehensive middleware system for the enhanced REST client,
 * including request interceptors, response processors, and error handlers.
 *
 * @packageDocumentation
 *
 * ## Overview
 *
 * The middleware module provides two main components:
 *
 * - **Middleware**: Base classes and interfaces for creating middleware
 * - **MiddlewarePipeline**: A pipeline for orchestrating middleware execution
 *
 * ## Features
 *
 * - Request middleware for intercepting and modifying requests before they're sent
 * - Response middleware for processing and modifying responses after they're received
 * - Error middleware for handling errors that occur during request processing
 * - Priority-based middleware execution
 * - Middleware registry for managing middleware instances
 * - Pipeline metrics and performance tracking
 * - Error recovery mechanisms
 * - Debug logging support
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   RequestMiddleware,
 *   ResponseMiddleware,
 *   ErrorMiddleware,
 *   MiddlewareRegistry,
 *   MiddlewarePipeline,
 *   MiddlewarePriority,
 *   MiddlewareType
 * } from '@your-package/middleware';
 *
 * // Create a middleware registry
 * const registry = new MiddlewareRegistry();
 *
 * // Create a request middleware
 * class AuthMiddleware extends RequestMiddleware {
 *   constructor() {
 *     super({
 *       name: 'auth',
 *       priority: MiddlewarePriority.High,
 *       description: 'Adds authentication headers to requests',
 *     });
 *   }
 *
 *   async processRequest(context, next) {
 *     // Add auth header to request
 *     context.request.headers.Authorization = 'Bearer token';
 *     return next();
 *   }
 * }
 *
 * // Register the middleware
 * registry.register(new AuthMiddleware());
 *
 * // Create a middleware pipeline
 * const pipeline = new MiddlewarePipeline(registry, {
 *   enableErrorRecovery: true,
 *   enableTiming: true,
 * });
 *
 * // Execute the pipeline
 * const response = await pipeline.execute(client, request, async (context) => {
 *   // This is where the actual request would be made
 *   return { status: 200, data: 'Response data' };
 * });
 * ```
 */

export {
  /**
   * Abstract base class for middleware
   * @see BaseMiddleware
   */
  BaseMiddleware,
  /**
   * Abstract base class for request middleware
   * @see RequestMiddleware
   */
  RequestMiddleware,
  /**
   * Abstract base class for response middleware
   * @see ResponseMiddleware
   */
  ResponseMiddleware,
  /**
   * Abstract base class for error middleware
   * @see ErrorMiddleware
   */
  ErrorMiddleware,
  /**
   * Registry for managing middleware instances
   * @see MiddlewareRegistry
   */
  MiddlewareRegistry,
} from './Middleware';

export {
  /**
   * Pipeline for orchestrating middleware execution
   * @see MiddlewarePipeline
   */
  MiddlewarePipeline,
} from './MiddlewarePipeline';

export type {
  /**
   * Interface for base middleware
   * @see IMiddleware
   */
  IMiddleware,
  /**
   * Interface for request middleware
   * @see IRequestMiddleware
   */
  IRequestMiddleware,
  /**
   * Interface for response middleware
   * @see IResponseMiddleware
   */
  IResponseMiddleware,
  /**
   * Interface for error middleware
   * @see IErrorMiddleware
   */
  IErrorMiddleware,
  /**
   * Interface for middleware metadata
   * @see MiddlewareMetadata
   */
  MiddlewareMetadata,
  /**
   * Type alias for middleware factory function
   * @see MiddlewareFactory
   */
  MiddlewareFactory,
} from './Middleware';

export type {
  /**
   * Enumeration of middleware execution priority levels
   * @see MiddlewarePriority
   */
  MiddlewarePriority,
  /**
   * Enumeration of middleware type identifiers
   * @see MiddlewareType
   */
  MiddlewareType,
} from './Middleware';

export type {
  /**
   * Interface for pipeline execution options
   * @see PipelineOptions
   */
  PipelineOptions,
  /**
   * Interface for pipeline execution metrics
   * @see PipelineMetrics
   */
  PipelineMetrics,
  /**
   * Interface for middleware execution context
   * @see ExecutionContext
   */
  ExecutionContext,
} from './MiddlewarePipeline';
