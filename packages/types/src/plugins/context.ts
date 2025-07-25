/**
 * @fileoverview Plugin context type definitions
 */

import type { 
  PluginServices,
  PluginSandboxContext 
} from './index.js';

/**
 * Basic plugin context interface
 */
export interface PluginContext {
  readonly pluginName: string;
  readonly config: unknown;
}

/**
 * Extended plugin context with full services
 */
export interface ExtendedPluginContext extends PluginContext {
  readonly services: PluginServices;
  readonly sandbox: PluginSandboxContext;
  readonly version: string;
  readonly environment: PluginEnvironment;
  readonly metadata: Record<string, unknown>;
}

/**
 * Plugin environment information
 */
export interface PluginEnvironment {
  readonly nodeVersion: string;
  readonly ovenjsVersion: string;
  readonly platform: string;
  readonly architecture: string;
  readonly development: boolean;
  readonly variables: Record<string, string>;
}

/**
 * Plugin context factory interface
 */
export interface PluginContextFactory {
  createContext(pluginName: string, config: unknown): PluginContext;
  createExtendedContext(pluginName: string, config: unknown): ExtendedPluginContext;
  updateContext(context: PluginContext, updates: Partial<PluginContext>): PluginContext;
  cloneContext(context: PluginContext): PluginContext;
}

/**
 * Plugin context validator
 */
export interface PluginContextValidator {
  validateContext(context: PluginContext): Promise<boolean>;
  sanitizeContext(context: PluginContext): PluginContext;
  enrichContext(context: PluginContext): Promise<ExtendedPluginContext>;
}