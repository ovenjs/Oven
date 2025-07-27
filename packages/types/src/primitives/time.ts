/**
 * Time-related types and utilities
 */

import type { Brand } from './brand.js';

/**
 * Milliseconds branded type
 */
export type Milliseconds = Brand<number, 'Milliseconds'>;

/**
 * Seconds branded type
 */
export type Seconds = Brand<number, 'Seconds'>;

/**
 * Heartbeat interval type for Discord gateway
 */
export type HeartbeatInterval = Milliseconds;

/**
 * Convert seconds to milliseconds
 */
export const s = (seconds: number): Milliseconds => (seconds * 1000) as Milliseconds;

/**
 * Convert milliseconds to milliseconds (for consistency)
 */
export const ms = (milliseconds: number): Milliseconds => milliseconds as Milliseconds;

/**
 * Convert minutes to milliseconds
 */
export const m = (minutes: number): Milliseconds => (minutes * 60 * 1000) as Milliseconds;

/**
 * Convert hours to milliseconds
 */
export const h = (hours: number): Milliseconds => (hours * 60 * 60 * 1000) as Milliseconds;

/**
 * Convert days to milliseconds
 */
export const d = (days: number): Milliseconds => (days * 24 * 60 * 60 * 1000) as Milliseconds;