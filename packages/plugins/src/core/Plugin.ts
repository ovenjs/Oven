/**
 * @fileoverview Core plugin interface with advanced type safety
 */

import type { 
  Plugin as IPlugin,
  PluginMetadata,
  PluginConfiguration,
  PluginHooks,
  PluginLifecycle,
  PluginContext
} from '@ovenjs/types/plugins';

// Re-export types for convenience
export type {
  PluginMetadata,
  PluginConfiguration,
  PluginHooks,
  PluginLifecycle,
  PluginContext
} from '@ovenjs/types/plugins';

/**
 * Plugin implementation base class
 */
export abstract class BasePlugin<TConfig = Record<string, unknown>, TContext = PluginContext> implements IPlugin<TConfig, TContext> {
  abstract readonly meta: PluginMetadata;
  abstract readonly config: PluginConfiguration<TConfig>;
  abstract readonly hooks: PluginHooks<TContext>;
  abstract readonly lifecycle: PluginLifecycle;

  abstract initialize(context: TContext): Promise<void> | void;
  abstract destroy(): Promise<void> | void;

  getMetrics?(): Record<string, unknown>;
  validate?(): Promise<boolean> | boolean;
  onConfigChange?(newConfig: TConfig, oldConfig: TConfig): Promise<void> | void;
  getHealth?(): Promise<import('@ovenjs/types/plugins').PluginHealthStatus> | import('@ovenjs/types/plugins').PluginHealthStatus;
}

/**
 * Simple plugin helper for creating plugins
 */
export function createPlugin<TConfig = Record<string, unknown>, TContext = PluginContext>(
  definition: {
    meta: PluginMetadata;
    config: PluginConfiguration<TConfig>;
    hooks?: PluginHooks<TContext>;
    initialize: (context: TContext) => Promise<void> | void;
    destroy: () => Promise<void> | void;
    getMetrics?: () => Record<string, unknown>;
    validate?: () => Promise<boolean> | boolean;
    onConfigChange?: (newConfig: TConfig, oldConfig: TConfig) => Promise<void> | void;
    getHealth?: () => Promise<import('@ovenjs/types/plugins').PluginHealthStatus> | import('@ovenjs/types/plugins').PluginHealthStatus;
  }
): IPlugin<TConfig, TContext> {
  return {
    meta: definition.meta,
    config: definition.config,
    hooks: definition.hooks || {} as PluginHooks<TContext>,
    lifecycle: {
      state: 'unloaded' as any,
      transitions: [],
      hooks: definition.hooks || {} as PluginHooks<TContext>,
      canTransition: () => true
    },
    initialize: definition.initialize,
    destroy: definition.destroy,
    getMetrics: definition.getMetrics,
    validate: definition.validate,
    onConfigChange: definition.onConfigChange,
    getHealth: definition.getHealth
  };
}