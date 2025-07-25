/**
 * Primitive types package exports
 * Foundation types for the OvenJS Discord API wrapper
 */

// Brand types
export type {
  Brand,
  Snowflake,
  UserId,
  GuildId,
  ChannelId,
  MessageId,
  RoleId,
  EmojiId,
  WebhookId,
  ApplicationId,
  BotToken,
  UserToken,
  ImageURL,
  WebhookURL,
  ISO8601Timestamp,
  UnixTimestamp,
} from './brand.js';

export { brand, unbrand } from './brand.js';

// Phantom types
export type {
  Phantom,
  ReadPermission,
  WritePermission,
  AdminPermission,
  Validated,
  Sanitized,
  Encrypted,
  APIVersion10,
  APIVersion9,
  GlobalBucket,
  GuildBucket,
  ChannelBucket,
} from './phantom.js';

export { phantom } from './phantom.js';

// Temporal types
export type {
  Milliseconds,
  Seconds,
  Minutes,
  Hours,
  Days,
  TimeoutDuration,
  RateLimitReset,
  HeartbeatInterval,
} from './temporal.js';

export { ms, seconds, minutes, hours, days, toMs, DISCORD_TIMEOUTS } from './temporal.js';

// Utility types
export type {
  DeepPartial,
  DeepRequired,
  Optional,
  Required,
  ArrayElement,
  Awaited,
  Parameters,
  ReturnType,
  DotNotation,
  GetByPath,
  DeepMerge,
  DeepReadonly,
  NonNullable,
  PickByType,
  OmitByType,
} from './utility.js';