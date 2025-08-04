/**
 * Request Batching and Queuing System
 * 
 * This module provides a high-performance request batching and queuing system for the enhanced REST client,
 * with support for intelligent batching, priority queuing, and efficient resource management.
 */

import { EventEmitter } from '../events/EventEmitter';
import { PerformanceMonitor } from '../performance/PerformanceMonitor';

/**
 * Batch item status
 */
export enum BatchItemStatus {
	/** Item is queued */
	QUEUED = 'queued',
	/** Item is processing */
	PROCESSING = 'processing',
	/** Item is completed */
	COMPLETED = 'completed',
	/** Item is failed */
	FAILED = 'failed',
	/** Item is cancelled */
	CANCELLED = 'cancelled',
}

/**
 * Batch item priority
 */
export enum BatchItemPriority {
	/** Low priority */
	LOW = 0,
	/** Normal priority */
	NORMAL = 1,
	/** High priority */
	HIGH = 2,
	/** Critical priority */
	CRITICAL = 3,
}

/**
 * Batch item metadata
 */
export interface BatchItemMetadata {
	/** Item ID */
	id: string;
	/** Item status */
	status: BatchItemStatus;
	/** Item priority */
	priority: BatchItemPriority;
	/** Item creation timestamp */
	createdAt: number;
	/** Item processing start timestamp */
	processingStartedAt?: number;
	/** Item completion timestamp */
	completedAt?: number;
	/** Item retry count */
	retryCount: number;
	/** Maximum number of retries */
	maxRetries: number;
	/** Item timeout in milliseconds */
	timeout: number;
	/** Additional metadata */
	metadata?: Record<string, any>;
}

/**
 * Batch item
 */
export interface BatchItem<T = any, R = any> {
	/** Item data */
	data: T;
	/** Item process function */
	processFn: (data: T) => Promise<R>;
	/** Item metadata */
	metadata: BatchItemMetadata;
}

/**
 * Batch configuration
 */
export interface BatchConfig {
	/** Maximum batch size */
	maxBatchSize?: number;
	/** Maximum batch wait time in milliseconds */
	maxBatchWaitTime?: number;
	/** Maximum concurrent batches */
	maxConcurrentBatches?: number;
	/** Maximum queue size */
	maxQueueSize?: number;
	/** Default item priority */
	defaultPriority?: BatchItemPriority;
	/** Default item timeout in milliseconds */
	defaultTimeout?: number;
	/** Default maximum number of retries */
	defaultMaxRetries?: number;
	/** Whether to enable batching */
	enabled?: boolean;
	/** Whether to enable priority queuing */
	priorityQueuing?: boolean;
	/** Whether to enable automatic retry */
	automaticRetry?: boolean;
	/** Retry delay in milliseconds */
	retryDelay?: number;
	/** Retry backoff factor */
	retryBackoffFactor?: number;
	/** Additional configuration options */
	options?: Record<string, any>;
}

/**
 * Batch statistics
 */
export interface BatchStats {
	/** Total number of items processed */
	totalItems: number;
	/** Number of queued items */
	queuedItems: number;
	/** Number of processing items */
	processingItems: number;
	/** Number of completed items */
	completedItems: number;
	/** Number of failed items */
	failedItems: number;
	/** Number of cancelled items */
	cancelledItems: number;
	/** Total number of batches processed */
	totalBatches: number;
	/** Average batch size */
	averageBatchSize: number;
	/** Total processing time in milliseconds */
	totalProcessingTime: number;
	/** Average processing time per item in milliseconds */
	averageProcessingTime: number;
	/** Total queue time in milliseconds */
	totalQueueTime: number;
	/** Average queue time per item in milliseconds */
	averageQueueTime: number;
	/** Batch processor creation timestamp */
	createdAt: number;
	/** Last statistics update timestamp */
	lastUpdatedAt: number;
}

/**
 * Batch event types
 */
