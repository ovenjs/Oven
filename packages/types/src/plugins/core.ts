/**
 * @fileoverview Core plugin interface definitions
 */

import type { 
  Brand, 
  Phantom, 
  SemverVersion 
} from '../primitives/index.js';

import type { 
  PluginMetadata,
  PluginConfiguration,
  PluginHooks,
  PluginLifecycle,
  PluginContext
} from './index.js';

/**
 * Core plugin interface with advanced type safety
 */
export interface Plugin<TConfig = Record<string, unknown>, TContext = PluginContext> {
  readonly meta: PluginMetadata;
  readonly config: PluginConfiguration<TConfig>;
  readonly hooks: PluginHooks<TContext>;
  readonly lifecycle: PluginLifecycle;

  /**
   * Initialize the plugin with context
   */
  initialize(context: TContext): Promise<void> | void;

  /**
   * Destroy the plugin and clean up resources
   */
  destroy(): Promise<void> | void;

  /**
   * Get plugin metrics (optional)
   */
  getMetrics?(): Record<string, unknown>;

  /**
   * Validate plugin state (optional)
   */
  validate?(): Promise<boolean> | boolean;

  /**
   * Handle plugin configuration changes (optional)
   */
  onConfigChange?(newConfig: TConfig, oldConfig: TConfig): Promise<void> | void;

  /**
   * Get plugin health status (optional)
   */
  getHealth?(): Promise<PluginHealthStatus> | PluginHealthStatus;
}

/**
 * Plugin health status
 */
export interface PluginHealthStatus {
  readonly healthy: boolean;
  readonly message?: string;
  readonly details?: Record<string, unknown>;
  readonly lastCheck: Date;
}

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry<TConfig = Record<string, unknown>> {
  readonly plugin: Plugin<TConfig>;
  readonly loadedAt: Date;
  readonly initializedAt?: Date;
  status: PluginStatus;
  readonly error?: PluginError;
  readonly metrics?: Record<string, unknown>;
  readonly health?: PluginHealthStatus;
}

/**
 * Plugin status enumeration
 */
export enum PluginStatus {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
  DESTROYING = 'destroying',
  DESTROYED = 'destroyed'
}

/**
 * Plugin load options
 */
export interface PluginLoadOptions<TConfig = Record<string, unknown>> {
  readonly config?: TConfig;
  readonly force?: boolean;
  readonly timeout?: number;
  readonly retries?: number;
  readonly dependencies?: readonly string[];
  readonly validateSecurity?: boolean;
}

/**
 * Plugin unload options
 */
export interface PluginUnloadOptions {
  readonly force?: boolean;
  readonly timeout?: number;
  readonly cascade?: boolean;
  readonly preserveData?: boolean;
}

/**
 * Plugin execution context
 */
export interface PluginExecutionContext {
  readonly pluginName: string;
  readonly version: SemverVersion;
  readonly executionId: string;
  readonly startTime: Date;
  readonly timeout?: number;
  readonly metadata: Record<string, unknown>;
}

/**
 * Plugin execution result
 */
export interface PluginExecutionResult<T = unknown> {
  readonly success: boolean;
  readonly result?: T;
  readonly error?: PluginError;
  readonly context: PluginExecutionContext;
  readonly duration: number;
  readonly memoryUsage: number;
}

/**
 * Plugin discovery result
 */
export interface PluginDiscoveryResult {
  readonly plugins: readonly PluginRegistryEntry[];
  readonly errors: readonly PluginError[];
  readonly timestamp: Date;
  readonly source: string;
}

/**
 * Plugin validation result
 */
export interface PluginValidationResult {
  readonly valid: boolean;
  readonly errors: readonly PluginValidationError[];
  readonly warnings: readonly PluginValidationWarning[];
  readonly metadata: PluginMetadata;
}

/**
 * Plugin validation error
 */
export interface PluginValidationError {
  readonly type: 'structure' | 'dependency' | 'security' | 'compatibility';
  readonly message: string;
  readonly code: string;
  readonly severity: 'error' | 'warning';
  readonly details?: Record<string, unknown>;
}

/**
 * Plugin validation warning
 */
export interface PluginValidationWarning extends PluginValidationError {
  readonly severity: 'warning';
  readonly suggestion?: string;
}

/**
 * Plugin error interface
 */
export interface PluginError extends Error {
  readonly type: PluginErrorType;
  readonly pluginName: string;
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly timestamp: Date;
}

/**
 * Plugin error types
 */
export enum PluginErrorType {
  VALIDATION_ERROR = 'validation_error',
  LOAD_ERROR = 'load_error',
  INITIALIZATION_ERROR = 'initialization_error',
  RUNTIME_ERROR = 'runtime_error',
  PERMISSION_ERROR = 'permission_error',
  DEPENDENCY_ERROR = 'dependency_error',
  TIMEOUT_ERROR = 'timeout_error',
  MEMORY_ERROR = 'memory_error',
  SECURITY_ERROR = 'security_error',
  CONFIGURATION_ERROR = 'configuration_error',
  SANDBOX_ERROR = 'sandbox_error'
}

/**
 * Branded types for plugin system
 */
export type PluginName = Brand<string, 'PluginName'>;
export type PluginVersion = Brand<string, 'PluginVersion'>;
export type PluginId = Brand<string, 'PluginId'>;
export type ExecutionId = Brand<string, 'ExecutionId'>;

/**
 * Phantom types for plugin system
 */
export type ValidatedPlugin<T> = Phantom<T, 'ValidatedPlugin'>;
export type AuthorizedPlugin<T> = Phantom<T, 'AuthorizedPlugin'>;
export type SandboxedPlugin<T> = Phantom<T, 'SandboxedPlugin'>;
export type InitializedPlugin<T> = Phantom<T, 'InitializedPlugin'>;
export type RunningPlugin<T> = Phantom<T, 'RunningPlugin'>;