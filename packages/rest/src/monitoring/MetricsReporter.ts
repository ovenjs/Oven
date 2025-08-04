/**
 * Metrics Reporting System
 *
 * This module provides comprehensive metrics reporting capabilities for the enhanced REST client,
 * with support for various output formats and destinations.
 */

import { EventEmitter } from 'events';
import { Logger } from '../logger/Logger';
import { PerformanceMonitor, Metric, PerformanceStats } from './PerformanceMonitor';

/**
 * Report format types
 */
export enum ReportFormat {
  JSON = 'json',
  PROMETHEUS = 'prometheus',
  INFLUXDB = 'influxdb',
  CONSOLE = 'console',
}

/**
 * Report destination types
 */
export enum ReportDestination {
  CONSOLE = 'console',
  FILE = 'file',
  HTTP = 'http',
  WEBHOOK = 'webhook',
}

/**
 * Metrics report configuration
 */
export interface MetricsReporterConfig {
  enabled: boolean;
  format: ReportFormat;
  destination: ReportDestination;
  interval: number;
  endpoint?: string;
  headers?: Record<string, string>;
  filename?: string;
  includeMetadata: boolean;
  includeHistograms: boolean;
  includeTimers: boolean;
  maxMetricsPerReport: number;
}

/**
 * Metrics report data
 */
export interface MetricsReport {
  timestamp: number;
  stats: PerformanceStats;
  metrics: Metric[];
  metadata?: Record<string, any>;
}

/**
 * Metrics Reporter implementation
 */
export class MetricsReporter extends EventEmitter {
  private config: MetricsReporterConfig;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private reportInterval?: NodeJS.Timeout;

  constructor(
    config: Partial<MetricsReporterConfig> = {},
    logger: Logger,
    performanceMonitor: PerformanceMonitor
  ) {
    super();
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;

    // Set default configuration
    this.config = {
      enabled: true,
      format: ReportFormat.JSON,
      destination: ReportDestination.CONSOLE,
      interval: 60000, // 1 minute
      includeMetadata: true,
      includeHistograms: true,
      includeTimers: true,
      maxMetricsPerReport: 1000,
      ...config,
    };

    // Start reporting if enabled
    if (this.config.enabled) {
      this.startReporting();
    }
  }

  /**
   * Start periodic reporting
   */
  startReporting(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }

    this.reportInterval = setInterval(() => {
      this.generateAndSendReport();
    }, this.config.interval);

