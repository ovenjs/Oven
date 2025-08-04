/**
 * Event Manager for REST Client
 *
 * This module provides an enhanced event management system specifically designed
 * for the REST client with support for request/response lifecycle events.
 */

import { EventEmitter, EventStatistics } from './EventEmitter';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';

// Declare global window interface for TypeScript
declare global {
  interface Window {
    localStorage: {
      setItem(key: string, value: string): void;
      getItem(key: string): string | null;
      removeItem(key: string): void;
      clear(): void;
    };
  }
}

/**
 * REST Client event types
 */
export enum RestEventType {
  /** Request is about to be sent */
  REQUEST_BEFORE_SEND = 'request.beforeSend',
  /** Request has been sent */
  REQUEST_SENT = 'request.sent',
  /** Response has been received */
  RESPONSE_RECEIVED = 'response.received',
  /** Response has been processed */
  RESPONSE_PROCESSED = 'response.processed',
  /** Request has been retried */
  REQUEST_RETRY = 'request.retry',
  /** Request has been aborted */
  REQUEST_ABORTED = 'request.aborted',
  /** Request has timed out */
  REQUEST_TIMEOUT = 'request.timeout',
  /** Request has been cached */
  REQUEST_CACHED = 'request.cached',
  /** Request has been rate limited */
  REQUEST_RATE_LIMITED = 'request.rateLimited',
  /** Request has been batched */
  REQUEST_BATCHED = 'request.batched',
  /** Error occurred */
  ERROR = 'error',
  /** Warning occurred */
  WARNING = 'warning',
  /** Debug information */
  DEBUG = 'debug',
  /** Performance metrics */
  PERFORMANCE = 'performance',
  /** Connection pool event */
  CONNECTION_POOL = 'connectionPool',
  /** Rate limiter event */
  RATE_LIMITER = 'rateLimiter',
  /** Cache event */
  CACHE = 'cache',
  /** Middleware event */
  MIDDLEWARE = 'middleware',
}

/**
 * Request event data
 */
export interface RequestEventData {
  /** Request ID */
  requestId: string;
  /** Request method */
  method: string;
  /** Request URL */
  url: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request body */
  body?: any;
  /** Request timestamp */
  timestamp: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Response event data
 */
export interface ResponseEventData {
  /** Request ID */
  requestId: string;
  /** Response status code */
  status: number;
  /** Response status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body */
  body?: any;
  /** Response timestamp */
  timestamp: number;
  /** Request duration in milliseconds */
  duration: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Error event data
 */
export interface ErrorEventData {
  /** Request ID */
  requestId?: string;
  /** Error message */
  message: string;
  /** Error stack trace */
  stack?: string;
  /** Error code */
  code?: string;
  /** Error timestamp */
  timestamp: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Performance event data
 */
export interface PerformanceEventData {
  /** Operation name */
  operation: string;
  /** Duration in milliseconds */
  duration: number;
  /** Timestamp */
  timestamp: number;
  /** Additional metrics */
  metrics?: Record<string, number>;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Event manager configuration
 */
export interface EventManagerConfig {
  /** Maximum number of event listeners */
  maxListeners?: number;
  /** Whether to enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  /** Whether to enable event batching */
  enableEventBatching?: boolean;
  /** Event batch size */
  eventBatchSize?: number;
  /** Event batch timeout in milliseconds */
  eventBatchTimeout?: number;
  /** Whether to enable event persistence */
  enableEventPersistence?: boolean;
  /** Event persistence key */
  eventPersistenceKey?: string;
}

/**
 * Event batch
 */
export interface EventBatch {
  /** Events in the batch */
  events: Array<{
    /** Event type */
    type: string;
    /** Event data */
    data: any;
    /** Event timestamp */
    timestamp: number;
  }>;
  /** Batch timestamp */
  timestamp: number;
}

/**
 * Enhanced Event Manager for REST Client
 */
export class EventManager extends EventEmitter {
  /** Event manager configuration */
  private config: EventManagerConfig;

  /** Event batch */
  private eventBatch: EventBatch | null = null;

  /** Event batch timeout */
  private eventBatchTimeout: NodeJS.Timeout | null = null;

  /** Event history */
  private eventHistory: Array<{
    type: string;
    data: any;
    timestamp: number;
  }> = [];

  /** Maximum event history size */
  private maxEventHistorySize = 1000;

  constructor(config: EventManagerConfig = {}, performanceMonitor?: PerformanceMonitor) {
    super(performanceMonitor);

    this.config = {
      maxListeners: 10,
      enablePerformanceMonitoring: true,
      enableEventBatching: false,
      eventBatchSize: 10,
      eventBatchTimeout: 1000,
      enableEventPersistence: false,
      eventPersistenceKey: 'rest-client-events',
      ...config,
    };

    // Initialize event batching if enabled
    if (this.config.enableEventBatching) {
      this.initializeEventBatching();
    }

    // Load persisted events if enabled
    if (this.config.enableEventPersistence) {
      this.loadPersistedEvents();
    }
  }

  /**
   * Emit a request event
   * @param type Event type
   * @param data Event data
   */
  async emitRequestEvent(type: RestEventType, data: RequestEventData): Promise<boolean> {
    return this.emitEvent(type, data);
  }

  /**
   * Emit a response event
   * @param type Event type
   * @param data Event data
   */
  async emitResponseEvent(
    type: RestEventType,
    data: ResponseEventData
  ): Promise<boolean> {
    return this.emitEvent(type, data);
  }

