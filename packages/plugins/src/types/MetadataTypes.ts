/**
 * @fileoverview Plugin metadata type definitions
 */

import type { Brand, Phantom, URLString, ISO8601Timestamp } from '@ovenjs/types';

/**
 * Semantic version type
 */
export type SemverVersion = Brand<string, 'SemverVersion'>;

/**
 * Plugin author information
 */
export interface PluginAuthor {
  readonly name: string;
  readonly email?: string;
  readonly url?: URLString;
  readonly avatar?: URLString;
  readonly bio?: string;
  readonly social?: PluginAuthorSocial;
}

/**
 * Plugin author social links
 */
export interface PluginAuthorSocial {
  readonly github?: string;
  readonly twitter?: string;
  readonly discord?: string;
  readonly website?: URLString;
}

/**
 * Plugin repository information
 */
export interface PluginRepository {
  readonly type: 'git' | 'svn' | 'hg' | 'bzr';
  readonly url: URLString;
  readonly directory?: string;
  readonly branch?: string;
  readonly tag?: string;
  readonly commit?: string;
}

/**
 * Plugin bug tracking information
 */
export interface PluginBugs {
  readonly url?: URLString;
  readonly email?: string;
}

/**
 * Plugin funding information
 */
export interface PluginFunding {
  readonly type: 'github' | 'patreon' | 'opencollective' | 'ko-fi' | 'tidelift' | 'community_bridge' | 'custom';
  readonly url: URLString;
}

/**
 * Plugin category enumeration
 */
export enum PluginCategory {
  UTILITY = 'utility',
  MODERATION = 'moderation',
  ENTERTAINMENT = 'entertainment',
  MUSIC = 'music',
  GAMES = 'games',
  PRODUCTIVITY = 'productivity',
  SOCIAL = 'social',
  ECONOMY = 'economy',
  ANALYTICS = 'analytics',
  INTEGRATION = 'integration',
  DEVELOPMENT = 'development',
  ADMIN = 'admin',
  SECURITY = 'security',
  AUTOMATION = 'automation',
  COMMUNICATION = 'communication'
}

/**
 * Plugin maturity level
 */
export enum PluginMaturity {
  EXPERIMENTAL = 'experimental',
  ALPHA = 'alpha',
  BETA = 'beta',
  STABLE = 'stable',
  DEPRECATED = 'deprecated'
}

/**
 * Plugin compatibility information
 */
export interface PluginCompatibility {
  readonly ovenjs: string;
  readonly discord: string;
  readonly node: string;
  readonly platforms: readonly string[];
  readonly architectures: readonly string[];
}

/**
 * Plugin screenshot information
 */
export interface PluginScreenshot {
  readonly url: URLString;
  readonly caption?: string;
  readonly alt?: string;
  readonly width?: number;
  readonly height?: number;
}

/**
 * Plugin documentation link
 */
export interface PluginDocumentation {
  readonly title: string;
  readonly url: URLString;
  readonly type: 'guide' | 'api' | 'tutorial' | 'faq' | 'changelog' | 'migration';
  readonly language?: string;
}

/**
 * Plugin example configuration
 */
export interface PluginExample {
  readonly title: string;
  readonly description: string;
  readonly code: string;
  readonly language: string;
  readonly tags?: readonly string[];
}

/**
 * Plugin performance metrics
 */
export interface PluginPerformance {
  readonly memoryUsage: PluginMemoryUsage;
  readonly cpuUsage: PluginCPUUsage;
  readonly diskUsage: PluginDiskUsage;
  readonly networkUsage: PluginNetworkUsage;
  readonly benchmarks?: PluginBenchmarks;
}

/**
 * Plugin memory usage information
 */
export interface PluginMemoryUsage {
  readonly heap: number;
  readonly rss: number;
  readonly external: number;
  readonly arrayBuffers: number;
}

/**
 * Plugin CPU usage information
 */
export interface PluginCPUUsage {
  readonly user: number;
  readonly system: number;
  readonly total: number;
  readonly percentage: number;
}

/**
 * Plugin disk usage information
 */
export interface PluginDiskUsage {
  readonly size: number;
  readonly files: number;
  readonly directories: number;
}

/**
 * Plugin network usage information
 */
