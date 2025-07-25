/**
 * @fileoverview Plugin sandbox type definitions
 */

import type { Brand, ISO8601Timestamp } from '../primitives/index.js';

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

/**
 * Sandbox execution result
 */
export interface SandboxExecutionResult<T = unknown> {
  readonly success: boolean;
  readonly result?: T;
  readonly error?: SandboxError;
  readonly stats: SandboxExecutionStats;
  readonly warnings: readonly SandboxWarning[];
}

/**
 * Sandbox execution statistics
 */
export interface SandboxExecutionStats {
  readonly duration: number;
  readonly memoryUsed: number;
  readonly cpuTime: number;
  readonly bytecodeSize: number;
  readonly compilationTime: number;
}

/**
 * Sandbox error
 */
export interface SandboxError extends Error {
  readonly type: SandboxErrorType;
  readonly contextId: string;
  readonly code?: string;
  readonly line?: number;
  readonly column?: number;
  readonly details?: Record<string, unknown>;
}

/**
 * Sandbox error types
 */
export enum SandboxErrorType {
  MEMORY_LIMIT = 'memory_limit',
  TIME_LIMIT = 'time_limit',
  PERMISSION_DENIED = 'permission_denied',
  MODULE_NOT_FOUND = 'module_not_found',
  COMPILATION_ERROR = 'compilation_error',
  RUNTIME_ERROR = 'runtime_error',
  SECURITY_VIOLATION = 'security_violation'
}

/**
 * Sandbox warning
 */
export interface SandboxWarning {
  readonly type: 'performance' | 'security' | 'compatibility' | 'deprecated';
  readonly message: string;
  readonly code?: string;
  readonly severity: 'low' | 'medium' | 'high';
}

/**
 * Sandbox configuration
 */
export interface SandboxConfiguration {
  readonly defaultRestrictions: SandboxRestrictions;
  readonly globalModules: readonly string[];
  readonly securityPolicies: readonly SecurityPolicy[];
  readonly monitoring: SandboxMonitoring;
}

/**
 * Security policy for sandbox
 */
export interface SecurityPolicy {
  readonly name: string;
  readonly description: string;
  readonly rules: readonly SecurityRule[];
  readonly enabled: boolean;
}

/**
 * Security rule
 */
export interface SecurityRule {
  readonly type: 'allow' | 'deny';
  readonly target: 'module' | 'function' | 'property' | 'global';
  readonly pattern: string;
  readonly conditions?: Record<string, unknown>;
}

/**
 * Sandbox monitoring configuration
 */
export interface SandboxMonitoring {
  readonly enabled: boolean;
  readonly metrics: readonly string[];
  readonly alerts: readonly SandboxAlert[];
  readonly retention: number;
}

/**
 * Sandbox alert configuration
 */
export interface SandboxAlert {
  readonly name: string;
  readonly condition: string;
  readonly threshold: number;
  readonly action: 'log' | 'warn' | 'error' | 'terminate';
  readonly cooldown: number;
}

/**
 * Module loader interface for sandbox
 */
export interface SandboxModuleLoader {
  loadModule<T>(modulePath: string, context: SandboxContext): Promise<T>;
  resolveModule(modulePath: string, context: SandboxContext): string;
  validateModule(modulePath: string, context: SandboxContext): boolean;
  cacheModule<T>(modulePath: string, module: T): void;
  clearCache(): void;
}

/**
 * Branded types for sandbox
 */
export type SandboxId = Brand<string, 'SandboxId'>;
export type ContextId = Brand<string, 'ContextId'>;
export type ModulePath = Brand<string, 'ModulePath'>;

/**
 * Phantom types for sandbox
 */
export type IsolatedContext<T> = Brand<T, 'IsolatedContext'>;
export type SecureModule<T> = Brand<T, 'SecureModule'>;
export type ValidatedCode<T> = Brand<T, 'ValidatedCode'>;