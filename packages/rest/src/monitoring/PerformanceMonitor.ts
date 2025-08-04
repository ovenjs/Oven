/**
 * Performance Monitoring and Metrics Collection System
 *
 * This module provides comprehensive performance monitoring and metrics collection for the enhanced REST client,
 * with support for request timing, resource usage tracking, and performance analytics.
 */

import { EventEmitter } from 'events';
import { Logger } from '../logger/Logger';

/**
 * Metric types for categorizing performance data
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer',
}

/**
 * Performance event types
 */
export enum PerformanceEventType {
  REQUEST_STARTED = 'requestStarted',
  REQUEST_COMPLETED = 'requestCompleted',
  REQUEST_FAILED = 'requestFailed',
  CACHE_HIT = 'cacheHit',
  CACHE_MISS = 'cacheMiss',
  RATE_LIMIT_EXCEEDED = 'rateLimitExceeded',
  BATCH_PROCESSING_STARTED = 'batchProcessingStarted',
  BATCH_PROCESSING_COMPLETED = 'batchProcessingCompleted',
  BATCH_ITEM_PROCESSED = 'batchItemProcessed',
  CONNECTION_ACQUIRED = 'connectionAcquired',
  CONNECTION_RELEASED = 'connectionReleased',
  CONNECTION_CREATED = 'connectionCreated',
  INTERCEPTOR_BEFORE = 'interceptorBefore',
  INTERCEPTOR_AFTER = 'interceptorAfter',
  ERROR_OCCURRED = 'errorOccurred',
  ERROR_RETRY = 'errorRetry',
  CIRCUIT_BREAKER_OPEN = 'circuitBreakerOpen',
  CIRCUIT_BREAKER_CLOSED = 'circuitBreakerClosed',
}

/**
 * Performance event data
 */
export interface PerformanceEventData {
  eventType: PerformanceEventType;
  timestamp: number;
  requestId?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  cacheKey?: string;
  batchId?: string;
  itemId?: string;
  connectionId?: string;
  interceptorName?: string;
  errorType?: string;
  metadata?: Record<string, any>;
}

/**
 * Metric data structure
 */
export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageRequestTime: number;
  minRequestTime: number;
  maxRequestTime: number;
  cacheHitRate: number;
  rateLimitExceededCount: number;
  batchProcessingCount: number;
  averageBatchSize: number;
  connectionPoolSize: number;
  activeConnections: number;
  circuitBreakerOpenCount: number;
  timestamp: number;
}

/**
 * Performance monitor configuration
 */
export interface PerformanceMonitorConfig {
  enabled: boolean;
  sampleRate: number;
  maxMetrics: number;
  retentionPeriod: number;
  enableDetailedMetrics: boolean;
  enablePerformanceEvents: boolean;
  enableStatsCollection: boolean;
  autoFlushInterval: number;
}

/**
 * Histogram bucket configuration
 */
export interface HistogramBucket {
  le: number; // Less than or equal to
  count: number;
}

/**
 * Timer metric data
 */
export interface TimerMetric {
  count: number;
  sum: number;
  min: number;
  max: number;
  buckets: HistogramBucket[];
}

/**
 * Performance Monitor implementation
 */
export class PerformanceMonitor extends EventEmitter {
  private config: PerformanceMonitorConfig;
  private logger: Logger;
  private metrics: Map<string, Metric[]> = new Map();
  private timers: Map<string, TimerMetric> = new Map();
  private stats: PerformanceStats;
  private flushInterval?: NodeJS.Timeout;

  constructor(config: Partial<PerformanceMonitorConfig> = {}, logger: Logger) {
    super();
    this.logger = logger;

    // Set default configuration
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      maxMetrics: 10000,
      retentionPeriod: 3600000, // 1 hour
      enableDetailedMetrics: true,
      enablePerformanceEvents: true,
      enableStatsCollection: true,
      autoFlushInterval: 60000, // 1 minute
      ...config,
    };

    // Initialize statistics
    this.stats = this.initializeStats();

