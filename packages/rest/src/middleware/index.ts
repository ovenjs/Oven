/**
 * Middleware System
 * 
 * This module provides a comprehensive middleware system for the enhanced REST client,
 * including request interceptors, response processors, and error handlers.
 */

export { 
	BaseMiddleware,
	RequestMiddleware,
	ResponseMiddleware,
	ErrorMiddleware,
	MiddlewareRegistry,
} from './Middleware';

export { MiddlewarePipeline } from './MiddlewarePipeline';

export type {
	IMiddleware,
	IRequestMiddleware,
	IResponseMiddleware,
	IErrorMiddleware,
	MiddlewareMetadata,
	MiddlewareFactory,
} from './Middleware';

export type {
	MiddlewarePriority,
	MiddlewareType,
} from './Middleware';

export type {
	PipelineOptions,
	PipelineMetrics,
	ExecutionContext,
} from './MiddlewarePipeline';