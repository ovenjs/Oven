/**
 * @fileoverview Plugin context for providing runtime services to plugins
 */

import type { PluginManager } from './PluginManager.js';
import type { HookManager } from '../hooks/HookManager.js';
import type { PluginSandbox } from './PluginSandbox.js';

/**
 * Plugin context providing access to runtime services
 */
export interface PluginContext {
  readonly plugins: PluginManager;
  readonly hooks: HookManager;
  readonly sandbox: PluginSandbox;
  readonly config: unknown;
}

/**
 * Extended plugin context with additional services
 */
export interface ExtendedPluginContext extends PluginContext {
  readonly logger: PluginLogger;
  readonly cache: PluginCache;
  readonly events: PluginEventBus;
  readonly metrics: PluginMetrics;
  readonly security: PluginSecurity;
}

/**
 * Plugin logger interface
 */
export interface PluginLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string | Error, meta?: Record<string, unknown>): void;
  fatal(message: string | Error, meta?: Record<string, unknown>): void;
}

/**
 * Plugin cache interface
 */
export interface PluginCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

/**
 * Plugin event bus interface
 */
export interface PluginEventBus {
  emit<T = unknown>(event: string, data: T): Promise<void>;
  on<T = unknown>(event: string, handler: (data: T) => void): () => void;
  once<T = unknown>(event: string, handler: (data: T) => void): () => void;
  off(event: string, handler: (data: unknown) => void): void;
  removeAllListeners(event?: string): void;
}

/**
 * Plugin metrics interface
 */
export interface PluginMetrics {
  counter(name: string, value?: number, tags?: Record<string, string>): void;
  gauge(name: string, value: number, tags?: Record<string, string>): void;
  histogram(name: string, value: number, tags?: Record<string, string>): void;
  timing(name: string, value: number, tags?: Record<string, string>): void;
  increment(name: string, tags?: Record<string, string>): void;
  decrement(name: string, tags?: Record<string, string>): void;
}

/**
 * Plugin security interface
 */
export interface PluginSecurity {
  validatePermission(permission: string): Promise<boolean>;
  requirePermission(permission: string): Promise<void>;
  checkRateLimit(key: string, limit: number, window: number): Promise<boolean>;
  sanitizeInput<T>(input: T): T;
  validateInput<T>(input: unknown, schema: ValidationSchema<T>): Promise<T>;
}

/**
 * Validation schema for input validation
 */
export interface ValidationSchema<T> {
  type: string;
  properties?: Record<keyof T, ValidationSchema<any>>;
  required?: (keyof T)[];
  additionalProperties?: boolean;
  custom?: (value: unknown) => boolean;
}

/**
 * Plugin context factory
 */
export class PluginContextFactory {
  private readonly plugins: PluginManager;
  private readonly hooks: HookManager;
  private readonly sandbox: PluginSandbox;
  private readonly logger: PluginLogger;
  private readonly cache: PluginCache;
  private readonly events: PluginEventBus;
  private readonly metrics: PluginMetrics;
  private readonly security: PluginSecurity;

  constructor(
    plugins: PluginManager,
    hooks: HookManager,
    sandbox: PluginSandbox,
    logger: PluginLogger,
    cache: PluginCache,
    events: PluginEventBus,
    metrics: PluginMetrics,
    security: PluginSecurity
  ) {
    this.plugins = plugins;
    this.hooks = hooks;
    this.sandbox = sandbox;
    this.logger = logger;
    this.cache = cache;
    this.events = events;
    this.metrics = metrics;
    this.security = security;
  }

  /**
   * Create a basic plugin context
   */
  public createContext(config: unknown): PluginContext {
    return {
      plugins: this.plugins,
      hooks: this.hooks,
      sandbox: this.sandbox,
      config
    };
  }

