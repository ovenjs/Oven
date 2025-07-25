/**
 * @fileoverview Complete plugin system type definitions
 * This file contains all plugin-related types organized into logical sections
 */

import type { 
  Brand, 
  Phantom, 
  SemverVersion,
  URLString,
  ISO8601Timestamp
} from './primitives/index.js';

// ============================================================================
// CORE PLUGIN INTERFACES
// ============================================================================

/**
 * Core plugin interface with advanced type safety
 */
export interface Plugin<TConfig = Record<string, unknown>, TContext = PluginContext> {
  readonly meta: PluginMetadata;
  readonly config: PluginConfiguration<TConfig>;
  readonly hooks: PluginHooks<TContext>;
  readonly lifecycle: PluginLifecycle;

  initialize(context: TContext): Promise<void> | void;
  destroy(): Promise<void> | void;
  getMetrics?(): Record<string, unknown>;
  validate?(): Promise<boolean> | boolean;
  onConfigChange?(newConfig: TConfig, oldConfig: TConfig): Promise<void> | void;
  getHealth?(): Promise<PluginHealthStatus> | PluginHealthStatus;
}

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
 * Plugin permission system
 */
export interface PluginPermission {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
  readonly scope: PermissionScope;
  readonly level: PermissionLevel;
}

export enum PermissionScope {
  GLOBAL = 'global',
  GUILD = 'guild',
  CHANNEL = 'channel',
  USER = 'user',
  PLUGIN = 'plugin'
}

export enum PermissionLevel {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

// ============================================================================
// PLUGIN CONFIGURATION
// ============================================================================

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
  };
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
 * Secret encryption configuration
 */
export interface SecretEncryption {
  readonly algorithm: string;
  readonly keyDerivation: string;
  readonly saltLength: number;
  readonly iterations: number;
}

// ============================================================================
// PLUGIN CONTEXT
// ============================================================================

/**
 * Basic plugin context interface
 */
export interface PluginContext {
  readonly pluginName: string;
  readonly config: unknown;
}

/**
 * Extended plugin context with full services
 */
export interface ExtendedPluginContext extends PluginContext {
  readonly services: PluginServices;
  readonly sandbox: PluginSandboxContext;
  readonly version: string;
  readonly environment: PluginEnvironment;
  readonly metadata: Record<string, unknown>;
}

/**
 * Plugin environment information
 */
export interface PluginEnvironment {
  readonly nodeVersion: string;
  readonly ovenjsVersion: string;
  readonly platform: string;
  readonly architecture: string;
  readonly development: boolean;
  readonly variables: Record<string, string>;
}

// ============================================================================
// PLUGIN LIFECYCLE
// ============================================================================

/**
 * Plugin lifecycle states
 */
