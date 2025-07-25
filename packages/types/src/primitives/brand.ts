/**
 * Brand types for creating nominal types in TypeScript
 * Provides type safety for IDs and other primitive values
 */

declare const __brand: unique symbol;

/**
 * Brand type utility for creating nominal types
 * @template T - The base type
 * @template B - The brand identifier
 */
export type Brand<T, B> = T & { readonly [__brand]: B };

/**
 * Utility to create a branded value
 * @template T - The base type
 * @template B - The brand identifier
 * @param value - The value to brand
 * @returns The branded value
 */
export const brand = <T, B>(value: T): Brand<T, B> => value as Brand<T, B>;

/**
 * Utility to unbrand a value back to its base type
 * @template T - The base type
 * @template B - The brand identifier
 * @param value - The branded value
 * @returns The unbranded value
 */
export const unbrand = <T, B>(value: Brand<T, B>): T => value as T;

// Common Discord branded types
export type Snowflake = Brand<string, 'Snowflake'>;
export type UserId = Brand<Snowflake, 'UserId'>;
export type GuildId = Brand<Snowflake, 'GuildId'>;
export type ChannelId = Brand<Snowflake, 'ChannelId'>;
export type MessageId = Brand<Snowflake, 'MessageId'>;
export type RoleId = Brand<Snowflake, 'RoleId'>;
export type EmojiId = Brand<Snowflake, 'EmojiId'>;
export type WebhookId = Brand<Snowflake, 'WebhookId'>;
export type ApplicationId = Brand<Snowflake, 'ApplicationId'>;

// Token types
export type BotToken = Brand<string, 'BotToken'>;
export type UserToken = Brand<string, 'UserToken'>;

// URL types  
export type ImageURL = Brand<string, 'ImageURL'>;
export type WebhookURL = Brand<string, 'WebhookURL'>;

// Timestamp types
export type ISO8601Timestamp = Brand<string, 'ISO8601Timestamp'>;
export type UnixTimestamp = Brand<number, 'UnixTimestamp'>;