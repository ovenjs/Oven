/**
 * Discord API-specific types
 * Request/response types and API constants
 */

import type {
  Snowflake,
  UserId,
  GuildId,
  ChannelId,
  MessageId,
  RoleId,
  BotToken,
  ISO8601Timestamp,
} from '../primitives/brand.js';

import type {
  User,
  Guild,
  Channel,
  Message,
  Role,
  GuildMember,
  Embed,
  MessageComponent,
  Attachment,
} from './entities.js';

// ============================================================================
// API CONSTANTS
// ============================================================================

export const API_VERSION = 10 as const;
export const API_BASE_URL = `https://discord.com/api/v${API_VERSION}` as const;
export const CDN_BASE_URL = 'https://cdn.discordapp.com' as const;
export const GATEWAY_VERSION = 10 as const;

// ============================================================================
// RATE LIMIT TYPES
// ============================================================================

export interface RateLimitHeaders {
  'x-ratelimit-limit'?: string;
  'x-ratelimit-remaining'?: string;
  'x-ratelimit-reset'?: string;
  'x-ratelimit-reset-after'?: string;
  'x-ratelimit-bucket'?: string;
  'x-ratelimit-global'?: string;
  'x-ratelimit-scope'?: string;
  'retry-after'?: string;
}

export interface RateLimitData {
  limit: number;
  remaining: number;
  reset: number;
  resetAfter: number;
  bucket: string;
  global: boolean;
  scope: 'user' | 'global' | 'shared';
}

// ============================================================================
// REST REQUEST TYPES
// ============================================================================

export interface RESTOptions {
  token: BotToken;
  version?: number;
  baseURL?: string;
  timeout?: number;
  retries?: number;
  rateLimitOffset?: number;
  globalRequestsPerSecond?: number;
  userAgent?: string;
}

export interface RequestOptions {
  method: HTTPMethod;
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  files?: FileData[];
  reason?: string;
  timeout?: number;
}

export interface FileData {
  name: string;
  data: Buffer | Uint8Array;
  contentType?: string;
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface APIResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
  rateLimit?: RateLimitData;
}

export interface APIError {
  code: number;
  message: string;
  errors?: Record<string, APIErrorDetail>;
}

export interface APIErrorDetail {
  code: string;
  message: string;
}

export interface APIErrorResponse {
  message: string;
  code: number;
  errors?: Record<string, APIErrorDetail>;
  retry_after?: number;
  global?: boolean;
}

// ============================================================================
// GATEWAY TYPES
// ============================================================================

export interface GatewayInfo {
  url: string;
  shards: number;
  session_start_limit: SessionStartLimit;
}

export interface SessionStartLimit {
  total: number;
  remaining: number;
  reset_after: number;
  max_concurrency: number;
}

export interface GatewayPayload<T = unknown> {
  op: GatewayOpcodes;
  d: T;
  s?: number;
  t?: string;
}

export const enum GatewayOpcodes {
  DISPATCH = 0,
  HEARTBEAT = 1,
  IDENTIFY = 2,
  PRESENCE_UPDATE = 3,
  VOICE_STATE_UPDATE = 4,
  RESUME = 6,
  RECONNECT = 7,
  REQUEST_GUILD_MEMBERS = 8,
  INVALID_SESSION = 9,
  HELLO = 10,
  HEARTBEAT_ACK = 11,
}

export const enum GatewayCloseCodes {
  UNKNOWN_ERROR = 4000,
  UNKNOWN_OPCODE = 4001,
  DECODE_ERROR = 4002,
  NOT_AUTHENTICATED = 4003,
  AUTHENTICATION_FAILED = 4004,
  ALREADY_AUTHENTICATED = 4005,
  INVALID_SEQ = 4007,
  RATE_LIMITED = 4008,
  SESSION_TIMED_OUT = 4009,
  INVALID_SHARD = 4010,
  SHARDING_REQUIRED = 4011,
  INVALID_API_VERSION = 4012,
  INVALID_INTENTS = 4013,
  DISALLOWED_INTENTS = 4014,
}

// ============================================================================
// INTENT TYPES
// ============================================================================

export const enum GatewayIntentBits {
  GUILDS = 1 << 0,
  GUILD_MEMBERS = 1 << 1,
  GUILD_MODERATION = 1 << 2,
  GUILD_EMOJIS_AND_STICKERS = 1 << 3,
  GUILD_INTEGRATIONS = 1 << 4,
  GUILD_WEBHOOKS = 1 << 5,
  GUILD_INVITES = 1 << 6,
  GUILD_VOICE_STATES = 1 << 7,
  GUILD_PRESENCES = 1 << 8,
  GUILD_MESSAGES = 1 << 9,
  GUILD_MESSAGE_REACTIONS = 1 << 10,
  GUILD_MESSAGE_TYPING = 1 << 11,
  DIRECT_MESSAGES = 1 << 12,
  DIRECT_MESSAGE_REACTIONS = 1 << 13,
  DIRECT_MESSAGE_TYPING = 1 << 14,
  MESSAGE_CONTENT = 1 << 15,
  GUILD_SCHEDULED_EVENTS = 1 << 16,
  AUTO_MODERATION_CONFIGURATION = 1 << 20,
  AUTO_MODERATION_EXECUTION = 1 << 21,
}

