/**
 * @fileoverview Plugin discovery type definitions
 */

import type { Brand, ISO8601Timestamp } from '../primitives/index.js';
import type { PluginMetadata } from './metadata.js';
import type { PluginError } from './core.js';

/**
 * Plugin discovery interface
 */
export interface PluginDiscovery {
  discover(sources: readonly PluginDiscoverySource[]): Promise<PluginDiscoveryResult>;
  scan(directory: string, options?: PluginScanOptions): Promise<PluginDiscoveryResult>;
  validate(pluginPath: string): Promise<PluginValidationResult>;
  getCache(): PluginDiscoveryCache;
  clearCache(): void;
}

/**
 * Plugin discovery source
 */
export interface PluginDiscoverySource {
  readonly type: PluginSourceType;
  readonly location: string;
  readonly options?: PluginSourceOptions;
  readonly priority?: number;
  readonly enabled?: boolean;
}

/**
 * Plugin source types
 */
export enum PluginSourceType {
  DIRECTORY = 'directory',
  NPM_REGISTRY = 'npm_registry',
  GIT_REPOSITORY = 'git_repository',
  URL = 'url',
  MARKETPLACE = 'marketplace'
}

/**
 * Plugin source options
 */
export interface PluginSourceOptions {
  readonly recursive?: boolean;
  readonly pattern?: string;
  readonly exclude?: readonly string[];
  readonly cache?: boolean;
  readonly timeout?: number;
  readonly credentials?: PluginSourceCredentials;
}

/**
 * Plugin source credentials
 */
export interface PluginSourceCredentials {
  readonly username?: string;
  readonly password?: string;
  readonly token?: string;
  readonly keyFile?: string;
}

/**
 * Plugin discovery result
 */
export interface PluginDiscoveryResult {
  readonly plugins: readonly DiscoveredPlugin[];
  readonly errors: readonly PluginDiscoveryError[];
  readonly statistics: PluginDiscoveryStatistics;
  readonly timestamp: ISO8601Timestamp;
  readonly sources: readonly string[];
}

/**
 * Discovered plugin
 */
export interface DiscoveredPlugin {
  readonly path: string;
  readonly metadata: PluginMetadata;
  readonly manifest?: PluginManifest;
  readonly source: PluginDiscoverySource;
  readonly valid: boolean;
  readonly issues: readonly PluginValidationIssue[];
  readonly discoveredAt: ISO8601Timestamp;
}

/**
 * Plugin manifest
 */
export interface PluginManifest {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly main?: string;
  readonly types?: string;
  readonly files?: readonly string[];
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
  readonly optionalDependencies?: Record<string, string>;
  readonly scripts?: Record<string, string>;
  readonly keywords?: readonly string[];
  readonly author?: string | PluginAuthor;
  readonly license?: string;
  readonly repository?: string | PluginRepository;
  readonly bugs?: string | PluginBugs;
  readonly homepage?: string;
  readonly engines?: Record<string, string>;
  readonly os?: readonly string[];
  readonly cpu?: readonly string[];
  readonly ovenjs?: Record<string, unknown>;
}

/**
 * Plugin author in manifest
 */
export interface PluginAuthor {
  readonly name: string;
  readonly email?: string;
  readonly url?: string;
}

/**
 * Plugin repository in manifest
 */
export interface PluginRepository {
  readonly type: string;
  readonly url: string;
  readonly directory?: string;
}

/**
 * Plugin bugs in manifest
 */
export interface PluginBugs {
  readonly url?: string;
  readonly email?: string;
}

/**
 * Plugin discovery error
 */
export interface PluginDiscoveryError extends PluginError {
  readonly source: PluginDiscoverySource;
  readonly path?: string;
}

/**
 * Plugin discovery statistics
 */
export interface PluginDiscoveryStatistics {
  readonly totalSources: number;
  readonly successfulSources: number;
  readonly failedSources: number;
  readonly totalPlugins: number;
  readonly validPlugins: number;
  readonly invalidPlugins: number;
  readonly duplicatePlugins: number;
  readonly duration: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
}

/**
 * Plugin scan options
 */
export interface PluginScanOptions {
  readonly recursive?: boolean;
  readonly maxDepth?: number;
  readonly followSymlinks?: boolean;
  readonly include?: readonly string[];
  readonly exclude?: readonly string[];
  readonly parallel?: boolean;
  readonly maxConcurrency?: number;
  readonly timeout?: number;
}

/**
 * Plugin validation result
 */
export interface PluginValidationResult {
  readonly valid: boolean;
  readonly metadata?: PluginMetadata;
  readonly manifest?: PluginManifest;
  readonly issues: readonly PluginValidationIssue[];
  readonly path: string;
  readonly validatedAt: ISO8601Timestamp;
}

/**
 * Plugin validation issue
 */
export interface PluginValidationIssue {
  readonly type: PluginValidationIssueType;
  readonly severity: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly file?: string;
  readonly line?: number;
  readonly column?: number;
  readonly suggestion?: string;
}

/**
 * Plugin validation issue types
 */
