/**
 * @fileoverview Declaration merging system for dynamic API extensions
 * Allows plugins and extensions to augment core types and interfaces
 */

/**
 * Core extensible interfaces that can be augmented by plugins
 */

/**
 * Client extensions - plugins can add methods to the main client
 */
export interface ClientExtensions {
  // Base client interface - plugins extend this
}

/**
 * Channel extensions - plugins can add channel-specific functionality
 */
export interface ChannelExtensions {
  // Base channel interface - plugins extend this
}

/**
 * Guild extensions - plugins can add guild-specific functionality  
 */
export interface GuildExtensions {
  // Base guild interface - plugins extend this
}

/**
 * User extensions - plugins can add user-specific functionality
 */
export interface UserExtensions {
  // Base user interface - plugins extend this
}

/**
 * Message extensions - plugins can add message-specific functionality
 */
export interface MessageExtensions {
  // Base message interface - plugins extend this
}

/**
 * Event map extensions - plugins can add custom events
 */
export interface EventMapExtensions {
  // Base event map - plugins extend this with custom events
}

/**
 * REST endpoint extensions - plugins can add custom REST endpoints
 */
export interface RESTEndpointExtensions {
  // Base REST endpoints - plugins extend this
}

/**
 * WebSocket event extensions - plugins can add custom WebSocket events
 */
export interface WebSocketEventExtensions {
  // Base WebSocket events - plugins extend this
}

/**
 * Cache extensions - plugins can add custom cache strategies
 */
export interface CacheExtensions {
  // Base cache interface - plugins extend this
}

/**
 * Configuration extensions - plugins can add configuration options
 */
export interface ConfigurationExtensions {
  // Base configuration - plugins extend this
}

/**
 * Utility types for declaration merging
 */

/**
 * Extract extension methods from an interface
 */
export type ExtensionMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

/**
 * Extract extension properties from an interface
 */
export type ExtensionProperties<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K;
}[keyof T];

/**
 * Merge extensions into base type
 */
export type WithExtensions<TBase, TExtensions> = TBase & TExtensions;

/**
 * Plugin registration system for type-safe extensions
 */
export interface PluginDeclaration<TName extends string, TExtensions> {
  readonly name: TName;
  readonly extensions: TExtensions;
}

/**
 * Registry of all plugin extensions
 */
export interface PluginRegistry {
  // Plugins register their extensions here through declaration merging
}

/**
 * Extract all registered extensions from plugin registry
 */
export type AllExtensions = PluginRegistry extends Record<infer K, infer V> 
  ? K extends string 
    ? V 
    : never
  : never;

/**
 * Module augmentation templates for common extension patterns
 */

/**
 * Template for augmenting the main Client interface
 * Usage in plugin:
 * ```typescript
 * declare module '@ovenjs/types/advanced/merging' {
 *   interface ClientExtensions {
 *     myPluginMethod(): void;
 *     myPluginProperty: string;
 *   }
 * }
 * ```
 */
export interface ClientMergeTemplate {
  // Methods that can be added to the client
  [methodName: string]: (...args: any[]) => any;
}

/**
 * Template for augmenting event maps
 * Usage in plugin:
 * ```typescript
 * declare module '@ovenjs/types/advanced/merging' {
 *   interface EventMapExtensions {
 *     customEvent: [data: CustomData];
 *     anotherEvent: [id: string, payload: unknown];
 *   }
 * }
 * ```
 */
export interface EventMapMergeTemplate {
  [eventName: string]: unknown[];
}

/**
 * Template for augmenting REST endpoints
 * Usage in plugin:
 * ```typescript
 * declare module '@ovenjs/types/advanced/merging' {
 *   interface RESTEndpointExtensions {
 *     '/custom/endpoint': {
 *       get: { response: CustomResponse };
 *       post: { body: CustomBody; response: CustomResponse };
 *     };
 *   }
 * }
 * ```
 */
export interface RESTEndpointMergeTemplate {
  [endpoint: string]: {
    [method: string]: {
      body?: unknown;
      response?: unknown;
      query?: Record<string, unknown>;
      params?: Record<string, unknown>;
    };
  };
}

/**
 * Template for augmenting cache strategies
 * Usage in plugin:
 * ```typescript
 * declare module '@ovenjs/types/advanced/merging' {
 *   interface CacheExtensions {
 *     customCacheStrategy: CacheStrategy<CustomData>;
 *   }
 * }
 * ```
 */
