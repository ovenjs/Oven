/**
 * Request/Response Transformation Utilities
 *
 * This module provides comprehensive request and response transformation utilities for the enhanced REST client,
 * with support for data serialization, deserialization, validation, and format conversion.
 */

import { Logger } from '../logger/Logger';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';

/**
 * Transformation direction
 */
export enum TransformDirection {
  REQUEST = 'request',
  RESPONSE = 'response',
}

/**
 * Transformation context
 */
export interface TransformContext {
  direction: TransformDirection;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  requestId?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

/**
 * Transformation options
 */
export interface TransformOptions {
  enabled: boolean;
  priority: number;
  condition?: (context: TransformContext) => boolean;
  async: boolean;
  continueOnError: boolean;
}

/**
 * Transformation result
 */
export interface TransformResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Base transformer interface
 */
export interface Transformer<T = any, R = any> {
  name: string;
  options: TransformOptions;
  transform(
    data: T,
    context: TransformContext
  ): Promise<TransformResult<R>> | TransformResult<R>;
}

/**
 * Serialization format
 */
export enum SerializationFormat {
  JSON = 'json',
  FORM_URLENCODED = 'form-urlencoded',
  FORM_DATA = 'form-data',
  TEXT = 'text',
  BINARY = 'binary',
  CUSTOM = 'custom',
}

/**
 * Serialization options
 */
export interface SerializationOptions {
  format: SerializationFormat;
  contentType?: string;
  encoding?: string;
  space?: number | string;
  replacer?: (key: string, value: any) => any;
  customSerializer?: (data: any) => string | Buffer;
}

/**
 * Validation rule
 */
export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | Promise<boolean>;
  message?: string;
}

/**
 * Validation schema
 */
export interface ValidationSchema {
  rules: ValidationRule[];
  strict?: boolean;
  stripUnknown?: boolean;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  enabled: boolean;
  schema?: ValidationSchema;
  abortEarly?: boolean;
  stripUnknown?: boolean;
  context?: Record<string, any>;
}

/**
 * JSON Schema validation options
 */
export interface JsonSchemaValidationOptions {
  enabled: boolean;
  schema?: any;
  strict?: boolean;
  coerceTypes?: boolean;
  removeAdditional?: boolean;
}

/**
 * Data mapping configuration
 */
export interface DataMappingConfig {
  sourcePath: string;
  targetPath: string;
  transform?: (value: any) => any;
  defaultValue?: any;
  condition?: (value: any) => boolean;
}

/**
 * Data mapping options
 */
export interface DataMappingOptions {
  enabled: boolean;
  mappings: DataMappingConfig[];
  strict?: boolean;
  ignoreMissing?: boolean;
}

/**
 * Data filtering configuration
 */
export interface DataFilterConfig {
  path: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex' | 'exists';
  value: any;
}

/**
 * Data filtering options
 */
export interface DataFilterOptions {
  enabled: boolean;
  filters: DataFilterConfig[];
  mode: 'include' | 'exclude';
}

/**
 * Data aggregation configuration
 */
export interface DataAggregationConfig {
  path: string;
  operation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'first' | 'last' | 'join';
  groupBy?: string;
  as?: string;
}

/**
 * Data aggregation options
 */
export interface DataAggregationOptions {
  enabled: boolean;
  aggregations: DataAggregationConfig[];
}

/**
 * Request transformer configuration
 */
export interface RequestTransformerConfig {
  serialization: SerializationOptions;
  validation: ValidationOptions;
  jsonSchemaValidation: JsonSchemaValidationOptions;
  dataMapping: DataMappingOptions;
  dataFiltering: DataFilterOptions;
  dataAggregation: DataAggregationOptions;
  customTransformers: Transformer[];
}

/**
 * Response transformer configuration
 */
export interface ResponseTransformerConfig {
  serialization: SerializationOptions;
  validation: ValidationOptions;
  jsonSchemaValidation: JsonSchemaValidationOptions;
  dataMapping: DataMappingOptions;
  dataFiltering: DataFilterOptions;
  dataAggregation: DataAggregationOptions;
  customTransformers: Transformer[];
}

/**
 * Combined transformer configuration
 */
export interface TransformerConfig {
  request: RequestTransformerConfig;
  response: ResponseTransformerConfig;
  globalOptions: {
    enablePerformanceTracking: boolean;
    enableErrorLogging: boolean;
    defaultPriority: number;
  };
}

/**
 * Serialization transformer
 */
class SerializationTransformer implements Transformer<any, string | Buffer> {
  name = 'serialization';
  options: TransformOptions = {
    enabled: true,
    priority: 100,
    async: false,
    continueOnError: false,
  };

  constructor(private serializationOptions: SerializationOptions) {}