  /**
   * Emit an error event
   * @param type Event type
   * @param data Event data
   */
  async emitErrorEvent(type: RestEventType, data: ErrorEventData): Promise<boolean> {
    return this.emitEvent(type, data);
  }

  /**
   * Emit a performance event
   * @param type Event type
   * @param data Event data
   */
  async emitPerformanceEvent(
    type: RestEventType,
    data: PerformanceEventData
  ): Promise<boolean> {
    return this.emitEvent(type, data);
  }

  /**
   * Emit a generic event
   * @param type Event type
   * @param data Event data
   */
  async emitEvent(type: string, data: any): Promise<boolean> {
    const timestamp = Date.now();

    // Add to event history
    this.addToEventHistory(type, data, timestamp);

    // Add to batch if batching is enabled
    if (this.config.enableEventBatching) {
      this.addToEventBatch(type, data, timestamp);
    }

    // Emit the event
    const result = await this.emit(type, data, timestamp);

    // Persist events if enabled
    if (this.config.enableEventPersistence) {
      this.persistEvents();
    }

    return result;
  }

  /**
   * Get event statistics
   * @param type Event type
   */
  getEventStatistics(type: string): EventStatistics | undefined {
    return this.getStatistics(type);
  }

  /**
   * Get all event statistics
   */
  getAllEventStatistics(): Map<string, EventStatistics> {
    return this.getAllStatistics();
  }

  /**
   * Get event history
   * @param type Event type (optional)
   * @param limit Maximum number of events to return
   */
  getEventHistory(
    type?: string,
    limit = 100
  ): Array<{
    type: string;
    data: any;
    timestamp: number;
  }> {
    let history = this.eventHistory;

    if (type) {
      history = history.filter(event => event.type === type);
    }

    return history.slice(-limit);
  }

  /**
   * Clear event history
   */
  clearEventHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Set maximum event history size
   * @param size Maximum size
   */
  setMaxEventHistorySize(size: number): void {
    this.maxEventHistorySize = size;

    // Trim history if needed
    if (this.eventHistory.length > size) {
      this.eventHistory = this.eventHistory.slice(-size);
    }
  }

  /**
   * Get event batch
   */
  getEventBatch(): EventBatch | null {
    return this.eventBatch;
  }

  /**
   * Flush event batch
   */
  async flushEventBatch(): Promise<void> {
    if (!this.eventBatch || this.eventBatch.events.length === 0) {
      return;
    }

    // Emit batch event
    await this.emit('eventBatch', this.eventBatch);

    // Clear batch
    this.eventBatch = null;

    // Clear timeout
    if (this.eventBatchTimeout) {
      clearTimeout(this.eventBatchTimeout);
      this.eventBatchTimeout = null;
    }
  }

  /**
   * Add to event history
   * @param type Event type
   * @param data Event data
   * @param timestamp Event timestamp
   */
  private addToEventHistory(type: string, data: any, timestamp: number): void {
    this.eventHistory.push({
      type,
      data,
      timestamp,
    });

    // Trim history if needed
    if (this.eventHistory.length > this.maxEventHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxEventHistorySize);
    }
  }

  /**
   * Initialize event batching
   */
  private initializeEventBatching(): void {
    this.eventBatch = {
      events: [],
      timestamp: Date.now(),
    };
  }

  /**
   * Add to event batch
   * @param type Event type
   * @param data Event data
   * @param timestamp Event timestamp
   */
  private addToEventBatch(type: string, data: any, timestamp: number): void {
    if (!this.eventBatch) {
      this.eventBatch = {
        events: [],
        timestamp: Date.now(),
      };
    }

    this.eventBatch.events.push({
      type,
      data,
      timestamp,
    });

    // Check if batch is full
    if (this.eventBatch.events.length >= (this.config.eventBatchSize || 10)) {
      this.flushEventBatch();
    } else {
      // Set timeout if not already set
      if (!this.eventBatchTimeout) {
        this.eventBatchTimeout = setTimeout(() => {
          this.flushEventBatch();
        }, this.config.eventBatchTimeout || 1000);
      }
    }
  }

  /**
   * Persist events
   */
  private persistEvents(): void {
    if (!this.config.enableEventPersistence || !this.config.eventPersistenceKey) {
      return;
    }

    try {
      const data = {
        eventHistory: this.eventHistory,
        timestamp: Date.now(),
      };

      // Check if we're in a browser environment
      if (
        typeof globalThis !== 'undefined' &&
        typeof globalThis.localStorage !== 'undefined'
      ) {
        globalThis.localStorage.setItem(
          this.config.eventPersistenceKey!,
          JSON.stringify(data)
        );
      }
    } catch (_error) {
      // Ignore persistence errors
    }
  }

  /**
   * Load persisted events
   */
  private loadPersistedEvents(): void {
    if (!this.config.enableEventPersistence || !this.config.eventPersistenceKey) {
      return;
    }

    try {
      // Check if we're in a browser environment
      if (
        typeof globalThis !== 'undefined' &&
        typeof globalThis.localStorage !== 'undefined'
      ) {
        const data = globalThis.localStorage.getItem(this.config.eventPersistenceKey!);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.eventHistory && Array.isArray(parsed.eventHistory)) {
            this.eventHistory = parsed.eventHistory;
          }
        }
      }
    } catch (_error) {
      // Ignore loading errors
    }
  }
}