export enum BatchEventType {
	/** Item added to queue */
	ITEM_ADDED = 'item.added',
	/** Item started processing */
	ITEM_STARTED = 'item.started',
	/** Item completed */
	ITEM_COMPLETED = 'item.completed',
	/** Item failed */
	ITEM_FAILED = 'item.failed',
	/** Item cancelled */
	ITEM_CANCELLED = 'item.cancelled',
	/** Item retried */
	ITEM_RETRIED = 'item.retried',
	/** Batch started */
	BATCH_STARTED = 'batch.started',
	/** Batch completed */
	BATCH_COMPLETED = 'batch.completed',
	/** Batch failed */
	BATCH_FAILED = 'batch.failed',
	/** Queue cleared */
	QUEUE_CLEARED = 'queue.cleared',
	/** Batch processor statistics updated */
	PROCESSOR_STATS_UPDATED = 'processor.statsUpdated',
}

/**
 * Batch Event Data
 */
export interface BatchEventData {
	/** Item ID */
	itemId?: string;
	/** Batch ID */
	batchId?: string;
	/** Item status */
	status?: BatchItemStatus;
	/** Item priority */
	priority?: BatchItemPriority;
	/** Error message */
	error?: string;
	/** Retry count */
	retryCount?: number;
	/** Batch size */
	batchSize?: number;
	/** Processing time in milliseconds */
	processingTime?: number;
	/** Queue time in milliseconds */
	queueTime?: number;
	/** Timestamp */
	timestamp: number;
	/** Additional metadata */
	metadata?: Record<string, any>;
}

/**
 * High-performance Batch Processor for Requests
 */
export class BatchProcessor<T = any, R = any> extends EventEmitter {
	/** Batch processor configuration */
	private config: BatchConfig;
	
	/** Item queue */
	private queue: BatchItem<T, R>[] = [];
	
	/** Active batches */
	private activeBatches: Map<string, {
		items: BatchItem<T, R>[];
		startTime: number;
		promise: Promise<R[]>;
	}> = new Map();
	
	/** Batch processor statistics */
	private stats: BatchStats;
	
	/** Batch processor ID */
	private id: string;
	
	/** Batch ID counter */
	private batchIdCounter = 0;
	
	/** Item ID counter */
	private itemIdCounter = 0;
	
	/** Processing flag */
	private isProcessing = false;
	
	/** Batch timeout */
	private batchTimeout: NodeJS.Timeout | null = null;
	
	constructor(config: BatchConfig = {}, performanceMonitor?: PerformanceMonitor) {
		super(performanceMonitor);
		
		this.id = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		
		this.config = {
			maxBatchSize: 10,
			maxBatchWaitTime: 100,
			maxConcurrentBatches: 3,
			maxQueueSize: 1000,
			defaultPriority: BatchItemPriority.NORMAL,
			defaultTimeout: 30000,
			defaultMaxRetries: 3,
			enabled: true,
			priorityQueuing: true,
			automaticRetry: true,
			retryDelay: 1000,
			retryBackoffFactor: 2,
			...config,
		};
		
		this.stats = {
			totalItems: 0,
			queuedItems: 0,
			processingItems: 0,
			completedItems: 0,
			failedItems: 0,
			cancelledItems: 0,
			totalBatches: 0,
			averageBatchSize: 0,
			totalProcessingTime: 0,
			averageProcessingTime: 0,
			totalQueueTime: 0,
			averageQueueTime: 0,
			createdAt: Date.now(),
			lastUpdatedAt: Date.now(),
		};
	}
	
