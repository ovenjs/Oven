/**
 * @fileoverview Core plugin interface with advanced type safety
 */

import type { SemverVersion } from '@ovenjs/types';

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  readonly name: string;
  readonly version: SemverVersion;
  readonly author: string;
  readonly description: string;
  readonly dependencies?: readonly string[];
  readonly peerDependencies?: readonly string[];
  readonly optionalDependencies?: readonly string[];
}

/**
 * Plugin configuration
 */
export interface PluginConfiguration<T = Record<string, unknown>> {
  readonly defaults: T;
  readonly schema?: ValidationSchema<T>;
}

/**
 * Simple validation schema
 */
export interface ValidationSchema<T> {
  readonly type: string;
  readonly properties?: Record<string, ValidationSchema<any>>;
  readonly required?: (keyof T)[];
}

/**
 * Plugin hooks
 */
export interface PluginHooks<TContext = unknown> {
  readonly beforeLoad?: (context: TContext) => Promise<void> | void;
  readonly afterLoad?: (context: TContext) => Promise<void> | void;
  readonly beforeUnload?: (context: TContext) => Promise<void> | void;
  readonly afterUnload?: (context: TContext) => Promise<void> | void;
  readonly onError?: (error: Error, context: TContext) => Promise<void> | void;
}

/**
 * Plugin lifecycle
 */
export interface PluginLifecycle {
  readonly state?: string;
}

/**
 * Plugin context
 */
export interface PluginContext {
  readonly pluginName: string;
  readonly config: unknown;
}

/**
 * Plugin interface
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
}

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry {
  readonly plugin: Plugin;
  readonly loadedAt: Date;
  status: 'loaded' | 'initialized' | 'error' | 'disabled';
  readonly error?: Error;
}

/**
 * Plugin load options
 */
export interface PluginLoadOptions<TConfig = Record<string, unknown>> {
  readonly config?: TConfig;
  readonly force?: boolean;
  readonly timeout?: number;
  readonly retries?: number;
}

/**
 * Plugin unload options
 */
export interface PluginUnloadOptions {
  readonly force?: boolean;
  readonly timeout?: number;
  readonly cascade?: boolean;
}

/**
 * Plugin status
 */
export interface PluginStatus {
  readonly name: string;
  readonly version: SemverVersion;
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
  pluginError: [plugin: Plugin | null, error: Error];
  pluginInitialized: [plugin: Plugin];
  pluginDestroyed: [plugin: Plugin];
}