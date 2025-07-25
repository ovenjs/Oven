/**
 * Type transformation utilities
 * Functions for converting between different data formats
 */

import type { Snowflake, ISO8601Timestamp, UnixTimestamp } from '../primitives/brand.js';
import { brand } from '../primitives/brand.js';

// ============================================================================
// SNOWFLAKE TRANSFORMERS
// ============================================================================

/**
 * Extract timestamp from Discord snowflake
 */
export function snowflakeToTimestamp(snowflake: Snowflake): UnixTimestamp {
  const id = BigInt(snowflake);
  const timestamp = (id >> 22n) + 1420070400000n;
  return brand<number, 'UnixTimestamp'>(Number(timestamp));
}

/**
 * Extract date from Discord snowflake
 */
export function snowflakeToDate(snowflake: Snowflake): Date {
  const timestamp = snowflakeToTimestamp(snowflake);
  return new Date(timestamp);
}

/**
 * Get the worker ID from snowflake (0-31)
 */
export function snowflakeToWorkerId(snowflake: Snowflake): number {
  const id = BigInt(snowflake);
  return Number((id & 0x3e0000n) >> 17n);
}

/**
 * Get the process ID from snowflake (0-31)
 */
export function snowflakeToProcessId(snowflake: Snowflake): number {
  const id = BigInt(snowflake);
  return Number((id & 0x1f000n) >> 12n);
}

/**
 * Get the increment from snowflake (0-4095)
 */
export function snowflakeToIncrement(snowflake: Snowflake): number {
  const id = BigInt(snowflake);
  return Number(id & 0xfffn);
}

// ============================================================================
// DATE/TIME TRANSFORMERS
// ============================================================================

/**
 * Convert ISO8601 timestamp to Unix timestamp
 */
export function iso8601ToUnix(iso: ISO8601Timestamp): UnixTimestamp {
  return brand<number, 'UnixTimestamp'>(new Date(iso).getTime());
}

/**
 * Convert Unix timestamp to ISO8601 timestamp
 */
export function unixToIso8601(unix: UnixTimestamp): ISO8601Timestamp {
  return brand<string, 'ISO8601Timestamp'>(new Date(unix).toISOString());
}

/**
 * Convert Unix timestamp to Date object
 */
export function unixToDate(unix: UnixTimestamp): Date {
  return new Date(unix);
}

/**
 * Convert Date object to Unix timestamp
 */
export function dateToUnix(date: Date): UnixTimestamp {
  return brand<number, 'UnixTimestamp'>(date.getTime());
}

/**
 * Convert Date object to ISO8601 timestamp
 */
export function dateToIso8601(date: Date): ISO8601Timestamp {
  return brand<string, 'ISO8601Timestamp'>(date.toISOString());
}

// ============================================================================
// PERMISSION TRANSFORMERS
// ============================================================================

/**
 * Convert permission bitfield to array of permission names
 */
export function permissionsToArray(permissions: string): string[] {
  const bits = BigInt(permissions);
  const permissionNames: string[] = [];
  
  const PERMISSIONS = {
    CREATE_INSTANT_INVITE: 1n << 0n,
    KICK_MEMBERS: 1n << 1n,
    BAN_MEMBERS: 1n << 2n,
    ADMINISTRATOR: 1n << 3n,
    MANAGE_CHANNELS: 1n << 4n,
    MANAGE_GUILD: 1n << 5n,
    ADD_REACTIONS: 1n << 6n,
    VIEW_AUDIT_LOG: 1n << 7n,
    PRIORITY_SPEAKER: 1n << 8n,
    STREAM: 1n << 9n,
    VIEW_CHANNEL: 1n << 10n,
    SEND_MESSAGES: 1n << 11n,
    SEND_TTS_MESSAGES: 1n << 12n,
    MANAGE_MESSAGES: 1n << 13n,
    EMBED_LINKS: 1n << 14n,
    ATTACH_FILES: 1n << 15n,
    READ_MESSAGE_HISTORY: 1n << 16n,
    MENTION_EVERYONE: 1n << 17n,
    USE_EXTERNAL_EMOJIS: 1n << 18n,
    VIEW_GUILD_INSIGHTS: 1n << 19n,
    CONNECT: 1n << 20n,
    SPEAK: 1n << 21n,
    MUTE_MEMBERS: 1n << 22n,
    DEAFEN_MEMBERS: 1n << 23n,
    MOVE_MEMBERS: 1n << 24n,
    USE_VAD: 1n << 25n,
    CHANGE_NICKNAME: 1n << 26n,
    MANAGE_NICKNAMES: 1n << 27n,
    MANAGE_ROLES: 1n << 28n,
    MANAGE_WEBHOOKS: 1n << 29n,
    MANAGE_EMOJIS_AND_STICKERS: 1n << 30n,
    USE_APPLICATION_COMMANDS: 1n << 31n,
    REQUEST_TO_SPEAK: 1n << 32n,
    MANAGE_EVENTS: 1n << 33n,
    MANAGE_THREADS: 1n << 34n,
    CREATE_PUBLIC_THREADS: 1n << 35n,
    CREATE_PRIVATE_THREADS: 1n << 36n,
    USE_EXTERNAL_STICKERS: 1n << 37n,
    SEND_MESSAGES_IN_THREADS: 1n << 38n,
    USE_EMBEDDED_ACTIVITIES: 1n << 39n,
    MODERATE_MEMBERS: 1n << 40n,
  };

  for (const [name, bit] of Object.entries(PERMISSIONS)) {
    if (bits & bit) {
      permissionNames.push(name);
    }
  }

  return permissionNames;
}