export enum PluginValidationIssueType {
  MISSING_MANIFEST = 'missing_manifest',
  INVALID_MANIFEST = 'invalid_manifest',
  MISSING_METADATA = 'missing_metadata',
  INVALID_METADATA = 'invalid_metadata',
  MISSING_ENTRY_POINT = 'missing_entry_point',
  INVALID_ENTRY_POINT = 'invalid_entry_point',
  MISSING_DEPENDENCY = 'missing_dependency',
  VERSION_CONFLICT = 'version_conflict',
  SECURITY_ISSUE = 'security_issue',
  SYNTAX_ERROR = 'syntax_error',
  TYPE_ERROR = 'type_error'
}

/**
 * Plugin discovery cache
 */
export interface PluginDiscoveryCache {
  get(path: string): DiscoveredPlugin | null;
  set(path: string, plugin: DiscoveredPlugin): void;
  delete(path: string): boolean;
  clear(): void;
  has(path: string): boolean;
  size(): number;
  keys(): readonly string[];
  values(): readonly DiscoveredPlugin[];
  entries(): readonly [string, DiscoveredPlugin][];
}

/**
 * Plugin discovery configuration
 */
export interface PluginDiscoveryConfig {
  readonly sources: readonly PluginDiscoverySource[];
  readonly cache: PluginDiscoveryCacheConfig;
  readonly validation: PluginDiscoveryValidationConfig;
  readonly concurrency: number;
  readonly timeout: number;
  readonly retry: PluginDiscoveryRetryConfig;
}

/**
 * Plugin discovery cache configuration
 */
export interface PluginDiscoveryCacheConfig {
  readonly enabled: boolean;
  readonly ttl: number;
  readonly maxSize: number;
  readonly persistToDisk: boolean;
  readonly diskPath?: string;
}

/**
 * Plugin discovery validation configuration
 */
export interface PluginDiscoveryValidationConfig {
  readonly enabled: boolean;
  readonly strict: boolean;
  readonly checkSecurity: boolean;
  readonly checkDependencies: boolean;
  readonly allowWarnings: boolean;
}

/**
 * Plugin discovery retry configuration
 */
export interface PluginDiscoveryRetryConfig {
  readonly maxAttempts: number;
  readonly delay: number;
  readonly backoff: 'linear' | 'exponential';
  readonly maxDelay: number;
}

/**
 * Plugin marketplace interface
 */
export interface PluginMarketplace {
  search(query: PluginMarketplaceQuery): Promise<PluginMarketplaceResult>;
  getPlugin(name: string): Promise<MarketplacePlugin | null>;
  getVersions(name: string): Promise<readonly string[]>;
  download(name: string, version?: string): Promise<string>;
  publish(plugin: PluginPackage): Promise<void>;
  unpublish(name: string, version?: string): Promise<void>;
}

/**
 * Plugin marketplace query
 */
export interface PluginMarketplaceQuery {
  readonly text?: string;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly author?: string;
  readonly minRating?: number;
  readonly maxPrice?: number;
  readonly license?: string;
  readonly sort?: 'relevance' | 'downloads' | 'rating' | 'updated';
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Plugin marketplace result
 */
export interface PluginMarketplaceResult {
  readonly plugins: readonly MarketplacePlugin[];
  readonly total: number;
  readonly query: PluginMarketplaceQuery;
  readonly facets?: PluginMarketplaceFacets;
}

/**
 * Marketplace plugin
 */
export interface MarketplacePlugin {
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly version: string;
  readonly versions: readonly string[];
  readonly author: PluginAuthor;
  readonly category: string;
  readonly tags: readonly string[];
  readonly license: string;
  readonly downloads: number;
  readonly rating: PluginRating;
  readonly price?: number;
  readonly currency?: string;
  readonly screenshots?: readonly string[];
  readonly readme?: string;
  readonly updatedAt: ISO8601Timestamp;
  readonly publishedAt: ISO8601Timestamp;
}

/**
 * Plugin rating
 */
export interface PluginRating {
  readonly average: number;
  readonly count: number;
  readonly distribution: Record<number, number>;
}

/**
 * Plugin marketplace facets
 */
export interface PluginMarketplaceFacets {
  readonly categories: Record<string, number>;
  readonly tags: Record<string, number>;
  readonly authors: Record<string, number>;
  readonly licenses: Record<string, number>;
}

/**
 * Plugin package for publishing
 */
export interface PluginPackage {
  readonly manifest: PluginManifest;
  readonly files: readonly PluginPackageFile[];
  readonly metadata: PluginMetadata;
  readonly readme?: string;
  readonly changelog?: string;
  readonly license?: string;
}

/**
 * Plugin package file
 */
export interface PluginPackageFile {
  readonly path: string;
  readonly content: string | Buffer;
  readonly encoding?: string;
}

/**
 * Branded types for discovery
 */
export type DiscoveryId = Brand<string, 'DiscoveryId'>;
export type SourceId = Brand<string, 'SourceId'>;
export type MarketplaceId = Brand<string, 'MarketplaceId'>;