export interface CacheMergeTemplate {
  [strategyName: string]: {
    get(key: string): unknown;
    set(key: string, value: unknown, ttl?: number): void;
    delete(key: string): boolean;
    clear(): void;
  };
}

/**
 * Advanced declaration merging utilities
 */

/**
 * Conditional merging based on feature flags
 */
export type ConditionalMerge<
  TBase, 
  TExtension, 
  TCondition extends boolean
> = TCondition extends true ? TBase & TExtension : TBase;

/**
 * Deep merging for nested extensions
 */
export type DeepMerge<T, U> = {
  [K in keyof T | keyof U]: K extends keyof U
    ? U[K]
    : K extends keyof T
    ? T[K]
    : never;
};

/**
 * Merge multiple extensions
 */
export type MergeExtensions<T extends readonly unknown[]> = T extends readonly [
  infer Head,
  ...infer Tail
]
  ? Head & MergeExtensions<Tail>
  : {};

/**
 * Extract plugin names from registry
 */
export type PluginNames = keyof PluginRegistry;

/**
 * Check if plugin is registered
 */
export type IsPluginRegistered<TName extends string> = TName extends PluginNames 
  ? true 
  : false;

/**
 * Get plugin extensions by name
 */
export type GetPluginExtensions<TName extends PluginNames> = PluginRegistry[TName];

/**
 * Type-safe plugin extension validator
 */
export type ValidateExtension<TExtension, TBase> = {
  [K in keyof TExtension]: K extends keyof TBase
    ? TExtension[K] extends TBase[K]
      ? TExtension[K]
      : never
    : TExtension[K];
};

/**
 * Runtime helpers for declaration merging
 */

/**
 * Mixin function for applying extensions to a base class
 */
export function applyMixins<TBase, TExtensions extends readonly any[]>(
  Base: new (...args: any[]) => TBase,
  ...Extensions: { [K in keyof TExtensions]: new (...args: any[]) => TExtensions[K] }
): new (...args: any[]) => TBase & TExtensions[number] {
  Extensions.forEach(Extension => {
    Object.getOwnPropertyNames(Extension.prototype).forEach(name => {
      if (name !== 'constructor') {
        (Base.prototype as any)[name] = Extension.prototype[name];
      }
    });
  });
  
  return Base as any;
}

/**
 * Extension registry for runtime tracking
 */
export class ExtensionRegistry {
  private static extensions = new Map<string, any>();
  
  static register<T>(name: string, extension: T): void {
    this.extensions.set(name, extension);
  }
  
  static get<T>(name: string): T | undefined {
    return this.extensions.get(name);
  }
  
  static has(name: string): boolean {
    return this.extensions.has(name);
  }
  
  static getAll(): Map<string, any> {
    return new Map(this.extensions);
  }
  
  static clear(): void {
    this.extensions.clear();
  }
}

/**
 * Decorator for automatically registering extensions
 */
export function Extension<T>(name: string) {
  return function(target: new (...args: any[]) => T) {
    ExtensionRegistry.register(name, target);
    return target;
  };
}

/**
 * Helper to create type-safe extension objects
 */
export function createExtension<T>(extension: T): T {
  return extension;
}

/**
 * Merge extensions at runtime
 */
export function mergeExtensions<TBase, TExtensions extends Record<string, any>>(
  base: TBase,
  extensions: TExtensions
): TBase & TExtensions {
  return Object.assign({}, base, extensions);
}

/**
 * Example usage documentation
 */

/**
 * Example: Plugin adding custom methods to Client
 * 
 * // In plugin file:
 * declare module '@ovenjs/types/advanced/merging' {
 *   interface ClientExtensions {
 *     customPluginMethod(data: string): Promise<boolean>;
 *     pluginProperty: number;
 *   }
 * }
 * 
 * // Implementation:
 * Client.prototype.customPluginMethod = async function(data: string) {
 *   // Plugin implementation
 *   return true;
 * };
 */

/**
 * Example: Plugin adding custom events
 * 
 * // In plugin file:
 * declare module '@ovenjs/types/advanced/merging' {
 *   interface EventMapExtensions {
 *     pluginEvent: [data: PluginEventData];
 *     pluginError: [error: PluginError];
 *   }
 * }
 */

/**
 * Example: Plugin adding REST endpoints
 * 
 * // In plugin file:
 * declare module '@ovenjs/types/advanced/merging' {
 *   interface RESTEndpointExtensions {
 *     '/plugin/data': {
 *       get: { response: PluginData[] };
 *       post: { body: CreatePluginData; response: PluginData };
 *     };
 *   }
 * }
 */