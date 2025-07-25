/**
 * @fileoverview Core plugin interface with advanced type safety
 */

import type { SemverVersion } from '@ovenjs/types';
import type { PluginContext } from './PluginContext.js';

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
export interface PluginConfiguration {
  readonly defaults: Record<string, unknown>;
  readonly schema?: ValidationSchema;
}

/**
 * Simple validation schema
 */
export interface ValidationSchema {
  readonly type: string;
  readonly properties?: Record<string, ValidationSchema>;
  readonly required?: string[];
}

/**
 * Plugin hooks
 */
export interface PluginHooks {
  readonly beforeLoad?: (context: PluginContext) => Promise<void> | void;
  readonly afterLoad?: (context: PluginContext) => Promise<void> | void;
  readonly beforeUnload?: (context: PluginContext) => Promise<void> | void;
  readonly afterUnload?: (context: PluginContext) => Promise<void> | void;
  readonly onError?: (error: Error, context: PluginContext) => Promise<void> | void;
}

/**
 * Plugin lifecycle
 */
export interface PluginLifecycle {
  readonly state?: string;
}

/**
 * Plugin interface
 */
export interface Plugin {
  readonly meta: PluginMetadata;
  readonly config: PluginConfiguration;
  readonly hooks: PluginHooks;
  readonly lifecycle: PluginLifecycle;
  
  initialize(context: PluginContext): Promise<void> | void;
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
export interface PluginLoadOptions {
  readonly config?: Record<string, unknown>;
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