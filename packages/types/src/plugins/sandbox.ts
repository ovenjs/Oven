/**
 * @fileoverview Plugin Sandboxing System for OvenJS
 * Provides isolated execution environments for plugins to prevent interference and security issues
 */

import { createContext, runInContext, Context } from 'vm';
import { PluginPermission } from './loader.js';

/**
 * Resource limits for plugin sandboxes
 */
export interface ResourceLimits {
  readonly maxMemory: number; // bytes
  readonly maxCPUTime: number; // milliseconds
  readonly maxAPICallsPerMinute: number;
  readonly maxFileDescriptors: number;
  readonly maxNetworkConnections: number;
  readonly allowedModules: readonly string[];
  readonly blockedModules: readonly string[];
  readonly timeoutMs: number;
}

/**
 * Sandbox execution context
 */
export interface SandboxContext {
  readonly pluginId: string;
  readonly permissions: readonly PluginPermission[];
  readonly globals: Record<string, any>;
  readonly modules: Record<string, any>;
  readonly logger: SandboxLogger;
  readonly metrics: SandboxMetrics;
}

/**
 * Sandbox execution result
 */
export interface SandboxResult<T = any> {
  readonly success: boolean;
  readonly result?: T;
  readonly error?: SandboxError;
  readonly metrics: ExecutionMetrics;
  readonly warnings: readonly string[];
}

export interface SandboxError {
  readonly type: 'timeout' | 'memory' | 'permission' | 'runtime' | 'security';
  readonly message: string;
  readonly stack?: string;
  readonly pluginId: string;
  readonly timestamp: Date;
}

export interface ExecutionMetrics {
  readonly executionTime: number; // ms
  readonly memoryUsed: number; // bytes
  readonly cpuUsage: number; // percentage
  readonly apiCalls: number;
  readonly networkRequests: number;
  readonly fileOperations: number;
}

/**
 * Sandbox logger with restrictions
 */
export interface SandboxLogger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string | Error, meta?: Record<string, any>): void;
}

/**
 * Sandbox metrics collector
 */
export interface SandboxMetrics {
  increment(metric: string, value?: number): void;
  gauge(metric: string, value: number): void;
  timing(metric: string, duration: number): void;
  apiCall(endpoint: string, method: string, duration: number): void;
}

/**
 * Security audit result
 */
export interface SecurityAuditResult {
  readonly safe: boolean;
  readonly risks: readonly SecurityRisk[];
  readonly recommendations: readonly string[];
  readonly score: number; // 0-100, higher is safer
}

export interface SecurityRisk {
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly type: 'code-injection' | 'file-access' | 'network-access' | 'prototype-pollution' | 'eval-usage';
  readonly description: string;
  readonly location?: CodeLocation;
  readonly mitigation?: string;
}

export interface CodeLocation {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly code: string;
}

/**
 * Main plugin sandbox interface
 */
export interface PluginSandbox {
  execute<T>(code: string, context: SandboxContext): Promise<SandboxResult<T>>;
  executeFunction<T>(fn: Function, args: any[], context: SandboxContext): Promise<SandboxResult<T>>;
  setLimits(limits: Partial<ResourceLimits>): void;
  getLimits(): ResourceLimits;
  grantPermissions(permissions: readonly PluginPermission[]): void;
  revokePermissions(permissions: readonly PluginPermission[]): void;
  auditCode(code: string): SecurityAuditResult;
  terminate(): Promise<void>;
  isTerminated(): boolean;
  getMetrics(): ExecutionMetrics;
}

/**
 * Sandbox permission checker
 */
export interface PermissionChecker {
  check(permission: PluginPermission, operation: SecurityOperation): boolean;
  checkAPI(endpoint: string, method: string): boolean;
  checkFileSystem(path: string, operation: 'read' | 'write' | 'execute'): boolean;
  checkNetwork(host: string, port: number): boolean;
  checkModule(moduleName: string): boolean;
}

export interface SecurityOperation {
  readonly type: 'api' | 'filesystem' | 'network' | 'process' | 'memory';
  readonly resource: string;
  readonly action: string;
  readonly metadata?: Record<string, any>;
}

/**
 * Advanced plugin sandbox implementation
 */
export class AdvancedPluginSandbox implements PluginSandbox {
  private vmContext?: Context;
  private limits: ResourceLimits;
  private permissions = new Set<PluginPermission>();
  private permissionChecker: PermissionChecker;
  private terminated = false;
  private executionMetrics: ExecutionMetrics = {
    executionTime: 0,
    memoryUsed: 0,
    cpuUsage: 0,
    apiCalls: 0,
    networkRequests: 0,
    fileOperations: 0
  };

