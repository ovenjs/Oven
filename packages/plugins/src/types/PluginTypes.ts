/**
 * @fileoverview Core plugin type definitions
 */

import type { 
  Brand, 
  Phantom, 
  Snowflake, 
  ISO8601Timestamp, 
  URLString, 
  SemverVersion,
  LocaleString 
} from '@ovenjs/types';

/**
 * Plugin metadata with comprehensive information
 */
export interface PluginMetadata {
  readonly name: string;
  readonly version: SemverVersion;
  readonly author: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly license: string;
  readonly repository?: URLString;
  readonly homepage?: URLString;
  readonly bugs?: URLString;
  readonly engines: EngineRequirements;
  readonly os?: readonly string[];
  readonly cpu?: readonly string[];
  readonly dependencies?: readonly string[];
  readonly peerDependencies?: readonly string[];
  readonly optionalDependencies?: readonly string[];
  readonly permissions?: readonly PluginPermission[];
  readonly hooks?: readonly string[];
  readonly extensionPoints?: readonly string[];
}

/**
 * Plugin configuration system
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
 * Plugin lifecycle hooks
 */
export interface PluginHooks<TContext = unknown> {
  readonly beforeLoad?: (context: TContext) => Promise<void> | void;
  readonly afterLoad?: (context: TContext) => Promise<void> | void;
  readonly beforeUnload?: (context: TContext) => Promise<void> | void;
  readonly afterUnload?: (context: TContext) => Promise<void> | void;
  readonly onError?: (error: Error, context: TContext) => Promise<void> | void;
  readonly onConfigChange?: (newConfig: unknown, oldConfig: unknown, context: TContext) => Promise<void> | void;
  readonly onHealthCheck?: (context: TContext) => Promise<HealthCheckResult> | HealthCheckResult;
}

/**
 * Plugin lifecycle interface
 */
export interface PluginLifecycle {
  readonly state: PluginState;
  readonly transitions: readonly PluginTransition[];
  readonly hooks: PluginHooks;
}

/**
 * Plugin context for runtime services
 */
export interface PluginContext {
  readonly pluginName: string;
  readonly config: unknown;
  readonly services: PluginServices;
  readonly sandbox: PluginSandboxContext;
}

/**
 * Plugin services available to plugins
 */
export interface PluginServices {
  readonly logger: PluginLogger;
  readonly cache: PluginCache;
  readonly events: PluginEventBus;
  readonly metrics: PluginMetrics;
  readonly security: PluginSecurity;
  readonly http: PluginHTTPClient;
  readonly storage: PluginStorage;
}

/**
 * Plugin state enumeration
 */
export enum PluginState {
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
 * Plugin state transitions
 */
export interface PluginTransition {
  readonly from: PluginState;
  readonly to: PluginState;
  readonly trigger: string;
  readonly guard?: (context: PluginContext) => boolean;
  readonly action?: (context: PluginContext) => Promise<void> | void;
}

/**
 * Plugin permission system
 */
export interface PluginPermission {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
  readonly scope: PermissionScope;
  readonly level: PermissionLevel;
}

/**
 * Permission scope enumeration
 */
export enum PermissionScope {
  GLOBAL = 'global',
  GUILD = 'guild',
  CHANNEL = 'channel',
  USER = 'user',
  PLUGIN = 'plugin'
}

/**
 * Permission level enumeration
 */
export enum PermissionLevel {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

/**
 * Engine requirements for plugins
 */
export interface EngineRequirements {
  readonly node?: string;
  readonly ovenjs?: string;
  readonly typescript?: string;
  readonly npm?: string;
  readonly yarn?: string;
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
  };
}

/**
 * Secret configuration for sensitive data
 */
export interface SecretConfiguration {
  readonly provider: 'env' | 'file' | 'vault' | 'keychain';
  readonly secrets: readonly SecretDefinition[];
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
}

/**
 * Secret rotation configuration
 */
export interface SecretRotation {
  readonly enabled: boolean;
  readonly interval: number;
  readonly strategy: 'automatic' | 'manual';
  readonly notification?: boolean;
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
  readonly custom?: (value: unknown) => boolean;
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
}

/**
 * Plugin logger interface
 */
export interface PluginLogger {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string | Error, meta?: LogMeta): void;
  fatal(message: string | Error, meta?: LogMeta): void;
  child(context: Record<string, unknown>): PluginLogger;
}

