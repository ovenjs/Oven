/**
 * @fileoverview Advanced plugin system for OvenJS Discord API wrapper
 * Provides sophisticated plugin architecture with type safety and extensibility
 */

// Core plugin system
export * from './core/Plugin.js';
export * from './core/PluginManager.js';
export * from './core/PluginContext.js';
export * from './core/PluginLifecycle.js';
export * from './core/PluginSandbox.js';

// Plugin metadata and configuration
export * from './metadata/PluginMetadata.js';
export * from './metadata/PluginConfiguration.js';
export * from './metadata/PluginValidation.js';

// Hook system
export * from './hooks/HookManager.js';
export * from './hooks/ExtensionPoints.js';
export * from './hooks/HookRegistry.js';

// Dependency system
export * from './dependencies/DependencyGraph.js';
export * from './dependencies/DependencyResolver.js';
export * from './dependencies/CircularDependencyError.js';

// Error handling
export * from './errors/PluginError.js';
export * from './errors/PluginValidationError.js';
export * from './errors/PluginLoadError.js';

// Utilities
export * from './utils/SecurityValidator.js';
export * from './utils/PluginLoader.js';
export * from './utils/VersionManager.js';

// Types
export * from './types/PluginTypes.js';
export * from './types/HookTypes.js';
export * from './types/MetadataTypes.js';