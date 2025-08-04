/**
 * Events System
 *
 * This module provides a comprehensive event handling system for the enhanced REST client,
 * including event emission, subscription management, and performance optimizations.
 *
 * @packageDocumentation
 *
 * ## Overview
 *
 * The events module provides two main components:
 *
 * - **EventEmitter**: A high-performance event emitter with priority-based listeners, wildcards, and performance monitoring
 * - **EventManager**: An enhanced event management system specifically designed for the REST client with support for request/response lifecycle events
 *
 * ## Features
 *
 * - Priority-based event listeners
 * - Wildcard pattern matching for events
 * - Performance monitoring and statistics
 * - Event batching for improved performance
 * - Event history and persistence
 * - One-time listeners
 * - Listener pausing and resuming
 * - Event aliases
 * - Request/response lifecycle events
 *
 * ## Usage
 *
 * ```typescript
 * import { EventManager, RestEventType } from '@your-package/events';
 *
 * // Create an event manager
 * const eventManager = new EventManager({
 *   enablePerformanceMonitoring: true,
 *   enableEventBatching: true,
 *   maxListeners: 20,
 * });
 *
 * // Listen for request events
 * eventManager.on(RestEventType.REQUEST_BEFORE_SEND, (data) => {
 *   console.log('Request about to be sent:', data.url);
 * });
 *
 * // Listen for response events
 * eventManager.on(RestEventType.RESPONSE_RECEIVED, (data) => {
 *   console.log('Response received:', data.status);
 * });
 *
 * // Emit a request event
 * await eventManager.emitRequestEvent(RestEventType.REQUEST_BEFORE_SEND, {
 *   requestId: 'req-123',
 *   method: 'GET',
 *   url: 'https://api.example.com/data',
 *   headers: {},
 *   timestamp: Date.now(),
 * });
 * ```
 */

export {
  /**
   * Enhanced EventEmitter with performance optimizations
   * @see EventEmitter
   */
  EventEmitter,
  /**
   * Interface representing event listener metadata
   * @see EventListenerMetadata
   */
  EventListenerMetadata,
  /**
   * Interface representing event statistics
   * @see EventStatistics
   */
  EventStatistics,
  /**
   * Interface representing event options
   * @see EventOptions
   */
  EventOptions,
  /**
   * Interface representing wildcard event patterns
   * @see WildcardPattern
   */
  WildcardPattern,
} from './EventEmitter';

export {
  /**
   * Enhanced Event Manager for REST Client
   * @see EventManager
   */
  EventManager,
  /**
   * Enumeration of REST client event types
   * @see RestEventType
   */
  RestEventType,
  /**
   * Interface representing request event data
   * @see RequestEventData
   */
  RequestEventData,
  /**
   * Interface representing response event data
   * @see ResponseEventData
   */
  ResponseEventData,
  /**
   * Interface representing error event data
   * @see ErrorEventData
   */
  ErrorEventData,
  /**
   * Interface representing performance event data
   * @see PerformanceEventData
   */
  PerformanceEventData,
  /**
   * Interface representing event manager configuration
   * @see EventManagerConfig
   */
  EventManagerConfig,
  /**
   * Interface representing event batches
   * @see EventBatch
   */
  EventBatch,
} from './EventManager';

export type {
  /**
   * Type alias for EventListenerMetadata interface
   * @deprecated Use EventListenerMetadata instead
   * @see EventListenerMetadata
   */
  EventListenerMetadata as IEventListenerMetadata,
  /**
   * Type alias for EventStatistics interface
   * @deprecated Use EventStatistics instead
   * @see EventStatistics
   */
  EventStatistics as IEventStatistics,
  /**
   * Type alias for EventOptions interface
   * @deprecated Use EventOptions instead
   * @see EventOptions
   */
  EventOptions as IEventOptions,
  /**
   * Type alias for WildcardPattern interface
   * @deprecated Use WildcardPattern instead
   * @see WildcardPattern
   */
  WildcardPattern as IWildcardPattern,
} from './EventEmitter';

export type {
  /**
   * Type alias for RequestEventData interface
   * @deprecated Use RequestEventData instead
   * @see RequestEventData
   */
  RequestEventData as IRequestEventData,
  /**
   * Type alias for ResponseEventData interface
   * @deprecated Use ResponseEventData instead
   * @see ResponseEventData
   */
  ResponseEventData as IResponseEventData,
  /**
   * Type alias for ErrorEventData interface
   * @deprecated Use ErrorEventData instead
   * @see ErrorEventData
   */
  ErrorEventData as IErrorEventData,
  /**
   * Type alias for PerformanceEventData interface
   * @deprecated Use PerformanceEventData instead
   * @see PerformanceEventData
   */
  PerformanceEventData as IPerformanceEventData,
  /**
   * Type alias for EventManagerConfig interface
   * @deprecated Use EventManagerConfig instead
   * @see EventManagerConfig
   */
  EventManagerConfig as IEventManagerConfig,
  /**
   * Type alias for EventBatch interface
   * @deprecated Use EventBatch instead
   * @see EventBatch
   */
  EventBatch as IEventBatch,
} from './EventManager';