/**
 * Log metadata
 */
export interface LogMeta {
  readonly [key: string]: unknown;
}

/**
 * Plugin cache interface
 */
export interface PluginCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  mget<T>(keys: readonly string[]): Promise<(T | null)[]>;
  mset<T>(entries: readonly [string, T, number?][]): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(pattern?: string): Promise<string[]>;
  ttl(key: string): Promise<number>;
  expire(key: string, ttl: number): Promise<boolean>;
  size(): Promise<number>;
}

/**
 * Plugin event bus interface
 */
export interface PluginEventBus {
  emit<T = unknown>(event: string, data: T): Promise<void>;
  on<T = unknown>(event: string, handler: EventHandler<T>): UnsubscribeFunction;
  once<T = unknown>(event: string, handler: EventHandler<T>): UnsubscribeFunction;
  off(event: string, handler: EventHandler<unknown>): void;
  removeAllListeners(event?: string): void;
  listeners(event: string): EventHandler<unknown>[];
  listenerCount(event: string): number;
}

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

/**
 * Unsubscribe function type
 */
export type UnsubscribeFunction = () => void;

/**
 * Plugin metrics interface
 */
export interface PluginMetrics {
  counter(name: string, value?: number, tags?: MetricTags): void;
  gauge(name: string, value: number, tags?: MetricTags): void;
  histogram(name: string, value: number, tags?: MetricTags): void;
  timing(name: string, value: number, tags?: MetricTags): void;
  increment(name: string, tags?: MetricTags): void;
  decrement(name: string, tags?: MetricTags): void;
  createTimer(name: string, tags?: MetricTags): MetricTimer;
}

/**
 * Metric tags
 */
export interface MetricTags {
  readonly [key: string]: string;
}

/**
 * Metric timer interface
 */
export interface MetricTimer {
  start(): void;
  stop(): void;
  time<T>(fn: () => T): T;
  timeAsync<T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * Plugin security interface
 */
export interface PluginSecurity {
  validatePermission(permission: string): Promise<boolean>;
  requirePermission(permission: string): Promise<void>;
  checkRateLimit(key: string, limit: number, window: number): Promise<boolean>;
  sanitizeInput<T>(input: T): T;
  validateInput<T>(input: unknown, schema: ValidationSchema<T>): Promise<T>;
  encrypt(data: string): Promise<string>;
  decrypt(encryptedData: string): Promise<string>;
  hash(data: string): Promise<string>;
  verify(data: string, hash: string): Promise<boolean>;
}

/**
 * Plugin HTTP client interface
 */
export interface PluginHTTPClient {
  get<T = unknown>(url: string, options?: HTTPOptions): Promise<HTTPResponse<T>>;
  post<T = unknown>(url: string, data?: unknown, options?: HTTPOptions): Promise<HTTPResponse<T>>;
  put<T = unknown>(url: string, data?: unknown, options?: HTTPOptions): Promise<HTTPResponse<T>>;
  patch<T = unknown>(url: string, data?: unknown, options?: HTTPOptions): Promise<HTTPResponse<T>>;
  delete<T = unknown>(url: string, options?: HTTPOptions): Promise<HTTPResponse<T>>;
  request<T = unknown>(options: HTTPRequestOptions): Promise<HTTPResponse<T>>;
}

/**
 * HTTP options
 */
export interface HTTPOptions {
  readonly headers?: Record<string, string>;
  readonly timeout?: number;
  readonly retries?: number;
  readonly validateStatus?: (status: number) => boolean;
}

/**
 * HTTP request options
 */
export interface HTTPRequestOptions extends HTTPOptions {
  readonly method: string;
  readonly url: string;
  readonly data?: unknown;
  readonly params?: Record<string, unknown>;
}

/**
 * HTTP response
 */
export interface HTTPResponse<T = unknown> {
  readonly data: T;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly config: HTTPRequestOptions;
}

/**
 * Plugin storage interface
 */
export interface PluginStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
  transaction<T>(fn: (tx: PluginStorageTransaction) => Promise<T>): Promise<T>;
}

