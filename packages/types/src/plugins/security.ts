/**
 * @fileoverview Plugin security type definitions
 */

import type { Brand, ISO8601Timestamp } from '../primitives/index.js';

/**
 * Plugin security validator interface
 */
export interface SecurityValidator {
  validatePlugin(plugin: any): Promise<SecurityValidationResult>;
  checkPermissions(plugin: any, permissions: string[]): Promise<boolean>;
  validateSignature(plugin: any): Promise<boolean>;
  scanForVulnerabilities(plugin: any): Promise<VulnerabilityReport>;
  auditPlugin(plugin: any): Promise<SecurityAudit>;
}

/**
 * Security validation result
 */
export interface SecurityValidationResult {
  readonly valid: boolean;
  readonly score: number;
  readonly issues: readonly SecurityIssue[];
  readonly recommendations: readonly SecurityRecommendation[];
  readonly timestamp: ISO8601Timestamp;
}

/**
 * Security issue
 */
export interface SecurityIssue {
  readonly id: string;
  readonly type: SecurityIssueType;
  readonly severity: SecuritySeverity;
  readonly title: string;
  readonly description: string;
  readonly file?: string;
  readonly line?: number;
  readonly column?: number;
  readonly cwe?: string;
  readonly cvss?: number;
  readonly remediation?: string;
}

/**
 * Security issue types
 */
export enum SecurityIssueType {
  PERMISSION_ESCALATION = 'permission_escalation',
  CODE_INJECTION = 'code_injection',
  UNSAFE_EVAL = 'unsafe_eval',
  PROTOTYPE_POLLUTION = 'prototype_pollution',
  PATH_TRAVERSAL = 'path_traversal',
  COMMAND_INJECTION = 'command_injection',
  INSECURE_CRYPTO = 'insecure_crypto',
  HARDCODED_SECRET = 'hardcoded_secret',
  UNSAFE_REGEX = 'unsafe_regex',
  MALICIOUS_CODE = 'malicious_code'
}

/**
 * Security severity levels
 */
export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Security recommendation
 */
export interface SecurityRecommendation {
  readonly type: 'fix' | 'mitigation' | 'enhancement';
  readonly priority: 'low' | 'medium' | 'high';
  readonly title: string;
  readonly description: string;
  readonly implementation?: string;
  readonly references?: readonly string[];
}

/**
 * Vulnerability report
 */
export interface VulnerabilityReport {
  readonly scannedAt: ISO8601Timestamp;
  readonly vulnerabilities: readonly Vulnerability[];
  readonly summary: VulnerabilitySummary;
  readonly dependencies: readonly DependencyVulnerability[];
}

/**
 * Individual vulnerability
 */
export interface Vulnerability {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly severity: SecuritySeverity;
  readonly cwe?: string;
  readonly cvss?: number;
  readonly affected: VulnerabilityAffected;
  readonly references: readonly string[];
  readonly fix?: VulnerabilityFix;
}

/**
 * Vulnerability affected information
 */
export interface VulnerabilityAffected {
  readonly component: string;
  readonly versions: readonly string[];
  readonly locations: readonly VulnerabilityLocation[];
}

/**
 * Vulnerability location
 */
export interface VulnerabilityLocation {
  readonly file: string;
  readonly line?: number;
  readonly column?: number;
  readonly function?: string;
}

/**
 * Vulnerability fix information
 */
export interface VulnerabilityFix {
  readonly version?: string;
  readonly patch?: string;
  readonly workaround?: string;
  readonly effort: 'low' | 'medium' | 'high';
}

/**
 * Vulnerability summary
 */
export interface VulnerabilitySummary {
  readonly total: number;
  readonly critical: number;
  readonly high: number;
  readonly medium: number;
  readonly low: number;
  readonly fixed: number;
  readonly unfixed: number;
}

/**
 * Dependency vulnerability
 */
export interface DependencyVulnerability {
  readonly name: string;
  readonly version: string;
  readonly vulnerabilities: readonly Vulnerability[];
  readonly directDependency: boolean;
  readonly path: readonly string[];
}

/**
 * Security audit
 */
export interface SecurityAudit {
  readonly auditedAt: ISO8601Timestamp;
  readonly auditor: SecurityAuditor;
  readonly score: number;
  readonly grade: SecurityGrade;
  readonly categories: readonly SecurityCategory[];
  readonly recommendations: readonly SecurityRecommendation[];
  readonly certificate?: SecurityCertificate;
}

/**
 * Security auditor information
 */
export interface SecurityAuditor {
  readonly name: string;
  readonly version: string;
  readonly type: 'automated' | 'manual' | 'hybrid';
  readonly credentials?: readonly string[];
}

/**
 * Security grades
 */
export enum SecurityGrade {
  A_PLUS = 'A+',
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  F = 'F'
}

/**
 * Security category
 */
export interface SecurityCategory {
  readonly name: string;
  readonly weight: number;
  readonly score: number;
  readonly issues: readonly SecurityIssue[];
  readonly passed: boolean;
}

/**
 * Security certificate
 */
export interface SecurityCertificate {
  readonly id: string;
  readonly issuer: string;
  readonly validFrom: ISO8601Timestamp;
  readonly validTo: ISO8601Timestamp;
  readonly algorithm: string;
  readonly fingerprint: string;
  readonly publicKey: string;
}

/**
 * Permission request
 */
export interface PermissionRequest {
  readonly permission: string;
  readonly reason: string;
  readonly scope: readonly string[];
  readonly required: boolean;
  readonly alternatives?: readonly string[];
}

/**
 * Permission grant
 */
export interface PermissionGrant {
  readonly permission: string;
  readonly granted: boolean;
  readonly scope: readonly string[];
  readonly restrictions?: readonly PermissionRestriction[];
  readonly grantedAt: ISO8601Timestamp;
  readonly expiresAt?: ISO8601Timestamp;
}

/**
 * Permission restriction
 */
export interface PermissionRestriction {
  readonly type: 'time' | 'scope' | 'rate' | 'size';
  readonly value: unknown;
  readonly description: string;
}

/**
 * Security policy
 */
export interface SecurityPolicy {
  readonly name: string;
  readonly version: string;
  readonly rules: readonly SecurityPolicyRule[];
  readonly enforcement: SecurityEnforcement;
  readonly exceptions?: readonly SecurityException[];
}

/**
 * Security policy rule
 */
export interface SecurityPolicyRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly action: 'allow' | 'deny' | 'audit';
  readonly conditions: readonly SecurityCondition[];
  readonly severity: SecuritySeverity;
}

/**
 * Security condition
 */
export interface SecurityCondition {
  readonly type: string;
  readonly operator: 'equals' | 'contains' | 'matches' | 'greater' | 'less';
  readonly value: unknown;
  readonly caseSensitive?: boolean;
}

/**
 * Security enforcement
 */
export interface SecurityEnforcement {
  readonly mode: 'strict' | 'permissive' | 'audit';
  readonly onViolation: 'block' | 'warn' | 'log';
  readonly monitoring: boolean;
  readonly reporting: boolean;
}

/**
 * Security exception
 */
export interface SecurityException {
  readonly id: string;
  readonly rule: string;
  readonly reason: string;
  readonly requestedBy: string;
  readonly approvedBy: string;
  readonly validFrom: ISO8601Timestamp;
  readonly validTo: ISO8601Timestamp;
}

/**
 * Branded types for security
 */
export type SecurityId = Brand<string, 'SecurityId'>;
export type VulnerabilityId = Brand<string, 'VulnerabilityId'>;
export type PermissionId = Brand<string, 'PermissionId'>;
export type CertificateId = Brand<string, 'CertificateId'>;