export interface PluginNetworkUsage {
  readonly bytesIn: number;
  readonly bytesOut: number;
  readonly requests: number;
  readonly connections: number;
}

/**
 * Plugin benchmarks
 */
export interface PluginBenchmarks {
  readonly startup: number;
  readonly shutdown: number;
  readonly memoryFootprint: number;
  readonly throughput: number;
  readonly latency: number;
  readonly operations: PluginOperationBenchmarks;
}

/**
 * Plugin operation benchmarks
 */
export interface PluginOperationBenchmarks {
  readonly [operation: string]: {
    readonly averageTime: number;
    readonly minTime: number;
    readonly maxTime: number;
    readonly operations: number;
    readonly throughput: number;
  };
}

/**
 * Plugin security information
 */
export interface PluginSecurity {
  readonly permissions: readonly PluginPermissionRequest[];
  readonly vulnerabilities?: readonly PluginVulnerability[];
  readonly audit?: PluginAudit;
  readonly signature?: PluginSignature;
}

/**
 * Plugin permission request
 */
export interface PluginPermissionRequest {
  readonly permission: string;
  readonly reason: string;
  readonly optional: boolean;
  readonly scope: string[];
}

/**
 * Plugin vulnerability information
 */
export interface PluginVulnerability {
  readonly id: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly title: string;
  readonly description: string;
  readonly cwe?: string;
  readonly cvss?: number;
  readonly discoveredAt: ISO8601Timestamp;
  readonly fixedAt?: ISO8601Timestamp;
  readonly references?: URLString[];
}

/**
 * Plugin audit information
 */
export interface PluginAudit {
  readonly auditedAt: ISO8601Timestamp;
  readonly auditor: string;
  readonly score: number;
  readonly issues: readonly PluginAuditIssue[];
  readonly certificate?: URLString;
}

/**
 * Plugin audit issue
 */
export interface PluginAuditIssue {
  readonly type: 'security' | 'performance' | 'reliability' | 'maintainability';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly message: string;
  readonly file?: string;
  readonly line?: number;
  readonly column?: number;
}

/**
 * Plugin signature information
 */
export interface PluginSignature {
  readonly algorithm: string;
  readonly signature: string;
  readonly publicKey: string;
  readonly certificate?: string;
  readonly signedAt: ISO8601Timestamp;
}

/**
 * Plugin changelog entry
 */
export interface PluginChangelogEntry {
  readonly version: SemverVersion;
  readonly date: ISO8601Timestamp;
  readonly type: 'major' | 'minor' | 'patch' | 'prerelease';
  readonly changes: readonly PluginChange[];
  readonly breaking?: boolean;
  readonly deprecated?: readonly string[];
}

/**
 * Plugin change information
 */
export interface PluginChange {
  readonly type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  readonly description: string;
  readonly issue?: string;
  readonly pr?: string;
  readonly author?: string;
}

/**
 * Plugin statistics
 */
export interface PluginStatistics {
  readonly downloads: PluginDownloadStats;
  readonly ratings: PluginRatingStats;
  readonly usage: PluginUsageStats;
  readonly dependencies: PluginDependencyStats;
}

/**
 * Plugin download statistics
 */
export interface PluginDownloadStats {
  readonly total: number;
  readonly lastWeek: number;
  readonly lastMonth: number;
  readonly lastYear: number;
  readonly dailyAverage: number;
  readonly peakDay: {
    readonly date: ISO8601Timestamp;
    readonly downloads: number;
  };
}

/**
 * Plugin rating statistics
 */
export interface PluginRatingStats {
  readonly average: number;
  readonly total: number;
  readonly distribution: {
    readonly 5: number;
    readonly 4: number;
    readonly 3: number;
    readonly 2: number;
    readonly 1: number;
  };
}

/**
 * Plugin usage statistics
 */
export interface PluginUsageStats {
  readonly activeInstalls: number;
  readonly totalInstalls: number;
  readonly uninstalls: number;
  readonly retention: {
    readonly day1: number;
    readonly day7: number;
    readonly day30: number;
  };
}

/**
 * Plugin dependency statistics
 */
export interface PluginDependencyStats {
  readonly dependents: number;
  readonly dependencies: number;
  readonly devDependencies: number;
  readonly outdated: number;
  readonly vulnerabilities: number;
}

