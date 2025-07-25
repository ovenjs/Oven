/**
 * @fileoverview Dependency graph for plugin dependency resolution
 */

// Import types from centralized location
import type { 
  PluginMetadata,
  DependencyGraph as IDependencyGraph
} from '@ovenjs/types/plugins';

/**
 * Dependency node in the graph
 */
export interface DependencyNode {
  readonly name: string;
  readonly version: string;
  readonly dependencies: readonly string[];
  readonly peerDependencies: readonly string[];
  readonly optionalDependencies: readonly string[];
}

/**
 * Circular dependency error
 */
export class CircularDependencyError extends Error {
  constructor(
    public readonly pluginName: string,
    public readonly chain: readonly string[]
  ) {
    super(`Circular dependency detected for plugin ${pluginName}: ${chain.join(' -> ')}`);
    this.name = 'CircularDependencyError';
  }
}

/**
 * Dependency graph for managing plugin dependencies
 */
export class DependencyGraph implements IDependencyGraph {
  private readonly nodes = new Map<string, DependencyNode>();
  private readonly edges = new Map<string, Set<string>>();

  /**
   * Add a plugin to the dependency graph
   */
  public addPlugin(plugin: PluginMetadata): void {
    const node: DependencyNode = {
      name: plugin.name,
      version: plugin.version,
      dependencies: plugin.dependencies || [],
      peerDependencies: plugin.peerDependencies || [],
      optionalDependencies: plugin.optionalDependencies || []
    };

    this.nodes.set(plugin.name, node);
    
    // Add edges for dependencies
    for (const dep of node.dependencies) {
      this.addEdge(plugin.name, dep);
    }
  }

  /**
   * Remove a plugin from the dependency graph
   */
  public removePlugin(pluginName: string): void {
    this.nodes.delete(pluginName);
    this.edges.delete(pluginName);
    
    // Remove edges pointing to this plugin
    for (const [, dependents] of this.edges) {
      dependents.delete(pluginName);
    }
  }

  /**
   * Get load order for all plugins
   */
  public getLoadOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: string[] = [];

    const visit = (nodeName: string): void => {
      if (visiting.has(nodeName)) {
        const chain = Array.from(visiting);
        chain.push(nodeName);
        throw new CircularDependencyError(nodeName, chain);
      }
      if (visited.has(nodeName)) return;

      visiting.add(nodeName);
      
      const node = this.nodes.get(nodeName);
      if (node) {
        for (const dep of node.dependencies) {
          visit(dep);
        }
      }
      
      visiting.delete(nodeName);
      visited.add(nodeName);
      sorted.push(nodeName);
    };

    for (const nodeName of this.nodes.keys()) {
      visit(nodeName);
    }

    return sorted;
  }

  /**
   * Get dependents of a plugin
   */
  public getDependents(pluginName: string): string[] {
    const dependents: string[] = [];
    
    for (const [name, node] of this.nodes) {
      if (node.dependencies.includes(pluginName)) {
        dependents.push(name);
      }
    }
    
    return dependents;
  }

  /**
   * Check if plugin exists in graph
   */
  public hasPlugin(pluginName: string): boolean {
    return this.nodes.has(pluginName);
  }

  /**
   * Get plugin node
   */
  public getPlugin(pluginName: string): DependencyNode | undefined {
    return this.nodes.get(pluginName);
  }

  /**
   * Check if there are any circular dependencies in the graph
   */
  public hasCycles(): boolean {
    try {
      this.getLoadOrder();
      return false;
    } catch (error) {
      return error instanceof CircularDependencyError;
    }
  }

  /**
   * Get all plugins in the graph
   */
  public getAllPlugins(): string[] {
    return Array.from(this.nodes.keys());
  }

  /**
   * Private method to add an edge
   */
  private addEdge(from: string, to: string): void {
    if (!this.edges.has(from)) {
      this.edges.set(from, new Set());
    }
    this.edges.get(from)!.add(to);
  }
}