/**
 * Discord types package exports
 * All Discord API related types and constants
 */

// Entity types
export type {
  User,
  ClientUser,
  Guild,
  WelcomeScreen,
  WelcomeScreenChannel,
  Channel,
  PermissionOverwrite,
  ThreadMetadata,
  ThreadMember,
  ForumTag,
  DefaultReaction,
  Message,
  ChannelMention,
  Attachment,
  Embed,
  EmbedFooter,
  EmbedImage,
  EmbedThumbnail,
  EmbedVideo,
  EmbedProvider,
  EmbedAuthor,
  EmbedField,
  Reaction,
  MessageActivity,
  Application,
  Team,
  TeamMember,
  InstallParams,
  MessageReference,
  MessageInteraction,
  MessageComponent,
  SelectOption,
  StickerItem,
  Sticker,
  RoleSubscriptionData,
  Role,
  RoleTags,
  GuildMember,
  Emoji,
  Webhook,
} from './entities.js';

// Channel type enum
export { ChannelType } from './entities.js';

// API types
export type {
  RateLimitHeaders,
  RateLimitData,
  RESTOptions,
  RequestOptions,
  FileData,
  HTTPMethod,
  APIResponse,
  APIError,
  APIErrorDetail,
  APIErrorResponse,
  GatewayInfo,
  SessionStartLimit,
  GatewayPayload,
  MessageCreateOptions,
  MessageEditOptions,
  AllowedMentions,
  GuildCreateOptions,
  GuildEditOptions,
  ChannelCreateOptions,
  ChannelEditOptions,
  WebhookCreateOptions,
  WebhookEditOptions,
  WebhookExecuteOptions,
  InteractionResponse,
  InteractionCallbackData,
} from './api.js';

// Re-export primitives for convenience
export type {
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
} from '../primitives/index.js';

// API constants
export {
  API_VERSION,
  API_BASE_URL,
  CDN_BASE_URL,
  GATEWAY_VERSION,
} from './api.js';

// API enums
export {
  GatewayOpcodes,
  GatewayCloseCodes,
  GatewayIntentBits,
  InteractionType,
  InteractionResponseType,
} from './api.js';