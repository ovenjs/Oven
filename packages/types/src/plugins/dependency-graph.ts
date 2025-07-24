/**
 * @fileoverview Plugin Dependency Graph System for OvenJS
 * Automatically resolves plugin dependencies and determines optimal loading order
 */

import { PluginManifest } from './loader.js';

/**
 * Dependency graph node representing a plugin
 */
export interface DependencyNode {
  readonly id: string;
  readonly manifest: PluginManifest;
  readonly dependencies: Set<string>;
  readonly dependents: Set<string>;
  readonly resolved: boolean;
  readonly depth: number;
  readonly circular: boolean;
}

/**
 * Circular dependency information
 */
export interface CircularDependency {
  readonly cycle: readonly string[];
  readonly severity: 'warning' | 'error';
  readonly canResolve: boolean;
  readonly suggestedResolution?: string;
}

/**
 * Dependency validation result
 */
export interface DependencyValidationResult {
  readonly valid: boolean;
  readonly errors: readonly DependencyError[];
  readonly warnings: readonly DependencyWarning[];
  readonly missing: readonly string[];
  readonly conflicts: readonly VersionConflict[];
}

export interface DependencyError {
  readonly type: 'missing' | 'circular' | 'version' | 'compatibility';
  readonly plugin: string;
  readonly dependency?: string;
  readonly message: string;
  readonly resolution?: string;
}

export interface DependencyWarning {
  readonly type: 'version' | 'compatibility' | 'optional';
  readonly plugin: string;
  readonly dependency?: string;
  readonly message: string;
  readonly suggestion?: string;
}

export interface VersionConflict {
  readonly dependency: string;
  readonly requiredBy: readonly VersionRequirement[];
  readonly resolution: 'latest' | 'specific' | 'manual';
  readonly resolvedVersion?: string;
}

export interface VersionRequirement {
  readonly plugin: string;
  readonly version: string;
  readonly range: string;
}

/**
 * Dependency resolution options
 */
export interface ResolutionOptions {
  readonly allowCircular: boolean;
  readonly circularBreaking: 'lazy' | 'weak' | 'error';
  readonly versionResolution: 'strict' | 'compatible' | 'latest';
  readonly missingDependencies: 'error' | 'warn' | 'ignore';
  readonly maxDepth: number;
  readonly hoisting: boolean;
}

/**
 * Dependency resolution result
 */
export interface ResolutionResult {
  readonly loadOrder: readonly string[];
  readonly graph: DependencyGraph;
  readonly validation: DependencyValidationResult;
  readonly metadata: ResolutionMetadata;
}

export interface ResolutionMetadata {
  readonly totalPlugins: number;
  readonly maxDepth: number;
  readonly resolutionTime: number;
  readonly hoistedDependencies: readonly string[];
  readonly breakingChanges: readonly string[];
}

/**
 * Main dependency graph interface
 */
export interface DependencyGraph {
  addPlugin(manifest: PluginManifest): void;
  removePlugin(pluginId: string): void;
  addDependency(pluginId: string, dependencyId: string, version?: string): void;
  removeDependency(pluginId: string, dependencyId: string): void;
  getNode(pluginId: string): DependencyNode | null;
  getAllNodes(): DependencyNode[];
  resolveLoadOrder(options?: Partial<ResolutionOptions>): ResolutionResult;
  detectCircularDependencies(): CircularDependency[];
  validateDependencies(options?: Partial<ResolutionOptions>): DependencyValidationResult;
  getDependents(pluginId: string): string[];
  getDependencies(pluginId: string): string[];
  getDepth(pluginId: string): number;
  clone(): DependencyGraph;
  merge(other: DependencyGraph): void;
  visualize(): string;
}

/**
 * Dependency injection container for managing plugin services
 */
export interface DependencyInjector {
  register<T>(token: string, implementation: T | (() => T), options?: InjectionOptions): void;
  registerSingleton<T>(token: string, implementation: T | (() => T)): void;
  registerTransient<T>(token: string, factory: () => T): void;
  resolve<T>(token: string): T;
  resolveAll<T>(token: string): T[];
  createScope(): DependencyScope;
  dispose(): Promise<void>;
}

