/**
 * @fileoverview Plugin events type definitions
 */

import type { Brand } from '../primitives/index.js';
import type { PluginLifecycleState } from './lifecycle.js';
import type { PluginError } from './core.js';

/**
 * Plugin system events
 */
export interface PluginEvents {
  // Plugin lifecycle events
  'plugin:loaded': [pluginName: string, version: string];
  'plugin:unloaded': [pluginName: string, version: string];
  'plugin:initialized': [pluginName: string, version: string];
  'plugin:destroyed': [pluginName: string, version: string];
  'plugin:error': [pluginName: string, error: PluginError];
  'plugin:state:changed': [pluginName: string, from: PluginLifecycleState, to: PluginLifecycleState];
  
  // Plugin configuration events
  'plugin:config:changed': [pluginName: string, path: string, oldValue: unknown, newValue: unknown];
  'plugin:config:validated': [pluginName: string, valid: boolean, errors?: string[]];
  'plugin:config:reset': [pluginName: string];
  
  // Plugin dependency events
  'plugin:dependency:resolved': [pluginName: string, dependency: string];
  'plugin:dependency:failed': [pluginName: string, dependency: string, error: Error];
  'plugin:dependency:circular': [pluginNames: string[]];
  
  // Plugin hook events
  'plugin:hook:registered': [pluginName: string, hookName: string];
  'plugin:hook:unregistered': [pluginName: string, hookName: string];
  'plugin:hook:executed': [pluginName: string, hookName: string, duration: number];
  'plugin:hook:failed': [pluginName: string, hookName: string, error: Error];
  
  // Plugin security events
  'plugin:security:validated': [pluginName: string, score: number];
  'plugin:security:violation': [pluginName: string, violation: SecurityViolation];
  'plugin:permission:requested': [pluginName: string, permission: string];
  'plugin:permission:granted': [pluginName: string, permission: string];
  'plugin:permission:denied': [pluginName: string, permission: string, reason: string];
  
  // Plugin sandbox events
  'plugin:sandbox:created': [pluginName: string, contextId: string];
  'plugin:sandbox:destroyed': [pluginName: string, contextId: string];
  'plugin:sandbox:violation': [pluginName: string, contextId: string, violation: SandboxViolation];
  
  // Plugin metrics events
  'plugin:metrics:collected': [pluginName: string, metrics: Record<string, unknown>];
  'plugin:health:checked': [pluginName: string, healthy: boolean, details?: Record<string, unknown>];
  
  // Plugin registry events
  'plugin:registry:updated': [added: string[], removed: string[], updated: string[]];
  'plugin:discovery:completed': [found: number, errors: number];
  'plugin:discovery:failed': [error: Error];
}

/**
 * Security violation
 */
export interface SecurityViolation {
  readonly type: SecurityViolationType;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

/**
 * Security violation types
 */
export enum SecurityViolationType {
  PERMISSION_DENIED = 'permission_denied',
  UNSAFE_OPERATION = 'unsafe_operation',
  RESOURCE_LIMIT_EXCEEDED = 'resource_limit_exceeded',
  MALICIOUS_ACTIVITY = 'malicious_activity',
  POLICY_VIOLATION = 'policy_violation'
}

/**
 * Sandbox violation
 */
export interface SandboxViolation {
  readonly type: SandboxViolationType;
  readonly description: string;
  readonly timestamp: Date;
  readonly context?: Record<string, unknown>;
}

/**
 * Sandbox violation types
 */
export enum SandboxViolationType {
  MEMORY_LIMIT = 'memory_limit',
  TIME_LIMIT = 'time_limit',
  ACCESS_DENIED = 'access_denied',
  MODULE_BLOCKED = 'module_blocked',
  FUNCTION_BLOCKED = 'function_blocked'
}

/**
 * Plugin event emitter interface
 */
export interface PluginEventEmitter {
  on<K extends keyof PluginEvents>(
    event: K,
    listener: (...args: PluginEvents[K]) => void
  ): void;
  
  once<K extends keyof PluginEvents>(
    event: K,
    listener: (...args: PluginEvents[K]) => void
  ): void;
  
  off<K extends keyof PluginEvents>(
    event: K,
    listener: (...args: PluginEvents[K]) => void
  ): void;
  
  emit<K extends keyof PluginEvents>(
    event: K,
    ...args: PluginEvents[K]
  ): boolean;
  
  removeAllListeners(event?: keyof PluginEvents): void;
  
  listeners<K extends keyof PluginEvents>(
    event: K
  ): ((...args: PluginEvents[K]) => void)[];
  
  listenerCount(event: keyof PluginEvents): number;
}

/**
 * Plugin event handler
 */
export interface PluginEventHandler<K extends keyof PluginEvents = keyof PluginEvents> {
  readonly event: K;
  readonly handler: (...args: PluginEvents[K]) => void | Promise<void>;
  readonly once?: boolean;
  readonly priority?: number;
  readonly pluginName?: string;
}

/**
 * Plugin event subscription
 */
export interface PluginEventSubscription {
  readonly id: string;
  readonly event: keyof PluginEvents;
  readonly pluginName: string;
  readonly active: boolean;
  readonly createdAt: Date;
  unsubscribe(): void;
}

/**
 * Plugin event filter
 */
export interface PluginEventFilter {
  readonly events?: readonly (keyof PluginEvents)[];
  readonly plugins?: readonly string[];
  readonly severity?: readonly string[];
  readonly timeRange?: {
    readonly start: Date;
    readonly end: Date;
  };
}

/**
 * Plugin event log entry
 */
export interface PluginEventLogEntry {
  readonly id: string;
  readonly event: keyof PluginEvents;
  readonly pluginName?: string;
  readonly timestamp: Date;
  readonly args: readonly unknown[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Plugin event logger
 */
export interface PluginEventLogger {
  log(entry: PluginEventLogEntry): void;
  getLogs(filter?: PluginEventFilter): readonly PluginEventLogEntry[];
  clearLogs(filter?: PluginEventFilter): void;
  export(format: 'json' | 'csv' | 'txt'): string;
}

/**
 * Branded types for events
 */
export type EventId = Brand<string, 'EventId'>;
export type SubscriptionId = Brand<string, 'SubscriptionId'>;