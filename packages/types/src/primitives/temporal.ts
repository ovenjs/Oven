/**
 * Temporal types for time-based operations
 * Provides type-safe date and time handling for Discord API
 */

import type { Brand } from './brand.js';

// Duration types
export type Milliseconds = Brand<number, 'Milliseconds'>;
export type Seconds = Brand<number, 'Seconds'>;
export type Minutes = Brand<number, 'Minutes'>;
export type Hours = Brand<number, 'Hours'>;
export type Days = Brand<number, 'Days'>;

// Timeout types for Discord
export type TimeoutDuration = Brand<Milliseconds, 'TimeoutDuration'>;
export type RateLimitReset = Brand<Milliseconds, 'RateLimitReset'>;
export type HeartbeatInterval = Brand<Milliseconds, 'HeartbeatInterval'>;

// Utility functions for time conversion
export const ms = (value: number): Milliseconds => value as Milliseconds;
export const seconds = (value: number): Seconds => value as Seconds;
export const minutes = (value: number): Minutes => value as Minutes;
export const hours = (value: number): Hours => value as Hours;
export const days = (value: number): Days => value as Days;

export const toMs = {
  fromSeconds: (s: Seconds): Milliseconds => (s * 1000) as Milliseconds,
  fromMinutes: (m: Minutes): Milliseconds => (m * 60 * 1000) as Milliseconds,
  fromHours: (h: Hours): Milliseconds => (h * 60 * 60 * 1000) as Milliseconds,
  fromDays: (d: Days): Milliseconds => (d * 24 * 60 * 60 * 1000) as Milliseconds,
};

// Discord-specific timeouts
export const DISCORD_TIMEOUTS = {
  GATEWAY_CONNECT: ms(10_000),
  HEARTBEAT_ACK: ms(5_000),
  IDENTIFY_TIMEOUT: ms(5_000),
  RESUME_TIMEOUT: ms(5_000),
  REQUEST_TIMEOUT: ms(15_000),
  WEBHOOK_TIMEOUT: ms(10_000),
} as const;