    // Start auto-flush if enabled
    if (this.config.autoFlushInterval > 0) {
      this.startAutoFlush();
    }
  }

  /**
   * Record a performance event
   */
  recordEvent(eventData: Omit<PerformanceEventData, 'timestamp'>): void {
    if (!this.config.enabled || !this.config.enablePerformanceEvents) {
      return;
    }

    // Apply sampling
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    const event: PerformanceEventData = {
      ...eventData,
      timestamp: Date.now(),
    };

    // Emit event
    this.emit('performanceEvent', event);

    // Update statistics
    this.updateStats(event);

    // Log event if detailed metrics are enabled
    if (this.config.enableDetailedMetrics) {
      this.logger.debug('Performance event recorded', { event });
    }
  }

  /**
   * Start timing a request
   */
  startTiming(requestId: string, url?: string, method?: string): () => void {
    if (!this.config.enabled) {
      return () => {};
    }

    const startTime = Date.now();

    this.recordEvent({
      eventType: PerformanceEventType.REQUEST_STARTED,
      requestId,
      url,
      method,
    });

    return () => {
      const duration = Date.now() - startTime;
      const tags: Record<string, string> = { requestId };
      if (url) tags.url = url;
      if (method) tags.method = method;
      this.recordTiming('request.duration', duration, tags);
    };
  }

  /**
   * Record a timing metric
   */
  recordTiming(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.enabled) {
      return;
    }

    // Update histogram
    const timerKey = this.getMetricKey(name, tags);
    let timer = this.timers.get(timerKey);

    if (!timer) {
      timer = this.initializeTimer();
      this.timers.set(timerKey, timer);
    }

    timer.count++;
    timer.sum += value;
    timer.min = Math.min(timer.min, value);
    timer.max = Math.max(timer.max, value);

    // Update buckets
    for (const bucket of timer.buckets) {
      if (value <= bucket.le) {
        bucket.count++;
      }
    }

    // Record as individual metric
    this.recordMetric({
      name,
      type: MetricType.TIMER,
      value,
      timestamp: Date.now(),
      tags,
    });
  }

  /**
   * Record a counter metric
   */
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    if (!this.config.enabled) {
      return;
    }

    this.recordMetric({
      name,
      type: MetricType.COUNTER,
      value,
      timestamp: Date.now(),
      tags,
    });
  }

  /**
   * Record a gauge metric
   */
  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.enabled) {
      return;
    }

    this.recordMetric({
      name,
      type: MetricType.GAUGE,
      value,
      timestamp: Date.now(),
      tags,
    });
  }

  /**
   * Record a histogram metric
   */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.enabled) {
      return;
    }

    this.recordMetric({
      name,
      type: MetricType.HISTOGRAM,
      value,
      timestamp: Date.now(),
      tags,
    });
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    return { ...this.stats };
  }

  /**
   * Get metrics by name
   */
  getMetrics(name?: string): Metric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }

    const allMetrics: Metric[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }
    return allMetrics;
  }

  /**
   * Get timer data
   */
  getTimer(name: string, tags?: Record<string, string>): TimerMetric | undefined {
    const key = this.getMetricKey(name, tags);
    return this.timers.get(key);
  }

  /**
   * Reset all metrics and statistics
   */
  reset(): void {
    this.metrics.clear();
    this.timers.clear();
    this.stats = this.initializeStats();
    this.emit('reset');
  }

  /**
   * Flush old metrics based on retention period
   */
  flush(): void {
    if (!this.config.enabled) {
      return;
    }

    const now = Date.now();
    const cutoffTime = now - this.config.retentionPeriod;

    for (const [name, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(metric => metric.timestamp > cutoffTime);

      if (filteredMetrics.length === 0) {
        this.metrics.delete(name);
      } else {
        this.metrics.set(name, filteredMetrics);
      }
    }

    this.emit('flush', {
      timestamp: now,
      metricsCount: Array.from(this.metrics.values()).reduce(
        (sum, metrics) => sum + metrics.length,
        0
      ),
    });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PerformanceMonitorConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart auto-flush if interval changed
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    if (this.config.autoFlushInterval > 0) {
      this.startAutoFlush();
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.removeAllListeners();
  }

  /**
   * Record a metric
   */
  private recordMetric(metric: Metric): void {
    const key = metric.name;
    let metrics = this.metrics.get(key);

    if (!metrics) {
      metrics = [];
      this.metrics.set(key, metrics);
    }

    metrics.push(metric);

    // Enforce maximum metrics limit
    if (metrics.length > this.config.maxMetrics) {
      metrics.splice(0, metrics.length - this.config.maxMetrics);
    }

    // Emit metric event
    this.emit('metric', metric);
  }

  /**
   * Get metric key with tags
   */
  private getMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }

    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');

    return `${name}{${tagString}}`;
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): PerformanceStats {
    return {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      averageRequestTime: 0,
      minRequestTime: 0,
      maxRequestTime: 0,
      cacheHitRate: 0,
      rateLimitExceededCount: 0,
      batchProcessingCount: 0,
      averageBatchSize: 0,
      connectionPoolSize: 0,
      activeConnections: 0,
      circuitBreakerOpenCount: 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Update statistics based on event
   */
  private updateStats(event: PerformanceEventData): void {
    if (!this.config.enableStatsCollection) {
      return;
    }

    switch (event.eventType) {
      case PerformanceEventType.REQUEST_STARTED:
        this.stats.requestCount++;
        break;

      case PerformanceEventType.REQUEST_COMPLETED:
        if (event.statusCode && event.statusCode >= 200 && event.statusCode < 400) {
          this.stats.successCount++;
        }
        if (event.duration !== undefined) {
          this.updateRequestTimeStats(event.duration);
        }
        break;

      case PerformanceEventType.REQUEST_FAILED:
        this.stats.errorCount++;
        break;

      case PerformanceEventType.CACHE_HIT:
        this.updateCacheHitRate(true);
        break;

      case PerformanceEventType.CACHE_MISS:
        this.updateCacheHitRate(false);
        break;

      case PerformanceEventType.RATE_LIMIT_EXCEEDED:
        this.stats.rateLimitExceededCount++;
        break;

      case PerformanceEventType.BATCH_PROCESSING_STARTED:
        this.stats.batchProcessingCount++;
        break;

      case PerformanceEventType.CONNECTION_ACQUIRED:
        this.stats.activeConnections++;
        break;

      case PerformanceEventType.CONNECTION_RELEASED:
        this.stats.activeConnections = Math.max(0, this.stats.activeConnections - 1);
        break;

      case PerformanceEventType.CONNECTION_CREATED:
        this.stats.connectionPoolSize++;
        break;

      case PerformanceEventType.CIRCUIT_BREAKER_OPEN:
        this.stats.circuitBreakerOpenCount++;
        break;
    }

    this.stats.timestamp = Date.now();
  }

  /**
   * Update request time statistics
   */
  private updateRequestTimeStats(duration: number): void {
    if (this.stats.minRequestTime === 0 || duration < this.stats.minRequestTime) {
      this.stats.minRequestTime = duration;
    }

    if (duration > this.stats.maxRequestTime) {
      this.stats.maxRequestTime = duration;
    }

    // Calculate running average
    const totalRequests = this.stats.successCount + this.stats.errorCount;
    this.stats.averageRequestTime =
      (this.stats.averageRequestTime * (totalRequests - 1) + duration) / totalRequests;
  }

  /**
   * Update cache hit rate
   */
  private updateCacheHitRate(isHit: boolean): void {
    // This is a simplified implementation
    // In a real implementation, you'd track total cache requests and hits
    const currentRate = this.stats.cacheHitRate;
    const smoothingFactor = 0.1; // Adjust for more/less smoothing
    this.stats.cacheHitRate =
      currentRate * (1 - smoothingFactor) + (isHit ? 1 : 0) * smoothingFactor;
  }

  /**
   * Initialize timer metric
   */
  private initializeTimer(): TimerMetric {
    return {
      count: 0,
      sum: 0,
      min: Infinity,
      max: 0,
      buckets: [
        { le: 10, count: 0 },
        { le: 50, count: 0 },
        { le: 100, count: 0 },
        { le: 250, count: 0 },
        { le: 500, count: 0 },
        { le: 1000, count: 0 },
        { le: 2500, count: 0 },
        { le: 5000, count: 0 },
        { le: 10000, count: 0 },
        { le: Infinity, count: 0 },
      ],
    };
  }

  /**
   * Start auto-flush interval
   */
  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.config.autoFlushInterval);
  }
}
