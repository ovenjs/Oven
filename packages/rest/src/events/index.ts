/**
 * Events System
 * 
 * This module provides a comprehensive event handling system for the enhanced REST client,
 * including event emission, subscription management, and performance optimizations.
 */

export { 
	EventEmitter,
	EventListenerMetadata,
	EventStatistics,
	EventOptions,
	WildcardPattern,
} from './EventEmitter';

export { 
	EventManager,
	RestEventType,
	RequestEventData,
	ResponseEventData,
	ErrorEventData,
	PerformanceEventData,
	EventManagerConfig,
	EventBatch,
} from './EventManager';

export type {
	EventListenerMetadata as IEventListenerMetadata,
	EventStatistics as IEventStatistics,
	EventOptions as IEventOptions,
	WildcardPattern as IWildcardPattern,
} from './EventEmitter';

export type {
	RequestEventData as IRequestEventData,
	ResponseEventData as IResponseEventData,
	ErrorEventData as IErrorEventData,
	PerformanceEventData as IPerformanceEventData,
	EventManagerConfig as IEventManagerConfig,
	EventBatch as IEventBatch,
} from './EventManager';