/**
 * @fileoverview OvenJS Plugin System - Advanced Plugin Architecture
 */

// Re-export only types from the centralized types package to avoid naming conflicts
export type * from '@ovenjs/types/plugins';

// Export implementations with their concrete classes
export { BasePlugin, createPlugin } from './core/Plugin.js';
export { PluginManager } from './core/PluginManager.js';
export { PluginContextFactory } from './core/PluginContext.js';
export { PluginLifecycleManager } from './core/PluginLifecycle.js';
export { PluginSandbox } from './core/PluginSandbox.js';

export { HookManager } from './hooks/HookManager.js';
export { DependencyGraph, CircularDependencyError } from './dependencies/DependencyGraph.js';
export { SecurityValidator } from './utils/SecurityValidator.js';