  /**
   * Create an extended plugin context with all services
   */
  public createExtendedContext(config: unknown): ExtendedPluginContext {
    return {
      plugins: this.plugins,
      hooks: this.hooks,
      sandbox: this.sandbox,
      config,
      logger: this.logger,
      cache: this.cache,
      events: this.events,
      metrics: this.metrics,
      security: this.security
    };
  }

  /**
   * Create a scoped context for a specific plugin
   */
  public createScopedContext(pluginName: string, config: unknown): ExtendedPluginContext {
    return {
      plugins: this.plugins,
      hooks: this.hooks,
      sandbox: this.sandbox,
      config,
      logger: this.createScopedLogger(pluginName),
      cache: this.createScopedCache(pluginName),
      events: this.createScopedEventBus(pluginName),
      metrics: this.createScopedMetrics(pluginName),
      security: this.security
    };
  }

  /**
   * Create a scoped logger for a plugin
   */
  private createScopedLogger(pluginName: string): PluginLogger {
    return {
      debug: (message, meta) => this.logger.debug(`[${pluginName}] ${message}`, meta),
      info: (message, meta) => this.logger.info(`[${pluginName}] ${message}`, meta),
      warn: (message, meta) => this.logger.warn(`[${pluginName}] ${message}`, meta),
      error: (message, meta) => this.logger.error(`[${pluginName}] ${message}`, meta),
      fatal: (message, meta) => this.logger.fatal(`[${pluginName}] ${message}`, meta)
    };
  }

  /**
   * Create a scoped cache for a plugin
   */
  private createScopedCache(pluginName: string): PluginCache {
    const prefix = `plugin:${pluginName}:`;
    
    return {
      get: <T>(key: string) => this.cache.get<T>(prefix + key),
      set: <T>(key: string, value: T, ttl?: number) => this.cache.set(prefix + key, value, ttl),
      delete: (key: string) => this.cache.delete(prefix + key),
      clear: async () => {
        const keys = await this.cache.keys();
        const pluginKeys = keys.filter(key => key.startsWith(prefix));
        await Promise.all(pluginKeys.map(key => this.cache.delete(key)));
      },
      has: (key: string) => this.cache.has(prefix + key),
      keys: async () => {
        const keys = await this.cache.keys();
        return keys.filter(key => key.startsWith(prefix)).map(key => key.slice(prefix.length));
      },
      size: async () => {
        const keys = await this.cache.keys();
        return keys.filter(key => key.startsWith(prefix)).length;
      }
    };
  }

  /**
   * Create a scoped event bus for a plugin
   */
  private createScopedEventBus(pluginName: string): PluginEventBus {
    const prefix = `plugin:${pluginName}:`;
    
    return {
      emit: <T>(event: string, data: T) => this.events.emit(prefix + event, data),
      on: <T>(event: string, handler: (data: T) => void) => this.events.on(prefix + event, handler),
      once: <T>(event: string, handler: (data: T) => void) => this.events.once(prefix + event, handler),
      off: (event: string, handler: (data: unknown) => void) => this.events.off(prefix + event, handler),
      removeAllListeners: (event?: string) => {
        if (event) {
          this.events.removeAllListeners(prefix + event);
        } else {
          this.events.removeAllListeners();
        }
      }
    };
  }

  /**
   * Create a scoped metrics for a plugin
   */
  private createScopedMetrics(pluginName: string): PluginMetrics {
    const addPluginTag = (tags: Record<string, string> = {}) => ({
      ...tags,
      plugin: pluginName
    });

    return {
      counter: (name, value, tags) => this.metrics.counter(name, value, addPluginTag(tags)),
      gauge: (name, value, tags) => this.metrics.gauge(name, value, addPluginTag(tags)),
      histogram: (name, value, tags) => this.metrics.histogram(name, value, addPluginTag(tags)),
      timing: (name, value, tags) => this.metrics.timing(name, value, addPluginTag(tags)),
      increment: (name, tags) => this.metrics.increment(name, addPluginTag(tags)),
      decrement: (name, tags) => this.metrics.decrement(name, addPluginTag(tags))
    };
  }
}