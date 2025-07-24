/**
 * @fileoverview Plugin Architecture System for OvenJS
 * Phase 2.1: Revolutionary Architecture - Plugin System
 */

// Plugin Loader
export type {
  PluginManifest,
  PluginPermission,
  PluginConfigSchema,
  ConfigProperty,
  LoadedPlugin,
  PluginInstance,
  PluginContext,
  PluginLogger,
  HookManager,
  CacheManager,
  MetricsCollector,
  PluginHealth,
  HealthCheck,
  PluginMetrics,
  DiscoveryOptions,
  LoadingOptions,
  PluginLoaderEvents,
  PluginLoader,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from './loader.js';

export {
  PluginStatus,
  DefaultPluginLoader,
  createPluginLoader
} from './loader.js';

// Dependency Graph
export type {
  DependencyNode,
  CircularDependency,
  DependencyValidationResult,
  DependencyError,
  DependencyWarning,
  VersionConflict,
  VersionRequirement,
  ResolutionOptions,
  ResolutionResult,
  ResolutionMetadata,
  DependencyGraph,
  DependencyInjector,
  InjectionOptions,
  DependencyScope
} from './dependency-graph.js';

export {
  AdvancedDependencyGraph,
  SimpleDependencyInjector,
  createDependencyGraph,
  createDependencyInjector
} from './dependency-graph.js';

// Sandbox System
export type {
  ResourceLimits,
  SandboxContext,
  SandboxResult,
  SandboxError,
  ExecutionMetrics,
  SandboxLogger,
  SandboxMetrics,
  SecurityAuditResult,
  SecurityRisk,
  CodeLocation,
  PluginSandbox,
  PermissionChecker,
  SecurityOperation
} from './sandbox.js';

export {
  AdvancedPluginSandbox,
  createPluginSandbox,
  createPermissionChecker
} from './sandbox.js';

/**
 * Complete plugin system factory
 */
export interface PluginSystem {
  readonly loader: PluginLoader;
  readonly dependencyGraph: DependencyGraph;
  readonly dependencyInjector: DependencyInjector;
  readonly sandbox: PluginSandbox;
}

/**
 * Plugin system configuration
 */
export interface PluginSystemConfig {
  readonly pluginPaths?: readonly string[];
  readonly sandboxLimits?: Partial<ResourceLimits>;
  readonly resolutionOptions?: Partial<ResolutionOptions>;
  readonly hotReload?: boolean;
  readonly logger?: PluginLogger;
}

/**
 * Create a complete plugin system instance
 */
export function createPluginSystem(config: PluginSystemConfig = {}): PluginSystem {
  const logger = config.logger || {
    debug: (msg, meta) => console.debug(`[PluginSystem] ${msg}`, meta),
    info: (msg, meta) => console.info(`[PluginSystem] ${msg}`, meta),
    warn: (msg, meta) => console.warn(`[PluginSystem] ${msg}`, meta),
    error: (msg, meta) => console.error(`[PluginSystem] ${msg}`, meta)
  };

  const loader = createPluginLoader(config.pluginPaths, logger);
  const dependencyGraph = createDependencyGraph();
  const dependencyInjector = createDependencyInjector();
  const sandbox = createPluginSandbox(config.sandboxLimits, logger);

  // Enable hot reload if requested
  if (config.hotReload) {
    loader.enableHotReload(true);
  }

  return {
    loader,
    dependencyGraph,
    dependencyInjector,
    sandbox
  };
}