/**
 * @fileoverview Temporal types for time-based operations with advanced typing
 */

import type { Brand, Phantom } from './brand.js';

/**
 * Unix timestamp in milliseconds
 */
export type UnixMilliseconds = Brand<number, 'UnixMilliseconds'>;

/**
 * Unix timestamp in seconds
 */
export type UnixSeconds = Brand<number, 'UnixSeconds'>;

/**
 * Duration in milliseconds with phantom typing
 */
export type DurationMs = Phantom<number, 'DurationMs'>;

/**
 * Duration in seconds with phantom typing
 */
export type DurationSeconds = Phantom<number, 'DurationSeconds'>;

/**
 * Rate limit duration with specific typing
 */
export type RateLimitDuration = Phantom<number, 'RateLimitDuration'>;

/**
 * Cache TTL duration with specific typing
 */
export type CacheTTL = Phantom<number, 'CacheTTL'>;

/**
 * Snowflake timestamp extraction result
 */
export type SnowflakeTimestamp = Brand<number, 'SnowflakeTimestamp'>;

/**
 * Discord epoch (first second of 2015)
 */
export const DISCORD_EPOCH = 1420070400000n;

/**
 * Time zone offset with brand typing
 */
export type TimezoneOffset = Brand<number, 'TimezoneOffset'>;

/**
 * Temporal utility functions
 */
export interface TemporalUtils {
  /**
   * Extract timestamp from Discord snowflake
   */
  extractSnowflakeTimestamp<T extends string>(snowflake: T): SnowflakeTimestamp;
  
  /**
   * Convert between different time formats
   */
  toUnixMs(seconds: UnixSeconds): UnixMilliseconds;
  toUnixSeconds(ms: UnixMilliseconds): UnixSeconds;
  
  /**
   * Duration utilities
   */
  toDurationMs(seconds: DurationSeconds): DurationMs;
  toDurationSeconds(ms: DurationMs): DurationSeconds;
  
  /**
   * Current time utilities
   */
  nowMs(): UnixMilliseconds;
  nowSeconds(): UnixSeconds;
}

/**
 * Time range with branded types
 */
export interface TimeRange {
  readonly start: UnixMilliseconds;
  readonly end: UnixMilliseconds;
}

/**
 * Rate limit window with temporal constraints
 */
export interface RateLimitWindow {
  readonly windowStart: UnixMilliseconds;
  readonly windowEnd: UnixMilliseconds;
  readonly duration: RateLimitDuration;
  readonly remaining: number;
  readonly limit: number;
}

/**
 * Cache entry with temporal metadata
 */
export interface CacheEntry<T = unknown> {
  readonly value: T;
  readonly createdAt: UnixMilliseconds;
  readonly expiresAt: UnixMilliseconds;
  readonly ttl: CacheTTL;
  readonly accessCount: number;
  readonly lastAccessed: UnixMilliseconds;
}

/**
 * Temporal event with precise timing
 */
export interface TemporalEvent<TData = unknown> {
  readonly id: string;
  readonly type: string;
  readonly data: TData;
  readonly timestamp: UnixMilliseconds;
  readonly sequence: number;
  readonly source: string;
}

/**
 * Time-based statistics
 */
export interface TemporalStats {
  readonly period: TimeRange;
  readonly count: number;
  readonly rate: number; // per second
  readonly peak: UnixMilliseconds;
  readonly average: DurationMs;
}

/**
 * Schedule with cron-like functionality
 */
export interface Schedule {
  readonly id: string;
  readonly expression: string;
  readonly nextRun: UnixMilliseconds;
  readonly lastRun?: UnixMilliseconds;
  readonly timezone: TimezoneOffset;
}

/**
 * Temporal query constraints
 */
export interface TemporalQuery {
  readonly since?: UnixMilliseconds;
  readonly until?: UnixMilliseconds;
  readonly limit?: number;
  readonly order?: 'asc' | 'desc';
}