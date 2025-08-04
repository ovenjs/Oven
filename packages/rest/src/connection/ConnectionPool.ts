/**
 * Connection Pool for HTTP Client
 * 
 * This module provides a high-performance connection pool for managing HTTP connections,
 * with support for connection reuse, keep-alive, and intelligent resource management.
 */

import { EventEmitter } from '../events/EventEmitter';
import { PerformanceMonitor } from '../performance/PerformanceMonitor';

/**
 * Connection status
 */
export enum ConnectionStatus {
	/** Connection is idle and available */
	IDLE = 'idle',
	/** Connection is active and in use */
	ACTIVE = 'active',
	/** Connection is closed */
	CLOSED = 'closed',
	/** Connection is in an error state */
	ERROR = 'error',
}

/**
 * Connection metadata
 */
export interface ConnectionMetadata {
	/** Connection ID */
	id: string;
	/** Connection URL */
	url: string;
	/** Connection status */
	status: ConnectionStatus;
	/** Connection creation timestamp */
	createdAt: number;
	/** Last used timestamp */
	lastUsedAt: number;
	/** Number of times this connection has been used */
	useCount: number;
	/** Total request duration in milliseconds */
	totalRequestTime: number;
	/** Average request duration in milliseconds */
	averageRequestTime: number;
	/** Maximum request duration in milliseconds */
	maxRequestTime: number;
	/** Minimum request duration in milliseconds */
	minRequestTime: number;
	/** Connection timeout in milliseconds */
	timeout: number;
	/** Connection keep-alive timeout in milliseconds */
	keepAliveTimeout: number;
	/** Maximum number of requests per connection */
	maxRequests: number;
	/** Additional metadata */
	metadata?: Record<string, any>;
}

/**
 * Connection pool configuration
 */
export interface ConnectionPoolConfig {
	/** Maximum number of connections in the pool */
	maxConnections?: number;
	/** Minimum number of connections to keep in the pool */
	minConnections?: number;
	/** Connection timeout in milliseconds */
	connectionTimeout?: number;
	/** Keep-alive timeout in milliseconds */
	keepAliveTimeout?: number;
	/** Maximum number of requests per connection */
	maxRequestsPerConnection?: number;
	/** Maximum idle time in milliseconds */
	maxIdleTime?: number;
	/** Whether to enable connection pooling */
	enabled?: boolean;
	/** Whether to enable connection reuse */
	reuseConnections?: boolean;
	/** Whether to enable keep-alive */
	keepAlive?: boolean;
	/** Whether to enable connection health checks */
	healthChecks?: boolean;
	/** Health check interval in milliseconds */
	healthCheckInterval?: number;
	/** Additional configuration options */
	options?: Record<string, any>;
}

/**
 * Connection pool statistics
 */
export interface ConnectionPoolStats {
	/** Total number of connections in the pool */
	totalConnections: number;
	/** Number of active connections */
	activeConnections: number;
	/** Number of idle connections */
	idleConnections: number;
	/** Number of closed connections */
	closedConnections: number;
	/** Number of connections in error state */
	errorConnections: number;
	/** Total number of requests processed */
	totalRequests: number;
	/** Total request time in milliseconds */
	totalRequestTime: number;
	/** Average request time in milliseconds */
	averageRequestTime: number;
	/** Maximum request time in milliseconds */
	maxRequestTime: number;
	/** Minimum request time in milliseconds */
	minRequestTime: number;
	/** Connection pool creation timestamp */
	createdAt: number;
	/** Last statistics update timestamp */
	lastUpdatedAt: number;
}

/**
 * Connection pool event types
 */
export enum ConnectionPoolEventType {
	/** Connection created */
	CONNECTION_CREATED = 'connection.created',
	/** Connection acquired */
	CONNECTION_ACQUIRED = 'connection.acquired',
	/** Connection released */
	CONNECTION_RELEASED = 'connection.released',
	/** Connection closed */
	CONNECTION_CLOSED = 'connection.closed',
	/** Connection error */
	CONNECTION_ERROR = 'connection.error',
	/** Pool statistics updated */
	POOL_STATS_UPDATED = 'pool.statsUpdated',
	/** Pool resized */
	POOL_RESIZED = 'pool.resized',
}

/**
 * Connection Pool Event Data
 */