export enum PluginLifecycleState {
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
 * Plugin lifecycle hooks interface
 */
export interface PluginHooks<TContext = PluginContext> {
  readonly beforeLoad?: (context: TContext) => Promise<void> | void;
  readonly afterLoad?: (context: TContext) => Promise<void> | void;
  readonly beforeInitialize?: (context: TContext) => Promise<void> | void;
  readonly afterInitialize?: (context: TContext) => Promise<void> | void;
  readonly beforeStart?: (context: TContext) => Promise<void> | void;
  readonly afterStart?: (context: TContext) => Promise<void> | void;
  readonly beforeStop?: (context: TContext) => Promise<void> | void;
  readonly afterStop?: (context: TContext) => Promise<void> | void;
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
  readonly state: PluginLifecycleState;
  readonly transitions: readonly PluginTransition[];
  readonly hooks: PluginHooks;
  readonly canTransition: (from: PluginLifecycleState, to: PluginLifecycleState) => boolean;
}

/**
 * Plugin state transition
 */
export interface PluginTransition {
  readonly from: PluginLifecycleState;
  readonly to: PluginLifecycleState;
  readonly trigger: string;
  readonly guard?: (context: PluginContext) => boolean | Promise<boolean>;
  readonly action?: (context: PluginContext) => Promise<void> | void;
  readonly timeout?: number;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  readonly healthy: boolean;
  readonly message?: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: Date;
  readonly checks: readonly HealthCheck[];
}

/**
 * Individual health check
 */
export interface HealthCheck {
  readonly name: string;
  readonly status: 'pass' | 'fail' | 'warn';
  readonly message?: string;
  readonly duration: number;
  readonly metadata?: Record<string, unknown>;
}

// ============================================================================
// PLUGIN SERVICES
// ============================================================================

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

export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;
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

export interface MetricTags {
  readonly [key: string]: string;
}

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

export interface HTTPOptions {
  readonly headers?: Record<string, string>;
  readonly timeout?: number;
  readonly retries?: number;
  readonly validateStatus?: (status: number) => boolean;
}

export interface HTTPRequestOptions extends HTTPOptions {
  readonly method: string;
  readonly url: string;
  readonly data?: unknown;
  readonly params?: Record<string, unknown>;
}

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

export interface PluginStorageTransaction {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// ============================================================================
// PLUGIN SANDBOX
// ============================================================================

/**
 * Plugin sandbox context
 */
export interface PluginSandboxContext {
  readonly id: string;
  readonly restrictions: SandboxRestrictions;
  readonly stats: SandboxStats;
  readonly isolated: boolean;
  readonly version: string;
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
  readonly allowEval: boolean;
  readonly allowDynamicImport: boolean;
  readonly timeoutMs: number;
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
  readonly errors: number;
  readonly timeouts: number;
}

/**
 * Plugin sandbox interface
 */
export interface PluginSandbox {
  createContext(restrictions?: Partial<SandboxRestrictions>): Promise<SandboxContext>;
  destroyContext(contextId: string): Promise<void>;
  executeInContext<T>(contextId: string, code: string): Promise<T>;
  getContextStats(contextId: string): SandboxStats | null;
  getAllContexts(): string[];
  resetContext(contextId: string): Promise<void>;
}

/**
 * Sandbox context for execution
 */
export interface SandboxContext {
  readonly id: string;
  readonly restrictions: SandboxRestrictions;
  loadModule<T>(modulePath: string): Promise<T>;
  execute<T>(code: string): Promise<T>;
  getStats(): SandboxStats;
  reset(): Promise<void>;
  destroy(): Promise<void>;
}

// ============================================================================
// PLUGIN HOOKS SYSTEM
// ============================================================================

/**
 * Hook priority levels
 */
export enum HookPriority {
  HIGHEST = 1000,
  HIGH = 750,
  NORMAL = 500,
  LOW = 250,
  LOWEST = 0
}

/**
 * Hook execution mode
 */
export enum HookExecutionMode {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  WATERFALL = 'waterfall',
  BAIL = 'bail'
}

/**
 * Hook definition interface
 */
export interface HookDefinition<TArgs extends readonly unknown[] = readonly unknown[], TReturn = unknown> {
  readonly name: string;
  readonly description: string;
  readonly parameters: readonly HookParameter[];
  readonly returnType: string;
  readonly async: boolean;
  readonly cancellable: boolean;
  readonly priority: HookPriority;
  readonly executionMode: HookExecutionMode;
  readonly timeout?: number;
  readonly retries?: number;
  readonly deprecated?: boolean;
  readonly since?: string;
  readonly example?: string;
}

/**
 * Hook parameter definition
 */
export interface HookParameter {
  readonly name: string;
  readonly type: string;
  readonly description: string;
  readonly required: boolean;
  readonly default?: unknown;
}

/**
 * Hook handler interface
 */
export interface HookHandler<TArgs extends readonly unknown[] = readonly unknown[], TReturn = unknown> {
  readonly name: string;
  readonly pluginName: string;
  readonly priority: HookPriority;
  readonly handler: HookHandlerFunction<TArgs, TReturn>;
  readonly options?: HookHandlerOptions;
}

export type HookHandlerFunction<TArgs extends readonly unknown[] = readonly unknown[], TReturn = unknown> = (
  ...args: TArgs
) => TReturn | Promise<TReturn>;

export interface HookHandlerOptions {
  readonly timeout?: number;
  readonly retries?: number;
  readonly ignoreErrors?: boolean;
  readonly runOnce?: boolean;
  readonly condition?: (args: readonly unknown[]) => boolean;
  readonly before?: readonly string[];
  readonly after?: readonly string[];
}

/**
 * Hook execution context
 */
export interface HookExecutionContext {
  readonly hookName: string;
  readonly pluginName: string;
  readonly handlerName: string;
  readonly executionId: string;
  readonly startTime: Date;
  readonly timeout?: number;
  readonly retries: number;
  readonly attempt: number;
  readonly metadata: Record<string, unknown>;
}

/**
 * Hook execution result
 */
export interface HookExecutionResult<TReturn = unknown> {
  readonly success: boolean;
  readonly result?: TReturn;
  readonly error?: Error;
  readonly context: HookExecutionContext;
  readonly duration: number;
  readonly memory: number;
  readonly logs: readonly HookLogEntry[];
}

export interface HookLogEntry {
  readonly level: 'debug' | 'info' | 'warn' | 'error';
  readonly message: string;
  readonly timestamp: Date;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Built-in hook names
 */
export const enum BuiltInHooks {
  // Core lifecycle
  CLIENT_BEFORE_CONNECT = 'client:beforeConnect',
  CLIENT_AFTER_CONNECT = 'client:afterConnect',
  CLIENT_BEFORE_DISCONNECT = 'client:beforeDisconnect',
  CLIENT_AFTER_DISCONNECT = 'client:afterDisconnect',
  
  // Request/Response pipeline
  REST_BEFORE_REQUEST = 'rest:beforeRequest',
  REST_AFTER_REQUEST = 'rest:afterRequest',
  REST_ON_ERROR = 'rest:onError',
  REST_ON_RATE_LIMIT = 'rest:onRateLimit',
  
  // WebSocket events
  WS_BEFORE_CONNECT = 'ws:beforeConnect',
  WS_AFTER_CONNECT = 'ws:afterConnect',
  WS_ON_MESSAGE = 'ws:onMessage',
  WS_ON_CLOSE = 'ws:onClose',
  WS_ON_ERROR = 'ws:onError',
  
  // Cache operations
  CACHE_BEFORE_GET = 'cache:beforeGet',
  CACHE_AFTER_GET = 'cache:afterGet',
  CACHE_BEFORE_SET = 'cache:beforeSet',
  CACHE_AFTER_SET = 'cache:afterSet',
  CACHE_BEFORE_DELETE = 'cache:beforeDelete',
  CACHE_AFTER_DELETE = 'cache:afterDelete',
  
  // State management
  STATE_BEFORE_UPDATE = 'state:beforeUpdate',
  STATE_AFTER_UPDATE = 'state:afterUpdate',
  STATE_BEFORE_RESET = 'state:beforeReset',
  STATE_AFTER_RESET = 'state:afterReset',
  
  // Error handling
  ERROR_UNHANDLED = 'error:unhandled',
  ERROR_VALIDATION = 'error:validation',
  ERROR_TIMEOUT = 'error:timeout',
  ERROR_RATE_LIMIT = 'error:rateLimit',
  
  // Analytics & monitoring
  METRICS_COUNTER = 'metrics:counter',
  METRICS_GAUGE = 'metrics:gauge',
  METRICS_HISTOGRAM = 'metrics:histogram',
  METRICS_TIMER = 'metrics:timer',
  
  // Security
  SECURITY_AUTH_ATTEMPT = 'security:authAttempt',
  SECURITY_AUTH_SUCCESS = 'security:authSuccess',
  SECURITY_AUTH_FAILURE = 'security:authFailure',
  SECURITY_PERMISSION_CHECK = 'security:permissionCheck',
  
  // Plugin system
  PLUGIN_BEFORE_LOAD = 'plugin:beforeLoad',
  PLUGIN_AFTER_LOAD = 'plugin:afterLoad',
  PLUGIN_BEFORE_UNLOAD = 'plugin:beforeUnload',
  PLUGIN_AFTER_UNLOAD = 'plugin:afterUnload',
  PLUGIN_ERROR = 'plugin:error',
  PLUGIN_CONFIG_CHANGE = 'plugin:configChange'
}

// ============================================================================
// PLUGIN ERRORS
// ============================================================================

/**
 * Base plugin error interface
 */
export interface PluginError extends Error {
  readonly type: PluginErrorType;
  readonly pluginName: string;
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly timestamp: ISO8601Timestamp;
  readonly severity: ErrorSeverity;
}

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
  SANDBOX_ERROR = 'sandbox_error',
  HOOK_ERROR = 'hook_error',
  LIFECYCLE_ERROR = 'lifecycle_error'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// ============================================================================
// PLUGIN MANAGEMENT
// ============================================================================

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
 * Plugin discovery result
 */
export interface PluginDiscoveryResult {
  readonly plugins: readonly DiscoveredPlugin[];
  readonly errors: readonly PluginError[];
  readonly timestamp: Date;
  readonly source: string;
}

/**
 * Discovered plugin
 */
export interface DiscoveredPlugin {
  readonly path: string;
  readonly metadata: PluginMetadata;
  readonly valid: boolean;
  readonly issues: readonly string[];
  readonly discoveredAt: Date;
}

// ============================================================================
// PLUGIN MANAGER INTERFACES
// ============================================================================

/**
 * Plugin manager interface
 */
export interface PluginManager {
  loadPlugin<TConfig = Record<string, unknown>>(
    pluginPath: string,
    options?: PluginLoadOptions<TConfig>
  ): Promise<Plugin<TConfig>>;
  
