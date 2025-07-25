/**
 * @fileoverview Plugin sandboxing system for secure plugin execution
 */

import { Worker } from 'worker_threads';
import { createContext, runInContext } from 'vm';
import type { Plugin } from './Plugin.js';

/**
 * Plugin sandbox interface
 */
export interface PluginSandbox {
  createContext(): Promise<SandboxContext>;
  destroyContext(context: SandboxContext): Promise<void>;
  validateCode(code: string): Promise<CodeValidationResult>;
  executeCode(code: string, context: SandboxContext): Promise<unknown>;
}

/**
 * Sandbox context for plugin execution
 */
export interface SandboxContext {
  readonly id: string;
  readonly globals: Record<string, unknown>;
  readonly restrictions: SandboxRestrictions;
  readonly stats: SandboxStats;
  loadModule(modulePath: string): Promise<Plugin>;
  evaluateCode(code: string): Promise<unknown>;
  cleanup(): Promise<void>;
}

/**
 * Sandbox restrictions configuration
 */
export interface SandboxRestrictions {
  readonly maxMemory: number;
  readonly maxCpuTime: number;
  readonly maxFileSize: number;
  readonly allowedModules: readonly string[];
  readonly blockedModules: readonly string[];
  readonly allowedGlobals: readonly string[];
  readonly blockedGlobals: readonly string[];
  readonly allowNetworkAccess: boolean;
  readonly allowFileSystem: boolean;
  readonly allowProcessAccess: boolean;
}

/**
 * Sandbox execution statistics
 */
export interface SandboxStats {
  readonly createdAt: Date;
  readonly memoryUsage: number;
  readonly cpuTime: number;
  readonly executionCount: number;
  readonly lastExecution?: Date;
}

/**
 * Code validation result
 */
export interface CodeValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly ast?: unknown;
  readonly metrics: CodeMetrics;
}

/**
 * Code metrics for analysis
 */
export interface CodeMetrics {
  readonly lines: number;
  readonly complexity: number;
  readonly dependencies: readonly string[];
  readonly exports: readonly string[];
  readonly imports: readonly string[];
  readonly functions: readonly string[];
  readonly classes: readonly string[];
}

/**
 * Default sandbox restrictions
 */
