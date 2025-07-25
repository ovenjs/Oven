/**
 * @fileoverview Plugin lifecycle type definitions
 */

import type { PluginContext } from './context.js';

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
 * Plugin lifecycle events
 */
export interface PluginLifecycleEvents {
  'state:changed': [pluginName: string, from: PluginLifecycleState, to: PluginLifecycleState];
  'transition:started': [pluginName: string, transition: PluginTransition];
  'transition:completed': [pluginName: string, transition: PluginTransition];
  'transition:failed': [pluginName: string, transition: PluginTransition, error: Error];
  'hook:executed': [pluginName: string, hookName: string, duration: number];
  'hook:failed': [pluginName: string, hookName: string, error: Error];
  'health:checked': [pluginName: string, result: HealthCheckResult];
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

/**
 * Plugin lifecycle manager interface
 */
export interface PluginLifecycleManager {
  registerHooks(pluginName: string, hooks: PluginHooks): void;
  unregisterHooks(pluginName: string): void;
  getState(pluginName: string): PluginLifecycleState;
  transition(pluginName: string, newState: PluginLifecycleState, context: PluginContext): Promise<void>;
  canTransition(pluginName: string, from: PluginLifecycleState, to: PluginLifecycleState): boolean;
  getAllStates(): Map<string, PluginLifecycleState>;
  getPluginsInState(state: PluginLifecycleState): string[];
  isRunning(pluginName: string): boolean;
  hasError(pluginName: string): boolean;
  resetState(pluginName: string): void;
  clearAll(): void;
  handleConfigChange(pluginName: string, newConfig: unknown, oldConfig: unknown, context: PluginContext): Promise<void>;
}