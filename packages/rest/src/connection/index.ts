/**
 * Connection Pooling and HTTP Client
 * 
 * This module provides a high-performance connection pooling system and HTTP client
 * with support for connection reuse, keep-alive, and intelligent resource management.
 */

export { 
	ConnectionPool,
	ConnectionStatus,
	ConnectionMetadata,
	ConnectionPoolConfig,
	ConnectionPoolStats,
	ConnectionPoolEventType,
	ConnectionPoolEventData,
} from './ConnectionPool';

export { 
	HttpClient,
	HttpMethod,
	HttpRequestOptions,
	HttpResponse,
	HttpClientConfig,
	HttpClientStats,
	HttpClientEventType,
	HttpClientEventData,
} from './HttpClient';

export type {
	ConnectionMetadata as IConnectionMetadata,
	ConnectionPoolConfig as IConnectionPoolConfig,
	ConnectionPoolStats as IConnectionPoolStats,
	ConnectionPoolEventData as IConnectionPoolEventData,
} from './ConnectionPool';

export type {
	HttpRequestOptions as IHttpRequestOptions,
	HttpResponse as IHttpResponse,
	HttpClientConfig as IHttpClientConfig,
	HttpClientStats as IHttpClientStats,
	HttpClientEventData as IHttpClientEventData,
} from './HttpClient';