const DEFAULT_RESTRICTIONS: SandboxRestrictions = {
  maxMemory: 128 * 1024 * 1024, // 128MB
  maxCpuTime: 30000, // 30 seconds
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedModules: ['@ovenjs/types', '@ovenjs/core'],
  blockedModules: ['fs', 'child_process', 'cluster', 'dgram', 'net', 'tls'],
  allowedGlobals: ['console', 'Buffer', 'process', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'],
  blockedGlobals: ['eval', 'Function', 'require', 'module', 'exports', '__dirname', '__filename'],
  allowNetworkAccess: false,
  allowFileSystem: false,
  allowProcessAccess: false
};

/**
 * VM-based plugin sandbox implementation
 */
export class VMPluginSandbox implements PluginSandbox {
  private readonly contexts = new Map<string, VMSandboxContext>();
  private readonly restrictions: SandboxRestrictions;
  private contextCounter = 0;

  constructor(restrictions: Partial<SandboxRestrictions> = {}) {
    this.restrictions = { ...DEFAULT_RESTRICTIONS, ...restrictions };
  }

  /**
   * Create a new sandbox context
   */
  public async createContext(): Promise<SandboxContext> {
    const contextId = `sandbox-${++this.contextCounter}`;
    const context = new VMSandboxContext(contextId, this.restrictions);
    this.contexts.set(contextId, context);
    return context;
  }

  /**
   * Destroy a sandbox context
   */
  public async destroyContext(context: SandboxContext): Promise<void> {
    const vmContext = this.contexts.get(context.id);
    if (vmContext) {
      await vmContext.cleanup();
      this.contexts.delete(context.id);
    }
  }

  /**
   * Validate plugin code
   */
  public async validateCode(code: string): Promise<CodeValidationResult> {
    const validator = new CodeValidator(this.restrictions);
    return validator.validate(code);
  }

  /**
   * Execute code in sandbox
   */
  public async executeCode(code: string, context: SandboxContext): Promise<unknown> {
    const validation = await this.validateCode(code);
    if (!validation.isValid) {
      throw new Error(`Code validation failed: ${validation.errors.join(', ')}`);
    }

    return context.evaluateCode(code);
  }

  /**
   * Get sandbox statistics
   */
  public getSandboxStats(): Map<string, SandboxStats> {
    const stats = new Map<string, SandboxStats>();
    for (const [id, context] of this.contexts) {
      stats.set(id, context.stats);
    }
    return stats;
  }

  /**
   * Cleanup all sandbox contexts
   */
  public async cleanup(): Promise<void> {
    const cleanupPromises: Promise<void>[] = [];
    
    for (const context of this.contexts.values()) {
      cleanupPromises.push(context.cleanup());
    }
    
    await Promise.allSettled(cleanupPromises);
    this.contexts.clear();
  }
}

/**
 * VM-based sandbox context implementation
 */
class VMSandboxContext implements SandboxContext {
  public readonly id: string;
  public readonly globals: Record<string, unknown>;
  public readonly restrictions: SandboxRestrictions;
  public readonly stats: SandboxStats;
  
  private readonly vmContext: vm.Context;
  private readonly memoryMonitor: MemoryMonitor;
  private readonly cpuMonitor: CPUMonitor;
  private executionCount = 0;
  private lastExecution?: Date;

  constructor(id: string, restrictions: SandboxRestrictions) {
    this.id = id;
    this.restrictions = restrictions;
    this.globals = this.createSafeGlobals();
    this.vmContext = createContext(this.globals);
    this.memoryMonitor = new MemoryMonitor(restrictions.maxMemory);
    this.cpuMonitor = new CPUMonitor(restrictions.maxCpuTime);
    
    this.stats = {
      createdAt: new Date(),
      memoryUsage: 0,
      cpuTime: 0,
      executionCount: 0
    };
  }

  /**
   * Load a module in the sandbox
   */
  public async loadModule(modulePath: string): Promise<Plugin> {
    this.validateModulePath(modulePath);
    
    // In a real implementation, this would load and instantiate the plugin
    // For now, we'll throw an error as this is a complex operation
    throw new Error('Module loading not implemented in this example');
  }

  /**
   * Evaluate code in the sandbox
   */
  public async evaluateCode(code: string): Promise<unknown> {
    this.memoryMonitor.start();
    this.cpuMonitor.start();
    
    try {
      const result = runInContext(code, this.vmContext, {
        timeout: this.restrictions.maxCpuTime,
        breakOnSigint: true
      });
      
      this.executionCount++;
      this.lastExecution = new Date();
      
      return result;
    } finally {
      this.memoryMonitor.stop();
      this.cpuMonitor.stop();
      
      // Update stats
      (this.stats as any).memoryUsage = this.memoryMonitor.getUsage();
      (this.stats as any).cpuTime = this.cpuMonitor.getTime();
      (this.stats as any).executionCount = this.executionCount;
      (this.stats as any).lastExecution = this.lastExecution;
    }
  }

  /**
   * Cleanup the sandbox context
   */
  public async cleanup(): Promise<void> {
    this.memoryMonitor.cleanup();
    this.cpuMonitor.cleanup();
  }

  /**
   * Create safe global objects for the sandbox
   */
  private createSafeGlobals(): Record<string, unknown> {
    const globals: Record<string, unknown> = {};
    
    // Add allowed globals
    for (const globalName of this.restrictions.allowedGlobals) {
      if (globalName in global) {
        globals[globalName] = (global as any)[globalName];
      }
    }
    
    // Add safe console implementation
    globals.console = {
      log: (...args: any[]) => console.log('[SANDBOX]', ...args),
      error: (...args: any[]) => console.error('[SANDBOX]', ...args),
      warn: (...args: any[]) => console.warn('[SANDBOX]', ...args),
      info: (...args: any[]) => console.info('[SANDBOX]', ...args),
      debug: (...args: any[]) => console.debug('[SANDBOX]', ...args)
    };
    
    return globals;
  }

  /**
   * Validate module path
   */
  private validateModulePath(modulePath: string): void {
    const isAllowed = this.restrictions.allowedModules.some(allowed => 
      modulePath.startsWith(allowed)
    );
    
    const isBlocked = this.restrictions.blockedModules.some(blocked => 
      modulePath.includes(blocked)
    );
    
    if (!isAllowed || isBlocked) {
      throw new Error(`Module ${modulePath} is not allowed in sandbox`);
    }
  }
}

/**
 * Memory monitoring utility
 */
class MemoryMonitor {
  private readonly maxMemory: number;
  private startMemory = 0;
  private currentMemory = 0;
  private monitoring = false;

  constructor(maxMemory: number) {
    this.maxMemory = maxMemory;
  }

  public start(): void {
    this.startMemory = process.memoryUsage().heapUsed;
    this.monitoring = true;
  }

  public stop(): void {
    if (this.monitoring) {
      this.currentMemory = process.memoryUsage().heapUsed - this.startMemory;
      this.monitoring = false;
      
      if (this.currentMemory > this.maxMemory) {
        throw new Error(`Memory limit exceeded: ${this.currentMemory} > ${this.maxMemory}`);
      }
    }
  }

  public getUsage(): number {
    return this.currentMemory;
  }

  public cleanup(): void {
    this.monitoring = false;
  }
}

/**
 * CPU monitoring utility
 */
class CPUMonitor {
  private readonly maxCpuTime: number;
  private startTime = 0;
  private currentTime = 0;
  private monitoring = false;

  constructor(maxCpuTime: number) {
    this.maxCpuTime = maxCpuTime;
  }

  public start(): void {
    this.startTime = process.hrtime.bigint();
    this.monitoring = true;
  }

  public stop(): void {
    if (this.monitoring) {
      const endTime = process.hrtime.bigint();
      this.currentTime = Number(endTime - this.startTime) / 1000000; // Convert to ms
      this.monitoring = false;
      
      if (this.currentTime > this.maxCpuTime) {
        throw new Error(`CPU time limit exceeded: ${this.currentTime}ms > ${this.maxCpuTime}ms`);
      }
    }
  }

  public getTime(): number {
    return this.currentTime;
  }

  public cleanup(): void {
    this.monitoring = false;
  }
}

/**
 * Code validator for plugin security
 */
class CodeValidator {
  private readonly restrictions: SandboxRestrictions;

  constructor(restrictions: SandboxRestrictions) {
    this.restrictions = restrictions;
  }

  public async validate(code: string): Promise<CodeValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (code.length === 0) {
      errors.push('Code cannot be empty');
    }

    // Check for blocked patterns
    const blockedPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /require\s*\(/,
      /import\s*\(/,
      /process\.exit/,
      /process\.kill/,
      /child_process/,
      /fs\./,
      /net\./,
      /http\./,
      /https\./
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(code)) {
        errors.push(`Blocked pattern found: ${pattern.source}`);
      }
    }

    // Check for blocked modules
    for (const blockedModule of this.restrictions.blockedModules) {
      if (code.includes(blockedModule)) {
        errors.push(`Blocked module usage: ${blockedModule}`);
      }
    }

    // Generate metrics
    const metrics: CodeMetrics = {
      lines: code.split('\n').length,
      complexity: this.calculateComplexity(code),
      dependencies: this.extractDependencies(code),
      exports: this.extractExports(code),
      imports: this.extractImports(code),
      functions: this.extractFunctions(code),
      classes: this.extractClasses(code)
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metrics
    };
  }

  private calculateComplexity(code: string): number {
    // Simple complexity calculation based on control flow statements
    const patterns = [/if\s*\(/, /for\s*\(/, /while\s*\(/, /switch\s*\(/, /catch\s*\(/];
    let complexity = 1; // Base complexity
    
    for (const pattern of patterns) {
      const matches = code.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        complexity += matches.length;
      }
    }
    
    return complexity;
  }

  private extractDependencies(code: string): string[] {
    const imports = code.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g) || [];
    const requires = code.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];
    
    const dependencies: string[] = [];
    
    for (const imp of imports) {
      const match = imp.match(/from\s+['"]([^'"]+)['"]/);
      if (match) dependencies.push(match[1]);
    }
    
    for (const req of requires) {
      const match = req.match(/['"]([^'"]+)['"]/);
      if (match) dependencies.push(match[1]);
    }
    
    return [...new Set(dependencies)];
  }

  private extractExports(code: string): string[] {
    const exports = code.match(/export\s+(function|class|const|let|var)\s+(\w+)/g) || [];
    const defaultExports = code.match(/export\s+default\s+(\w+)/g) || [];
    
    const result: string[] = [];
    
    for (const exp of exports) {
      const match = exp.match(/export\s+(?:function|class|const|let|var)\s+(\w+)/);
      if (match) result.push(match[1]);
    }
    
    for (const exp of defaultExports) {
      const match = exp.match(/export\s+default\s+(\w+)/);
      if (match) result.push(match[1]);
    }
    
    return result;
  }

  private extractImports(code: string): string[] {
    const imports = code.match(/import\s+(\w+)/g) || [];
    const result: string[] = [];
    
    for (const imp of imports) {
      const match = imp.match(/import\s+(\w+)/);
      if (match) result.push(match[1]);
    }
    
    return result;
  }

  private extractFunctions(code: string): string[] {
    const functions = code.match(/function\s+(\w+)/g) || [];
    const arrowFunctions = code.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g) || [];
    
    const result: string[] = [];
    
    for (const func of functions) {
      const match = func.match(/function\s+(\w+)/);
      if (match) result.push(match[1]);
    }
    
    for (const func of arrowFunctions) {
      const match = func.match(/const\s+(\w+)/);
      if (match) result.push(match[1]);
    }
    
    return result;
  }

  private extractClasses(code: string): string[] {
    const classes = code.match(/class\s+(\w+)/g) || [];
    const result: string[] = [];
    
    for (const cls of classes) {
      const match = cls.match(/class\s+(\w+)/);
      if (match) result.push(match[1]);
    }
    
    return result;
  }
}