	/**
	 * Add an item to the batch queue
	 * @param data Item data
	 * @param processFn Process function
	 * @param options Item options
	 */
	add(data: T, processFn: (data: T) => Promise<R>, options: {
		priority?: BatchItemPriority;
		timeout?: number;
		maxRetries?: number;
		metadata?: Record<string, any>;
	} = {}): Promise<R> {
		return new Promise((resolve, reject) => {
			// Check if queue is full
			if (this.queue.length >= (this.config.maxQueueSize || 1000)) {
				reject(new Error('Batch queue is full'));
				return;
			}
			
			const itemId = this.generateItemId();
			const now = Date.now();
			
			// Create batch item
			const item: BatchItem<T, R> = {
				data,
				processFn: async (itemData) => {
					try {
						const result = await processFn(itemData);
						resolve(result);
						return result;
					} catch (error) {
						reject(error);
						throw error;
					}
				},
				metadata: {
					id: itemId,
					status: BatchItemStatus.QUEUED,
					priority: options.priority || this.config.defaultPriority || BatchItemPriority.NORMAL,
					createdAt: now,
					retryCount: 0,
					maxRetries: options.maxRetries || this.config.defaultMaxRetries || 3,
					timeout: options.timeout || this.config.defaultTimeout || 30000,
					metadata: options.metadata,
				},
			};
			
			// Add to queue
			this.queue.push(item);
			
			// Sort queue by priority if enabled
			if (this.config.priorityQueuing) {
				this.sortQueueByPriority();
			}
			
			// Update statistics
			this.stats.totalItems++;
			this.stats.queuedItems++;
			this.updateStats();
			
			// Emit item added event
			this.emit(BatchEventType.ITEM_ADDED, {
				itemId,
				priority: item.metadata.priority,
				timestamp: Date.now(),
			});
			
			// Start processing if not already processing
			if (!this.isProcessing) {
				this.startProcessing();
			}
			
			// Set batch timeout if not already set
			if (!this.batchTimeout) {
				this.batchTimeout = setTimeout(() => {
					this.processBatch();
				}, this.config.maxBatchWaitTime || 100);
			}
		});
	}
	
	/**
	 * Cancel an item in the queue
	 * @param itemId Item ID
	 */
	cancel(itemId: string): boolean {
		// Check if item is in queue
		const queueIndex = this.queue.findIndex(item => item.metadata.id === itemId);
		if (queueIndex !== -1) {
			const item = this.queue[queueIndex];
			item.metadata.status = BatchItemStatus.CANCELLED;
			this.queue.splice(queueIndex, 1);
			
			// Update statistics
			this.stats.queuedItems--;
			this.stats.cancelledItems++;
			this.updateStats();
			
			// Emit item cancelled event
			this.emit(BatchEventType.ITEM_CANCELLED, {
				itemId,
				status: item.metadata.status,
				timestamp: Date.now(),
			});
			
			return true;
		}
		
		// Check if item is in active batches
		for (const [batchId, batch] of this.activeBatches) {
			const itemIndex = batch.items.findIndex(item => item.metadata.id === itemId);
			if (itemIndex !== -1) {
				const item = batch.items[itemIndex];
				item.metadata.status = BatchItemStatus.CANCELLED;
				batch.items.splice(itemIndex, 1);
				
				// Update statistics
				this.stats.processingItems--;
				this.stats.cancelledItems++;
				this.updateStats();
				
				// Emit item cancelled event
				this.emit(BatchEventType.ITEM_CANCELLED, {
					itemId,
					batchId,
					status: item.metadata.status,
					timestamp: Date.now(),
				});
				
				return true;
			}
		}
		
		return false;
	}
	
	/**
	 * Clear the queue
	 */
	clearQueue(): void {
		// Cancel all queued items
		for (const item of this.queue) {
			item.metadata.status = BatchItemStatus.CANCELLED;
			
			// Emit item cancelled event
			this.emit(BatchEventType.ITEM_CANCELLED, {
				itemId: item.metadata.id,
				status: item.metadata.status,
				timestamp: Date.now(),
			});
		}
		
		// Clear queue
		this.queue = [];
		
		// Update statistics
		this.stats.queuedItems = 0;
		this.updateStats();
		
		// Emit queue cleared event
		this.emit(BatchEventType.QUEUE_CLEARED, {
			timestamp: Date.now(),
		});
	}
	
	/**
	 * Get batch processor statistics
	 */
	getStats(): BatchStats {
		return { ...this.stats };
	}
	
	/**
	 * Get the queue
	 */
	getQueue(): BatchItem<T, R>[] {
		return [...this.queue];
	}
	