  async transform(
    data: any,
    context: TransformContext
  ): Promise<TransformResult<string | Buffer>> {
    const startTime = Date.now();

    try {
      let result: string | Buffer;

      switch (this.serializationOptions.format) {
        case SerializationFormat.JSON:
          result = JSON.stringify(
            data,
            this.serializationOptions.replacer,
            this.serializationOptions.space
          );
          break;

        case SerializationFormat.FORM_URLENCODED:
          result = this.serializeFormUrlEncoded(data);
          break;

        case SerializationFormat.TEXT:
          result = String(data);
          break;

        case SerializationFormat.BINARY:
          result = this.serializeBinary(data);
          break;

        case SerializationFormat.CUSTOM:
          if (this.serializationOptions.customSerializer) {
            result = this.serializationOptions.customSerializer(data);
          } else {
            throw new Error('Custom serializer not provided');
          }
          break;

        default:
          throw new Error(
            `Unsupported serialization format: ${this.serializationOptions.format}`
          );
      }

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
        metadata: { format: this.serializationOptions.format },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime,
      };
    }
  }

  private serializeFormUrlEncoded(data: any): string {
    const params = new URLSearchParams();

    const flatten = (obj: any, prefix = ''): void => {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          const newKey = prefix ? `${prefix}[${key}]` : key;

          if (value === null || value === undefined) {
            continue;
          }

          if (typeof value === 'object') {
            flatten(value, newKey);
          } else {
            params.append(newKey, String(value));
          }
        }
      }
    };

    flatten(data);
    return params.toString();
  }

  private serializeBinary(data: any): Buffer {
    if (Buffer.isBuffer(data)) {
      return data;
    }

    if (typeof data === 'string') {
      return Buffer.from(
        String(data),
        (this.serializationOptions.encoding as BufferEncoding) || 'utf8'
      );
    }

    return Buffer.from(JSON.stringify(data));
  }
}

/**
 * Deserialization transformer
 */
class DeserializationTransformer implements Transformer<string | Buffer, any> {
  name = 'deserialization';
  options: TransformOptions = {
    enabled: true,
    priority: 100,
    async: false,
    continueOnError: false,
  };

  constructor(private serializationOptions: SerializationOptions) {}

  async transform(
    data: string | Buffer,
    context: TransformContext
  ): Promise<TransformResult<any>> {
    const startTime = Date.now();

    try {
      let result: any;

      switch (this.serializationOptions.format) {
        case SerializationFormat.JSON:
          result = JSON.parse(data.toString());
          break;

        case SerializationFormat.TEXT:
          result = data.toString();
          break;

        case SerializationFormat.BINARY:
          result = data;
          break;

        default:
          throw new Error(
            `Unsupported deserialization format: ${this.serializationOptions.format}`
          );
      }

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
        metadata: { format: this.serializationOptions.format },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime,
      };
    }
  }
}

/**
 * Validation transformer
 */
class ValidationTransformer implements Transformer<any, any> {
  name = 'validation';
  options: TransformOptions = {
    enabled: true,
    priority: 200,
    async: true,
    continueOnError: false,
  };

  constructor(private validationOptions: ValidationOptions) {}

  async transform(data: any, context: TransformContext): Promise<TransformResult<any>> {
    if (!this.validationOptions.enabled || !this.validationOptions.schema) {
      return { success: true, data };
    }

    const startTime = Date.now();

    try {
      const result = await this.validate(data, this.validationOptions.schema);

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime,
      };
    }
  }

  private async validate(data: any, schema: ValidationSchema): Promise<any> {
    const errors: string[] = [];
    let result = { ...data };

    for (const rule of schema.rules) {
      const value = this.getNestedValue(data, rule.field);

      // Check required
      if (rule.required && (value === undefined || value === null)) {
        errors.push(rule.message || `Field '${rule.field}' is required`);
        if (this.validationOptions.abortEarly) break;
        continue;
      }

      // Skip validation if not required and value is undefined/null
      if (!rule.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (rule.type && typeof value !== rule.type) {
        errors.push(rule.message || `Field '${rule.field}' must be of type ${rule.type}`);
        if (this.validationOptions.abortEarly) break;
        continue;
      }

      // String validation
      if (rule.type === 'string' && typeof value === 'string') {
        if (rule.minLength !== undefined && value.length < rule.minLength) {
          errors.push(
            rule.message ||
              `Field '${rule.field}' must be at least ${rule.minLength} characters`
          );
          if (this.validationOptions.abortEarly) break;
        }

        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
          errors.push(
            rule.message ||
              `Field '${rule.field}' must be at most ${rule.maxLength} characters`
          );
          if (this.validationOptions.abortEarly) break;
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(
            rule.message || `Field '${rule.field}' does not match required pattern`
          );
          if (this.validationOptions.abortEarly) break;
        }
      }

      // Number validation
      if (rule.type === 'number' && typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(
            rule.message || `Field '${rule.field}' must be at least ${rule.min}`
          );
          if (this.validationOptions.abortEarly) break;
        }

        if (rule.max !== undefined && value > rule.max) {
          errors.push(
            rule.message || `Field '${rule.field}' must be at most ${rule.max}`
          );
          if (this.validationOptions.abortEarly) break;
        }
      }

      // Enum validation
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(
          rule.message || `Field '${rule.field}' must be one of: ${rule.enum.join(', ')}`
        );
        if (this.validationOptions.abortEarly) break;
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult instanceof Promise) {
          const isValid = await customResult;
          if (!isValid) {
            errors.push(rule.message || `Field '${rule.field}' failed custom validation`);
            if (this.validationOptions.abortEarly) break;
          }
        } else if (!customResult) {
          errors.push(rule.message || `Field '${rule.field}' failed custom validation`);
          if (this.validationOptions.abortEarly) break;
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Strip unknown fields if configured
    if (schema.stripUnknown) {
      const knownFields = schema.rules.map(rule => rule.field);
      result = this.stripUnknownFields(result, knownFields);
    }

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private stripUnknownFields(obj: any, knownFields: string[]): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.stripUnknownFields(item, knownFields));
    }

    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && knownFields.includes(key)) {
        result[key] = this.stripUnknownFields(obj[key], knownFields);
      }
    }

    return result;
  }
}