// ============================================================================
// MESSAGE CREATION TYPES
// ============================================================================

export interface MessageCreateOptions {
  content?: string;
  nonce?: string | number;
  tts?: boolean;
  embeds?: Embed[];
  allowed_mentions?: AllowedMentions;
  message_reference?: MessageReference;
  components?: MessageComponent[];
  sticker_ids?: Snowflake[];
  files?: FileData[];
  flags?: number;
}

export interface MessageEditOptions {
  content?: string | null;
  embeds?: Embed[] | null;
  flags?: number | null;
  allowed_mentions?: AllowedMentions | null;
  components?: MessageComponent[] | null;
  files?: FileData[];
  attachments?: Attachment[];
}

export interface AllowedMentions {
  parse?: ('roles' | 'users' | 'everyone')[];
  roles?: RoleId[];
  users?: UserId[];
  replied_user?: boolean;
}

export interface MessageReference {
  message_id?: MessageId;
  channel_id?: ChannelId;
  guild_id?: GuildId;
  fail_if_not_exists?: boolean;
}

// ============================================================================
// GUILD CREATION TYPES
// ============================================================================

export interface GuildCreateOptions {
  name: string;
  region?: string;
  icon?: string;
  verification_level?: number;
  default_message_notifications?: number;
  explicit_content_filter?: number;
  roles?: Role[];
  channels?: Partial<Channel>[];
  afk_channel_id?: ChannelId;
  afk_timeout?: number;
  system_channel_id?: ChannelId;
  system_channel_flags?: number;
}

export interface GuildEditOptions {
  name?: string;
  region?: string | null;
  verification_level?: number | null;
  default_message_notifications?: number | null;
  explicit_content_filter?: number | null;
  afk_channel_id?: ChannelId | null;
  afk_timeout?: number;
  icon?: string | null;
  owner_id?: UserId;
  splash?: string | null;
  discovery_splash?: string | null;
  banner?: string | null;
  system_channel_id?: ChannelId | null;
  system_channel_flags?: number;
  rules_channel_id?: ChannelId | null;
  public_updates_channel_id?: ChannelId | null;
  preferred_locale?: string | null;
  features?: string[];
  description?: string | null;
  premium_progress_bar_enabled?: boolean;
}

// ============================================================================
// CHANNEL CREATION TYPES
// ============================================================================

export interface ChannelCreateOptions {
  name: string;
  type?: number;
  topic?: string;
  bitrate?: number;
  user_limit?: number;
  rate_limit_per_user?: number;
  position?: number;
  permission_overwrites?: PermissionOverwrite[];
  parent_id?: ChannelId;
  nsfw?: boolean;
  rtc_region?: string;
  video_quality_mode?: number;
  default_auto_archive_duration?: number;
}

export interface ChannelEditOptions {
  name?: string;
  type?: number;
  position?: number | null;
  topic?: string | null;
  nsfw?: boolean | null;
  rate_limit_per_user?: number | null;
  bitrate?: number | null;
  user_limit?: number | null;
  permission_overwrites?: PermissionOverwrite[] | null;
  parent_id?: ChannelId | null;
  rtc_region?: string | null;
  video_quality_mode?: number | null;
  default_auto_archive_duration?: number | null;
  flags?: number;
}

export interface PermissionOverwrite {
  id: Snowflake;
  type: number;
  allow: string;
  deny: string;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface WebhookCreateOptions {
  name: string;
  avatar?: string | null;
}

export interface WebhookEditOptions {
  name?: string;
  avatar?: string | null;
  channel_id?: ChannelId;
}

export interface WebhookExecuteOptions {
  content?: string;
  username?: string;
  avatar_url?: string;
  tts?: boolean;
  embeds?: Embed[];
  allowed_mentions?: AllowedMentions;
  components?: MessageComponent[];
  files?: FileData[];
  flags?: number;
  thread_id?: ChannelId;
}

// ============================================================================
// INTERACTION TYPES
// ============================================================================

export const enum InteractionType {
  PING = 1,
  APPLICATION_COMMAND = 2,
  MESSAGE_COMPONENT = 3,
  APPLICATION_COMMAND_AUTOCOMPLETE = 4,
  MODAL_SUBMIT = 5,
}

export const enum InteractionResponseType {
  PONG = 1,
  CHANNEL_MESSAGE_WITH_SOURCE = 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5,
  DEFERRED_UPDATE_MESSAGE = 6,
  UPDATE_MESSAGE = 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT = 8,
  MODAL = 9,
}

export interface InteractionResponse {
  type: InteractionResponseType;
  data?: InteractionCallbackData;
}

export interface InteractionCallbackData {
  tts?: boolean;
  content?: string;
  embeds?: Embed[];
  allowed_mentions?: AllowedMentions;
  flags?: number;
  components?: MessageComponent[];
  attachments?: Attachment[];
}