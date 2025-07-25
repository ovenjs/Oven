/**
 * @fileoverview Advanced plugin manager with dependency resolution and sandboxing
 */

import { EventEmitter } from 'events';
import type { 
  Plugin, 
  PluginRegistryEntry, 
  PluginLoadOptions, 
  PluginUnloadOptions,
  PluginStatus,
  PluginEvents,
  PluginContext,
  PluginMetadata
} from './Plugin.js';
import type { PluginSandbox } from './PluginSandbox.js';
import type { DependencyGraph } from '../dependencies/DependencyGraph.js';
import type { HookManager } from '../hooks/HookManager.js';
import type { SecurityValidator } from '../utils/SecurityValidator.js';

/**
 * Advanced plugin manager with sophisticated lifecycle management
 */
export class PluginManager extends EventEmitter {
  private readonly registry = new Map<string, PluginRegistryEntry>();
  private readonly dependencyGraph: DependencyGraph;
  private readonly sandbox: PluginSandbox;
  private readonly hookManager: HookManager;
  private readonly securityValidator: SecurityValidator;
  private readonly loadingQueue = new Set<string>();
  private readonly unloadingQueue = new Set<string>();

  constructor(
    dependencyGraph: DependencyGraph,
    sandbox: PluginSandbox,
    hookManager: HookManager,
    securityValidator: SecurityValidator
  ) {
    super();
    this.dependencyGraph = dependencyGraph;
    this.sandbox = sandbox;
    this.hookManager = hookManager;
    this.securityValidator = securityValidator;
  }

  /**
   * Load a plugin with advanced dependency resolution
   */
  public async loadPlugin<TConfig = Record<string, unknown>>(
    pluginPath: string,
    options: PluginLoadOptions<TConfig> = {}
  ): Promise<Plugin<TConfig>> {
    const { config, force = false, timeout = 30000, retries = 3 } = options;

    // Check if already loading
    if (this.loadingQueue.has(pluginPath)) {
      throw new Error(`Plugin ${pluginPath} is already being loaded`);
    }

    // Check if already loaded
    if (this.registry.has(pluginPath) && !force) {
      throw new Error(`Plugin ${pluginPath} is already loaded`);
    }

    this.loadingQueue.add(pluginPath);

    try {
      // Load plugin in isolated context with retries
      const plugin = await this.loadWithRetries(pluginPath, config, retries, timeout);
      
      // Validate plugin security
      await this.securityValidator.validatePlugin(plugin);
      
      // Resolve dependencies
      await this.resolveDependencies(plugin.meta);
      
      // Register plugin
      const entry: PluginRegistryEntry = {
        plugin: plugin as Plugin,
        loadedAt: new Date(),
        status: 'loaded'
      };
      
      this.registry.set(plugin.meta.name, entry);
      
      // Initialize plugin
      await this.initializePlugin(plugin as Plugin);
      
      // Register hooks
      await this.hookManager.registerPluginHooks(plugin as Plugin);
      
      // Update status
      entry.status = 'initialized';
      
      this.emit('pluginLoaded', plugin as Plugin);
      
      return plugin;
    } catch (error) {
      this.emit('pluginError', null, error as Error);
      throw error;
    } finally {
      this.loadingQueue.delete(pluginPath);
    }
  }

