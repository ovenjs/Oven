/**
 * @fileoverview Brand types and phantom types for compile-time safety
 * Prevents mixing different types of IDs and provides strong typing
 */

/**
 * Brand utility type - creates a branded type that's distinct at compile time
 */
export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

/**
 * Phantom type utility - adds compile-time constraints without runtime overhead
 */
export type Phantom<T, TPhantom extends string> = T & { readonly __phantom: TPhantom };

/**
 * Snowflake ID - Discord's unique identifier system
 * Prevents mixing different entity IDs at compile time
 */
export type Snowflake<TEntity extends string = string> = Brand<string, `Snowflake<${TEntity}>`>;

// Specific entity snowflakes - cannot be mixed at compile time
export type UserSnowflake = Snowflake<'User'>;
export type GuildSnowflake = Snowflake<'Guild'>;
export type ChannelSnowflake = Snowflake<'Channel'>;
export type MessageSnowflake = Snowflake<'Message'>;
export type RoleSnowflake = Snowflake<'Role'>;
export type EmojiSnowflake = Snowflake<'Emoji'>;
export type WebhookSnowflake = Snowflake<'Webhook'>;
export type ApplicationSnowflake = Snowflake<'Application'>;
export type InteractionSnowflake = Snowflake<'Interaction'>;
export type ThreadSnowflake = Snowflake<'Thread'>;
export type StickerSnowflake = Snowflake<'Sticker'>;
export type GuildScheduledEventSnowflake = Snowflake<'GuildScheduledEvent'>;

/**
 * Generic branded ID type for extensibility
 */
export type BrandedId<TEntity extends string> = Snowflake<TEntity>;

/**
 * Permission bit flags with phantom typing for permission validation
 */
export type PermissionBits = Phantom<bigint, 'PermissionBits'>;

/**
 * Intent bit flags with phantom typing for intent validation  
 */
export type IntentBits = Phantom<number, 'IntentBits'>;

/**
 * ISO 8601 timestamp with brand typing
 */
export type ISO8601Timestamp = Brand<string, 'ISO8601Timestamp'>;

/**
 * Base64 encoded data with brand typing
 */
export type Base64String = Brand<string, 'Base64String'>;

/**
 * URL string with brand typing
 */
export type URLString = Brand<string, 'URLString'>;

/**
 * Token string with phantom typing for security
 */
export type Token<TType extends 'Bot' | 'Bearer' | 'User' = 'Bot'> = Phantom<string, `Token<${TType}>`>;

/**
 * API Version with brand typing
 */
export type APIVersion = Brand<string, 'APIVersion'>;

/**
 * Locale string with brand typing for i18n
 */
export type LocaleString = Brand<string, 'LocaleString'>;

/**
 * Color value with validation at type level
 */
export type ColorValue = Phantom<number, 'ColorValue'> & {
  readonly __constraint: 'Must be between 0 and 0xFFFFFF';
};

/**
 * Utility to create snowflake IDs with proper typing
 */
export const createSnowflake = <TEntity extends string>(
  id: string,
  _entity: TEntity
): Snowflake<TEntity> => id as Snowflake<TEntity>;

/**
 * Type guard to check if a value is a valid snowflake
 */
export const isSnowflake = (value: unknown): value is Snowflake => {
  return typeof value === 'string' && /^\d{17,19}$/.test(value);
};

/**
 * Extract the entity type from a snowflake type
 */
export type ExtractSnowflakeEntity<T> = T extends Snowflake<infer TEntity> ? TEntity : never;

/**
 * Union of all specific snowflake types
 */
export type AnySnowflake = 
  | UserSnowflake
  | GuildSnowflake
  | ChannelSnowflake
  | MessageSnowflake
  | RoleSnowflake
  | EmojiSnowflake
  | WebhookSnowflake
  | ApplicationSnowflake
  | InteractionSnowflake
  | ThreadSnowflake
  | StickerSnowflake
  | GuildScheduledEventSnowflake;