/**
 * Plugin system types for OvenJS
 * Simplified plugin architecture types
 */

// ============================================================================
// CORE PLUGIN INTERFACES
// ============================================================================

/**
 * Base plugin interface that all plugins must implement
 */
export interface Plugin {
  /** Unique plugin identifier */
  readonly name: string;
  
  /** Plugin version following semver */
  readonly version: string;
  
  /** Optional plugin description */
  readonly description?: string;
  
  /** Plugin author information */
  readonly author?: string | PluginAuthor;
  
  /** Plugin dependencies */
  readonly dependencies?: PluginDependency[];
  
  /** Plugin configuration schema */
  readonly configSchema?: PluginConfigSchema;
  
  /**
   * Called when the plugin is loaded
   * @param context - Plugin execution context
   */
  load(context: PluginContext): Promise<void> | void;
  
  /**
   * Called when the plugin is unloaded
   */
  unload(): Promise<void> | void;
}

/**
 * Plugin author information
 */
export interface PluginAuthor {
  name: string;
  email?: string;
  url?: string;
}

/**
 * Plugin dependency specification
 */
export interface PluginDependency {
  name: string;
  version: string;
  optional?: boolean;
}

/**
 * Plugin configuration schema
 */
export interface PluginConfigSchema {
  [key: string]: PluginConfigSchemaProperty;
}

export interface PluginConfigSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  default?: any;
  required?: boolean;
  enum?: any[];
  properties?: PluginConfigSchema;
  items?: PluginConfigSchemaProperty;
}

// ============================================================================
// PLUGIN CONTEXT
// ============================================================================

/**
 * Context provided to plugins during execution
 */
export interface PluginContext {
  /** Plugin configuration */
  readonly config: Record<string, any>;
  
  /** Plugin logger instance */
  readonly logger: PluginLogger;
  
  /** Hook manager for event registration */
  readonly hooks: HookManager;
  
  /** Reference to the main client (will be available after core package) */
  readonly client?: any; // Will be typed as OvenClient when core is implemented
  
  /** Plugin-specific data storage */
  readonly storage: PluginStorage;
}

/**
 * Plugin logger interface
 */
export interface PluginLogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

/**
 * Plugin data storage interface
 */
export interface PluginStorage {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

// ============================================================================
// HOOK SYSTEM
// ============================================================================

/**
 * Hook manager for plugin event system
 */
export interface HookManager {
  /**
   * Register a hook handler
   * @param event - Event name to hook into
   * @param handler - Handler function
   * @param priority - Handler priority (higher = earlier execution)
   */
  register<T extends any[]>(
    event: string,
    handler: HookHandler<T>,
    priority?: number
  ): void;
  
  /**
   * Unregister a hook handler
   * @param event - Event name
   * @param handler - Handler function to remove
   */
  unregister<T extends any[]>(event: string, handler: HookHandler<T>): void;
  
  /**
   * Execute all handlers for an event
   * @param event - Event name
   * @param args - Arguments to pass to handlers
   */
  execute<T extends any[]>(event: string, ...args: T): Promise<void>;
  
  /**
   * Execute handlers and allow them to modify data
   * @param event - Event name
   * @param data - Data to be modified by handlers
   */
  filter<T>(event: string, data: T): Promise<T>;
}

/**
 * Hook handler function type
 */
export type HookHandler<T extends any[] = any[]> = (...args: T) => Promise<void> | void;

/**
 * Hook filter function type
 */
export type HookFilter<T = any> = (data: T) => Promise<T> | T;

// ============================================================================
// PLUGIN MANAGER
// ============================================================================

/**
 * Plugin manager configuration
 */
export interface PluginManagerConfig {
  /** Directory to load plugins from */
  pluginDir?: string;
  
  /** Enable plugin hot reloading */
  hotReload?: boolean;
  
  /** Maximum plugin load timeout in milliseconds */
  loadTimeout?: number;
  
  /** Plugin configuration overrides */
  pluginConfigs?: Record<string, Record<string, any>>;
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Plugin instance */
  plugin: Plugin;
  
  /** Plugin configuration */
  config: Record<string, any>;
  
  /** Plugin load state */
  state: PluginState;
  
  /** Plugin load/unload timestamps */
  timestamps: {
    loaded?: Date;
    unloaded?: Date;
  };
  
  /** Plugin errors */
  errors: PluginError[];
}

/**
 * Plugin state enumeration
 */
export enum PluginState {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  UNLOADING = 'unloading',
  ERROR = 'error',
}

/**
 * Plugin error information
 */
export interface PluginError {
  message: string;
  stack?: string;
  timestamp: Date;
  phase: 'load' | 'unload' | 'runtime';
}

// ============================================================================
// PLUGIN EVENTS
// ============================================================================

/**
 * Plugin lifecycle events
 */
export interface PluginEvents {
  'plugin:beforeLoad': [plugin: Plugin, config: Record<string, any>];
  'plugin:afterLoad': [plugin: Plugin];
  'plugin:beforeUnload': [plugin: Plugin];
  'plugin:afterUnload': [plugin: Plugin];
  'plugin:error': [plugin: Plugin, error: Error];
  'plugins:ready': [];
}

// ============================================================================
// HOOK EVENTS (Common hooks that plugins can use)
// ============================================================================

/**
 * Common hook events that will be available
 */
export interface CommonHookEvents {
  // Client events
  'client:ready': [];
  'client:disconnect': [code: number, reason: string];
  
  // Message events
  'message:create': [message: any]; // Will be typed when Message type is available
  'message:update': [oldMessage: any, newMessage: any];
  'message:delete': [message: any];
  
  // Guild events
  'guild:create': [guild: any]; // Will be typed when Guild type is available
  'guild:update': [oldGuild: any, newGuild: any];
  'guild:delete': [guild: any];
  
  // Member events
  'member:add': [member: any]; // Will be typed when GuildMember type is available
  'member:remove': [member: any];
  'member:update': [oldMember: any, newMember: any];
  
  // Channel events
  'channel:create': [channel: any]; // Will be typed when Channel type is available
  'channel:update': [oldChannel: any, newChannel: any];
  'channel:delete': [channel: any];
  
  // Role events
  'role:create': [role: any]; // Will be typed when Role type is available
  'role:update': [oldRole: any, newRole: any];
  'role:delete': [role: any];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract event handler type from hook events
 */
export type HookEventHandler<T extends keyof CommonHookEvents> = HookHandler<CommonHookEvents[T]>;

/**
 * Plugin factory function type
 */
export type PluginFactory<T extends Plugin = Plugin> = () => T | Promise<T>;

/**
 * Plugin configuration type
 */
export type PluginConfig<T extends Plugin = Plugin> = T extends { configSchema: infer S }
  ? S extends PluginConfigSchema
    ? ConfigFromSchema<S>
    : Record<string, any>
  : Record<string, any>;

/**
 * Extract configuration type from schema
 */
type ConfigFromSchema<T extends PluginConfigSchema> = {
  [K in keyof T]: T[K] extends { type: 'string' }
    ? string
    : T[K] extends { type: 'number' }
    ? number
    : T[K] extends { type: 'boolean' }
    ? boolean
    : T[K] extends { type: 'array' }
    ? any[]
    : T[K] extends { type: 'object' }
    ? Record<string, any>
    : any;
};