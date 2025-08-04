/**
 * Request Batching and Queuing System
 *
 * This module provides a high-performance request batching and queuing system for the enhanced REST client,
 * with support for intelligent batching, priority queuing, and efficient resource management.
 */

export {
  BatchProcessor,
  BatchItemStatus,
  BatchItemPriority,
  BatchItem,
  BatchItemMetadata,
  BatchConfig,
  BatchStats,
  BatchEventType,
  BatchEventData,
} from './BatchProcessor';

export type {
  BatchItem as IBatchItem,
  BatchItemMetadata as IBatchItemMetadata,
  BatchConfig as IBatchConfig,
  BatchStats as IBatchStats,
  BatchEventData as IBatchEventData,
} from './BatchProcessor';