	/**
	 * Get active batches
	 */
	getActiveBatches(): Array<{
		batchId: string;
		items: BatchItem<T, R>[];
		startTime: number;
	}> {
		return Array.from(this.activeBatches.entries()).map(([batchId, batch]) => ({
			batchId,
			items: batch.items,
			startTime: batch.startTime,
		}));
	}
	
	/**
	 * Get the number of items in the queue
	 */
	getQueueSize(): number {
		return this.queue.length;
	}
	
	/**
	 * Get the number of active batches
	 */
	getActiveBatchCount(): number {
		return this.activeBatches.size;
	}
	
	/**
	 * Destroy the batch processor
	 */
	destroy(): void {
		// Clear queue
		this.clearQueue();
		
		// Clear batch timeout
		if (this.batchTimeout) {
			clearTimeout(this.batchTimeout);
			this.batchTimeout = null;
		}
		
		// Remove all event listeners
		this.removeAllListeners();
	}
	
	/**
	 * Start processing the queue
	 */
	private startProcessing(): void {
		if (this.isProcessing) {
			return;
		}
		
		this.isProcessing = true;
		this.processQueue();
	}
	
	/**
	 * Process the queue
	 */
	private async processQueue(): Promise<void> {
		while (
			this.isProcessing &&
			this.queue.length > 0 &&
			this.activeBatches.size < (this.config.maxConcurrentBatches || 3)
		) {
			// Process batch if conditions are met
			if (
				this.queue.length >= (this.config.maxBatchSize || 10) ||
				(this.batchTimeout && this.queue.length > 0)
			) {
				await this.processBatch();
			} else {
				// Wait for more items or timeout
				break;
			}
		}
		
		// Stop processing if queue is empty or no more active batches can be created
		if (this.queue.length === 0 || this.activeBatches.size >= (this.config.maxConcurrentBatches || 3)) {
			this.isProcessing = false;
		}
	}
	
	/**
	 * Process a batch of items
	 */
	private async processBatch(): Promise<void> {
		// Clear batch timeout
		if (this.batchTimeout) {
			clearTimeout(this.batchTimeout);
			this.batchTimeout = null;
		}
		
		// Get batch items
		const batchSize = Math.min(this.queue.length, this.config.maxBatchSize || 10);
		const items = this.queue.splice(0, batchSize);
		
		// Update item status
		const now = Date.now();
		for (const item of items) {
			item.metadata.status = BatchItemStatus.PROCESSING;
			item.metadata.processingStartedAt = now;
		}
		
		// Update statistics
		this.stats.queuedItems -= items.length;
		this.stats.processingItems += items.length;
		this.stats.totalBatches++;
		this.updateStats();
		
		// Create batch
		const batchId = this.generateBatchId();
		const batchPromise = this.executeBatch(items);
		
		// Add to active batches
		this.activeBatches.set(batchId, {
			items,
			startTime: now,
			promise: batchPromise,
		});
		
		// Emit batch started event
		this.emit(BatchEventType.BATCH_STARTED, {
			batchId,
			batchSize: items.length,
			timestamp: Date.now(),
		});
		
		try {
			// Wait for batch to complete
			await batchPromise;
			
			// Remove from active batches
			this.activeBatches.delete(batchId);
			
			// Emit batch completed event
			this.emit(BatchEventType.BATCH_COMPLETED, {
				batchId,
				batchSize: items.length,
				processingTime: Date.now() - now,
				timestamp: Date.now(),
			});
		} catch (error) {
			// Remove from active batches
			this.activeBatches.delete(batchId);
			
			// Emit batch failed event
			this.emit(BatchEventType.BATCH_FAILED, {
				batchId,
				batchSize: items.length,
				error: error instanceof Error ? error.message : String(error),
				processingTime: Date.now() - now,
				timestamp: Date.now(),
			});
		}
		
		// Continue processing queue
		this.processQueue();
	}
	