/**
 * Plugin localization information
 */
export interface PluginLocalization {
  readonly defaultLocale: string;
  readonly supportedLocales: readonly string[];
  readonly translations: Record<string, PluginTranslation>;
}

/**
 * Plugin translation
 */
export interface PluginTranslation {
  readonly locale: string;
  readonly name: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly strings: Record<string, string>;
}

/**
 * Plugin feature flags
 */
export interface PluginFeatureFlags {
  readonly [flag: string]: {
    readonly enabled: boolean;
    readonly description: string;
    readonly experimental?: boolean;
    readonly deprecated?: boolean;
    readonly since?: SemverVersion;
    readonly until?: SemverVersion;
  };
}

/**
 * Plugin configuration schema
 */
export interface PluginConfigurationSchema {
  readonly $schema: string;
  readonly type: 'object';
  readonly properties: Record<string, PluginConfigurationProperty>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
}

/**
 * Plugin configuration property
 */
export interface PluginConfigurationProperty {
  readonly type: string;
  readonly description: string;
  readonly default?: unknown;
  readonly enum?: readonly unknown[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly format?: string;
  readonly items?: PluginConfigurationProperty;
  readonly properties?: Record<string, PluginConfigurationProperty>;
  readonly required?: readonly string[];
  readonly examples?: readonly unknown[];
}

/**
 * Enhanced plugin metadata with all optional fields
 */
export interface EnhancedPluginMetadata {
  // Core metadata
  readonly name: string;
  readonly version: SemverVersion;
  readonly description: string;
  readonly author: PluginAuthor;
  readonly license: string;
  readonly homepage?: URLString;
  readonly repository?: PluginRepository;
  readonly bugs?: PluginBugs;
  readonly funding?: PluginFunding[];
  
  // Classification
  readonly category: PluginCategory;
  readonly tags: readonly string[];
  readonly keywords: readonly string[];
  readonly maturity: PluginMaturity;
  
  // Compatibility
  readonly compatibility: PluginCompatibility;
  readonly engines: Record<string, string>;
  readonly os?: readonly string[];
  readonly cpu?: readonly string[];
  
  // Dependencies
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
  readonly optionalDependencies?: Record<string, string>;
  
  // Media
  readonly icon?: URLString;
  readonly screenshots?: readonly PluginScreenshot[];
  readonly banner?: URLString;
  
  // Documentation
  readonly readme?: string;
  readonly documentation?: readonly PluginDocumentation[];
  readonly examples?: readonly PluginExample[];
  readonly changelog?: readonly PluginChangelogEntry[];
  
  // Performance
  readonly performance?: PluginPerformance;
  
  // Security
  readonly security?: PluginSecurity;
  
  // Statistics
  readonly statistics?: PluginStatistics;
  
  // Localization
  readonly localization?: PluginLocalization;
  
  // Features
  readonly features?: PluginFeatureFlags;
  
  // Configuration
  readonly configurationSchema?: PluginConfigurationSchema;
  
  // Timestamps
  readonly createdAt: ISO8601Timestamp;
  readonly updatedAt: ISO8601Timestamp;
  readonly publishedAt: ISO8601Timestamp;
}

/**
 * Branded types for metadata
 */
export type PluginName = Brand<string, 'PluginName'>;
export type PluginVersion = Brand<string, 'PluginVersion'>;
export type PluginId = Brand<string, 'PluginId'>;
export type AuthorName = Brand<string, 'AuthorName'>;
export type CategoryName = Brand<string, 'CategoryName'>;
export type TagName = Brand<string, 'TagName'>;
export type KeywordName = Brand<string, 'KeywordName'>;
export type LicenseName = Brand<string, 'LicenseName'>;
export type LocaleCode = Brand<string, 'LocaleCode'>;

/**
 * Phantom types for metadata
 */
export type ValidatedMetadata<T> = Phantom<T, 'ValidatedMetadata'>;
export type PublishedMetadata<T> = Phantom<T, 'PublishedMetadata'>;
export type SignedMetadata<T> = Phantom<T, 'SignedMetadata'>;
export type AuditedMetadata<T> = Phantom<T, 'AuditedMetadata'>;