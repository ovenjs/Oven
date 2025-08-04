/**
 * Request/Response Transformation Utilities
 *
 * This module provides comprehensive request and response transformation utilities for the enhanced REST client,
 * with support for data serialization, deserialization, validation, and format conversion.
 */

export { TransformerManager } from './Transformer';

export type {
  TransformDirection,
  TransformContext,
  TransformOptions,
  TransformResult,
  Transformer,
  SerializationFormat,
  SerializationOptions,
  ValidationRule,
  ValidationSchema,
  ValidationOptions,
  JsonSchemaValidationOptions,
  DataMappingConfig,
  DataMappingOptions,
  DataFilterConfig,
  DataFilterOptions,
  DataAggregationConfig,
  DataAggregationOptions,
  RequestTransformerConfig,
  ResponseTransformerConfig,
  TransformerConfig,
} from './Transformer';
