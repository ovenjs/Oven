/**
 * @fileoverview Plugin configuration type definitions
 */

import type { Brand } from '../primitives/index.js';

/**
 * Plugin configuration interface
 */
export interface PluginConfiguration<T = Record<string, unknown>> {
  readonly schema: ValidationSchema<T>;
  readonly defaults: T;
  readonly required: readonly (keyof T)[];
  readonly env?: EnvironmentVariables;
  readonly secrets?: SecretConfiguration;
  readonly validation?: ValidationBehavior;
}

/**
 * Validation schema for plugin configuration
 */
export interface ValidationSchema<T = unknown> {
  readonly type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  readonly properties?: { [K in keyof T]?: ValidationSchema<T[K]> };
  readonly items?: ValidationSchema;
  readonly required?: readonly (keyof T)[];
  readonly additionalProperties?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly pattern?: string;
  readonly enum?: readonly T[];
  readonly custom?: (value: unknown) => boolean | Promise<boolean>;
  readonly description?: string;
  readonly examples?: readonly T[];
}

/**
 * Validation behavior configuration
 */
export interface ValidationBehavior {
  readonly strict: boolean;
  readonly coercion: boolean;
  readonly removeAdditional: boolean;
  readonly useDefaults: boolean;
  readonly abortEarly: boolean;
  readonly allowUnknown: boolean;
}

/**
 * Environment variables configuration
 */
export interface EnvironmentVariables {
  readonly [key: string]: {
    readonly description: string;
    readonly required: boolean;
    readonly default?: string;
    readonly type: 'string' | 'number' | 'boolean' | 'json';
    readonly sensitive?: boolean;
    readonly validation?: EnvironmentVariableValidation;
  };
}

/**
 * Environment variable validation
 */
export interface EnvironmentVariableValidation {
  readonly pattern?: string;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly enum?: readonly string[];
}

/**
 * Secret configuration for sensitive data
 */
export interface SecretConfiguration {
  readonly provider: 'env' | 'file' | 'vault' | 'keychain' | 'external';
  readonly secrets: readonly SecretDefinition[];
  readonly encryption?: SecretEncryption;
}

/**
 * Secret definition
 */
export interface SecretDefinition {
  readonly name: string;
  readonly key: string;
  readonly description: string;
  readonly required: boolean;
  readonly rotation?: SecretRotation;
  readonly validation?: SecretValidation;
}

/**
 * Secret rotation configuration
 */
export interface SecretRotation {
  readonly enabled: boolean;
  readonly interval: number;
  readonly strategy: 'automatic' | 'manual' | 'ondemand';
  readonly notification?: boolean;
  readonly backup?: boolean;
}

/**
 * Secret validation
 */
export interface SecretValidation {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly strength?: 'weak' | 'medium' | 'strong';
  readonly custom?: (secret: string) => boolean | Promise<boolean>;
}

/**
 * Secret encryption configuration
 */
export interface SecretEncryption {
  readonly algorithm: string;
  readonly keyDerivation: string;
  readonly saltLength: number;
  readonly iterations: number;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult<T = unknown> {
  readonly valid: boolean;
  readonly value?: T;
  readonly errors: readonly ConfigValidationError[];
  readonly warnings: readonly ConfigValidationWarning[];
}

/**
 * Configuration validation error
 */
export interface ConfigValidationError {
  readonly path: string;
  readonly message: string;
  readonly code: string;
  readonly value?: unknown;
}

/**
 * Configuration validation warning
 */
export interface ConfigValidationWarning extends ConfigValidationError {
  readonly suggestion?: string;
}

/**
 * Configuration change event
 */
export interface ConfigChangeEvent<T = unknown> {
  readonly pluginName: string;
  readonly path: string;
  readonly oldValue: T;
  readonly newValue: T;
  readonly timestamp: Date;
  readonly source: 'user' | 'system' | 'plugin';
}

/**
 * Configuration manager interface
 */
export interface ConfigurationManager<T = Record<string, unknown>> {
  validate(config: unknown, schema: ValidationSchema<T>): Promise<ConfigValidationResult<T>>;
  merge(target: T, source: Partial<T>): T;
  get<K extends keyof T>(key: K): T[K] | undefined;
  set<K extends keyof T>(key: K, value: T[K]): Promise<void>;
  delete<K extends keyof T>(key: K): Promise<void>;
  subscribe<K extends keyof T>(key: K, callback: (value: T[K]) => void): () => void;
  reset(): Promise<void>;
  export(): T;
  import(config: T): Promise<void>;
}

/**
 * Branded types for configuration
 */
export type ConfigKey = Brand<string, 'ConfigKey'>;
export type SecretKey = Brand<string, 'SecretKey'>;
export type EnvVarName = Brand<string, 'EnvVarName'>;