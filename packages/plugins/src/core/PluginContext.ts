/**
 * @fileoverview Plugin context for providing runtime services to plugins
 */

import type { PluginManager } from './PluginManager.js';
import type { HookManager } from '../hooks/HookManager.js';
import type { PluginSandbox } from './PluginSandbox.js';

/**
 * Basic plugin context
 */
export interface PluginContext {
  readonly pluginName: string;
  readonly config: unknown;
}

/**
 * Plugin context providing access to runtime services
 */
export interface ExtendedPluginContext extends PluginContext {
  readonly plugins: PluginManager;
  readonly hooks: HookManager;
  readonly sandbox: PluginSandbox;
}

/**
 * Plugin context factory
 */
export class PluginContextFactory {
  private readonly plugins: PluginManager;
  private readonly hooks: HookManager;
  private readonly sandbox: PluginSandbox;

  constructor(
    plugins: PluginManager,
    hooks: HookManager,
    sandbox: PluginSandbox
  ) {
    this.plugins = plugins;
    this.hooks = hooks;
    this.sandbox = sandbox;
  }

  /**
   * Create a basic plugin context
   */
  public createContext(pluginName: string, config: unknown): PluginContext {
    return {
      pluginName,
      config
    };
  }

  /**
   * Create an extended plugin context with all services
   */
  public createExtendedContext(pluginName: string, config: unknown): ExtendedPluginContext {
    return {
      pluginName,
      config,
      plugins: this.plugins,
      hooks: this.hooks,
      sandbox: this.sandbox
    };
  }
}