/**
 * Performance Monitoring and Metrics Collection System
 *
 * This module provides comprehensive performance monitoring and metrics collection for the enhanced REST client,
 * with support for request timing, resource usage tracking, and performance analytics.
 */

export { PerformanceMonitor } from './PerformanceMonitor';

export type {
	MetricType,
	PerformanceEventType,
	PerformanceEventData,
	Metric,
	PerformanceStats,
	PerformanceMonitorConfig,
	HistogramBucket,
	TimerMetric,
} from './PerformanceMonitor';