	/**
	 * Execute a batch of items
	 * @param items Batch items
	 */
	private async executeBatch(items: BatchItem<T, R>[]): Promise<R[]> {
		const results: R[] = [];
		
		for (const item of items) {
			try {
				// Calculate queue time
				const queueTime = (item.metadata.processingStartedAt || 0) - item.metadata.createdAt;
				
				// Process item
				const startTime = this.performanceMonitor.now();
				const result = await this.processItemWithTimeout(item);
				const processingTime = this.performanceMonitor.now() - startTime;
				
				// Update item metadata
				item.metadata.status = BatchItemStatus.COMPLETED;
				item.metadata.completedAt = Date.now();
				
				// Update statistics
				this.stats.processingItems--;
				this.stats.completedItems++;
				this.stats.totalProcessingTime += processingTime;
				this.stats.averageProcessingTime = this.stats.totalProcessingTime / this.stats.completedItems;
				this.stats.totalQueueTime += queueTime;
				this.stats.averageQueueTime = this.stats.totalQueueTime / this.stats.completedItems;
				this.updateStats();
				
				// Emit item completed event
				this.emit(BatchEventType.ITEM_COMPLETED, {
					itemId: item.metadata.id,
					status: item.metadata.status,
					priority: item.metadata.priority,
					processingTime,
					queueTime,
					timestamp: Date.now(),
				});
				
				results.push(result);
			} catch (error) {
				// Update item metadata
				item.metadata.retryCount++;
				
				// Check if item should be retried
				if (
					this.config.automaticRetry &&
					item.metadata.retryCount <= item.metadata.maxRetries
				) {
					// Re-queue item for retry
					item.metadata.status = BatchItemStatus.QUEUED;
					this.queue.unshift(item);
					
					// Update statistics
					this.stats.processingItems--;
					this.stats.queuedItems++;
					this.updateStats();
					
					// Emit item retried event
					this.emit(BatchEventType.ITEM_RETRIED, {
						itemId: item.metadata.id,
						status: item.metadata.status,
						priority: item.metadata.priority,
						retryCount: item.metadata.retryCount,
						timestamp: Date.now(),
					});
				} else {
					// Mark item as failed
					item.metadata.status = BatchItemStatus.FAILED;
					item.metadata.completedAt = Date.now();
					
					// Update statistics
					this.stats.processingItems--;
					this.stats.failedItems++;
					this.updateStats();
					
					// Emit item failed event
					this.emit(BatchEventType.ITEM_FAILED, {
						itemId: item.metadata.id,
						status: item.metadata.status,
						priority: item.metadata.priority,
						error: error instanceof Error ? error.message : String(error),
						retryCount: item.metadata.retryCount,
						timestamp: Date.now(),
					});
				}
				
				// Re-throw error
				throw error;
			}
		}
		
		// Update average batch size
		this.stats.averageBatchSize = (this.stats.averageBatchSize * (this.stats.totalBatches - 1) + items.length) / this.stats.totalBatches;
		
		return results;
	}
	
	/**
	 * Process an item with timeout
	 * @param item Batch item
	 */
	private async processItemWithTimeout(item: BatchItem<T, R>): Promise<R> {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error(`Item processing timeout: ${item.metadata.id}`));
			}, item.metadata.timeout);
			
			item.processFn(item.data)
				.then((result) => {
					clearTimeout(timeout);
					resolve(result);
				})
				.catch((error) => {
					clearTimeout(timeout);
					reject(error);
				});
		});
	}
	
	/**
	 * Sort the queue by priority
	 */
	private sortQueueByPriority(): void {
		this.queue.sort((a, b) => b.metadata.priority - a.metadata.priority);
	}
	
	/**
	 * Generate a unique batch ID
	 */
	private generateBatchId(): string {
		return `batch-${++this.batchIdCounter}-${Date.now()}`;
	}
	
	/**
	 * Generate a unique item ID
	 */
	private generateItemId(): string {
		return `item-${++this.itemIdCounter}-${Date.now()}`;
	}
	
	/**
	 * Update batch processor statistics
	 */
	private updateStats(): void {
		this.stats.lastUpdatedAt = Date.now();
		
		// Emit processor stats updated event
		this.emit(BatchEventType.PROCESSOR_STATS_UPDATED, {
			timestamp: Date.now(),
			metadata: {
				stats: this.stats,
			},
		});
	}
}