/**
 * @fileoverview Dynamic Plugin Loader for OvenJS
 * Enables runtime plugin discovery, loading, and hot-reloading without application restart
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join, resolve, dirname } from 'path';
import { pathToFileURL } from 'url';
import { watch } from 'chokidar';

/**
 * Plugin manifest structure
 */
export interface PluginManifest {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly author?: string;
  readonly homepage?: string;
  readonly repository?: string;
  readonly compatibility: string; // OvenJS version range
  readonly main: string; // Entry point file
  readonly dependencies: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
  readonly hooks: readonly string[]; // Hook points this plugin uses
  readonly permissions: readonly PluginPermission[];
  readonly config?: PluginConfigSchema;
  readonly exports?: Record<string, string>;
  readonly files?: readonly string[];
}

/**
 * Plugin permissions for security sandbox
 */
export interface PluginPermission {
  readonly type: 'api' | 'filesystem' | 'network' | 'process' | 'memory';
  readonly resource: string;
  readonly access: 'read' | 'write' | 'execute' | 'all';
  readonly reason?: string;
}

/**
 * Plugin configuration schema
 */
export interface PluginConfigSchema {
  readonly type: 'object';
  readonly properties: Record<string, ConfigProperty>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
}

export interface ConfigProperty {
  readonly type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  readonly description?: string;
  readonly default?: any;
  readonly enum?: readonly any[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly items?: ConfigProperty;
  readonly properties?: Record<string, ConfigProperty>;
}

/**
 * Loaded plugin instance
 */
export interface LoadedPlugin {
  readonly manifest: PluginManifest;
  readonly instance: PluginInstance;
  readonly status: PluginStatus;
  readonly loadTime: Date;
  readonly path: string;
  readonly dependencies: readonly LoadedPlugin[];
  readonly dependents: readonly LoadedPlugin[];
  readonly config: Record<string, any>;
  readonly metrics: PluginMetrics;
}

/**
 * Plugin instance interface that all plugins must implement
 */
export interface PluginInstance {
  readonly name: string;
  readonly version: string;
  initialize(context: PluginContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
  configure?(config: Record<string, any>): Promise<void> | void;
  getHealth?(): PluginHealth;
}

/**
 * Plugin context provided during initialization
 */
export interface PluginContext {
  readonly client: any; // OvenJS Client instance
  readonly logger: PluginLogger;
  readonly config: Record<string, any>;
  readonly events: EventEmitter;
  readonly hooks: HookManager;
  readonly cache: CacheManager;
  readonly metrics: MetricsCollector;
}

export interface PluginLogger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string | Error, meta?: Record<string, any>): void;
}

export interface HookManager {
  register(hookName: string, handler: Function, priority?: number): void;
  unregister(hookName: string, handler: Function): void;
}

export interface CacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
}

export interface MetricsCollector {
  increment(metric: string, value?: number, tags?: Record<string, string>): void;
  decrement(metric: string, value?: number, tags?: Record<string, string>): void;
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
  histogram(metric: string, value: number, tags?: Record<string, string>): void;
  timing(metric: string, duration: number, tags?: Record<string, string>): void;
}

/**
 * Plugin status enumeration
 */
export enum PluginStatus {
  DISCOVERED = 'discovered',
  LOADING = 'loading',
  LOADED = 'loaded',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  ERROR = 'error',
  UNLOADING = 'unloading',
  UNLOADED = 'unloaded'
}

/**
 * Plugin health information
 */
export interface PluginHealth {
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly checks: readonly HealthCheck[];
  readonly lastCheck: Date;
}

export interface HealthCheck {
  readonly name: string;
  readonly status: 'pass' | 'warn' | 'fail';
  readonly message?: string;
  readonly observedValue?: any;
  readonly observedUnit?: string;
}

/**
 * Plugin metrics and statistics
 */
export interface PluginMetrics {
  readonly loadTime: number; // ms
  readonly initTime: number; // ms
  readonly memoryUsage: number; // bytes
  readonly cpuUsage: number; // percentage
  readonly apiCalls: number;
  readonly errors: number;
  readonly uptime: number; // ms
}

/**
 * Plugin discovery options
 */
export interface DiscoveryOptions {
  readonly paths: readonly string[];
  readonly patterns: readonly string[];
  readonly includeNodeModules: boolean;
  readonly includeDevDependencies: boolean;
  readonly maxDepth: number;
  readonly followSymlinks: boolean;
}

/**
 * Plugin loading options
 */
export interface LoadingOptions {
  readonly hotReload: boolean;
  readonly validateDependencies: boolean;
  readonly sandboxed: boolean;
  readonly timeout: number; // ms
  readonly maxRetries: number;
  readonly config: Record<string, any>;
}

