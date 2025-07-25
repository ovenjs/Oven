/**
 * @fileoverview Plugin services type definitions
 */

import type { Brand } from '../primitives/index.js';

/**
 * Plugin services available to plugins
 */
export interface PluginServices {
  readonly logger: PluginLogger;
  readonly cache: PluginCache;
  readonly events: PluginEventBus;
  readonly metrics: PluginMetrics;
  readonly security: PluginSecurity;
  readonly http: PluginHTTPClient;
  readonly storage: PluginStorage;
}

/**
 * Plugin logger interface
 */
export interface PluginLogger {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string | Error, meta?: LogMeta): void;
  fatal(message: string | Error, meta?: LogMeta): void;
  child(context: Record<string, unknown>): PluginLogger;
}

/**
 * Log metadata
 */
export interface LogMeta {
  readonly [key: string]: unknown;
}

/**
 * Plugin cache interface
 */
export interface PluginCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  mget<T>(keys: readonly string[]): Promise<(T | null)[]>;
  mset<T>(entries: readonly [string, T, number?][]): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(pattern?: string): Promise<string[]>;
  ttl(key: string): Promise<number>;
  expire(key: string, ttl: number): Promise<boolean>;
  size(): Promise<number>;
}

/**
 * Plugin event bus interface
 */
export interface PluginEventBus {
  emit<T = unknown>(event: string, data: T): Promise<void>;
  on<T = unknown>(event: string, handler: EventHandler<T>): UnsubscribeFunction;
  once<T = unknown>(event: string, handler: EventHandler<T>): UnsubscribeFunction;
  off(event: string, handler: EventHandler<unknown>): void;
  removeAllListeners(event?: string): void;
  listeners(event: string): EventHandler<unknown>[];
  listenerCount(event: string): number;
}

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

/**
 * Unsubscribe function type
 */
export type UnsubscribeFunction = () => void;

/**
 * Plugin metrics interface
 */
export interface PluginMetrics {
  counter(name: string, value?: number, tags?: MetricTags): void;
  gauge(name: string, value: number, tags?: MetricTags): void;
  histogram(name: string, value: number, tags?: MetricTags): void;
  timing(name: string, value: number, tags?: MetricTags): void;
  increment(name: string, tags?: MetricTags): void;
  decrement(name: string, tags?: MetricTags): void;
  createTimer(name: string, tags?: MetricTags): MetricTimer;
}

/**
 * Metric tags
 */
export interface MetricTags {
  readonly [key: string]: string;
}

/**
 * Metric timer interface
 */
export interface MetricTimer {
  start(): void;
  stop(): void;
  time<T>(fn: () => T): T;
  timeAsync<T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * Plugin security interface
 */
export interface PluginSecurity {
  validatePermission(permission: string): Promise<boolean>;
  requirePermission(permission: string): Promise<void>;
  checkRateLimit(key: string, limit: number, window: number): Promise<boolean>;
  sanitizeInput<T>(input: T): T;
  validateInput<T>(input: unknown, schema: ValidationSchema<T>): Promise<T>;
  encrypt(data: string): Promise<string>;
  decrypt(encryptedData: string): Promise<string>;
  hash(data: string): Promise<string>;
  verify(data: string, hash: string): Promise<boolean>;
}

/**
 * Validation schema for security
 */
export interface ValidationSchema<T = unknown> {
  readonly type: string;
  readonly properties?: Record<string, ValidationSchema>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
  readonly custom?: (value: unknown) => boolean | Promise<boolean>;
}

/**
 * Plugin HTTP client interface
 */
export interface PluginHTTPClient {
  get<T = unknown>(url: string, options?: HTTPOptions): Promise<HTTPResponse<T>>;
  post<T = unknown>(url: string, data?: unknown, options?: HTTPOptions): Promise<HTTPResponse<T>>;
  put<T = unknown>(url: string, data?: unknown, options?: HTTPOptions): Promise<HTTPResponse<T>>;
  patch<T = unknown>(url: string, data?: unknown, options?: HTTPOptions): Promise<HTTPResponse<T>>;
  delete<T = unknown>(url: string, options?: HTTPOptions): Promise<HTTPResponse<T>>;
  request<T = unknown>(options: HTTPRequestOptions): Promise<HTTPResponse<T>>;
}

/**
 * HTTP options
 */
export interface HTTPOptions {
  readonly headers?: Record<string, string>;
  readonly timeout?: number;
  readonly retries?: number;
  readonly validateStatus?: (status: number) => boolean;
}

/**
 * HTTP request options
 */
export interface HTTPRequestOptions extends HTTPOptions {
  readonly method: string;
  readonly url: string;
  readonly data?: unknown;
  readonly params?: Record<string, unknown>;
}

/**
 * HTTP response
 */
export interface HTTPResponse<T = unknown> {
  readonly data: T;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly config: HTTPRequestOptions;
}

/**
 * Plugin storage interface
 */
export interface PluginStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
  transaction<T>(fn: (tx: PluginStorageTransaction) => Promise<T>): Promise<T>;
}

/**
 * Plugin storage transaction
 */
export interface PluginStorageTransaction {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Branded types for services
 */
export type CacheKey = Brand<string, 'CacheKey'>;
export type StorageKey = Brand<string, 'StorageKey'>;
export type MetricName = Brand<string, 'MetricName'>;
export type EventName = Brand<string, 'EventName'>;
export type PermissionName = Brand<string, 'PermissionName'>;