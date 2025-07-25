/**
 * @fileoverview Hook manager for plugin system
 */

import type { Plugin } from '../core/Plugin.js';

/**
 * Simple hook manager implementation
 */
export class HookManager {
  private readonly hooks = new Map<string, Set<Function>>();

  /**
   * Register plugin hooks
   */
  public async registerPluginHooks(plugin: Plugin): Promise<void> {
    // In a real implementation, this would register the plugin's hooks
    // For now, we'll just log that hooks are being registered
    console.log(`Registering hooks for plugin: ${plugin.meta.name}`);
  }

  /**
   * Unregister plugin hooks
   */
  public async unregisterPluginHooks(plugin: Plugin): Promise<void> {
    // In a real implementation, this would unregister the plugin's hooks
    // For now, we'll just log that hooks are being unregistered
    console.log(`Unregistering hooks for plugin: ${plugin.meta.name}`);
  }

  /**
   * Execute a hook
   */
  public async executeHook<T>(hookName: string, ...args: any[]): Promise<T[]> {
    const handlers = this.hooks.get(hookName);
    if (!handlers) {
      return [];
    }

    const results: T[] = [];
    for (const handler of handlers) {
      try {
        const result = await handler(...args);
        results.push(result);
      } catch (error) {
        console.error(`Hook ${hookName} failed:`, error);
      }
    }

    return results;
  }

  /**
   * Register a hook handler
   */
  public registerHook(hookName: string, handler: Function): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, new Set());
    }
    this.hooks.get(hookName)!.add(handler);
  }

  /**
   * Unregister a hook handler
   */
  public unregisterHook(hookName: string, handler: Function): void {
    const handlers = this.hooks.get(hookName);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.hooks.delete(hookName);
      }
    }
  }
}