/**
 * Plugin loader events
 */
export interface PluginLoaderEvents {
  'plugin:discovered': (manifest: PluginManifest) => void;
  'plugin:loading': (manifest: PluginManifest) => void;
  'plugin:loaded': (plugin: LoadedPlugin) => void;
  'plugin:error': (manifest: PluginManifest, error: Error) => void;
  'plugin:unloaded': (plugin: LoadedPlugin) => void;
  'plugin:reloaded': (plugin: LoadedPlugin) => void;
  'discovery:start': () => void;
  'discovery:complete': (count: number) => void;
}

/**
 * Main plugin loader interface
 */
export interface PluginLoader extends EventEmitter {
  discover(options?: Partial<DiscoveryOptions>): Promise<PluginManifest[]>;
  load(manifestOrPath: PluginManifest | string, options?: Partial<LoadingOptions>): Promise<LoadedPlugin>;
  unload(pluginId: string): Promise<void>;
  reload(pluginId: string): Promise<void>;
  get(pluginId: string): LoadedPlugin | null;
  getAll(): LoadedPlugin[];
  isLoaded(pluginId: string): boolean;
  enableHotReload(enabled: boolean): void;
  validateManifest(manifest: PluginManifest): ValidationResult;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly value?: any;
}

export interface ValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly value?: any;
}

/**
 * Default plugin loader implementation
 */
export class DefaultPluginLoader extends EventEmitter implements PluginLoader {
  private plugins = new Map<string, LoadedPlugin>();
  private manifestCache = new Map<string, PluginManifest>();
  private fileWatcher?: ReturnType<typeof watch>;
  private hotReloadEnabled = false;

  constructor(
    private readonly defaultPaths: readonly string[] = ['./plugins', './node_modules'],
    private readonly logger: PluginLogger
  ) {
    super();
  }

  /**
   * Discover plugins in specified paths
   */
  async discover(options: Partial<DiscoveryOptions> = {}): Promise<PluginManifest[]> {
    const opts: DiscoveryOptions = {
      paths: options.paths || this.defaultPaths,
      patterns: options.patterns || ['**/plugin.json', '**/package.json'],
      includeNodeModules: options.includeNodeModules ?? true,
      includeDevDependencies: options.includeDevDependencies ?? false,
      maxDepth: options.maxDepth ?? 5,
      followSymlinks: options.followSymlinks ?? false
    };

    this.emit('discovery:start');
    this.logger.info('Starting plugin discovery', { paths: opts.paths });

    const manifests: PluginManifest[] = [];

    for (const searchPath of opts.paths) {
      try {
        const foundManifests = await this.discoverInPath(searchPath, opts);
        manifests.push(...foundManifests);
      } catch (error) {
        this.logger.error('Error discovering plugins in path', { path: searchPath, error });
      }
    }

    // Remove duplicates based on plugin name
    const uniqueManifests = this.deduplicateManifests(manifests);

    this.emit('discovery:complete', uniqueManifests.length);
    this.logger.info('Plugin discovery complete', { found: uniqueManifests.length });

    return uniqueManifests;
  }