  constructor(
    limits: Partial<ResourceLimits> = {},
    private readonly logger: SandboxLogger
  ) {
    this.limits = {
      maxMemory: limits.maxMemory ?? 128 * 1024 * 1024, // 128MB
      maxCPUTime: limits.maxCPUTime ?? 5000, // 5 seconds
      maxAPICallsPerMinute: limits.maxAPICallsPerMinute ?? 1000,
      maxFileDescriptors: limits.maxFileDescriptors ?? 100,
      maxNetworkConnections: limits.maxNetworkConnections ?? 10,
      allowedModules: limits.allowedModules ?? ['path', 'util', 'crypto'],
      blockedModules: limits.blockedModules ?? ['fs', 'child_process', 'cluster', 'worker_threads'],
      timeoutMs: limits.timeoutMs ?? 30000 // 30 seconds
    };

    this.permissionChecker = new DefaultPermissionChecker(this.permissions);
    this.initializeVM();
  }

  /**
   * Execute code in the sandbox
   */
  async execute<T>(code: string, context: SandboxContext): Promise<SandboxResult<T>> {
    if (this.terminated) {
      throw new Error('Sandbox has been terminated');
    }

    // Security audit first
    const auditResult = this.auditCode(code);
    if (!auditResult.safe) {
      return {
        success: false,
        error: {
          type: 'security',
          message: `Code failed security audit: ${auditResult.risks[0]?.description}`,
          pluginId: context.pluginId,
          timestamp: new Date()
        },
        metrics: this.executionMetrics,
        warnings: auditResult.recommendations
      };
    }

    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      // Update permissions for this execution
      this.updatePermissions(context.permissions);

      // Prepare the execution context
      const sandboxedCode = this.prepareSandboxedCode(code, context);

      // Execute with timeout and resource monitoring
      const result = await this.executeWithLimits<T>(sandboxedCode, context);

      // Update metrics
      const executionTime = Date.now() - startTime;
      const memoryUsed = process.memoryUsage().heapUsed - startMemory;

      this.executionMetrics = {
        ...this.executionMetrics,
        executionTime: this.executionMetrics.executionTime + executionTime,
        memoryUsed: Math.max(this.executionMetrics.memoryUsed, memoryUsed),
        cpuUsage: this.calculateCPUUsage(executionTime)
      };

      return {
        success: true,
        result,
        metrics: {
          executionTime,
          memoryUsed,
          cpuUsage: this.calculateCPUUsage(executionTime),
          apiCalls: 0, // Would be tracked during execution
          networkRequests: 0,
          fileOperations: 0
        },
        warnings: []
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: {
          type: this.classifyError(error),
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          pluginId: context.pluginId,
          timestamp: new Date()
        },
        metrics: {
          executionTime,
          memoryUsed: process.memoryUsage().heapUsed - startMemory,
          cpuUsage: this.calculateCPUUsage(executionTime),
          apiCalls: 0,
          networkRequests: 0,
          fileOperations: 0
        },
        warnings: []
      };
    }
  }

  /**
   * Execute a function in the sandbox
   */
  async executeFunction<T>(
    fn: Function, 
    args: any[], 
    context: SandboxContext
  ): Promise<SandboxResult<T>> {
    const code = `(${fn.toString()})(${args.map(arg => JSON.stringify(arg)).join(', ')})`;
    return this.execute<T>(code, context);
  }

  /**
   * Set resource limits
   */
  setLimits(limits: Partial<ResourceLimits>): void {
    this.limits = { ...this.limits, ...limits };
  }

  /**
   * Get current resource limits
   */
  getLimits(): ResourceLimits {
    return { ...this.limits };
  }

  /**
   * Grant permissions to the sandbox
   */
  grantPermissions(permissions: readonly PluginPermission[]): void {
    for (const permission of permissions) {
      this.permissions.add(permission);
    }
  }

  /**
   * Revoke permissions from the sandbox
   */
  revokePermissions(permissions: readonly PluginPermission[]): void {
    for (const permission of permissions) {
      this.permissions.delete(permission);
    }
  }

  /**
   * Audit code for security risks
   */
  auditCode(code: string): SecurityAuditResult {
    const risks: SecurityRisk[] = [];
    let score = 100;

    // Check for eval usage
    if (/\beval\s*\(/.test(code)) {
      risks.push({
        severity: 'high',
        type: 'eval-usage',
        description: 'Code uses eval() which can execute arbitrary code',
        mitigation: 'Remove eval() usage or use safer alternatives'
      });
      score -= 30;
    }

    // Check for Function constructor
    if (/new\s+Function\s*\(/.test(code)) {
      risks.push({
        severity: 'high',
        type: 'code-injection',
        description: 'Code uses Function constructor which can execute arbitrary code',
        mitigation: 'Remove Function constructor usage'
      });
      score -= 25;
    }

    // Check for prototype pollution
    if (/__proto__|prototype\s*\[/.test(code)) {
      risks.push({
        severity: 'medium',
        type: 'prototype-pollution',
        description: 'Code may modify object prototypes',
        mitigation: 'Avoid modifying prototypes directly'
      });
      score -= 15;
    }

    // Check for file system access
    if (/require\s*\(\s*['"`]fs['"`]/.test(code)) {
      risks.push({
        severity: 'medium',
        type: 'file-access',
        description: 'Code attempts to access file system',
        mitigation: 'Use provided file system APIs instead'
      });
      score -= 20;
    }

    // Check for network access
    if (/require\s*\(\s*['"`](http|https|net)['"`]/.test(code)) {
      risks.push({
        severity: 'medium',
        type: 'network-access',
        description: 'Code attempts direct network access',
        mitigation: 'Use provided HTTP client APIs instead'
      });
      score -= 20;
    }

    const recommendations: string[] = [];
    if (risks.length > 0) {
      recommendations.push('Review and address security risks before deployment');
      recommendations.push('Use provided sandbox APIs instead of direct Node.js APIs');
      recommendations.push('Follow plugin security best practices');
    }

    return {
      safe: risks.filter(r => r.severity === 'high' || r.severity === 'critical').length === 0,
      risks,
      recommendations,
      score: Math.max(0, score)
    };
  }

  /**
   * Terminate the sandbox
   */
  async terminate(): Promise<void> {
    this.terminated = true;
    if (this.vmContext) {
      // Clean up the VM context
      this.vmContext = undefined;
    }
    this.logger.info('Sandbox terminated');
  }

  /**
   * Check if sandbox is terminated
   */
  isTerminated(): boolean {
    return this.terminated;
  }

  /**
   * Get execution metrics
   */
  getMetrics(): ExecutionMetrics {
    return { ...this.executionMetrics };
  }

  /**
   * Private helper methods
   */

  private initializeVM(): void {
    const sandboxObject = this.createSandboxObject();
    this.vmContext = createContext(sandboxObject);
  }

  private createSandboxObject(): Record<string, any> {
    return {
      console: this.createRestrictedConsole(),
      setTimeout: this.createRestrictedSetTimeout(),
      setInterval: this.createRestrictedSetInterval(),
      clearTimeout: clearTimeout,
      clearInterval: clearInterval,
      Buffer: Buffer,
      process: this.createRestrictedProcess(),
      require: this.createRestrictedRequire(),
      module: { exports: {} },
      exports: {},
      __filename: '<sandbox>',
      __dirname: '<sandbox>',
      global: undefined, // Prevent access to global object
      globalThis: undefined
    };
  }

  private createRestrictedConsole(): any {
    return {
      log: (...args: any[]) => this.logger.info(args.join(' ')),
      info: (...args: any[]) => this.logger.info(args.join(' ')),
      warn: (...args: any[]) => this.logger.warn(args.join(' ')),
      error: (...args: any[]) => this.logger.error(args.join(' ')),
      debug: (...args: any[]) => this.logger.debug(args.join(' '))
    };
  }

  private createRestrictedSetTimeout(): any {
    return (callback: Function, delay: number) => {
      if (delay > this.limits.timeoutMs) {
        throw new Error(`Timeout exceeds limit: ${delay}ms > ${this.limits.timeoutMs}ms`);
      }
      return setTimeout(callback, delay);
    };
  }

  private createRestrictedSetInterval(): any {
    return (callback: Function, delay: number) => {
      if (delay < 100) {
        throw new Error('Interval too short, minimum 100ms');
      }
      return setInterval(callback, delay);
    };
  }

  private createRestrictedProcess(): any {
    return {
      env: {}, // Empty environment
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      nextTick: process.nextTick.bind(process)
    };
  }

  private createRestrictedRequire(): any {
    return (moduleName: string) => {
      if (this.limits.blockedModules.includes(moduleName)) {
        throw new Error(`Module '${moduleName}' is not allowed in sandbox`);
      }
      
      if (!this.limits.allowedModules.includes(moduleName)) {
        throw new Error(`Module '${moduleName}' is not in allowed modules list`);
      }

      // Return safe version of the module
      return this.getSafeModule(moduleName);
    };
  }

  private getSafeModule(moduleName: string): any {
    switch (moduleName) {
      case 'path':
        return require('path');
      case 'util':
        return require('util');
      case 'crypto':
        return require('crypto');
      default:
        throw new Error(`Module '${moduleName}' is not available`);
    }
  }

  private updatePermissions(permissions: readonly PluginPermission[]): void {
    this.permissions.clear();
    for (const permission of permissions) {
      this.permissions.add(permission);
    }
  }

  private prepareSandboxedCode(code: string, context: SandboxContext): string {
    // Wrap code in an IIFE to prevent global pollution
    return `
      (function() {
        'use strict';
        ${code}
      })();
    `;
  }

  private async executeWithLimits<T>(code: string, context: SandboxContext): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Execution timeout: ${this.limits.timeoutMs}ms`));
      }, this.limits.timeoutMs);

      try {
        if (!this.vmContext) {
          throw new Error('VM context not initialized');
        }

        const result = runInContext(code, this.vmContext, {
          timeout: this.limits.timeoutMs,
          displayErrors: true
        });

        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  private classifyError(error: any): SandboxError['type'] {
    const message = error?.message || String(error);
    
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('memory')) return 'memory';
    if (message.includes('permission') || message.includes('not allowed')) return 'permission';
    if (message.includes('security') || message.includes('audit')) return 'security';
    
    return 'runtime';
  }

  private calculateCPUUsage(executionTime: number): number {
    // Simplified CPU usage calculation
    // In a real implementation, this would use process.cpuUsage()
    return Math.min(100, (executionTime / 1000) * 100);
  }
}

/**
 * Default permission checker implementation
 */
class DefaultPermissionChecker implements PermissionChecker {
  constructor(private permissions: Set<PluginPermission>) {}

  check(permission: PluginPermission, operation: SecurityOperation): boolean {
    for (const p of this.permissions) {
      if (this.matchesPermission(p, permission) && this.matchesOperation(p, operation)) {
        return true;
      }
    }
    return false;
  }

  checkAPI(endpoint: string, method: string): boolean {
    return this.check(
      { type: 'api', resource: endpoint, access: 'all' },
      { type: 'api', resource: endpoint, action: method }
    );
  }

  checkFileSystem(path: string, operation: 'read' | 'write' | 'execute'): boolean {
    return this.check(
      { type: 'filesystem', resource: path, access: operation as any },
      { type: 'filesystem', resource: path, action: operation }
    );
  }

  checkNetwork(host: string, port: number): boolean {
    return this.check(
      { type: 'network', resource: `${host}:${port}`, access: 'all' },
      { type: 'network', resource: `${host}:${port}`, action: 'connect' }
    );
  }

  checkModule(moduleName: string): boolean {
    return this.check(
      { type: 'process', resource: moduleName, access: 'read' },
      { type: 'process', resource: moduleName, action: 'require' }
    );
  }

  private matchesPermission(granted: PluginPermission, requested: PluginPermission): boolean {
    return granted.type === requested.type &&
           (granted.resource === '*' || granted.resource === requested.resource) &&
           (granted.access === 'all' || granted.access === requested.access);
  }

  private matchesOperation(permission: PluginPermission, operation: SecurityOperation): boolean {
    return permission.type === operation.type &&
           (permission.resource === '*' || operation.resource.includes(permission.resource));
  }
}

/**
 * Create a new plugin sandbox instance
 */
export function createPluginSandbox(
  limits?: Partial<ResourceLimits>,
  logger?: SandboxLogger
): PluginSandbox {
  const defaultLogger: SandboxLogger = logger || {
    debug: (msg, meta) => console.debug(`[Sandbox] ${msg}`, meta),
    info: (msg, meta) => console.info(`[Sandbox] ${msg}`, meta),
    warn: (msg, meta) => console.warn(`[Sandbox] ${msg}`, meta),
    error: (msg, meta) => console.error(`[Sandbox] ${msg}`, meta)
  };

  return new AdvancedPluginSandbox(limits, defaultLogger);
}

/**
 * Create a permission checker instance
 */
export function createPermissionChecker(permissions: Set<PluginPermission>): PermissionChecker {
  return new DefaultPermissionChecker(permissions);
}