export interface InjectionOptions {
  readonly scope: 'singleton' | 'transient' | 'scoped';
  readonly tags?: readonly string[];
  readonly priority?: number;
}

export interface DependencyScope {
  register<T>(token: string, implementation: T | (() => T)): void;
  resolve<T>(token: string): T;
  dispose(): Promise<void>;
}

/**
 * Advanced dependency graph implementation
 */
export class AdvancedDependencyGraph implements DependencyGraph {
  private nodes = new Map<string, DependencyNode>();
  private adjacencyList = new Map<string, Set<string>>();
  private reverseAdjacencyList = new Map<string, Set<string>>();

  /**
   * Add a plugin to the dependency graph
   */
  addPlugin(manifest: PluginManifest): void {
    if (this.nodes.has(manifest.name)) {
      throw new Error(`Plugin ${manifest.name} already exists in dependency graph`);
    }

    const node: DependencyNode = {
      id: manifest.name,
      manifest,
      dependencies: new Set(),
      dependents: new Set(),
      resolved: false,
      depth: 0,
      circular: false
    };

    this.nodes.set(manifest.name, node);
    this.adjacencyList.set(manifest.name, new Set());
    this.reverseAdjacencyList.set(manifest.name, new Set());

    // Add declared dependencies
    for (const [depName, depVersion] of Object.entries(manifest.dependencies || {})) {
      this.addDependency(manifest.name, depName, depVersion);
    }
  }

  /**
   * Remove a plugin from the dependency graph
   */
  removePlugin(pluginId: string): void {
    const node = this.nodes.get(pluginId);
    if (!node) {
      return;
    }

    // Remove all dependencies
    for (const depId of node.dependencies) {
      this.removeDependency(pluginId, depId);
    }

    // Remove all dependents
    for (const depId of node.dependents) {
      this.removeDependency(depId, pluginId);
    }

    this.nodes.delete(pluginId);
    this.adjacencyList.delete(pluginId);
    this.reverseAdjacencyList.delete(pluginId);
  }

  /**
   * Add a dependency relationship
   */
  addDependency(pluginId: string, dependencyId: string, version?: string): void {
    const pluginNode = this.nodes.get(pluginId);
    if (!pluginNode) {
      throw new Error(`Plugin ${pluginId} not found in dependency graph`);
    }

    // Add to adjacency lists
    this.adjacencyList.get(pluginId)?.add(dependencyId);
    if (!this.reverseAdjacencyList.has(dependencyId)) {
      this.reverseAdjacencyList.set(dependencyId, new Set());
    }
    this.reverseAdjacencyList.get(dependencyId)?.add(pluginId);

    // Update node relationships
    pluginNode.dependencies.add(dependencyId);
    const depNode = this.nodes.get(dependencyId);
    if (depNode) {
      depNode.dependents.add(pluginId);
    }
  }

  /**
   * Remove a dependency relationship
   */
  removeDependency(pluginId: string, dependencyId: string): void {
    const pluginNode = this.nodes.get(pluginId);
    if (!pluginNode) {
      return;
    }

    this.adjacencyList.get(pluginId)?.delete(dependencyId);
    this.reverseAdjacencyList.get(dependencyId)?.delete(pluginId);

    pluginNode.dependencies.delete(dependencyId);
    const depNode = this.nodes.get(dependencyId);
    if (depNode) {
      depNode.dependents.delete(pluginId);
    }
  }

  /**
   * Get a dependency node by ID
   */
  getNode(pluginId: string): DependencyNode | null {
    return this.nodes.get(pluginId) || null;
  }