/**
 * Data mapping transformer
 */
class DataMappingTransformer implements Transformer<any, any> {
  name = 'dataMapping';
  options: TransformOptions = {
    enabled: true,
    priority: 300,
    async: false,
    continueOnError: true,
  };

  constructor(private mappingOptions: DataMappingOptions) {}

  async transform(data: any, context: TransformContext): Promise<TransformResult<any>> {
    if (!this.mappingOptions.enabled) {
      return { success: true, data };
    }

    const startTime = Date.now();

    try {
      const result = this.mapData(data, this.mappingOptions.mappings);

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      if (this.mappingOptions.strict) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          duration: Date.now() - startTime,
        };
      }

      return {
        success: true,
        data,
        duration: Date.now() - startTime,
        metadata: {
          mappingError: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  private mapData(data: any, mappings: DataMappingConfig[]): any {
    const result = Array.isArray(data) ? [] : {};

    const processItem = (item: any): any => {
      const mappedItem: any = {};

      for (const mapping of mappings) {
        try {
          const sourceValue = this.getNestedValue(item, mapping.sourcePath);

          // Check condition
          if (mapping.condition && !mapping.condition(sourceValue)) {
            continue;
          }

          // Use default value if source is undefined/null
          let value = sourceValue;
          if (value === undefined || value === null) {
            if (mapping.defaultValue !== undefined) {
              value = mapping.defaultValue;
            } else if (!this.mappingOptions.ignoreMissing) {
              throw new Error(`Missing required field: ${mapping.sourcePath}`);
            } else {
              continue;
            }
          }

          // Apply transform function
          if (mapping.transform) {
            value = mapping.transform(value);
          }

          // Set the value in the target path
          this.setNestedValue(mappedItem, mapping.targetPath, value);
        } catch (error) {
          if (!this.mappingOptions.ignoreMissing) {
            throw error;
          }
        }
      }

      return mappedItem;
    };

    if (Array.isArray(data)) {
      for (const item of data) {
        (result as any[]).push(processItem(item));
      }
    } else {
      Object.assign(result, processItem(data));
    }

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;

    let current = obj;
    for (const key of keys) {
      if (current[key] === undefined || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }
}

/**
 * Main Transformer class
 */
export class TransformerManager {
  private config: TransformerConfig;
  private logger: Logger;
  private performanceMonitor?: PerformanceMonitor;
  private requestTransformers: Transformer[] = [];
  private responseTransformers: Transformer[] = [];

  constructor(
    config: Partial<TransformerConfig> = {},
    logger: Logger,
    performanceMonitor?: PerformanceMonitor
  ) {
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;

    // Set default configuration
    this.config = {
      request: {
        serialization: {
          format: SerializationFormat.JSON,
        },
        validation: {
          enabled: false,
        },
        jsonSchemaValidation: {
          enabled: false,
        },
        dataMapping: {
          enabled: false,
          mappings: [],
        },
        dataFiltering: {
          enabled: false,
          filters: [],
          mode: 'include',
        },
        dataAggregation: {
          enabled: false,
          aggregations: [],
        },
        customTransformers: [],
      },
      response: {
        serialization: {
          format: SerializationFormat.JSON,
        },
        validation: {
          enabled: false,
        },
        jsonSchemaValidation: {
          enabled: false,
        },
        dataMapping: {
          enabled: false,
          mappings: [],
        },
        dataFiltering: {
          enabled: false,
          filters: [],
          mode: 'include',
        },
        dataAggregation: {
          enabled: false,
          aggregations: [],
        },
        customTransformers: [],
      },
      globalOptions: {
        enablePerformanceTracking: true,
        enableErrorLogging: true,
        defaultPriority: 500,
      },
      ...config,
    };

    this.initializeTransformers();
  }

  /**
   * Transform request data
   */
  async transformRequest(
    data: any,
    context: TransformContext
  ): Promise<TransformResult<any>> {
    return this.transform(data, context, this.requestTransformers);
  }

  /**
   * Transform response data
   */
  async transformResponse(
    data: any,
    context: TransformContext
  ): Promise<TransformResult<any>> {
    return this.transform(data, context, this.responseTransformers);
  }

  /**
   * Add a custom request transformer
   */
  addRequestTransformer(transformer: Transformer): void {
    this.requestTransformers.push(transformer);
    this.sortTransformers(this.requestTransformers);
  }

  /**
   * Add a custom response transformer
   */
  addResponseTransformer(transformer: Transformer): void {
    this.responseTransformers.push(transformer);
    this.sortTransformers(this.responseTransformers);
  }

  /**
   * Remove a transformer by name
   */
  removeTransformer(name: string, direction: TransformDirection): void {
    const transformers =
      direction === TransformDirection.REQUEST
        ? this.requestTransformers
        : this.responseTransformers;

    const index = transformers.findIndex(t => t.name === name);
    if (index > -1) {
      transformers.splice(index, 1);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TransformerConfig>): void {
    this.config = { ...this.config, ...config };
    this.initializeTransformers();
  }

  /**
   * Core transformation logic
   */
  private async transform(
    data: any,
    context: TransformContext,
    transformers: Transformer[]
  ): Promise<TransformResult<any>> {
    let currentData = data;
    let metadata: Record<string, any> = {};

    for (const transformer of transformers) {
      // Check if transformer is enabled
      if (!transformer.options.enabled) {
        continue;
      }

      // Check condition
      if (transformer.options.condition && !transformer.options.condition(context)) {
        continue;
      }

      try {
        const result = await transformer.transform(currentData, context);

        // Track performance if enabled
        if (
          this.config.globalOptions.enablePerformanceTracking &&
          this.performanceMonitor
        ) {
          this.performanceMonitor.recordTiming(
            `transformer.${transformer.name}`,
            result.duration || 0,
            { direction: context.direction }
          );
        }

        if (result.success) {
          if (result.data !== undefined) {
            currentData = result.data;
          }
          if (result.metadata) {
            metadata = { ...metadata, ...result.metadata };
          }
        } else if (!transformer.options.continueOnError) {
          // Log error if enabled
          if (this.config.globalOptions.enableErrorLogging) {
            this.logger.error(`Transformer '${transformer.name}' failed`, {
              error: result.error,
              context,
            });
          }

          return {
            success: false,
            error: result.error,
            metadata,
          };
        } else {
          // Log warning if enabled
          if (this.config.globalOptions.enableErrorLogging) {
            this.logger.warn(`Transformer '${transformer.name}' failed but continuing`, {
              error: result.error,
              context,
            });
          }

          if (result.metadata) {
            metadata = { ...metadata, ...result.metadata };
          }
        }
      } catch (error) {
        if (!transformer.options.continueOnError) {
          // Log error if enabled
          if (this.config.globalOptions.enableErrorLogging) {
            this.logger.error(`Transformer '${transformer.name}' threw an error`, {
              error,
              context,
            });
          }

          return {
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
            metadata,
          };
        } else {
          // Log warning if enabled
          if (this.config.globalOptions.enableErrorLogging) {
            this.logger.warn(
              `Transformer '${transformer.name}' threw an error but continuing`,
              { error, context }
            );
          }
        }
      }
    }

    return {
      success: true,
      data: currentData,
      metadata,
    };
  }

  /**
   * Initialize built-in transformers
   */
  private initializeTransformers(): void {
    // Request transformers
    this.requestTransformers = [
      new ValidationTransformer(this.config.request.validation),
      new DataMappingTransformer(this.config.request.dataMapping),
      new SerializationTransformer(this.config.request.serialization),
      ...this.config.request.customTransformers,
    ];

    // Response transformers
    this.responseTransformers = [
      new DeserializationTransformer(this.config.response.serialization),
      new ValidationTransformer(this.config.response.validation),
      new DataMappingTransformer(this.config.response.dataMapping),
      ...this.config.response.customTransformers,
    ];

    // Sort transformers by priority
    this.sortTransformers(this.requestTransformers);
    this.sortTransformers(this.responseTransformers);
  }

  /**
   * Sort transformers by priority
   */
  private sortTransformers(transformers: Transformer[]): void {
    transformers.sort((a, b) => a.options.priority - b.options.priority);
  }
}
