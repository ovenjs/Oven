/**
 * Discord entity type definitions
 * Core Discord API object types with proper TypeScript typing
 */

import type {
  Snowflake,
  UserId,
  GuildId,
  ChannelId,
  MessageId,
  RoleId,
  EmojiId,
  WebhookId,
  ApplicationId,
  ISO8601Timestamp,
} from '../primitives/brand.js';

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: UserId;
  username: string;
  discriminator: string;
  global_name?: string | null;
  avatar?: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: string | null;
  accent_color?: number | null;
  locale?: string;
  verified?: boolean;
  email?: string | null;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
  avatar_decoration?: string | null;
}

export interface ClientUser extends User {
  verified: boolean;
  email: string | null;
  flags: number;
  premium_type: number;
  mfa_enabled: boolean;
}

// ============================================================================
// GUILD TYPES
// ============================================================================

export interface Guild {
  id: GuildId;
  name: string;
  icon?: string | null;
  icon_hash?: string | null;
  splash?: string | null;
  discovery_splash?: string | null;
  owner?: boolean;
  owner_id: UserId;
  permissions?: string;
  region?: string | null;
  afk_channel_id?: ChannelId | null;
  afk_timeout: number;
  widget_enabled?: boolean;
  widget_channel_id?: ChannelId | null;
  verification_level: number;
  default_message_notifications: number;
  explicit_content_filter: number;
  roles: Role[];
  emojis: Emoji[];
  features: string[];
  mfa_level: number;
  application_id?: ApplicationId | null;
  system_channel_id?: ChannelId | null;
  system_channel_flags: number;
  rules_channel_id?: ChannelId | null;
  max_presences?: number | null;
  max_members?: number;
  vanity_url_code?: string | null;
  description?: string | null;
  banner?: string | null;
  premium_tier: number;
  premium_subscription_count?: number;
  preferred_locale: string;
  public_updates_channel_id?: ChannelId | null;
  max_video_channel_users?: number;
  max_stage_video_channel_users?: number;
  approximate_member_count?: number;
  approximate_presence_count?: number;
  welcome_screen?: WelcomeScreen;
  nsfw_level: number;
  stickers?: Sticker[];
  premium_progress_bar_enabled: boolean;
  safety_alerts_channel_id?: ChannelId | null;
}

export interface WelcomeScreen {
  description?: string | null;
  welcome_channels: WelcomeScreenChannel[];
}

export interface WelcomeScreenChannel {
  channel_id: ChannelId;
  description: string;
  emoji_id?: EmojiId | null;
  emoji_name?: string | null;
}

// ============================================================================
// CHANNEL TYPES
// ============================================================================

export const enum ChannelType {
  GUILD_TEXT = 0,
  DM = 1,
  GUILD_VOICE = 2,
  GROUP_DM = 3,
  GUILD_CATEGORY = 4,
  GUILD_ANNOUNCEMENT = 5,
  GUILD_STORE = 6,
  ANNOUNCEMENT_THREAD = 10,
  PUBLIC_THREAD = 11,
  PRIVATE_THREAD = 12,
  GUILD_STAGE_VOICE = 13,
  GUILD_DIRECTORY = 14,
  GUILD_FORUM = 15,
  GUILD_MEDIA = 16,
}

export interface Channel {
  id: ChannelId;
  type: ChannelType;
  guild_id?: GuildId;
  position?: number;
  permission_overwrites?: PermissionOverwrite[];
  name?: string | null;
  topic?: string | null;
  nsfw?: boolean;
  last_message_id?: MessageId | null;
  bitrate?: number;
  user_limit?: number;
  rate_limit_per_user?: number;
  recipients?: User[];
  icon?: string | null;
  owner_id?: UserId;
  application_id?: ApplicationId;
  parent_id?: ChannelId | null;
  last_pin_timestamp?: ISO8601Timestamp | null;
  rtc_region?: string | null;
  video_quality_mode?: number;
  message_count?: number;
  member_count?: number;
  thread_metadata?: ThreadMetadata;
  member?: ThreadMember;
  default_auto_archive_duration?: number;
  permissions?: string;
  flags?: number;
  total_message_sent?: number;
  available_tags?: ForumTag[];
  applied_tags?: Snowflake[];
  default_reaction_emoji?: DefaultReaction | null;
  default_thread_rate_limit_per_user?: number;
  default_sort_order?: number | null;
  default_forum_layout?: number;
}

export interface PermissionOverwrite {
  id: Snowflake;
  type: number;
  allow: string;
  deny: string;
}

export interface ThreadMetadata {
  archived: boolean;
  auto_archive_duration: number;
  archive_timestamp: ISO8601Timestamp;
  locked: boolean;
  invitable?: boolean;
  create_timestamp?: ISO8601Timestamp | null;
}

export interface ThreadMember {
  id?: ChannelId;
  user_id?: UserId;
  join_timestamp: ISO8601Timestamp;
  flags: number;
}

export interface ForumTag {
  id: Snowflake;
  name: string;
  moderated: boolean;
  emoji_id?: EmojiId | null;
  emoji_name?: string | null;
}