  /**
   * Get all dependency nodes
   */
  getAllNodes(): DependencyNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Resolve the optimal loading order for all plugins
   */
  resolveLoadOrder(options: Partial<ResolutionOptions> = {}): ResolutionResult {
    const opts: ResolutionOptions = {
      allowCircular: options.allowCircular ?? false,
      circularBreaking: options.circularBreaking ?? 'error',
      versionResolution: options.versionResolution ?? 'compatible',
      missingDependencies: options.missingDependencies ?? 'error',
      maxDepth: options.maxDepth ?? 50,
      hoisting: options.hoisting ?? true
    };

    const startTime = Date.now();
    
    // Validate dependencies first
    const validation = this.validateDependencies(opts);
    
    if (!validation.valid && opts.missingDependencies === 'error') {
      throw new Error(`Dependency validation failed: ${validation.errors[0]?.message}`);
    }

    // Detect circular dependencies
    const circularDeps = this.detectCircularDependencies();
    
    if (circularDeps.length > 0 && !opts.allowCircular) {
      throw new Error(`Circular dependencies detected: ${circularDeps[0]?.cycle.join(' -> ')}`);
    }

    // Perform topological sort
    const loadOrder = this.topologicalSort(opts);
    
    // Calculate metadata
    const metadata: ResolutionMetadata = {
      totalPlugins: this.nodes.size,
      maxDepth: this.calculateMaxDepth(),
      resolutionTime: Date.now() - startTime,
      hoistedDependencies: [], // Would be calculated with hoisting
      breakingChanges: [] // Would be calculated with version analysis
    };

    return {
      loadOrder,
      graph: this.clone(),
      validation,
      metadata
    };
  }

  /**
   * Detect circular dependencies in the graph
   */
  detectCircularDependencies(): CircularDependency[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: CircularDependency[] = [];

    const dfs = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        const cycleStart = path.indexOf(nodeId);
        const cycle = [...path.slice(cycleStart), nodeId];
        
        cycles.push({
          cycle,
          severity: this.analyzeCycleSeverity(cycle),
          canResolve: this.canResolveCycle(cycle),
          suggestedResolution: this.suggestCycleResolution(cycle)
        });
        return;
      }

      if (visited.has(nodeId)) {
        return;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const dependencies = this.adjacencyList.get(nodeId) || new Set();
      for (const depId of dependencies) {
        dfs(depId, [...path, nodeId]);
      }

      recursionStack.delete(nodeId);
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }

  /**
   * Validate all dependencies in the graph
   */
  validateDependencies(options: Partial<ResolutionOptions> = {}): DependencyValidationResult {
    const errors: DependencyError[] = [];
    const warnings: DependencyWarning[] = [];
    const missing: string[] = [];
    const conflicts: VersionConflict[] = [];

    // Check for missing dependencies
    for (const node of this.nodes.values()) {
      for (const depId of node.dependencies) {
        if (!this.nodes.has(depId)) {
          missing.push(depId);
          errors.push({
            type: 'missing',
            plugin: node.id,
            dependency: depId,
            message: `Missing dependency: ${depId}`,
            resolution: 'Install the missing plugin or remove the dependency'
          });
        }
      }
    }

    // Check for version conflicts
    const versionConflicts = this.detectVersionConflicts();
    conflicts.push(...versionConflicts);

    for (const conflict of versionConflicts) {
      errors.push({
        type: 'version',
        plugin: conflict.requiredBy[0]?.plugin || 'unknown',
        dependency: conflict.dependency,
        message: `Version conflict for ${conflict.dependency}`,
        resolution: `Resolve to version ${conflict.resolvedVersion || 'latest'}`
      });
    }

    // Check circular dependencies
    const circularDeps = this.detectCircularDependencies();
    for (const circular of circularDeps) {
      if (circular.severity === 'error') {
        errors.push({
          type: 'circular',
          plugin: circular.cycle[0] || 'unknown',
          message: `Circular dependency: ${circular.cycle.join(' -> ')}`,
          resolution: circular.suggestedResolution
        });
      } else {
        warnings.push({
          type: 'version',
          plugin: circular.cycle[0] || 'unknown',
          message: `Circular dependency warning: ${circular.cycle.join(' -> ')}`,
          suggestion: circular.suggestedResolution
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      missing,
      conflicts
    };
  }

  /**
   * Get all plugins that depend on the given plugin
   */
  getDependents(pluginId: string): string[] {
    const dependents = this.reverseAdjacencyList.get(pluginId);
    return dependents ? Array.from(dependents) : [];
  }

  /**
   * Get all dependencies of the given plugin
   */
  getDependencies(pluginId: string): string[] {
    const dependencies = this.adjacencyList.get(pluginId);
    return dependencies ? Array.from(dependencies) : [];
  }

  /**
   * Get the depth of a plugin in the dependency tree
   */
  getDepth(pluginId: string): number {
    const visited = new Set<string>();
    
    const calculateDepth = (nodeId: string): number => {
      if (visited.has(nodeId)) {
        return 0; // Circular dependency, return 0 to avoid infinite recursion
      }
      
      visited.add(nodeId);
      const dependencies = this.getDependencies(nodeId);
      
      if (dependencies.length === 0) {
        return 0;
      }
      
      let maxDepth = 0;
      for (const depId of dependencies) {
        const depDepth = calculateDepth(depId);
        maxDepth = Math.max(maxDepth, depDepth + 1);
      }
      
      visited.delete(nodeId);
      return maxDepth;
    };

    return calculateDepth(pluginId);
  }

  /**
   * Create a deep copy of the dependency graph
   */
  clone(): DependencyGraph {
    const cloned = new AdvancedDependencyGraph();
    
    // Clone all nodes
    for (const node of this.nodes.values()) {
      cloned.addPlugin(node.manifest);
    }
    
    return cloned;
  }

  /**
   * Merge another dependency graph into this one
   */
  merge(other: DependencyGraph): void {
    for (const node of other.getAllNodes()) {
      if (!this.nodes.has(node.id)) {
        this.addPlugin(node.manifest);
      }
    }
  }

  /**
   * Generate a visual representation of the dependency graph
   */
  visualize(): string {
    const lines: string[] = ['Dependency Graph:'];
    
    for (const node of this.nodes.values()) {
      const deps = Array.from(node.dependencies);
      if (deps.length > 0) {
        lines.push(`${node.id} -> [${deps.join(', ')}]`);
      } else {
        lines.push(`${node.id} (no dependencies)`);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Private helper methods
   */

  private topologicalSort(options: ResolutionOptions): string[] {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const result: string[] = [];

    // Initialize in-degree count
    for (const nodeId of this.nodes.keys()) {
      inDegree.set(nodeId, 0);
    }

    // Calculate in-degrees
    for (const [nodeId, dependencies] of this.adjacencyList) {
      for (const depId of dependencies) {
        if (this.nodes.has(depId)) {
          inDegree.set(depId, (inDegree.get(depId) || 0) + 1);
        }
      }
    }

    // Find nodes with no incoming edges
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    // Process queue
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      const dependencies = this.adjacencyList.get(nodeId) || new Set();
      for (const depId of dependencies) {
        if (this.nodes.has(depId)) {
          const newDegree = (inDegree.get(depId) || 0) - 1;
          inDegree.set(depId, newDegree);
          
          if (newDegree === 0) {
            queue.push(depId);
          }
        }
      }
    }

    // Check for remaining nodes (circular dependencies)
    if (result.length !== this.nodes.size) {
      const remaining = Array.from(this.nodes.keys()).filter(id => !result.includes(id));
      if (options.allowCircular) {
        result.push(...remaining);
      } else {
        throw new Error(`Circular dependencies prevent topological sort: ${remaining.join(', ')}`);
      }
    }

    return result;
  }

  private calculateMaxDepth(): number {
    let maxDepth = 0;
    for (const nodeId of this.nodes.keys()) {
      const depth = this.getDepth(nodeId);
      maxDepth = Math.max(maxDepth, depth);
    }
    return maxDepth;
  }

  private analyzeCycleSeverity(cycle: string[]): 'warning' | 'error' {
    // Simple heuristic: short cycles are more problematic
    return cycle.length <= 3 ? 'error' : 'warning';
  }

  private canResolveCycle(cycle: string[]): boolean {
    // Check if any dependency in the cycle is optional
    for (let i = 0; i < cycle.length - 1; i++) {
      const node = this.nodes.get(cycle[i]);
      if (node) {
        // Check if the dependency is in peerDependencies (optional)
        const nextNodeId = cycle[i + 1];
        if (node.manifest.peerDependencies?.[nextNodeId]) {
          return true;
        }
      }
    }
    return false;
  }

  private suggestCycleResolution(cycle: string[]): string {
    if (this.canResolveCycle(cycle)) {
      return 'Make one of the dependencies optional or use lazy loading';
    }
    return 'Refactor plugins to remove circular dependency';
  }

  private detectVersionConflicts(): VersionConflict[] {
    const conflicts: VersionConflict[] = [];
    const dependencyVersions = new Map<string, VersionRequirement[]>();

    // Collect all version requirements
    for (const node of this.nodes.values()) {
      for (const [depName, depVersion] of Object.entries(node.manifest.dependencies || {})) {
        if (!dependencyVersions.has(depName)) {
          dependencyVersions.set(depName, []);
        }
        dependencyVersions.get(depName)!.push({
          plugin: node.id,
          version: depVersion,
          range: depVersion
        });
      }
    }

    // Check for conflicts
    for (const [depName, requirements] of dependencyVersions) {
      if (requirements.length > 1) {
        const versions = new Set(requirements.map(r => r.version));
        if (versions.size > 1) {
          conflicts.push({
            dependency: depName,
            requiredBy: requirements,
            resolution: 'latest',
            resolvedVersion: Array.from(versions)[0] // Simplified resolution
          });
        }
      }
    }

    return conflicts;
  }
}

/**
 * Simple dependency injection container implementation
 */
export class SimpleDependencyInjector implements DependencyInjector {
  private container = new Map<string, any>();
  private factories = new Map<string, () => any>();
  private singletons = new Map<string, any>();
  private scopes = new Map<string, DependencyScope>();

  register<T>(token: string, implementation: T | (() => T), options: InjectionOptions = { scope: 'singleton' }): void {
    if (typeof implementation === 'function' && options.scope === 'transient') {
      this.factories.set(token, implementation as () => T);
    } else if (options.scope === 'singleton') {
      this.registerSingleton(token, implementation);
    } else {
      this.container.set(token, implementation);
    }
  }

  registerSingleton<T>(token: string, implementation: T | (() => T)): void {
    if (typeof implementation === 'function') {
      this.factories.set(token, implementation as () => T);
    } else {
      this.singletons.set(token, implementation);
    }
  }

  registerTransient<T>(token: string, factory: () => T): void {
    this.factories.set(token, factory);
  }

  resolve<T>(token: string): T {
    // Check singletons first
    if (this.singletons.has(token)) {
      return this.singletons.get(token);
    }

    // Check factories
    if (this.factories.has(token)) {
      const factory = this.factories.get(token)!;
      const instance = factory();
      this.singletons.set(token, instance); // Cache as singleton
      return instance;
    }

    // Check container
    if (this.container.has(token)) {
      return this.container.get(token);
    }

    throw new Error(`No implementation found for token: ${token}`);
  }

  resolveAll<T>(token: string): T[] {
    // Simplified implementation - would support multiple registrations in a real system
    try {
      return [this.resolve<T>(token)];
    } catch {
      return [];
    }
  }

  createScope(): DependencyScope {
    const scopeId = Math.random().toString(36);
    const scope = new SimpleDependencyScope(this);
    this.scopes.set(scopeId, scope);
    return scope;
  }

  async dispose(): Promise<void> {
    // Dispose all scoped instances
    for (const scope of this.scopes.values()) {
      await scope.dispose();
    }
    
    this.container.clear();
    this.factories.clear();
    this.singletons.clear();
    this.scopes.clear();
  }
}

class SimpleDependencyScope implements DependencyScope {
  private scopedInstances = new Map<string, any>();

  constructor(private parent: DependencyInjector) {}

  register<T>(token: string, implementation: T | (() => T)): void {
    this.scopedInstances.set(token, implementation);
  }

  resolve<T>(token: string): T {
    if (this.scopedInstances.has(token)) {
      const impl = this.scopedInstances.get(token);
      return typeof impl === 'function' ? impl() : impl;
    }
    return this.parent.resolve<T>(token);
  }

  async dispose(): Promise<void> {
    // Dispose all scoped instances if they have a dispose method
    for (const instance of this.scopedInstances.values()) {
      if (instance && typeof instance.dispose === 'function') {
        await instance.dispose();
      }
    }
    this.scopedInstances.clear();
  }
}

/**
 * Create a default dependency graph instance
 */
export function createDependencyGraph(): DependencyGraph {
  return new AdvancedDependencyGraph();
}

/**
 * Create a default dependency injector instance
 */
export function createDependencyInjector(): DependencyInjector {
  return new SimpleDependencyInjector();
}