  /**
   * Load a plugin from manifest or path
   */
  async load(
    manifestOrPath: PluginManifest | string,
    options: Partial<LoadingOptions> = {}
  ): Promise<LoadedPlugin> {
    const opts: LoadingOptions = {
      hotReload: options.hotReload ?? this.hotReloadEnabled,
      validateDependencies: options.validateDependencies ?? true,
      sandboxed: options.sandboxed ?? true,
      timeout: options.timeout ?? 30000,
      maxRetries: options.maxRetries ?? 3,
      config: options.config ?? {}
    };

    let manifest: PluginManifest;
    let pluginPath: string;

    if (typeof manifestOrPath === 'string') {
      pluginPath = resolve(manifestOrPath);
      manifest = await this.loadManifest(pluginPath);
    } else {
      manifest = manifestOrPath;
      pluginPath = this.resolvePluginPath(manifest);
    }

    // Validate manifest
    const validation = this.validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Invalid plugin manifest: ${validation.errors[0]?.message}`);
    }

    // Check if already loaded
    if (this.plugins.has(manifest.name)) {
      throw new Error(`Plugin ${manifest.name} is already loaded`);
    }

    this.emit('plugin:loading', manifest);
    this.logger.info('Loading plugin', { name: manifest.name, version: manifest.version });

    const loadStartTime = Date.now();

    try {
      // Load the plugin module
      const instance = await this.loadPluginInstance(manifest, pluginPath, opts);
      
      // Create loaded plugin object
      const loadedPlugin: LoadedPlugin = {
        manifest,
        instance,
        status: PluginStatus.LOADED,
        loadTime: new Date(),
        path: pluginPath,
        dependencies: [], // Will be populated by dependency resolver
        dependents: [],
        config: opts.config,
        metrics: {
          loadTime: Date.now() - loadStartTime,
          initTime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          apiCalls: 0,
          errors: 0,
          uptime: 0
        }
      };

      this.plugins.set(manifest.name, loadedPlugin);

      // Setup hot reload if enabled
      if (opts.hotReload) {
        this.setupHotReload(loadedPlugin);
      }

      this.emit('plugin:loaded', loadedPlugin);
      this.logger.info('Plugin loaded successfully', { 
        name: manifest.name, 
        loadTime: loadedPlugin.metrics.loadTime 
      });

      return loadedPlugin;

    } catch (error) {
      this.emit('plugin:error', manifest, error as Error);
      this.logger.error('Failed to load plugin', { name: manifest.name, error });
      throw error;
    }
  }

  /**
   * Unload a plugin
   */
  async unload(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not loaded`);
    }

    this.logger.info('Unloading plugin', { name: pluginId });

    try {
      // Call plugin destroy method if available
      if (plugin.instance.destroy) {
        await plugin.instance.destroy();
      }

      // Remove from registry
      this.plugins.delete(pluginId);

      // Stop watching for hot reload
      if (this.hotReloadEnabled) {
        this.stopWatchingPlugin(plugin);
      }

      this.emit('plugin:unloaded', plugin);
      this.logger.info('Plugin unloaded successfully', { name: pluginId });

    } catch (error) {
      this.logger.error('Error unloading plugin', { name: pluginId, error });
      throw error;
    }
  }

  /**
   * Reload a plugin
   */
  async reload(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not loaded`);
    }

    this.logger.info('Reloading plugin', { name: pluginId });

    try {
      // Unload first
      await this.unload(pluginId);

      // Clear require cache for the plugin
      this.clearModuleCache(plugin.path);

      // Reload manifest and plugin
      const newManifest = await this.loadManifest(plugin.path);
      const newPlugin = await this.load(newManifest, { config: plugin.config });

      this.emit('plugin:reloaded', newPlugin);
      this.logger.info('Plugin reloaded successfully', { name: pluginId });

    } catch (error) {
      this.logger.error('Error reloading plugin', { name: pluginId, error });
      throw error;
    }
  }

  /**
   * Get a loaded plugin
   */
  get(pluginId: string): LoadedPlugin | null {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * Get all loaded plugins
   */
  getAll(): LoadedPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if a plugin is loaded
   */
  isLoaded(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Enable or disable hot reload
   */
  enableHotReload(enabled: boolean): void {
    this.hotReloadEnabled = enabled;
    
    if (enabled) {
      this.setupGlobalHotReload();
    } else {
      this.teardownGlobalHotReload();
    }
  }

  /**
   * Validate a plugin manifest
   */
  validateManifest(manifest: PluginManifest): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!manifest.name) {
      errors.push({ field: 'name', message: 'Plugin name is required' });
    }
    if (!manifest.version) {
      errors.push({ field: 'version', message: 'Plugin version is required' });
    }
    if (!manifest.main) {
      errors.push({ field: 'main', message: 'Plugin main entry point is required' });
    }
    if (!manifest.compatibility) {
      errors.push({ field: 'compatibility', message: 'Plugin compatibility version is required' });
    }

    // Validate version format
    if (manifest.version && !this.isValidSemVer(manifest.version)) {
      errors.push({ 
        field: 'version', 
        message: 'Plugin version must be valid semantic version', 
        value: manifest.version 
      });
    }

    // Validate hooks
    if (manifest.hooks && !Array.isArray(manifest.hooks)) {
      errors.push({ field: 'hooks', message: 'Plugin hooks must be an array' });
    }

    // Validate permissions
    if (manifest.permissions && !Array.isArray(manifest.permissions)) {
      errors.push({ field: 'permissions', message: 'Plugin permissions must be an array' });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Private helper methods
   */

  private async discoverInPath(searchPath: string, options: DiscoveryOptions): Promise<PluginManifest[]> {
    const manifests: PluginManifest[] = [];
    
    try {
      const entries = await fs.readdir(searchPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(searchPath, entry.name);
        
        if (entry.isDirectory()) {
          // Check for plugin.json or package.json in this directory
          for (const pattern of ['plugin.json', 'package.json']) {
            const manifestPath = join(fullPath, pattern);
            try {
              const manifest = await this.loadManifest(manifestPath);
              if (this.isValidPluginManifest(manifest)) {
                manifests.push(manifest);
                this.emit('plugin:discovered', manifest);
              }
            } catch {
              // Ignore files that don't exist or can't be parsed
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn('Could not read directory', { path: searchPath, error });
    }

    return manifests;
  }

  private async loadManifest(manifestPath: string): Promise<PluginManifest> {
    try {
      const content = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(content);
      
      // If it's a package.json, extract plugin info
      if (manifestPath.endsWith('package.json')) {
        return this.extractPluginManifestFromPackageJson(manifest);
      }
      
      return manifest;
    } catch (error) {
      throw new Error(`Failed to load manifest from ${manifestPath}: ${error}`);
    }
  }

  private extractPluginManifestFromPackageJson(packageJson: any): PluginManifest {
    const ovenjs = packageJson.ovenjs || {};
    
    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      author: packageJson.author,
      homepage: packageJson.homepage,
      repository: packageJson.repository,
      compatibility: ovenjs.compatibility || '*',
      main: packageJson.main || 'index.js',
      dependencies: packageJson.dependencies || {},
      peerDependencies: packageJson.peerDependencies,
      hooks: ovenjs.hooks || [],
      permissions: ovenjs.permissions || [],
      config: ovenjs.config,
      exports: packageJson.exports,
      files: packageJson.files
    };
  }

  private isValidPluginManifest(manifest: any): boolean {
    return manifest && 
           typeof manifest.name === 'string' && 
           typeof manifest.version === 'string' &&
           (manifest.hooks || manifest.ovenjs);
  }

  private deduplicateManifests(manifests: PluginManifest[]): PluginManifest[] {
    const seen = new Set<string>();
    return manifests.filter(manifest => {
      if (seen.has(manifest.name)) {
        return false;
      }
      seen.add(manifest.name);
      return true;
    });
  }

  private resolvePluginPath(manifest: PluginManifest): string {
    // This would be more complex in a real implementation
    // For now, assume the manifest contains the path
    return process.cwd();
  }

  private async loadPluginInstance(
    manifest: PluginManifest, 
    pluginPath: string, 
    options: LoadingOptions
  ): Promise<PluginInstance> {
    const entryPath = resolve(pluginPath, manifest.main);
    
    try {
      // Use dynamic import for ES modules
      const module = await import(pathToFileURL(entryPath).href);
      const PluginClass = module.default || module[manifest.name];
      
      if (!PluginClass) {
        throw new Error(`Plugin ${manifest.name} does not export a default class or named export`);
      }
      
      return new PluginClass();
    } catch (error) {
      throw new Error(`Failed to load plugin instance: ${error}`);
    }
  }

  private setupHotReload(plugin: LoadedPlugin): void {
    if (!this.fileWatcher) {
      this.fileWatcher = watch([], { ignored: /node_modules/ });
    }

    const watchPath = plugin.path;
    this.fileWatcher.add(watchPath);
    
    this.fileWatcher.on('change', (path) => {
      if (path.startsWith(watchPath)) {
        this.logger.info('Plugin file changed, reloading', { plugin: plugin.manifest.name, path });
        this.reload(plugin.manifest.name).catch(error => {
          this.logger.error('Hot reload failed', { plugin: plugin.manifest.name, error });
        });
      }
    });
  }

  private stopWatchingPlugin(plugin: LoadedPlugin): void {
    if (this.fileWatcher) {
      this.fileWatcher.unwatch(plugin.path);
    }
  }

  private setupGlobalHotReload(): void {
    // Setup global file watching for hot reload
  }

  private teardownGlobalHotReload(): void {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = undefined;
    }
  }

  private clearModuleCache(pluginPath: string): void {
    // Clear Node.js module cache for the plugin
    const resolvedPath = require.resolve(pluginPath);
    delete require.cache[resolvedPath];
  }

  private isValidSemVer(version: string): boolean {
    const semVerRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semVerRegex.test(version);
  }
}

/**
 * Create a default plugin loader instance
 */
export function createPluginLoader(
  paths?: readonly string[], 
  logger?: PluginLogger
): PluginLoader {
  const defaultLogger: PluginLogger = logger || {
    debug: (msg, meta) => console.debug(`[PluginLoader] ${msg}`, meta),
    info: (msg, meta) => console.info(`[PluginLoader] ${msg}`, meta),
    warn: (msg, meta) => console.warn(`[PluginLoader] ${msg}`, meta),
    error: (msg, meta) => console.error(`[PluginLoader] ${msg}`, meta)
  };

  return new DefaultPluginLoader(paths, defaultLogger);
}