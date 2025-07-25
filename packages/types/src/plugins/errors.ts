/**
 * @fileoverview Plugin error type definitions
 */

import type { Brand, ISO8601Timestamp } from '../primitives/index.js';

/**
 * Base plugin error class interface
 */
export interface PluginError extends Error {
  readonly type: PluginErrorType;
  readonly pluginName: string;
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly timestamp: ISO8601Timestamp;
  readonly severity: ErrorSeverity;
  readonly context?: ErrorContext;
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
  SANDBOX_ERROR = 'sandbox_error',
  HOOK_ERROR = 'hook_error',
  LIFECYCLE_ERROR = 'lifecycle_error',
  REGISTRY_ERROR = 'registry_error',
  DISCOVERY_ERROR = 'discovery_error'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error context information
 */
export interface ErrorContext {
  readonly operation?: string;
  readonly phase?: string;
  readonly file?: string;
  readonly line?: number;
  readonly column?: number;
  readonly function?: string;
  readonly stackTrace?: readonly string[];
  readonly environment?: Record<string, unknown>;
}

/**
 * Plugin validation error
 */
export interface PluginValidationError extends PluginError {
  readonly type: PluginErrorType.VALIDATION_ERROR;
  readonly validationErrors: readonly ValidationError[];
  readonly schema?: string;
}

/**
 * Individual validation error
 */
export interface ValidationError {
  readonly path: string;
  readonly message: string;
  readonly value?: unknown;
  readonly constraint?: string;
}

/**
 * Plugin load error
 */
export interface PluginLoadError extends PluginError {
  readonly type: PluginErrorType.LOAD_ERROR;
  readonly path: string;
  readonly reason: LoadErrorReason;
  readonly attempts: number;
}

/**
 * Load error reasons
 */
export enum LoadErrorReason {
  FILE_NOT_FOUND = 'file_not_found',
  SYNTAX_ERROR = 'syntax_error',
  MODULE_ERROR = 'module_error',
  DEPENDENCY_ERROR = 'dependency_error',
  PERMISSION_DENIED = 'permission_denied',
  TIMEOUT = 'timeout'
}

/**
 * Plugin initialization error
 */
export interface PluginInitializationError extends PluginError {
  readonly type: PluginErrorType.INITIALIZATION_ERROR;
  readonly phase: InitializationPhase;
  readonly config?: unknown;
}

/**
 * Initialization phases
 */
export enum InitializationPhase {
  PRE_INIT = 'pre_init',
  INIT = 'init',
  POST_INIT = 'post_init',
  HOOK_REGISTRATION = 'hook_registration',
  SERVICE_SETUP = 'service_setup'
}

/**
 * Plugin runtime error
 */
export interface PluginRuntimeError extends PluginError {
  readonly type: PluginErrorType.RUNTIME_ERROR;
  readonly operation: string;
  readonly args?: readonly unknown[];
  readonly result?: unknown;
}

/**
 * Plugin permission error
 */
export interface PluginPermissionError extends PluginError {
  readonly type: PluginErrorType.PERMISSION_ERROR;
  readonly permission: string;
  readonly action: string;
  readonly resource?: string;
  readonly required: readonly string[];
  readonly granted: readonly string[];
}

/**
 * Plugin dependency error
 */
export interface PluginDependencyError extends PluginError {
  readonly type: PluginErrorType.DEPENDENCY_ERROR;
  readonly dependency: string;
  readonly version?: string;
  readonly reason: DependencyErrorReason;
  readonly available?: readonly string[];
}

/**
 * Dependency error reasons
 */
export enum DependencyErrorReason {
  NOT_FOUND = 'not_found',
  VERSION_MISMATCH = 'version_mismatch',
  CIRCULAR_DEPENDENCY = 'circular_dependency',
  LOAD_FAILED = 'load_failed',
  INCOMPATIBLE = 'incompatible'
}

/**
 * Plugin timeout error
 */
export interface PluginTimeoutError extends PluginError {
  readonly type: PluginErrorType.TIMEOUT_ERROR;
  readonly operation: string;
  readonly timeout: number;
  readonly elapsed: number;
}

/**
 * Plugin memory error
 */
export interface PluginMemoryError extends PluginError {
  readonly type: PluginErrorType.MEMORY_ERROR;
  readonly limit: number;
  readonly used: number;
  readonly operation?: string;
}

/**
 * Plugin security error
 */
export interface PluginSecurityError extends PluginError {
  readonly type: PluginErrorType.SECURITY_ERROR;
  readonly violation: SecurityViolation;
  readonly policy?: string;
  readonly risk: SecurityRisk;
}

/**
 * Security violation types
 */
export enum SecurityViolation {
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  MALICIOUS_CODE = 'malicious_code',
  UNSAFE_OPERATION = 'unsafe_operation',
  POLICY_VIOLATION = 'policy_violation',
  SIGNATURE_INVALID = 'signature_invalid'
}

/**
 * Security risk levels
 */
export enum SecurityRisk {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Plugin configuration error
 */
export interface PluginConfigurationError extends PluginError {
  readonly type: PluginErrorType.CONFIGURATION_ERROR;
  readonly configPath?: string;
  readonly invalidKeys: readonly string[];
  readonly missingKeys: readonly string[];
  readonly validationErrors: readonly ValidationError[];
}

/**
 * Plugin sandbox error
 */
export interface PluginSandboxError extends PluginError {
  readonly type: PluginErrorType.SANDBOX_ERROR;
  readonly contextId: string;
  readonly violation: SandboxViolation;
  readonly restrictions?: Record<string, unknown>;
}

/**
 * Sandbox violation types
 */
export enum SandboxViolation {
  MEMORY_LIMIT_EXCEEDED = 'memory_limit_exceeded',
  TIME_LIMIT_EXCEEDED = 'time_limit_exceeded',
  ACCESS_DENIED = 'access_denied',
  MODULE_BLOCKED = 'module_blocked',
  FUNCTION_BLOCKED = 'function_blocked',
  GLOBAL_ACCESS = 'global_access'
}

/**
 * Plugin hook error
 */
export interface PluginHookError extends PluginError {
  readonly type: PluginErrorType.HOOK_ERROR;
  readonly hookName: string;
  readonly handlerName?: string;
  readonly phase: HookErrorPhase;
  readonly args?: readonly unknown[];
}

/**
 * Hook error phases
 */
export enum HookErrorPhase {
  REGISTRATION = 'registration',
  EXECUTION = 'execution',
  VALIDATION = 'validation',
  TIMEOUT = 'timeout',
  CANCELLATION = 'cancellation'
}

/**
 * Plugin lifecycle error
 */
export interface PluginLifecycleError extends PluginError {
  readonly type: PluginErrorType.LIFECYCLE_ERROR;
  readonly currentState: string;
  readonly targetState: string;
  readonly transition: string;
  readonly guard?: string;
}

/**
 * Plugin registry error
 */
export interface PluginRegistryError extends PluginError {
  readonly type: PluginErrorType.REGISTRY_ERROR;
  readonly operation: RegistryOperation;
  readonly entryCount?: number;
}

/**
 * Registry operations
 */
export enum RegistryOperation {
  REGISTER = 'register',
  UNREGISTER = 'unregister',
  UPDATE = 'update',
  QUERY = 'query',
  SNAPSHOT = 'snapshot',
  RESTORE = 'restore'
}

/**
 * Plugin discovery error
 */
export interface PluginDiscoveryError extends PluginError {
  readonly type: PluginErrorType.DISCOVERY_ERROR;
  readonly source: DiscoverySource;
  readonly path?: string;
  readonly reason: DiscoveryErrorReason;
}

/**
 * Discovery sources
 */
export enum DiscoverySource {
  FILESYSTEM = 'filesystem',
  NPM_REGISTRY = 'npm_registry',
  GIT_REPOSITORY = 'git_repository',
  MARKETPLACE = 'marketplace',
  URL = 'url'
}

/**
 * Discovery error reasons
 */
export enum DiscoveryErrorReason {
  ACCESS_DENIED = 'access_denied',
  NETWORK_ERROR = 'network_error',
  INVALID_FORMAT = 'invalid_format',
  CORRUPT_DATA = 'corrupt_data',
  TIMEOUT = 'timeout'
}

/**
 * Error aggregator for collecting multiple errors
 */
export interface PluginErrorAggregator {
  readonly errors: readonly PluginError[];
  readonly count: number;
  readonly severity: ErrorSeverity;
  readonly firstError: PluginError;
  readonly lastError: PluginError;
  readonly byType: Map<PluginErrorType, readonly PluginError[]>;
  readonly bySeverity: Map<ErrorSeverity, readonly PluginError[]>;
}

/**
 * Error reporter interface
 */
export interface PluginErrorReporter {
  report(error: PluginError): void;
  reportMultiple(errors: readonly PluginError[]): void;
  getErrors(filter?: ErrorFilter): readonly PluginError[];
  clearErrors(filter?: ErrorFilter): void;
  subscribe(callback: (error: PluginError) => void): () => void;
  export(format: 'json' | 'csv' | 'txt'): string;
}

/**
 * Error filter
 */
export interface ErrorFilter {
  readonly types?: readonly PluginErrorType[];
  readonly severities?: readonly ErrorSeverity[];
  readonly plugins?: readonly string[];
  readonly timeRange?: {
    readonly start: ISO8601Timestamp;
    readonly end: ISO8601Timestamp;
  };
  readonly limit?: number;
}

/**
 * Error handler interface
 */
export interface PluginErrorHandler {
  handle(error: PluginError): Promise<ErrorHandlingResult>;
  canHandle(error: PluginError): boolean;
  getPriority(): number;
}

/**
 * Error handling result
 */
export interface ErrorHandlingResult {
  readonly handled: boolean;
  readonly action: ErrorHandlingAction;
  readonly message?: string;
  readonly retry?: boolean;
  readonly delay?: number;
}

/**
 * Error handling actions
 */
export enum ErrorHandlingAction {
  IGNORE = 'ignore',
  LOG = 'log',
  WARN = 'warn',
  RETRY = 'retry',
  RESTART = 'restart',
  UNLOAD = 'unload',
  QUARANTINE = 'quarantine',
  TERMINATE = 'terminate'
}

/**
 * Branded types for errors
 */
export type ErrorId = Brand<string, 'ErrorId'>;
export type ErrorCode = Brand<string, 'ErrorCode'>;
export type HandlerId = Brand<string, 'HandlerId'>;