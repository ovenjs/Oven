/**
 * @fileoverview Hook system type definitions
 */

import type { Brand, Phantom } from '../primitives/index.js';

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
  readonly validation?: HookParameterValidation;
}

/**
 * Hook parameter validation
 */
export interface HookParameterValidation {
  readonly type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function';
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly pattern?: string;
  readonly enum?: readonly unknown[];
  readonly custom?: (value: unknown) => boolean;
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
  readonly metadata?: HookHandlerMetadata;
}

/**
 * Hook handler function type
 */
export type HookHandlerFunction<TArgs extends readonly unknown[] = readonly unknown[], TReturn = unknown> = (
  ...args: TArgs
) => TReturn | Promise<TReturn>;

/**
 * Hook handler options
 */
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
 * Hook handler metadata
 */
export interface HookHandlerMetadata {
  readonly description?: string;
  readonly version?: string;
  readonly author?: string;
  readonly deprecated?: boolean;
  readonly since?: string;
  readonly tags?: readonly string[];
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

/**
 * Hook log entry
 */
export interface HookLogEntry {
  readonly level: 'debug' | 'info' | 'warn' | 'error';
  readonly message: string;
  readonly timestamp: Date;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Hook cancellation token
 */
export interface HookCancellationToken {
  readonly cancelled: boolean;
  readonly reason?: string;
  cancel(reason?: string): void;
  onCancelled(callback: (reason?: string) => void): void;
}

/**
 * Hook statistics
 */
export interface HookStatistics {
  readonly hookName: string;
  readonly registeredHandlers: number;
  readonly totalExecutions: number;
  readonly successfulExecutions: number;
  readonly failedExecutions: number;
  readonly cancelledExecutions: number;
  readonly timeoutExecutions: number;
  readonly averageExecutionTime: number;
  readonly minimumExecutionTime: number;
  readonly maximumExecutionTime: number;
  readonly totalExecutionTime: number;
  readonly averageMemoryUsage: number;
  readonly lastExecutionTime?: Date;
  readonly errorRate: number;
  readonly throughput: number;
}

/**
 * Hook registry interface
 */
export interface HookRegistry {
  register<TArgs extends readonly unknown[], TReturn>(
    definition: HookDefinition<TArgs, TReturn>
  ): void;
  
  unregister(hookName: string): void;
  
  registerHandler<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    handler: HookHandler<TArgs, TReturn>
  ): void;
  
  unregisterHandler(hookName: string, handlerName: string): void;
  
  getDefinition(hookName: string): HookDefinition | null;
  
  getHandlers(hookName: string): HookHandler[];
  
  getAllHooks(): string[];
  
  hasHook(hookName: string): boolean;
  
  hasHandler(hookName: string, handlerName: string): boolean;
  
  getStatistics(hookName: string): HookStatistics | null;
  
  getAllStatistics(): Map<string, HookStatistics>;
  
  clearStatistics(hookName?: string): void;
}

/**
 * Hook manager interface
 */
export interface HookManager {
  readonly registry: HookRegistry;
  
  execute<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    ...args: TArgs
  ): Promise<TReturn[]>;
  
  executeSequential<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    ...args: TArgs
  ): Promise<TReturn[]>;
  
  executeParallel<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    ...args: TArgs
  ): Promise<TReturn[]>;
  
  executeWaterfall<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    initialValue: TReturn,
    ...args: TArgs
  ): Promise<TReturn>;
  
  executeBail<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    ...args: TArgs
  ): Promise<TReturn | undefined>;
  
  executeWithTimeout<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    timeout: number,
    ...args: TArgs
  ): Promise<TReturn[]>;
  
  executeWithCancellation<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    cancellationToken: HookCancellationToken,
    ...args: TArgs
  ): Promise<TReturn[]>;
  
  createCancellationToken(): HookCancellationToken;
  
  registerPluginHooks(plugin: { meta: { name: string }; hooks: any }): Promise<void>;
  unregisterPluginHooks(plugin: { meta: { name: string } }): Promise<void>;
}

/**
 * Hook middleware interface
 */
export interface HookMiddleware {
  readonly name: string;
  readonly priority: HookPriority;
  
  beforeExecution?(
    context: HookExecutionContext,
    args: readonly unknown[]
  ): Promise<void> | void;
  
  afterExecution?(
    context: HookExecutionContext,
    result: HookExecutionResult
  ): Promise<void> | void;
  
  onError?(
    context: HookExecutionContext,
    error: Error
  ): Promise<void> | void;
  
  onTimeout?(
    context: HookExecutionContext
  ): Promise<void> | void;
  
  onCancellation?(
    context: HookExecutionContext,
    reason: string
  ): Promise<void> | void;
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

/**
 * Hook events interface
 */
export interface HookEvents {
  'hook:registered': [hookName: string, definition: HookDefinition];
  'hook:unregistered': [hookName: string];
  'hook:handler:registered': [hookName: string, handler: HookHandler];
  'hook:handler:unregistered': [hookName: string, handlerName: string];
  'hook:execution:started': [context: HookExecutionContext];
  'hook:execution:completed': [result: HookExecutionResult];
  'hook:execution:failed': [context: HookExecutionContext, error: Error];
  'hook:execution:cancelled': [context: HookExecutionContext, reason: string];
  'hook:execution:timeout': [context: HookExecutionContext];
  'hook:execution:retry': [context: HookExecutionContext, attempt: number];
}

/**
 * Branded types for hook system
 */
export type HookName = Brand<string, 'HookName'>;
export type HandlerName = Brand<string, 'HandlerName'>;
export type ExecutionId = Brand<string, 'ExecutionId'>;
export type MiddlewareName = Brand<string, 'MiddlewareName'>;

/**
 * Phantom types for hook system
 */
export type RegisteredHook<T> = Phantom<T, 'RegisteredHook'>;
export type ValidatedHandler<T> = Phantom<T, 'ValidatedHandler'>;
export type ExecutingHook<T> = Phantom<T, 'ExecutingHook'>;
export type CompletedHook<T> = Phantom<T, 'CompletedHook'>;