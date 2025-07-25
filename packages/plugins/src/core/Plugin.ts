/**
 * @fileoverview Core plugin interface with advanced type safety
 */

import type { 
  PluginMetadata, 
  PluginConfiguration, 
  PluginHooks, 
  PluginLifecycle,
  PluginContext 
} from '../types/PluginTypes.js';

/**
 * Advanced plugin interface with full type safety
 */
export interface Plugin<TConfig = Record<string, unknown>, TContext = PluginContext> {
  readonly meta: PluginMetadata;
  readonly config: PluginConfiguration<TConfig>;
  readonly hooks: PluginHooks<TContext>;
  readonly lifecycle: PluginLifecycle;
}

/**
 * Abstract base class for plugin implementations
 */
export abstract class BasePlugin<TConfig = Record<string, unknown>, TContext = PluginContext> 
  implements Plugin<TConfig, TContext> {
  
  public abstract readonly meta: PluginMetadata;
  public abstract readonly config: PluginConfiguration<TConfig>;
  public abstract readonly hooks: PluginHooks<TContext>;
  public abstract readonly lifecycle: PluginLifecycle;

  /**
   * Initialize the plugin with context
   */
  public abstract initialize(context: TContext): Promise<void> | void;

  /**
   * Clean up plugin resources
   */
  public abstract destroy(): Promise<void> | void;

  /**
   * Handle configuration changes
   */
  public onConfigChange?(newConfig: TConfig, oldConfig: TConfig): Promise<void> | void;

  /**
   * Handle context updates
   */
  public onContextUpdate?(context: TContext): Promise<void> | void;

  /**
   * Plugin health check
   */
  public healthCheck?(): Promise<boolean> | boolean;

  /**
   * Get plugin metrics
   */
  public getMetrics?(): Record<string, unknown>;

  /**
   * Validate plugin state
   */
  public validate?(): Promise<boolean> | boolean;
}

/**
 * Plugin factory function type
 */
export type PluginFactory<TConfig = Record<string, unknown>, TContext = PluginContext> = (
  config: TConfig,
  context: TContext
) => Plugin<TConfig, TContext>;

/**
 * Plugin constructor type
 */
export type PluginConstructor<TConfig = Record<string, unknown>, TContext = PluginContext> = new (
  config: TConfig,
  context: TContext
) => Plugin<TConfig, TContext>;

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry<TConfig = Record<string, unknown>, TContext = PluginContext> {
  readonly plugin: Plugin<TConfig, TContext>;
  readonly loadedAt: Date;
  readonly status: 'loaded' | 'initialized' | 'error' | 'disabled';
  readonly error?: Error;
}

/**
 * Plugin loading options
 */
export interface PluginLoadOptions<TConfig = Record<string, unknown>> {
  readonly config?: TConfig;
  readonly force?: boolean;
  readonly timeout?: number;
  readonly retries?: number;
  readonly dependencies?: readonly string[];
}

/**
 * Plugin unloading options
 */
export interface PluginUnloadOptions {
  readonly force?: boolean;
  readonly timeout?: number;
  readonly cascade?: boolean;
}

/**
 * Plugin status information
 */
export interface PluginStatus {
  readonly name: string;
  readonly version: string;
  readonly status: 'loaded' | 'initialized' | 'error' | 'disabled';
  readonly loadedAt?: Date;
  readonly error?: string;
  readonly dependencies: readonly string[];
  readonly dependents: readonly string[];
  readonly metrics?: Record<string, unknown>;
}

/**
 * Plugin events
 */
export interface PluginEvents {
  pluginLoaded: [plugin: Plugin];
  pluginUnloaded: [plugin: Plugin];
  pluginError: [plugin: Plugin, error: Error];
  pluginInitialized: [plugin: Plugin];
  pluginDestroyed: [plugin: Plugin];
  configChanged: [plugin: Plugin, newConfig: unknown, oldConfig: unknown];
}