/**
 * @fileoverview Advanced generic types with sophisticated constraints
 */

import type { Snowflake, BrandedId } from '../primitives/brand.js';
import type { DeepReadonly, NonEmptyArray } from '../primitives/utility.js';

/**
 * Advanced generic constraint for Discord entities
 */
export interface DiscordEntity<TId extends string = string> {
  readonly id: BrandedId<TId>;
  readonly createdAt: Date;
}

/**
 * Generic repository pattern with advanced constraints
 */
export interface Repository<
  TEntity extends DiscordEntity,
  TCreateData = Partial<TEntity>,
  TUpdateData = Partial<Omit<TEntity, 'id' | 'createdAt'>>,
  TQueryOptions = Record<string, unknown>
> {
  findById<TId extends TEntity['id']>(id: TId): Promise<TEntity | null>;
  findMany(options?: TQueryOptions): Promise<TEntity[]>;
  create(data: TCreateData): Promise<TEntity>;
  update(id: TEntity['id'], data: TUpdateData): Promise<TEntity>;
  delete(id: TEntity['id']): Promise<void>;
}

/**
 * Advanced event system with type-safe event data
 */
export interface EventMap {
  [K: string]: unknown[];
}

export interface TypedEventEmitter<TEventMap extends EventMap> {
  on<K extends keyof TEventMap>(
    event: K,
    listener: (...args: TEventMap[K]) => void
  ): this;
  
  once<K extends keyof TEventMap>(
    event: K,
    listener: (...args: TEventMap[K]) => void
  ): this;
  
  emit<K extends keyof TEventMap>(
    event: K,
    ...args: TEventMap[K]
  ): boolean;
  
  off<K extends keyof TEventMap>(
    event: K,
    listener: (...args: TEventMap[K]) => void
  ): this;
}

/**
 * Advanced builder pattern with method chaining
 */
export interface Builder<T> {
  build(): T;
}

export interface FluentBuilder<T, TThis = unknown> extends Builder<T> {
  clone(): TThis;
  reset(): TThis;
}

/**
 * Manager pattern with advanced type constraints
 */
export interface Manager<
  TEntity extends DiscordEntity,
  TKey extends TEntity['id'] = TEntity['id']
> {
  readonly cache: Map<TKey, TEntity>;
  fetch(id: TKey): Promise<TEntity>;
  resolve(idOrEntity: TKey | TEntity): TEntity | null;
  add(entity: TEntity): TEntity;
  remove(id: TKey): boolean;
  clear(): void;
}

/**
 * Advanced plugin system with type-safe configuration
 */
export interface Plugin<TConfig = Record<string, unknown>> {
  readonly name: string;
  readonly version: string;
  readonly dependencies?: readonly string[];
  readonly config?: TConfig;
  initialize(context: PluginContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export interface PluginContext {
  readonly plugins: PluginManager;
  readonly events: TypedEventEmitter<any>;
  readonly cache: CacheManager;
  readonly logger: Logger;
}

export interface PluginManager {
  register<TConfig>(plugin: Plugin<TConfig>): Promise<void>;
  unregister(name: string): Promise<void>;
  get<TConfig>(name: string): Plugin<TConfig> | null;
  isLoaded(name: string): boolean;
}

/**
 * Cache manager with advanced generics
 */
export interface CacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): boolean;
  clear(): void;
  has(key: string): boolean;
  keys(): IterableIterator<string>;
  values<T>(): IterableIterator<T>;
  entries<T>(): IterableIterator<[string, T]>;
}

/**
 * Logger with advanced type constraints
 */
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string | Error, meta?: Record<string, unknown>): void;
  fatal(message: string | Error, meta?: Record<string, unknown>): void;
}

/**
 * Advanced state management with immutable updates
 */
export interface StateManager<TState extends Record<string, unknown>> {
  readonly state: DeepReadonly<TState>;
  getState(): DeepReadonly<TState>;
  setState<K extends keyof TState>(
    key: K,
    value: TState[K] | ((prev: TState[K]) => TState[K])
  ): void;
  subscribe<K extends keyof TState>(
    key: K,
    callback: (value: TState[K], previous: TState[K]) => void
  ): () => void;
  reset(): void;
}

/**
 * Advanced validation with type-safe schemas
 */
export interface Validator<T> {
  validate(value: unknown): value is T;
  validateAsync(value: unknown): Promise<T>;
  errors: readonly ValidationError[];
}

export interface ValidationError {
  readonly path: readonly (string | number)[];
  readonly message: string;
  readonly code: string;
  readonly expected: string;
  readonly received: string;
}

/**
 * Advanced HTTP client with type-safe requests
 */
export interface HTTPClient {
  request<TResponse = unknown>(
    options: RequestOptions
  ): Promise<Response<TResponse>>;
  
  get<TResponse = unknown>(
    url: string,
    options?: RequestOptions
  ): Promise<Response<TResponse>>;
  
  post<TBody = unknown, TResponse = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions
  ): Promise<Response<TResponse>>;
  
  put<TBody = unknown, TResponse = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions
  ): Promise<Response<TResponse>>;
  
  patch<TBody = unknown, TResponse = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions
  ): Promise<Response<TResponse>>;
  
  delete<TResponse = unknown>(
    url: string,
    options?: RequestOptions
  ): Promise<Response<TResponse>>;
}

export interface RequestOptions {
  readonly headers?: Record<string, string>;
  readonly query?: Record<string, string | number | boolean>;
  readonly timeout?: number;
  readonly signal?: AbortSignal;
}

export interface Response<T = unknown> {
  readonly data: T;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly ok: boolean;
}

/**
 * Extract event data from event map
 */
export type ExtractEventData<
  TEventMap extends EventMap,
  TEvent extends keyof TEventMap
> = TEventMap[TEvent];

/**
 * Infer manager type from entity
 */
export type InferManagerType<TEntity extends DiscordEntity> = Manager<TEntity>;

/**
 * Plugin configuration type
 */
export type PluginConfiguration<T extends Plugin<any>> = T extends Plugin<infer TConfig>
  ? TConfig
  : never;