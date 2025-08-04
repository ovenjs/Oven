/**
 * Connection Pooling and HTTP Client
 *
 * This module provides a high-performance connection pooling system and HTTP client
 * with support for connection reuse, keep-alive, and intelligent resource management.
 *
 * @packageDocumentation
 *
 * ## Overview
 *
 * The connection module provides two main components:
 *
 * - **ConnectionPool**: Manages a pool of reusable HTTP connections to improve performance
 * - **HttpClient**: An HTTP client that uses the connection pool for efficient request handling
 *
 * ## Features
 *
 * - Connection pooling with configurable limits
 * - Connection reuse and keep-alive support
 * - Intelligent resource management
 * - Connection health checks
 * - Request timeout handling
 * - Performance monitoring and statistics
 * - Event-driven architecture
 *
 * ## Usage
 *
 * ```typescript
 * import { HttpClient, ConnectionPoolConfig } from '@your-package/connection';
 *
 * const connectionPoolConfig: ConnectionPoolConfig = {
 *   maxConnections: 10,
 *   minConnections: 2,
 *   connectionTimeout: 30000,
 *   keepAliveTimeout: 5000,
 * };
 *
 * const httpClient = new HttpClient({
 *   connectionPool: connectionPoolConfig,
 *   enableConnectionPool: true,
 * });
 *
 * // Make a request
 * const response = await httpClient.get('https://api.example.com/data');
 * console.log(response.status, response.body);
 * ```
 */

export {
  /**
   * High-performance connection pool for managing HTTP connections
   * @see ConnectionPool
   */
  ConnectionPool,
  /**
   * Enumeration of connection status states
   * @see ConnectionStatus
   */
  ConnectionStatus,
  /**
   * Interface representing connection metadata
   * @see ConnectionMetadata
   */
  ConnectionMetadata,
  /**
   * Configuration interface for the connection pool
   * @see ConnectionPoolConfig
   */
  ConnectionPoolConfig,
  /**
   * Statistics interface for the connection pool
   * @see ConnectionPoolStats
   */
  ConnectionPoolStats,
  /**
   * Enumeration of connection pool event types
   * @see ConnectionPoolEventType
   */
  ConnectionPoolEventType,
  /**
   * Interface for connection pool event data
   * @see ConnectionPoolEventData
   */
  ConnectionPoolEventData,
} from './ConnectionPool';

export {
  /**
   * High-performance HTTP client with connection pooling
   * @see HttpClient
   */
  HttpClient,
  /**
   * Enumeration of HTTP method types
   * @see HttpMethod
   */
  HttpMethod,
  /**
   * Interface for HTTP request options
   * @see HttpRequestOptions
   */
  HttpRequestOptions,
  /**
   * Interface for HTTP response
   * @see HttpResponse
   */
  HttpResponse,
  /**
   * Configuration interface for the HTTP client
   * @see HttpClientConfig
   */
  HttpClientConfig,
  /**
   * Statistics interface for the HTTP client
   * @see HttpClientStats
   */
  HttpClientStats,
  /**
   * Enumeration of HTTP client event types
   * @see HttpClientEventType
   */
  HttpClientEventType,
  /**
   * Interface for HTTP client event data
   * @see HttpClientEventData
   */
  HttpClientEventData,
} from './HttpClient';

export type {
  /**
   * Type alias for ConnectionMetadata interface
   * @deprecated Use ConnectionMetadata instead
   * @see ConnectionMetadata
   */
  ConnectionMetadata as IConnectionMetadata,
  /**
   * Type alias for ConnectionPoolConfig interface
   * @deprecated Use ConnectionPoolConfig instead
   * @see ConnectionPoolConfig
   */
  ConnectionPoolConfig as IConnectionPoolConfig,
  /**
   * Type alias for ConnectionPoolStats interface
   * @deprecated Use ConnectionPoolStats instead
   * @see ConnectionPoolStats
   */
  ConnectionPoolStats as IConnectionPoolStats,
  /**
   * Type alias for ConnectionPoolEventData interface
   * @deprecated Use ConnectionPoolEventData instead
   * @see ConnectionPoolEventData
   */
  ConnectionPoolEventData as IConnectionPoolEventData,
} from './ConnectionPool';

export type {
  /**
   * Type alias for HttpRequestOptions interface
   * @deprecated Use HttpRequestOptions instead
   * @see HttpRequestOptions
   */
  HttpRequestOptions as IHttpRequestOptions,
  /**
   * Type alias for HttpResponse interface
   * @deprecated Use HttpResponse instead
   * @see HttpResponse
   */
  HttpResponse as IHttpResponse,
  /**
   * Type alias for HttpClientConfig interface
   * @deprecated Use HttpClientConfig instead
   * @see HttpClientConfig
   */
  HttpClientConfig as IHttpClientConfig,
  /**
   * Type alias for HttpClientStats interface
   * @deprecated Use HttpClientStats instead
   * @see HttpClientStats
   */
  HttpClientStats as IHttpClientStats,
  /**
   * Type alias for HttpClientEventData interface
   * @deprecated Use HttpClientEventData instead
   * @see HttpClientEventData
   */
  HttpClientEventData as IHttpClientEventData,
} from './HttpClient';