export interface ConnectionPoolEventData {
	/** Connection ID */
	connectionId?: string;
	/** Connection URL */
	url?: string;
	/** Connection status */
	status?: ConnectionStatus;
	/** Error message */
	error?: string;
	/** Timestamp */
	timestamp: number;
	/** Additional metadata */
	metadata?: Record<string, any>;
}

/**
 * High-performance Connection Pool for HTTP Client
 */
export class ConnectionPool extends EventEmitter {
	/** Connection pool configuration */
	private config: ConnectionPoolConfig;
	
	/** Connection pool storage */
	private connections: Map<string, ConnectionMetadata> = new Map();
	
	/** Connection queue for waiting requests */
	private connectionQueue: Array<{
		url: string;
		resolve: (connection: ConnectionMetadata) => void;
		reject: (error: Error) => void;
	}> = [];
	
	/** Connection pool statistics */
	private stats: ConnectionPoolStats;
	
	/** Health check interval */
	private healthCheckInterval: NodeJS.Timeout | null = null;
	
	/** Connection pool ID */
	private id: string;
	
	constructor(config: ConnectionPoolConfig = {}, performanceMonitor?: PerformanceMonitor) {
		super(performanceMonitor);
		
		this.id = `pool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		
		this.config = {
			maxConnections: 10,
			minConnections: 2,
			connectionTimeout: 30000,
			keepAliveTimeout: 5000,
			maxRequestsPerConnection: 100,
			maxIdleTime: 60000,
			enabled: true,
			reuseConnections: true,
			keepAlive: true,
			healthChecks: true,
			healthCheckInterval: 30000,
			...config,
		};
		
		this.stats = {
			totalConnections: 0,
			activeConnections: 0,
			idleConnections: 0,
			closedConnections: 0,
			errorConnections: 0,
			totalRequests: 0,
			totalRequestTime: 0,
			averageRequestTime: 0,
			maxRequestTime: 0,
			minRequestTime: Number.MAX_VALUE,
			createdAt: Date.now(),
			lastUpdatedAt: Date.now(),
		};
		
		// Initialize minimum connections
		this.initializeConnections();
		
		// Start health checks if enabled
		if (this.config.healthChecks) {
			this.startHealthChecks();
		}
	}
	
	/**
	 * Acquire a connection from the pool
	 * @param url Connection URL
	 */
	async acquireConnection(url: string): Promise<ConnectionMetadata> {
		if (!this.config.enabled) {
			// Create a new connection if pooling is disabled
			return this.createConnection(url);
		}
		
		// Try to find an idle connection
		let connection = this.findIdleConnection(url);
		
		if (!connection) {
			// Check if we can create a new connection
			if (this.stats.totalConnections < (this.config.maxConnections || 10)) {
				connection = await this.createConnection(url);
			} else {
				// Wait for a connection to become available
				connection = await this.waitForConnection(url);
			}
		}
		
		// Update connection status
		connection.status = ConnectionStatus.ACTIVE;
		connection.lastUsedAt = Date.now();
		connection.useCount++;
		
		// Update statistics
		this.updateStats();
		
		// Emit connection acquired event
		this.emit(ConnectionPoolEventType.CONNECTION_ACQUIRED, {
			connectionId: connection.id,
			url: connection.url,
			status: connection.status,
			timestamp: Date.now(),
		});
		
		return connection;
	}
	
	/**
	 * Release a connection back to the pool
	 * @param connection Connection to release
	 */
	releaseConnection(connection: ConnectionMetadata): void {
		if (!this.config.enabled || !this.connections.has(connection.id)) {
			return;
		}
		
		// Check if connection should be closed
		if (this.shouldCloseConnection(connection)) {
			this.closeConnection(connection.id);
			return;
		}
		
		// Update connection status
		connection.status = ConnectionStatus.IDLE;
		connection.lastUsedAt = Date.now();
		
		// Update statistics
		this.updateStats();
		
		// Process connection queue
		this.processConnectionQueue();
		
		// Emit connection released event
		this.emit(ConnectionPoolEventType.CONNECTION_RELEASED, {
			connectionId: connection.id,
			url: connection.url,
			status: connection.status,
			timestamp: Date.now(),
		});
	}
	
	/**
	 * Close a connection
	 * @param connectionId Connection ID
	 */
	closeConnection(connectionId: string): void {
		const connection = this.connections.get(connectionId);
		if (!connection) {
			return;
		}
		
		// Update connection status
		connection.status = ConnectionStatus.CLOSED;
		
		// Remove from pool
		this.connections.delete(connectionId);
		
		// Update statistics
		this.updateStats();
		
		// Emit connection closed event
		this.emit(ConnectionPoolEventType.CONNECTION_CLOSED, {
			connectionId: connection.id,
			url: connection.url,
			status: connection.status,
			timestamp: Date.now(),
		});
	}
	
	/**
	 * Get connection pool statistics
	 */
	getStats(): ConnectionPoolStats {
		return { ...this.stats };
	}
	
	/**
	 * Get all connections in the pool
	 */
	getConnections(): ConnectionMetadata[] {
		return Array.from(this.connections.values());
	}
	
	/**
	 * Get connections by status
	 * @param status Connection status
	 */
	getConnectionsByStatus(status: ConnectionStatus): ConnectionMetadata[] {
		return Array.from(this.connections.values()).filter(conn => conn.status === status);
	}
	
	/**
	 * Resize the connection pool
	 * @param newSize New pool size
	 */
	async resizePool(newSize: number): Promise<void> {
		const oldSize = this.config.maxConnections || 10;
		this.config.maxConnections = newSize;
		
		if (newSize > oldSize) {
			// Add new connections
			const connectionsToAdd = newSize - oldSize;
			for (let i = 0; i < connectionsToAdd; i++) {
				// Create connections for common URLs
				const urls = Array.from(new Set(Array.from(this.connections.values()).map(conn => conn.url)));
				if (urls.length > 0) {
					await this.createConnection(urls[0]);
				}
			}
		} else if (newSize < oldSize) {
			// Remove excess idle connections
			const idleConnections = this.getConnectionsByStatus(ConnectionStatus.IDLE);
			const connectionsToRemove = idleConnections.slice(0, oldSize - newSize);
			for (const connection of connectionsToRemove) {
				this.closeConnection(connection.id);
			}
		}
		
		// Update statistics
		this.updateStats();
		
		// Emit pool resized event
		this.emit(ConnectionPoolEventType.POOL_RESIZED, {
			timestamp: Date.now(),
			metadata: {
				oldSize,
				newSize,
			},
		});
	}
	
	/**
	 * Clear all connections in the pool
	 */
	clearPool(): void {
		for (const connection of this.connections.values()) {
			this.closeConnection(connection.id);
		}
		
		// Clear connection queue
		this.connectionQueue = [];
		
		// Update statistics
		this.updateStats();
	}
	
	/**
	 * Destroy the connection pool
	 */
	destroy(): void {
		// Stop health checks
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
			this.healthCheckInterval = null;
		}
		
		// Clear all connections
		this.clearPool();
		
		// Remove all event listeners
		this.removeAllListeners();
	}
	
	/**
	 * Create a new connection
	 * @param url Connection URL
	 */
	private async createConnection(url: string): Promise<ConnectionMetadata> {
		const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const now = Date.now();
		
		const connection: ConnectionMetadata = {
			id: connectionId,
			url,
			status: ConnectionStatus.IDLE,
			createdAt: now,
			lastUsedAt: now,
			useCount: 0,
			totalRequestTime: 0,
			averageRequestTime: 0,
			maxRequestTime: 0,
			minRequestTime: Number.MAX_VALUE,
			timeout: this.config.connectionTimeout || 30000,
			keepAliveTimeout: this.config.keepAliveTimeout || 5000,
			maxRequests: this.config.maxRequestsPerConnection || 100,
		};
		
		// Add to pool
		this.connections.set(connectionId, connection);
		
		// Update statistics
		this.updateStats();
		
		// Emit connection created event
		this.emit(ConnectionPoolEventType.CONNECTION_CREATED, {
			connectionId: connection.id,
			url: connection.url,
			status: connection.status,
			timestamp: Date.now(),
		});
		
		return connection;
	}
	
	/**
	 * Find an idle connection for a URL
	 * @param url Connection URL
	 */
	private findIdleConnection(url: string): ConnectionMetadata | undefined {
		const idleConnections = Array.from(this.connections.values())
			.filter(conn => 
				conn.status === ConnectionStatus.IDLE && 
				conn.url === url &&
				conn.useCount < (conn.maxRequests || 100)
			);
		
		if (idleConnections.length === 0) {
			return undefined;
		}
		
		// Return the least recently used connection
		return idleConnections.reduce((prev, curr) => 
			prev.lastUsedAt < curr.lastUsedAt ? prev : curr
		);
	}
	
	/**
	 * Wait for a connection to become available
	 * @param url Connection URL
	 */
	private waitForConnection(url: string): Promise<ConnectionMetadata> {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				const index = this.connectionQueue.findIndex(item => item.url === url);
				if (index !== -1) {
					this.connectionQueue.splice(index, 1);
				}
				reject(new Error(`Connection timeout for URL: ${url}`));
			}, this.config.connectionTimeout || 30000);
			
			this.connectionQueue.push({
				url,
				resolve: (connection) => {
					clearTimeout(timeout);
					resolve(connection);
				},
				reject: (error) => {
					clearTimeout(timeout);
					reject(error);
				},
			});
		});
	}
	
	/**
	 * Process the connection queue
	 */
	private processConnectionQueue(): void {
		while (this.connectionQueue.length > 0) {
			const item = this.connectionQueue[0];
			const connection = this.findIdleConnection(item.url);
			
			if (connection) {
				// Remove from queue
				this.connectionQueue.shift();
				
				// Update connection status
				connection.status = ConnectionStatus.ACTIVE;
				connection.lastUsedAt = Date.now();
				connection.useCount++;
				
				// Update statistics
				this.updateStats();
				
				// Resolve promise
				item.resolve(connection);
				
				// Emit connection acquired event
				this.emit(ConnectionPoolEventType.CONNECTION_ACQUIRED, {
					connectionId: connection.id,
					url: connection.url,
					status: connection.status,
					timestamp: Date.now(),
				});
			} else {
				// No idle connections available
				break;
			}
		}
	}
	
	/**
	 * Check if a connection should be closed
	 * @param connection Connection to check
	 */
	private shouldCloseConnection(connection: ConnectionMetadata): boolean {
		// Close if max requests reached
		if (connection.useCount >= (connection.maxRequests || 100)) {
			return true;
		}
		
		// Close if idle for too long
		const maxIdleTime = this.config.maxIdleTime || 60000;
		if (Date.now() - connection.lastUsedAt > maxIdleTime) {
			return true;
		}
		
		return false;
	}
	
	/**
	 * Initialize minimum connections
	 */
	private async initializeConnections(): Promise<void> {
		const minConnections = this.config.minConnections || 2;
		
		for (let i = 0; i < minConnections; i++) {
			// Create connections with a placeholder URL
			await this.createConnection('https://example.com');
		}
	}
	
	/**
	 * Start health checks
	 */
	private startHealthChecks(): void {
		this.healthCheckInterval = setInterval(() => {
			this.performHealthChecks();
		}, this.config.healthCheckInterval || 30000);
	}
	
	/**
	 * Perform health checks on all connections
	 */
	private performHealthChecks(): void {
		const now = Date.now();
		const maxIdleTime = this.config.maxIdleTime || 60000;
		
		for (const connection of this.connections.values()) {
			// Check if connection has been idle for too long
			if (connection.status === ConnectionStatus.IDLE && 
				now - connection.lastUsedAt > maxIdleTime) {
				this.closeConnection(connection.id);
			}
		}
		
		// Update statistics
		this.updateStats();
	}
	
	/**
	 * Update connection pool statistics
	 */
	private updateStats(): void {
		const connections = Array.from(this.connections.values());
		
		this.stats.totalConnections = connections.length;
		this.stats.activeConnections = connections.filter(conn => conn.status === ConnectionStatus.ACTIVE).length;
		this.stats.idleConnections = connections.filter(conn => conn.status === ConnectionStatus.IDLE).length;
		this.stats.closedConnections = connections.filter(conn => conn.status === ConnectionStatus.CLOSED).length;
		this.stats.errorConnections = connections.filter(conn => conn.status === ConnectionStatus.ERROR).length;
		this.stats.lastUpdatedAt = Date.now();
		
		// Emit pool stats updated event
		this.emit(ConnectionPoolEventType.POOL_STATS_UPDATED, {
			timestamp: Date.now(),
			metadata: {
				stats: this.stats,
			},
		});
	}
}