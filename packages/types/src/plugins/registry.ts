/**
 * @fileoverview Plugin registry type definitions
 */

import type { Brand, ISO8601Timestamp } from '../primitives/index.js';
import type { PluginMetadata } from './metadata.js';
import type { PluginStatus, PluginError } from './core.js';

/**
 * Plugin registry interface
 */
export interface PluginRegistry {
  register(plugin: PluginRegistryEntry): Promise<void>;
  unregister(pluginName: string): Promise<void>;
  get(pluginName: string): PluginRegistryEntry | null;
  getAll(): readonly PluginRegistryEntry[];
  getByStatus(status: PluginStatus): readonly PluginRegistryEntry[];
  has(pluginName: string): boolean;
  count(): number;
  clear(): Promise<void>;
  export(): PluginRegistrySnapshot;
  import(snapshot: PluginRegistrySnapshot): Promise<void>;
}

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry {
  readonly metadata: PluginMetadata;
  readonly loadedAt: ISO8601Timestamp;
  readonly initializedAt?: ISO8601Timestamp;
  readonly status: PluginStatus;
  readonly version: string;
  readonly path: string;
  readonly error?: PluginError;
  readonly dependencies: readonly string[];
  readonly dependents: readonly string[];
  readonly metrics?: PluginRegistryMetrics;
  readonly health?: PluginHealthStatus;
}

/**
 * Plugin registry metrics
 */
export interface PluginRegistryMetrics {
  readonly loadTime: number;
  readonly initTime: number;
  readonly memoryUsage: number;
  readonly cpuUsage: number;
  readonly errorCount: number;
  readonly restartCount: number;
  readonly lastActivity: ISO8601Timestamp;
}

/**
 * Plugin health status
 */
export interface PluginHealthStatus {
  readonly healthy: boolean;
  readonly score: number;
  readonly checks: readonly HealthCheck[];
  readonly lastCheck: ISO8601Timestamp;
  readonly nextCheck?: ISO8601Timestamp;
}

/**
 * Health check
 */
export interface HealthCheck {
  readonly name: string;
  readonly status: 'pass' | 'fail' | 'warn';
  readonly message?: string;
  readonly duration: number;
  readonly details?: Record<string, unknown>;
}

/**
 * Plugin registry snapshot
 */
export interface PluginRegistrySnapshot {
  readonly timestamp: ISO8601Timestamp;
  readonly version: string;
  readonly entries: readonly PluginRegistryEntry[];
  readonly metadata: PluginRegistryMetadata;
}

/**
 * Plugin registry metadata
 */
export interface PluginRegistryMetadata {
  readonly totalPlugins: number;
  readonly loadedPlugins: number;
  readonly failedPlugins: number;
  readonly memoryUsage: number;
  readonly diskUsage: number;
  readonly lastUpdated: ISO8601Timestamp;
}

/**
 * Plugin registry configuration
 */
export interface PluginRegistryConfig {
  readonly autoLoad: boolean;
  readonly loadTimeout: number;
  readonly healthCheckInterval: number;
  readonly metricsCollection: boolean;
  readonly persistSnapshots: boolean;
  readonly snapshotInterval: number;
  readonly maxSnapshots: number;
}

/**
 * Plugin registry events
 */
export interface PluginRegistryEvents {
  'registry:entry:added': [entry: PluginRegistryEntry];
  'registry:entry:removed': [pluginName: string];
  'registry:entry:updated': [pluginName: string, entry: PluginRegistryEntry];
  'registry:snapshot:created': [snapshot: PluginRegistrySnapshot];
  'registry:snapshot:restored': [snapshot: PluginRegistrySnapshot];
  'registry:health:checked': [pluginName: string, status: PluginHealthStatus];
  'registry:metrics:collected': [pluginName: string, metrics: PluginRegistryMetrics];
  'registry:error': [error: Error, context?: Record<string, unknown>];
}

/**
 * Plugin registry query
 */
export interface PluginRegistryQuery {
  readonly name?: string;
  readonly status?: PluginStatus | readonly PluginStatus[];
  readonly version?: string;
  readonly author?: string;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly dependencies?: readonly string[];
  readonly loadedBefore?: ISO8601Timestamp;
  readonly loadedAfter?: ISO8601Timestamp;
  readonly healthy?: boolean;
  readonly errorCount?: {
    readonly min?: number;
    readonly max?: number;
  };
}

/**
 * Plugin registry search result
 */
export interface PluginRegistrySearchResult {
  readonly entries: readonly PluginRegistryEntry[];
  readonly total: number;
  readonly query: PluginRegistryQuery;
  readonly executionTime: number;
}

/**
 * Plugin dependency graph
 */
export interface PluginDependencyGraph {
  readonly nodes: readonly PluginDependencyNode[];
  readonly edges: readonly PluginDependencyEdge[];
  readonly cycles: readonly string[][];
  readonly roots: readonly string[];
  readonly leaves: readonly string[];
}

/**
 * Plugin dependency node
 */
export interface PluginDependencyNode {
  readonly name: string;
  readonly version: string;
  readonly dependencies: readonly string[];
  readonly dependents: readonly string[];
  readonly depth: number;
  readonly critical: boolean;
}

/**
 * Plugin dependency edge
 */
export interface PluginDependencyEdge {
  readonly from: string;
  readonly to: string;
  readonly type: 'required' | 'optional' | 'peer';
  readonly version?: string;
}

/**
 * Plugin load order
 */
export interface PluginLoadOrder {
  readonly order: readonly string[];
  readonly parallelGroups: readonly string[][];
  readonly errors: readonly PluginLoadOrderError[];
}

/**
 * Plugin load order error
 */
export interface PluginLoadOrderError {
  readonly plugin: string;
  readonly type: 'missing_dependency' | 'circular_dependency' | 'version_conflict';
  readonly message: string;
  readonly dependencies?: readonly string[];
}

/**
 * Branded types for registry
 */
export type RegistryId = Brand<string, 'RegistryId'>;
export type SnapshotId = Brand<string, 'SnapshotId'>;
export type QueryId = Brand<string, 'QueryId'>;