/**
 * Plugin storage transaction
 */
export interface PluginStorageTransaction {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Plugin sandbox context
 */
export interface PluginSandboxContext {
  readonly id: string;
  readonly restrictions: SandboxRestrictions;
  readonly stats: SandboxStats;
}

/**
 * Sandbox restrictions
 */
export interface SandboxRestrictions {
  readonly maxMemory: number;
  readonly maxCpuTime: number;
  readonly maxFileSize: number;
  readonly allowedModules: readonly string[];
  readonly blockedModules: readonly string[];
  readonly allowNetworkAccess: boolean;
  readonly allowFileSystem: boolean;
  readonly allowProcessAccess: boolean;
}

/**
 * Sandbox statistics
 */
export interface SandboxStats {
  readonly createdAt: ISO8601Timestamp;
  readonly memoryUsage: number;
  readonly cpuTime: number;
  readonly executionCount: number;
  readonly lastExecution?: ISO8601Timestamp;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  readonly healthy: boolean;
  readonly message?: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: ISO8601Timestamp;
}

/**
 * Plugin error types
 */
export enum PluginErrorType {
  VALIDATION_ERROR = 'validation_error',
  LOAD_ERROR = 'load_error',
  RUNTIME_ERROR = 'runtime_error',
  PERMISSION_ERROR = 'permission_error',
  DEPENDENCY_ERROR = 'dependency_error',
  TIMEOUT_ERROR = 'timeout_error',
  MEMORY_ERROR = 'memory_error',
  SECURITY_ERROR = 'security_error'
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
}

/**
 * Plugin manifest for package.json
 */
export interface PluginManifest {
  readonly name: string;
  readonly version: SemverVersion;
  readonly description: string;
  readonly main: string;
  readonly types?: string;
  readonly ovenjs: PluginMetadata;
  readonly dependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
  readonly optionalDependencies?: Record<string, string>;
}

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry {
  readonly metadata: PluginMetadata;
  readonly manifest: PluginManifest;
  readonly loadedAt: ISO8601Timestamp;
  readonly status: PluginState;
  readonly error?: PluginError;
  readonly health?: HealthCheckResult;
}

/**
 * Plugin discovery result
 */
export interface PluginDiscoveryResult {
  readonly plugins: readonly PluginRegistryEntry[];
  readonly errors: readonly PluginError[];
  readonly timestamp: ISO8601Timestamp;
}

/**
 * Branded types for plugin system
 */
export type PluginName = Brand<string, 'PluginName'>;
export type PluginVersion = Brand<string, 'PluginVersion'>;
export type PluginId = Brand<string, 'PluginId'>;
export type HookName = Brand<string, 'HookName'>;
export type EventName = Brand<string, 'EventName'>;
export type MetricName = Brand<string, 'MetricName'>;
export type PermissionName = Brand<string, 'PermissionName'>;
export type ConfigKey = Brand<string, 'ConfigKey'>;
export type SecretKey = Brand<string, 'SecretKey'>;
export type CacheKey = Brand<string, 'CacheKey'>;
export type StorageKey = Brand<string, 'StorageKey'>;

/**
 * Phantom types for plugin system
 */
export type ValidatedPlugin<T> = Phantom<T, 'ValidatedPlugin'>;
export type AuthorizedPlugin<T> = Phantom<T, 'AuthorizedPlugin'>;
export type SandboxedPlugin<T> = Phantom<T, 'SandboxedPlugin'>;
export type EncryptedConfig<T> = Phantom<T, 'EncryptedConfig'>;
export type SignedPlugin<T> = Phantom<T, 'SignedPlugin'>;