/**
 * @fileoverview Plugin context for providing runtime services to plugins
 */

// Re-export types from the central type definitions
export type {
  PluginContext,
  ExtendedPluginContext,
  PluginEnvironment,
  PluginServices
} from '@ovenjs/types/plugins';

import type {
  PluginContext,
  ExtendedPluginContext,
  PluginServices,
  PluginSandboxContext,
  PluginEnvironment
} from '@ovenjs/types/plugins';

/**
 * Plugin context factory
 */
export class PluginContextFactory {
  private readonly services: PluginServices;
  private readonly environment: PluginEnvironment;

  constructor(
    services: PluginServices,
    environment?: Partial<PluginEnvironment>
  ) {
    this.services = services;
    this.environment = {
      nodeVersion: process.version,
      ovenjsVersion: '0.1.0', // TODO: Get from package.json
      platform: process.platform,
      architecture: process.arch,
      development: process.env.NODE_ENV !== 'production',
      variables: process.env as Record<string, string>,
      ...environment
    };
  }

  /**
   * Create a basic plugin context
   */
  public createContext(pluginName: string, config: unknown): PluginContext {
    return {
      pluginName,
      config
    };
  }

  /**
   * Create an extended plugin context with all services
   */
  public createExtendedContext(
    pluginName: string, 
    config: unknown,
    sandbox: PluginSandboxContext
  ): ExtendedPluginContext {
    return {
      pluginName,
      config,
      services: this.services,
      sandbox,
      version: '0.1.0', // TODO: Get from plugin metadata
      environment: this.environment,
      metadata: {}
    };
  }
}