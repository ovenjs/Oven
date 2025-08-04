/**
 * Performance Monitoring and Metrics Collection System
 *
 * This module provides comprehensive performance monitoring and metrics collection for the enhanced REST client,
 * with support for request timing, resource usage tracking, and performance analytics.
 *
 * @packageDocumentation
 *
 * ## Overview
 *
 * The monitoring module provides two main components:
 *
 * - **PerformanceMonitor**: A comprehensive performance monitoring system for tracking request timing, resource usage, and performance analytics
 * - **MetricsReporter**: A metrics reporting system for sending metrics to various destinations in different formats
 *
 * ## Features
 *
 * - Request timing and performance tracking
 * - Counter, gauge, histogram, and timer metrics
 * - Performance event recording
 * - Statistics collection and analysis
 * - Metrics reporting in multiple formats (JSON, Prometheus, InfluxDB, Console)
 * - Multiple report destinations (Console, File, HTTP, Webhook)
 * - Configurable sampling rates and retention periods
 * - Automatic metric flushing and cleanup
 *
 * ## Usage
 *
 * ```typescript
 * import { PerformanceMonitor, MetricsReporter, ReportFormat, ReportDestination } from '@your-package/monitoring';
 * import { Logger } from '@your-package/logger';
 *
 * // Create a logger
 * const logger = new Logger();
 *
 * // Create a performance monitor
 * const performanceMonitor = new PerformanceMonitor({
 *   enabled: true,
 *   sampleRate: 1.0,
 *   enableDetailedMetrics: true,
 * }, logger);
 *
 * // Create a metrics reporter
 * const metricsReporter = new MetricsReporter({
 *   enabled: true,
 *   format: ReportFormat.JSON,
 *   destination: ReportDestination.CONSOLE,
 *   interval: 60000, // 1 minute
 * }, logger, performanceMonitor);
 *
 * // Record a performance event
 * performanceMonitor.recordEvent({
 *   eventType: 'requestStarted',
 *   requestId: 'req-123',
 *   url: 'https://api.example.com/data',
 *   method: 'GET',
 * });
 *
 * // Start timing a request
 * const endTiming = performanceMonitor.startTiming('req-123', 'https://api.example.com/data', 'GET');
 *
 * // End timing and record the duration
 * endTiming();
 *
 * // Record a counter metric
 * performanceMonitor.incrementCounter('api.requests', 1, { endpoint: '/data' });
 *
 * // Generate and send a report immediately
 * await metricsReporter.generateAndSendReport();
 * ```
 */

export {
  /**
   * Performance monitoring system for tracking request timing and performance analytics
   * @see PerformanceMonitor
   */
  PerformanceMonitor,
} from './PerformanceMonitor';

export {
  /**
   * Metrics reporting system for sending metrics to various destinations
   * @see MetricsReporter
   */
  MetricsReporter,
} from './MetricsReporter';

export type {
  /**
   * Enumeration of metric types for categorizing performance data
   * @see MetricType
   */
  MetricType,
  /**
   * Enumeration of performance event types
   * @see PerformanceEventType
   */
  PerformanceEventType,
  /**
   * Interface for performance event data
   * @see PerformanceEventData
   */
  PerformanceEventData,
  /**
   * Interface for metric data structure
   * @see Metric
   */
  Metric,
  /**
   * Interface for performance statistics
   * @see PerformanceStats
   */
  PerformanceStats,
  /**
   * Interface for performance monitor configuration
   * @see PerformanceMonitorConfig
   */
  PerformanceMonitorConfig,
  /**
   * Interface for histogram bucket configuration
   * @see HistogramBucket
   */
  HistogramBucket,
  /**
   * Interface for timer metric data
   * @see TimerMetric
   */
  TimerMetric,
} from './PerformanceMonitor';

export type {
  /**
   * Enumeration of report format types
   * @see ReportFormat
   */
  ReportFormat,
  /**
   * Enumeration of report destination types
   * @see ReportDestination
   */
  ReportDestination,
  /**
   * Interface for metrics report configuration
   * @see MetricsReporterConfig
   */
  MetricsReporterConfig,
  /**
   * Interface for metrics report data
   * @see MetricsReport
   */
  MetricsReport,
} from './MetricsReporter';