    this.logger.info('Metrics reporting started', {
      interval: this.config.interval,
      format: this.config.format,
      destination: this.config.destination,
    });
  }

  /**
   * Stop periodic reporting
   */
  stopReporting(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = undefined;
    }

    this.logger.info('Metrics reporting stopped');
  }

  /**
   * Generate and send a report immediately
   */
  async generateAndSendReport(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const report = this.generateReport();
      await this.sendReport(report);
      this.emit('reportSent', report);
    } catch (error) {
      this.logger.error('Failed to generate and send metrics report', { error });
      this.emit('reportError', error);
    }
  }

  /**
   * Generate a metrics report
   */
  generateReport(): MetricsReport {
    const stats = this.performanceMonitor.getStats();
    const metrics = this.performanceMonitor.getMetrics();

    // Limit metrics to prevent oversized reports
    const limitedMetrics = metrics.slice(-this.config.maxMetricsPerReport);

    const report: MetricsReport = {
      timestamp: Date.now(),
      stats,
      metrics: limitedMetrics,
    };

    // Add metadata if enabled
    if (this.config.includeMetadata) {
      report.metadata = {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
      };
    }

    return report;
  }

  /**
   * Send a report to the configured destination
   */
  private async sendReport(report: MetricsReport): Promise<void> {
    const formattedReport = this.formatReport(report);

    switch (this.config.destination) {
      case ReportDestination.CONSOLE:
        this.sendToConsole(formattedReport);
        break;
      case ReportDestination.FILE:
        await this.sendToFile(formattedReport);
        break;
      case ReportDestination.HTTP:
        await this.sendToHttp(formattedReport);
        break;
      case ReportDestination.WEBHOOK:
        await this.sendToWebhook(formattedReport);
        break;
      default:
        throw new Error(`Unsupported report destination: ${this.config.destination}`);
    }
  }

  /**
   * Format a report according to the configured format
   */
  private formatReport(report: MetricsReport): string {
    switch (this.config.format) {
      case ReportFormat.JSON:
        return this.formatAsJson(report);
      case ReportFormat.PROMETHEUS:
        return this.formatAsPrometheus(report);
      case ReportFormat.INFLUXDB:
        return this.formatAsInfluxDB(report);
      case ReportFormat.CONSOLE:
        return this.formatAsConsole(report);
      default:
        throw new Error(`Unsupported report format: ${this.config.format}`);
    }
  }

  /**
   * Format report as JSON
   */
  private formatAsJson(report: MetricsReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Format report as Prometheus metrics
   */
  private formatAsPrometheus(report: MetricsReport): string {
    const lines: string[] = [];

    // Add stats as Prometheus metrics
    lines.push(`# HELP discord_rest_request_count Total number of requests`);
    lines.push(`# TYPE discord_rest_request_count counter`);
    lines.push(`discord_rest_request_count ${report.stats.requestCount}`);

    lines.push(`# HELP discord_rest_success_count Total number of successful requests`);
    lines.push(`# TYPE discord_rest_success_count counter`);
    lines.push(`discord_rest_success_count ${report.stats.successCount}`);

    lines.push(`# HELP discord_rest_error_count Total number of failed requests`);
    lines.push(`# TYPE discord_rest_error_count counter`);
    lines.push(`discord_rest_error_count ${report.stats.errorCount}`);

    lines.push(
      `# HELP discord_rest_average_request_time Average request time in milliseconds`
    );
    lines.push(`# TYPE discord_rest_average_request_time gauge`);
    lines.push(`discord_rest_average_request_time ${report.stats.averageRequestTime}`);

    lines.push(
      `# HELP discord_rest_min_request_time Minimum request time in milliseconds`
    );
    lines.push(`# TYPE discord_rest_min_request_time gauge`);
    lines.push(`discord_rest_min_request_time ${report.stats.minRequestTime}`);

    lines.push(
      `# HELP discord_rest_max_request_time Maximum request time in milliseconds`
    );
    lines.push(`# TYPE discord_rest_max_request_time gauge`);
    lines.push(`discord_rest_max_request_time ${report.stats.maxRequestTime}`);

    lines.push(`# HELP discord_rest_cache_hit_rate Cache hit rate (0-1)`);
    lines.push(`# TYPE discord_rest_cache_hit_rate gauge`);
    lines.push(`discord_rest_cache_hit_rate ${report.stats.cacheHitRate}`);

    lines.push(
      `# HELP discord_rest_rate_limit_exceeded_count Total number of rate limit exceeded events`
    );
    lines.push(`# TYPE discord_rest_rate_limit_exceeded_count counter`);
    lines.push(
      `discord_rest_rate_limit_exceeded_count ${report.stats.rateLimitExceededCount}`
    );

    lines.push(
      `# HELP discord_rest_batch_processing_count Total number of batch processing events`
    );
    lines.push(`# TYPE discord_rest_batch_processing_count counter`);
    lines.push(
      `discord_rest_batch_processing_count ${report.stats.batchProcessingCount}`
    );

    lines.push(`# HELP discord_rest_connection_pool_size Connection pool size`);
    lines.push(`# TYPE discord_rest_connection_pool_size gauge`);
    lines.push(`discord_rest_connection_pool_size ${report.stats.connectionPoolSize}`);

    lines.push(`# HELP discord_rest_active_connections Number of active connections`);
    lines.push(`# TYPE discord_rest_active_connections gauge`);
    lines.push(`discord_rest_active_connections ${report.stats.activeConnections}`);

    lines.push(
      `# HELP discord_rest_circuit_breaker_open_count Total number of circuit breaker open events`
    );
    lines.push(`# TYPE discord_rest_circuit_breaker_open_count counter`);
    lines.push(
      `discord_rest_circuit_breaker_open_count ${report.stats.circuitBreakerOpenCount}`
    );

    // Add individual metrics
    for (const metric of report.metrics) {
      const name = `discord_rest_${metric.name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      const tags = metric.tags
        ? `{${Object.entries(metric.tags)
            .map(([k, v]) => `${k}="${v}"`)
            .join(',')}}`
        : '';
      lines.push(`# HELP ${name} ${name} metric`);
      lines.push(`# TYPE ${name} ${metric.type}`);
      lines.push(`${name}${tags} ${metric.value} ${metric.timestamp}`);
    }

    return lines.join('\n');
  }

  /**
   * Format report as InfluxDB line protocol
   */
  private formatAsInfluxDB(report: MetricsReport): string {
    const lines: string[] = [];

    // Add stats as InfluxDB points
    lines.push(
      `discord_rest_stats request_count=${report.stats.requestCount},success_count=${report.stats.successCount},error_count=${report.stats.errorCount},average_request_time=${report.stats.averageRequestTime},min_request_time=${report.stats.minRequestTime},max_request_time=${report.stats.maxRequestTime},cache_hit_rate=${report.stats.cacheHitRate},rate_limit_exceeded_count=${report.stats.rateLimitExceededCount},batch_processing_count=${report.stats.batchProcessingCount},connection_pool_size=${report.stats.connectionPoolSize},active_connections=${report.stats.activeConnections},circuit_breaker_open_count=${report.stats.circuitBreakerOpenCount} ${report.timestamp}000000`
    );

    // Add individual metrics
    for (const metric of report.metrics) {
      const tags = metric.tags
        ? `,${Object.entries(metric.tags)
            .map(([k, v]) => `${k}=${v.replace(/ /g, '\\ ')}`)
            .join(',')}`
        : '';
      lines.push(
        `discord_rest_${metric.name.replace(/[^a-zA-Z0-9_]/g, '_')}${tags} value=${metric.value} ${metric.timestamp}000000`
      );
    }

    return lines.join('\n');
  }

  /**
   * Format report for console output
   */
  private formatAsConsole(report: MetricsReport): string {
    const lines: string[] = [];
    lines.push('=== Discord REST Metrics Report ===');
    lines.push(`Timestamp: ${new Date(report.timestamp).toISOString()}`);
    lines.push('');

    // Add stats
    lines.push('Statistics:');
    lines.push(`  Request Count: ${report.stats.requestCount}`);
    lines.push(`  Success Count: ${report.stats.successCount}`);
    lines.push(`  Error Count: ${report.stats.errorCount}`);
    lines.push(`  Average Request Time: ${report.stats.averageRequestTime.toFixed(2)}ms`);
    lines.push(`  Min Request Time: ${report.stats.minRequestTime}ms`);
    lines.push(`  Max Request Time: ${report.stats.maxRequestTime}ms`);
    lines.push(`  Cache Hit Rate: ${(report.stats.cacheHitRate * 100).toFixed(2)}%`);
    lines.push(`  Rate Limit Exceeded Count: ${report.stats.rateLimitExceededCount}`);
    lines.push(`  Batch Processing Count: ${report.stats.batchProcessingCount}`);
    lines.push(`  Connection Pool Size: ${report.stats.connectionPoolSize}`);
    lines.push(`  Active Connections: ${report.stats.activeConnections}`);
    lines.push(`  Circuit Breaker Open Count: ${report.stats.circuitBreakerOpenCount}`);
    lines.push('');

    // Add metadata if available
    if (report.metadata) {
      lines.push('Metadata:');
      lines.push(`  Uptime: ${report.metadata.uptime.toFixed(2)}s`);
      lines.push(
        `  Memory Usage: ${Math.round(report.metadata.memoryUsage.heapUsed / 1024 / 1024)}MB/${Math.round(report.metadata.memoryUsage.heapTotal / 1024 / 1024)}MB`
      );
      lines.push(`  Platform: ${report.metadata.platform}`);
      lines.push(`  Node Version: ${report.metadata.nodeVersion}`);
      lines.push('');
    }

    // Add top metrics
    lines.push('Top Metrics:');
    const metricCounts = new Map<string, number>();
    for (const metric of report.metrics) {
      const count = metricCounts.get(metric.name) || 0;
      metricCounts.set(metric.name, count + 1);
    }

    const sortedMetrics = Array.from(metricCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    for (const [name, count] of sortedMetrics) {
      lines.push(`  ${name}: ${count} records`);
    }

    return lines.join('\n');
  }

  /**
   * Send report to console
   */
  private sendToConsole(formattedReport: string): void {
    console.log(formattedReport);
  }

  /**
   * Send report to file
   */
  private async sendToFile(formattedReport: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    if (!this.config.filename) {
      throw new Error('Filename is required for file destination');
    }

    const filePath = path.resolve(this.config.filename);
    const dir = path.dirname(filePath);

    // Ensure directory exists
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Write report to file
    await fs.appendFile(filePath, formattedReport + '\n\n');
  }

  /**
   * Send report to HTTP endpoint
   */
  private async sendToHttp(formattedReport: string): Promise<void> {
    if (!this.config.endpoint) {
      throw new Error('Endpoint is required for HTTP destination');
    }

    const headers: Record<string, string> = {
      'Content-Type': this.getContentType(),
      ...this.config.headers,
    };

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers,
      body: formattedReport,
    });

    if (!response.ok) {
      throw new Error(`HTTP request failed with status ${response.status}`);
    }
  }

  /**
   * Send report to webhook
   */
  private async sendToWebhook(formattedReport: string): Promise<void> {
    if (!this.config.endpoint) {
      throw new Error('Endpoint is required for webhook destination');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };

    // For webhooks, wrap the report in a JSON payload
    const payload = {
      text: 'Discord REST Metrics Report',
      attachments: [
        {
          text: formattedReport,
          color: '#36a64f',
        },
      ],
    };

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed with status ${response.status}`);
    }
  }

  /**
   * Get content type based on format
   */
  private getContentType(): string {
    switch (this.config.format) {
      case ReportFormat.JSON:
        return 'application/json';
      case ReportFormat.PROMETHEUS:
        return 'text/plain; version=0.0.4';
      case ReportFormat.INFLUXDB:
        return 'text/plain';
      case ReportFormat.CONSOLE:
        return 'text/plain';
      default:
        return 'text/plain';
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MetricsReporterConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart reporting if interval changed
    if (this.config.enabled) {
      this.startReporting();
    } else {
      this.stopReporting();
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopReporting();
    this.removeAllListeners();
  }
}