  unloadPlugin(pluginName: string, options?: PluginUnloadOptions): Promise<void>;
  
  getPlugin(name: string): Plugin | null;
  
  isLoaded(name: string): boolean;
  
  getPluginStatus(name: string): PluginStatus | null;
  
  getAllPlugins(): readonly Plugin[];
  
  shutdown(): Promise<void>;
}

/**
 * Hook manager interface
 */
export interface HookManager {
  execute<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    ...args: TArgs
  ): Promise<TReturn[]>;
  
  registerPluginHooks(plugin: Plugin): Promise<void>;
  
  unregisterPluginHooks(plugin: Plugin): Promise<void>;
}

/**
 * Dependency graph interface
 */
export interface DependencyGraph {
  addPlugin(metadata: PluginMetadata): void;
  
  removePlugin(pluginName: string): void;
  
  getLoadOrder(): string[];
  
  getDependents(pluginName: string): string[];
  
  hasCycles(): boolean;
}

/**
 * Security validator interface
 */
export interface SecurityValidator {
  validatePlugin(plugin: Plugin): Promise<void>;
}

// ============================================================================
// BRANDED AND PHANTOM TYPES
// ============================================================================

export type PluginName = Brand<string, 'PluginName'>;
export type PluginVersion = Brand<string, 'PluginVersion'>;
export type PluginId = Brand<string, 'PluginId'>;
export type HookName = Brand<string, 'HookName'>;
export type ExecutionId = Brand<string, 'ExecutionId'>;
export type CacheKey = Brand<string, 'CacheKey'>;
export type StorageKey = Brand<string, 'StorageKey'>;
export type MetricName = Brand<string, 'MetricName'>;
export type EventName = Brand<string, 'EventName'>;
export type PermissionName = Brand<string, 'PermissionName'>;
export type ConfigKey = Brand<string, 'ConfigKey'>;
export type SecretKey = Brand<string, 'SecretKey'>;

export type ValidatedPlugin<T> = Phantom<T, 'ValidatedPlugin'>;
export type AuthorizedPlugin<T> = Phantom<T, 'AuthorizedPlugin'>;
export type SandboxedPlugin<T> = Phantom<T, 'SandboxedPlugin'>;
export type InitializedPlugin<T> = Phantom<T, 'InitializedPlugin'>;
export type RunningPlugin<T> = Phantom<T, 'RunningPlugin'>;
export type EncryptedConfig<T> = Phantom<T, 'EncryptedConfig'>;
export type SignedPlugin<T> = Phantom<T, 'SignedPlugin'>;