  /**
   * Unload a plugin with cascade option
   */
  public async unloadPlugin(
    pluginName: string,
    options: PluginUnloadOptions = {}
  ): Promise<void> {
    const { force = false, timeout = 10000, cascade = true } = options;

    if (this.unloadingQueue.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is already being unloaded`);
    }

    const entry = this.registry.get(pluginName);
    if (!entry) {
      throw new Error(`Plugin ${pluginName} is not loaded`);
    }

    this.unloadingQueue.add(pluginName);

    try {
      // Handle dependent plugins if cascade is enabled
      if (cascade) {
        const dependents = this.dependencyGraph.getDependents(pluginName);
        for (const dependent of dependents) {
          await this.unloadPlugin(dependent, options);
        }
      }

      // Destroy plugin
      await this.destroyPlugin(entry.plugin, timeout);
      
      // Unregister hooks
      await this.hookManager.unregisterPluginHooks(entry.plugin);
      
      // Remove from registry
      this.registry.delete(pluginName);
      
      // Update dependency graph
      this.dependencyGraph.removePlugin(pluginName);
      
      this.emit('pluginUnloaded', entry.plugin);
    } catch (error) {
      this.emit('pluginError', entry.plugin, error as Error);
      if (!force) {
        throw error;
      }
    } finally {
      this.unloadingQueue.delete(pluginName);
    }
  }

  /**
   * Get plugin by name
   */
  public getPlugin<TConfig = Record<string, unknown>>(
    name: string
  ): Plugin<TConfig> | null {
    const entry = this.registry.get(name);
    return entry ? (entry.plugin as Plugin<TConfig>) : null;
  }

  /**
   * Check if plugin is loaded
   */
  public isLoaded(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * Get plugin status
   */
  public getPluginStatus(name: string): PluginStatus | null {
    const entry = this.registry.get(name);
    if (!entry) return null;

    return {
      name: entry.plugin.meta.name,
      version: entry.plugin.meta.version,
      status: entry.status,
      loadedAt: entry.loadedAt,
      error: entry.error?.message,
      dependencies: entry.plugin.meta.dependencies || [],
      dependents: this.dependencyGraph.getDependents(name),
      metrics: entry.plugin.getMetrics?.()
    };
  }

  /**
   * Shutdown all plugins
   */
  public async shutdown(): Promise<void> {
    const shutdownPromises: Promise<void>[] = [];
    
    for (const [name] of this.registry) {
      shutdownPromises.push(
        this.unloadPlugin(name, { force: true, timeout: 5000 })
      );
    }
    
    await Promise.allSettled(shutdownPromises);
    this.registry.clear();
    this.removeAllListeners();
  }

  /**
   * Private method to load plugin with retries
   */
  private async loadWithRetries<TConfig>(
    pluginPath: string,
    config: TConfig | undefined,
    retries: number,
    timeout: number
  ): Promise<Plugin<TConfig>> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const context = await this.sandbox.createContext();
        const plugin = await Promise.race([
          context.loadModule(pluginPath),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Plugin load timeout')), timeout)
          )
        ]);
        
        if (config) {
          await plugin.initialize(this.createPluginContext(plugin.meta.name, config));
        }
        
        return plugin;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    throw lastError || new Error('Unknown error during plugin loading');
  }

  /**
   * Private method to resolve dependencies
   */
  private async resolveDependencies(metadata: PluginMetadata): Promise<void> {
    // Add to dependency graph
    this.dependencyGraph.addPlugin(metadata);
    
    // Ensure dependencies are loaded
    if (metadata.dependencies) {
      for (const dependency of metadata.dependencies) {
        if (!this.registry.has(dependency)) {
          throw new Error(`Dependency ${dependency} is not loaded`);
        }
      }
    }
    
    // Check for circular dependencies
    const loadOrder = this.dependencyGraph.getLoadOrder();
    if (!loadOrder.includes(metadata.name)) {
      throw new Error(`Circular dependency detected for plugin ${metadata.name}`);
    }
  }

  /**
   * Private method to initialize plugin
   */
  private async initializePlugin(plugin: Plugin): Promise<void> {
    const context = this.createPluginContext(plugin.meta.name, plugin.config.defaults);
    
    // Call lifecycle beforeLoad hook
    await plugin.hooks.beforeLoad?.(context);
    
    // Initialize plugin
    await plugin.initialize(context);
    
    // Call lifecycle afterLoad hook
    await plugin.hooks.afterLoad?.(context);
    
    this.emit('pluginInitialized', plugin);
  }

  /**
   * Private method to destroy plugin
   */
  private async destroyPlugin(plugin: Plugin, timeout: number): Promise<void> {
    const context = this.createPluginContext(plugin.meta.name, plugin.config.defaults);
    
    try {
      // Call lifecycle beforeUnload hook
      await plugin.hooks.beforeUnload?.(context);
      
      // Destroy plugin with timeout
      await Promise.race([
        plugin.destroy(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Plugin destroy timeout')), timeout)
        )
      ]);
      
      // Call lifecycle afterUnload hook
      await plugin.hooks.afterUnload?.(context);
      
      this.emit('pluginDestroyed', plugin);
    } catch (error) {
      this.emit('pluginError', plugin, error as Error);
      throw error;
    }
  }

  /**
   * Private method to create plugin context
   */
  private createPluginContext(pluginName: string, config: unknown): PluginContext {
    return {
      pluginName,
      config
    };
  }

  // Event type declarations
  declare on: <K extends keyof PluginEvents>(
    event: K,
    listener: (...args: PluginEvents[K]) => void
  ) => this;
  
  declare emit: <K extends keyof PluginEvents>(
    event: K,
    ...args: PluginEvents[K]
  ) => boolean;
}