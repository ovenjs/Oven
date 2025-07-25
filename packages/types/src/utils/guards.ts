/**
 * Type guard functions for runtime type checking
 * Provides safe type narrowing with proper TypeScript support
 */

import type {
  Snowflake,
  UserId,
  GuildId,
  ChannelId,
  MessageId,
  BotToken,
} from '../primitives/brand.js';

import type {
  User,
  Guild,
  Channel,
  Message,
  GuildMember,
  Role,
  Emoji,
} from '../discord/entities.js';

// ============================================================================
// PRIMITIVE TYPE GUARDS
// ============================================================================

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === 'function';
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

// ============================================================================
// SNOWFLAKE TYPE GUARDS
// ============================================================================

const SNOWFLAKE_REGEX = /^\d{17,19}$/;

export function isSnowflake(value: unknown): value is Snowflake {
  return isString(value) && SNOWFLAKE_REGEX.test(value);
}

export function isUserId(value: unknown): value is UserId {
  return isSnowflake(value);
}

export function isGuildId(value: unknown): value is GuildId {
  return isSnowflake(value);
}

export function isChannelId(value: unknown): value is ChannelId {
  return isSnowflake(value);
}

export function isMessageId(value: unknown): value is MessageId {
  return isSnowflake(value);
}

// ============================================================================
// TOKEN TYPE GUARDS
// ============================================================================

const BOT_TOKEN_REGEX = /^[A-Za-z\d]{24}\.[A-Za-z\d]{6}\.[A-Za-z\d_-]{27}$/;

export function isBotToken(value: unknown): value is BotToken {
  return isString(value) && BOT_TOKEN_REGEX.test(value);
}

// ============================================================================
// DISCORD ENTITY TYPE GUARDS
// ============================================================================

export function isUser(value: unknown): value is User {
  return (
    isObject(value) &&
    isUserId(value.id) &&
    isString(value.username) &&
    isString(value.discriminator)
  );
}

export function isGuild(value: unknown): value is Guild {
  return (
    isObject(value) &&
    isGuildId(value.id) &&
    isString(value.name) &&
    isUserId(value.owner_id) &&
    isArray(value.roles) &&
    isArray(value.emojis)
  );
}

export function isChannel(value: unknown): value is Channel {
  return (
    isObject(value) &&
    isChannelId(value.id) &&
    isNumber(value.type)
  );
}

export function isMessage(value: unknown): value is Message {
  return (
    isObject(value) &&
    isMessageId(value.id) &&
    isChannelId(value.channel_id) &&
    isUser(value.author) &&
    isString(value.content) &&
    isString(value.timestamp)
  );
}

export function isGuildMember(value: unknown): value is GuildMember {
  return (
    isObject(value) &&
    isArray(value.roles) &&
    isString(value.joined_at) &&
    isBoolean(value.deaf) &&
    isBoolean(value.mute)
  );
}

export function isRole(value: unknown): value is Role {
  return (
    isObject(value) &&
    isSnowflake(value.id) &&
    isString(value.name) &&
    isNumber(value.color) &&
    isBoolean(value.hoist) &&
    isNumber(value.position) &&
    isString(value.permissions) &&
    isBoolean(value.managed) &&
    isBoolean(value.mentionable)
  );
}

export function isEmoji(value: unknown): value is Emoji {
  return isObject(value) && (value.id === null || isSnowflake(value.id));
}

// ============================================================================
// ARRAY TYPE GUARDS
// ============================================================================

export function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[] {
  return isArray(value) && value.every(guard);
}

export function isUserArray(value: unknown): value is User[] {
  return isArrayOf(value, isUser);
}

export function isGuildArray(value: unknown): value is Guild[] {
  return isArrayOf(value, isGuild);
}

export function isChannelArray(value: unknown): value is Channel[] {
  return isArrayOf(value, isChannel);
}

export function isMessageArray(value: unknown): value is Message[] {
  return isArrayOf(value, isMessage);
}

export function isRoleArray(value: unknown): value is Role[] {
  return isArrayOf(value, isRole);
}

// ============================================================================
// UTILITY TYPE GUARDS
// ============================================================================

export function isOneOf<T extends readonly unknown[]>(
  value: unknown,
  options: T
): value is T[number] {
  return options.includes(value);
}

export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

export function hasRequiredProperties<T extends Record<string, unknown>>(
  obj: unknown,
  keys: (keyof T)[]
): obj is T {
  if (!isObject(obj)) return false;
  return keys.every(key => key in obj && obj[key as string] !== undefined);
}

// ============================================================================
// ERROR TYPE GUARDS
// ============================================================================

export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function isErrorWithCode(value: unknown): value is Error & { code: string } {
  return isError(value) && 'code' in value && isString(value.code);
}

export function isErrorWithStatus(value: unknown): value is Error & { status: number } {
  return isError(value) && 'status' in value && isNumber(value.status);
}

// ============================================================================
// PROMISE TYPE GUARDS
// ============================================================================

export function isPromise<T>(value: unknown): value is Promise<T> {
  return value instanceof Promise;
}

export function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return isObject(value) && 'then' in value && isFunction(value.then);
}

// ============================================================================
// ASYNC ITERATOR TYPE GUARDS
// ============================================================================

export function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  return isObject(value) && Symbol.asyncIterator in value;
}

export function isIterable<T>(value: unknown): value is Iterable<T> {
  return isObject(value) && Symbol.iterator in value;
}