/**
 * Convert array of permission names to bitfield
 */
export function arrayToPermissions(permissions: string[]): string {
  const PERMISSIONS = {
    CREATE_INSTANT_INVITE: 1n << 0n,
    KICK_MEMBERS: 1n << 1n,
    BAN_MEMBERS: 1n << 2n,
    ADMINISTRATOR: 1n << 3n,
    MANAGE_CHANNELS: 1n << 4n,
    MANAGE_GUILD: 1n << 5n,
    ADD_REACTIONS: 1n << 6n,
    VIEW_AUDIT_LOG: 1n << 7n,
    PRIORITY_SPEAKER: 1n << 8n,
    STREAM: 1n << 9n,
    VIEW_CHANNEL: 1n << 10n,
    SEND_MESSAGES: 1n << 11n,
    SEND_TTS_MESSAGES: 1n << 12n,
    MANAGE_MESSAGES: 1n << 13n,
    EMBED_LINKS: 1n << 14n,
    ATTACH_FILES: 1n << 15n,
    READ_MESSAGE_HISTORY: 1n << 16n,
    MENTION_EVERYONE: 1n << 17n,
    USE_EXTERNAL_EMOJIS: 1n << 18n,
    VIEW_GUILD_INSIGHTS: 1n << 19n,
    CONNECT: 1n << 20n,
    SPEAK: 1n << 21n,
    MUTE_MEMBERS: 1n << 22n,
    DEAFEN_MEMBERS: 1n << 23n,
    MOVE_MEMBERS: 1n << 24n,
    USE_VAD: 1n << 25n,
    CHANGE_NICKNAME: 1n << 26n,
    MANAGE_NICKNAMES: 1n << 27n,
    MANAGE_ROLES: 1n << 28n,
    MANAGE_WEBHOOKS: 1n << 29n,
    MANAGE_EMOJIS_AND_STICKERS: 1n << 30n,
    USE_APPLICATION_COMMANDS: 1n << 31n,
    REQUEST_TO_SPEAK: 1n << 32n,
    MANAGE_EVENTS: 1n << 33n,
    MANAGE_THREADS: 1n << 34n,
    CREATE_PUBLIC_THREADS: 1n << 35n,
    CREATE_PRIVATE_THREADS: 1n << 36n,
    USE_EXTERNAL_STICKERS: 1n << 37n,
    SEND_MESSAGES_IN_THREADS: 1n << 38n,
    USE_EMBEDDED_ACTIVITIES: 1n << 39n,
    MODERATE_MEMBERS: 1n << 40n,
  };

  let bits = 0n;
  for (const permission of permissions) {
    const bit = PERMISSIONS[permission as keyof typeof PERMISSIONS];
    if (bit) {
      bits |= bit;
    }
  }

  return bits.toString();
}

// ============================================================================
// COLOR TRANSFORMERS
// ============================================================================

/**
 * Convert hex color string to decimal number
 */
export function hexToDecimal(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * Convert decimal number to hex color string
 */
export function decimalToHex(decimal: number): string {
  return `#${decimal.toString(16).padStart(6, '0')}`;
}

/**
 * Convert RGB values to decimal number
 */
export function rgbToDecimal(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

/**
 * Convert decimal number to RGB values
 */
export function decimalToRgb(decimal: number): [number, number, number] {
  const r = (decimal >> 16) & 255;
  const g = (decimal >> 8) & 255;
  const b = decimal & 255;
  return [r, g, b];
}

// ============================================================================
// URL TRANSFORMERS
// ============================================================================

/**
 * Build Discord CDN URL for user avatar
 */
export function buildAvatarUrl(userId: string, avatarHash: string, options?: {
  size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
  format?: 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif';
}): string {
  const { size = 256, format = 'png' } = options ?? {};
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}?size=${size}`;
}

/**
 * Build Discord CDN URL for guild icon
 */
export function buildGuildIconUrl(guildId: string, iconHash: string, options?: {
  size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
  format?: 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif';
}): string {
  const { size = 256, format = 'png' } = options ?? {};
  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.${format}?size=${size}`;
}

/**
 * Build Discord CDN URL for emoji
 */
export function buildEmojiUrl(emojiId: string, options?: {
  size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
  format?: 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif';
}): string {
  const { size = 256, format = 'png' } = options ?? {};
  return `https://cdn.discordapp.com/emojis/${emojiId}.${format}?size=${size}`;
}

// ============================================================================
// OBJECT TRANSFORMERS
// ============================================================================

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }

  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
}

/**
 * Convert snake_case keys to camelCase
 */
export function snakeToCamel<T extends Record<string, any>>(obj: T): any {
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }

  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = snakeToCamel(value);
    }
    return result;
  }

  return obj;
}

/**
 * Convert camelCase keys to snake_case
 */
export function camelToSnake<T extends Record<string, any>>(obj: T): any {
  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }

  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = camelToSnake(value);
    }
    return result;
  }

  return obj;
}