export interface DefaultReaction {
  emoji_id?: EmojiId | null;
  emoji_name?: string | null;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export interface Message {
  id: MessageId;
  channel_id: ChannelId;
  author: User;
  content: string;
  timestamp: ISO8601Timestamp;
  edited_timestamp?: ISO8601Timestamp | null;
  tts: boolean;
  mention_everyone: boolean;
  mentions: User[];
  mention_roles: RoleId[];
  mention_channels?: ChannelMention[];
  attachments: Attachment[];
  embeds: Embed[];
  reactions?: Reaction[];
  nonce?: number | string;
  pinned: boolean;
  webhook_id?: WebhookId;
  type: number;
  activity?: MessageActivity;
  application?: Application;
  application_id?: ApplicationId;
  message_reference?: MessageReference;
  flags?: number;
  referenced_message?: Message | null;
  interaction?: MessageInteraction;
  thread?: Channel;
  components?: MessageComponent[];
  sticker_items?: StickerItem[];
  stickers?: Sticker[];
  position?: number;
  role_subscription_data?: RoleSubscriptionData;
}

export interface ChannelMention {
  id: ChannelId;
  guild_id: GuildId;
  type: ChannelType;
  name: string;
}

export interface Attachment {
  id: Snowflake;
  filename: string;
  description?: string;
  content_type?: string;
  size: number;
  url: string;
  proxy_url: string;
  height?: number | null;
  width?: number | null;
  ephemeral?: boolean;
  duration_secs?: number;
  waveform?: string;
  flags?: number;
}

export interface Embed {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  timestamp?: ISO8601Timestamp;
  color?: number;
  footer?: EmbedFooter;
  image?: EmbedImage;
  thumbnail?: EmbedThumbnail;
  video?: EmbedVideo;
  provider?: EmbedProvider;
  author?: EmbedAuthor;
  fields?: EmbedField[];
}

export interface EmbedFooter {
  text: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

export interface EmbedImage {
  url: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

export interface EmbedThumbnail {
  url: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

export interface EmbedVideo {
  url?: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

export interface EmbedProvider {
  name?: string;
  url?: string;
}

export interface EmbedAuthor {
  name: string;
  url?: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface Reaction {
  count: number;
  me: boolean;
  emoji: Emoji;
}

export interface MessageActivity {
  type: number;
  party_id?: string;
}

export interface Application {
  id: ApplicationId;
  name: string;
  icon?: string | null;
  description: string;
  rpc_origins?: string[];
  bot_public: boolean;
  bot_require_code_grant: boolean;
  terms_of_service_url?: string;
  privacy_policy_url?: string;
  owner?: User;
  verify_key: string;
  team?: Team | null;
  guild_id?: GuildId;
  primary_sku_id?: Snowflake;
  slug?: string;
  cover_image?: string;
  flags?: number;
  approximate_guild_count?: number;
  redirect_uris?: string[];
  interactions_endpoint_url?: string;
  role_connections_verification_url?: string;
  tags?: string[];
  install_params?: InstallParams;
  custom_install_url?: string;
}

export interface Team {
  icon?: string | null;
  id: Snowflake;
  members: TeamMember[];
  name: string;
  owner_user_id: UserId;
}

export interface TeamMember {
  membership_state: number;
  permissions: string[];
  team_id: Snowflake;
  user: User;
}

export interface InstallParams {
  scopes: string[];
  permissions: string;
}

export interface MessageReference {
  message_id?: MessageId;
  channel_id?: ChannelId;
  guild_id?: GuildId;
  fail_if_not_exists?: boolean;
}

export interface MessageInteraction {
  id: Snowflake;
  type: number;
  name: string;
  user: User;
  member?: GuildMember;
}

export interface MessageComponent {
  type: number;
  style?: number;
  label?: string;
  emoji?: Emoji;
  custom_id?: string;
  url?: string;
  disabled?: boolean;
  components?: MessageComponent[];
  options?: SelectOption[];
  placeholder?: string;
  min_values?: number;
  max_values?: number;
  min_length?: number;
  max_length?: number;
  required?: boolean;
  value?: string;
}

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: Emoji;
  default?: boolean;
}

export interface StickerItem {
  id: Snowflake;
  name: string;
  format_type: number;
}

export interface Sticker {
  id: Snowflake;
  pack_id?: Snowflake;
  name: string;
  description?: string | null;
  tags: string;
  asset?: string;
  type: number;
  format_type: number;
  available?: boolean;
  guild_id?: GuildId;
  user?: User;
  sort_value?: number;
}

export interface RoleSubscriptionData {
  role_subscription_listing_id: Snowflake;
  tier_name: string;
  total_months_subscribed: number;
  is_renewal: boolean;
}

// ============================================================================
// ROLE TYPES
// ============================================================================

export interface Role {
  id: RoleId;
  name: string;
  color: number;
  hoist: boolean;
  icon?: string | null;
  unicode_emoji?: string | null;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
  tags?: RoleTags;
  flags: number;
}

export interface RoleTags {
  bot_id?: UserId;
  integration_id?: Snowflake;
  premium_subscriber?: null;
  subscription_listing_id?: Snowflake;
  available_for_purchase?: null;
  guild_connections?: null;
}

// ============================================================================
// MEMBER TYPES
// ============================================================================

export interface GuildMember {
  user?: User;
  nick?: string | null;
  avatar?: string | null;
  roles: RoleId[];
  joined_at: ISO8601Timestamp;
  premium_since?: ISO8601Timestamp | null;
  deaf: boolean;
  mute: boolean;
  flags: number;
  pending?: boolean;
  permissions?: string;
  communication_disabled_until?: ISO8601Timestamp | null;
}

// ============================================================================
// EMOJI TYPES
// ============================================================================

export interface Emoji {
  id?: EmojiId | null;
  name?: string | null;
  roles?: RoleId[];
  user?: User;
  require_colons?: boolean;
  managed?: boolean;
  animated?: boolean;
  available?: boolean;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface Webhook {
  id: WebhookId;
  type: number;
  guild_id?: GuildId | null;
  channel_id: ChannelId;
  user?: User;
  name?: string | null;
  avatar?: string | null;
  token?: string;
  application_id?: ApplicationId | null;
  source_guild?: Guild;
  source_channel?: Channel;
  url?: string;
}