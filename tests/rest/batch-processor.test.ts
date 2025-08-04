/**
 * Batch Processor Tests
 * 
 * This file contains comprehensive tests for the BatchProcessor module
 * implemented in the enhanced REST package.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BatchProcessor, BatchItemPriority, BatchItemStatus } from '../../../packages/rest/src/batch';

describe('BatchProcessor', () => {
	let batchProcessor: BatchProcessor;
	let mockProcessFn: vi.Mock;

	beforeEach(() => {
		mockProcessFn = vi.fn().mockResolvedValue({ success: true });
		batchProcessor = new BatchProcessor(
			{
				batchSize: 3,
				waitTime: 100,
				maxConcurrentBatches: 2,
				itemTimeout: 1000,
			},
			mockProcessFn
		);
	});

	describe('constructor', () => {
		it('should create a BatchProcessor with default config', () => {
			const processor = new BatchProcessor({}, mockProcessFn);
			expect(processor).toBeInstanceOf(BatchProcessor);
		});

		it('should create a BatchProcessor with custom config', () => {
			const config = {
				batchSize: 5,
				waitTime: 200,
				maxConcurrentBatches: 3,
				itemTimeout: 2000,
			};
			const processor = new BatchProcessor(config, mockProcessFn);
			expect(processor).toBeInstanceOf(BatchProcessor);
		});
	});

	describe('addItem', () => {
		it('should add an item to the queue', async () => {
			const item = { id: '1', data: 'test' };
			const promise = batchProcessor.addItem(item, BatchItemPriority.NORMAL);
			
			// Check that the promise is pending
			let resolved = false;
			promise.then(() => { resolved = true; });
			
			// Wait a bit to see if it resolves
			await new Promise(resolve => setTimeout(resolve, 10));
			expect(resolved).toBe(false);
		});

		it('should add items with different priorities', async () => {
			const item1 = { id: '1', data: 'low' };
			const item2 = { id: '2', data: 'high' };
			
			batchProcessor.addItem(item1, BatchItemPriority.LOW);
			batchProcessor.addItem(item2, BatchItemPriority.HIGH);
			
			// The queue should be ordered by priority
			const stats = batchProcessor.getStats();
			expect(stats.queuedItems).toBe(2);
		});

		it('should reject items when queue is full', async () => {
			// Create a processor with a small queue
			const processor = new BatchProcessor(
				{
					batchSize: 1,
					waitTime: 100,
					maxConcurrentBatches: 1,
					itemTimeout: 1000,
					maxQueueSize: 1,
				},
				mockProcessFn
			);
			
			// Add first item
			await processor.addItem({ id: '1', data: 'test' }, BatchItemPriority.NORMAL);
			
			// Try to add second item - should be rejected
			await expect(processor.addItem({ id: '2', data: 'test' }, BatchItemPriority.NORMAL))
				.rejects.toThrow('Queue is full');
		});
	});

	describe('processBatch', () => {
		it('should process a batch of items', async () => {
			const items = [
				{ id: '1', data: 'test1' },
				{ id: '2', data: 'test2' },
				{ id: '3', data: 'test3' },
			];
			
			// Add items to the queue
			const promises = items.map(item => 
				batchProcessor.addItem(item, BatchItemPriority.NORMAL)
			);
			
			// Wait for processing to complete
			const results = await Promise.all(promises);
			
			// Verify all items were processed
			expect(results).toHaveLength(3);
			expect(results.every(result => result.success)).toBe(true);
			
			// Verify the process function was called once with all items
			expect(mockProcessFn).toHaveBeenCalledTimes(1);
			expect(mockProcessFn).toHaveBeenCalledWith(items);
		});

		it('should handle processing errors', async () => {
			// Make the process function fail
			mockProcessFn.mockRejectedValue(new Error('Processing failed'));
			
			const items = [
				{ id: '1', data: 'test1' },
				{ id: '2', data: 'test2' },
			];
			
			const promises = items.map(item => 
				batchProcessor.addItem(item, BatchItemPriority.NORMAL)
			);
			
			// Wait for processing to complete
			const results = await Promise.allSettled(promises);
			
			// Verify all items were rejected
			expect(results).toHaveLength(2);
			expect(results.every(result => result.status === 'rejected')).toBe(true);
		});

		it('should retry failed items if configured', async () => {
			// Make the process function fail first time, succeed second time
			mockProcessFn
				.mockRejectedValueOnce(new Error('Processing failed'))
				.mockResolvedValue({ success: true });
			
			const processor = new BatchProcessor(
				{
					batchSize: 1,
					waitTime: 10,
					maxConcurrentBatches: 1,
					itemTimeout: 1000,
					retryAttempts: 1,
				},
				mockProcessFn
			);
			
			const item = { id: '1', data: 'test' };
			const result = await processor.addItem(item, BatchItemPriority.NORMAL);
			
			// Verify the item was eventually processed successfully
			expect(result.success).toBe(true);
			
			// Verify the process function was called twice (original + retry)
			expect(mockProcessFn).toHaveBeenCalledTimes(2);
		});
	});

	describe('getStats', () => {
		it('should return correct statistics', () => {
			const stats = batchProcessor.getStats();
			
			expect(stats).toHaveProperty('queuedItems');
			expect(stats).toHaveProperty('processingItems');
			expect(stats).toHaveProperty('completedItems');
			expect(stats).toHaveProperty('failedItems');
			expect(stats).toHaveProperty('totalBatches');
			expect(stats).toHaveProperty('averageProcessingTime');
			expect(stats).toHaveProperty('lastProcessedAt');
			
			// Initial state
			expect(stats.queuedItems).toBe(0);
			expect(stats.processingItems).toBe(0);
			expect(stats.completedItems).toBe(0);
			expect(stats.failedItems).toBe(0);
			expect(stats.totalBatches).toBe(0);
		});
	});

	describe('clear', () => {
		it('should clear all items from the queue', async () => {
			// Add some items
			batchProcessor.addItem({ id: '1', data: 'test1' }, BatchItemPriority.NORMAL);
			batchProcessor.addItem({ id: '2', data: 'test2' }, BatchItemPriority.NORMAL);
			
			// Verify items are queued
			let stats = batchProcessor.getStats();
			expect(stats.queuedItems).toBe(2);
			
			// Clear the queue
			batchProcessor.clear();
			
			// Verify queue is empty
			stats = batchProcessor.getStats();
			expect(stats.queuedItems).toBe(0);
		});
	});

	describe('events', () => {
		it('should emit batch events', async () => {
			const batchStartSpy = vi.fn();
			const batchCompleteSpy = vi.fn();
			const batchErrorSpy = vi.fn();
			
			batchProcessor.on('batchStart', batchStartSpy);
			batchProcessor.on('batchComplete', batchCompleteSpy);
			batchProcessor.on('batchError', batchErrorSpy);
			
			// Add items to trigger batch processing
			const items = [
				{ id: '1', data: 'test1' },
				{ id: '2', data: 'test2' },
				{ id: '3', data: 'test3' },
			];
			
			const promises = items.map(item => 
				batchProcessor.addItem(item, BatchItemPriority.NORMAL)
			);
			
			// Wait for processing to complete
			await Promise.all(promises);
			
			// Verify events were emitted
			expect(batchStartSpy).toHaveBeenCalled();
			expect(batchCompleteSpy).toHaveBeenCalled();
			expect(batchErrorSpy).not.toHaveBeenCalled();
		});

		it('should emit error events when processing fails', async () => {
			const batchErrorSpy = vi.fn();
			
			batchProcessor.on('batchError', batchErrorSpy);
			
			// Make the process function fail
			mockProcessFn.mockRejectedValue(new Error('Processing failed'));
			
			// Add items to trigger batch processing
			const items = [
				{ id: '1', data: 'test1' },
				{ id: '2', data: 'test2' },
			];
			
			const promises = items.map(item => 
				batchProcessor.addItem(item, BatchItemPriority.NORMAL)
			);
			
			// Wait for processing to complete
			await Promise.allSettled(promises);
			
			// Verify error event was emitted
			expect(batchErrorSpy).toHaveBeenCalled();
		});
	});
});