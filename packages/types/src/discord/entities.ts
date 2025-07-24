/**
 * @fileoverview Discord entity types with sophisticated discriminated unions
 */

import type {
  UserSnowflake,
  GuildSnowflake,
  ChannelSnowflake,
  MessageSnowflake,
  RoleSnowflake,
  EmojiSnowflake,
  ISO8601Timestamp,
  URLString,
  ColorValue
} from '../primitives/brand.js';

/**
 * Base Discord entity with phantom typing
 */
export interface DiscordEntity<TType extends string, TId extends string> {
  readonly id: TId;
  readonly type: TType;
}

/**
 * Advanced User type with discriminated unions
 */
export type APIUser = 
  | BotUser
  | RegularUser
  | SystemUser
  | WebhookUser;

interface BaseUser {
  readonly id: UserSnowflake;
  readonly username: string;
  readonly discriminator: string;
  readonly avatar?: string | null;
  readonly banner?: string | null;
  readonly accent_color?: ColorValue | null;
  readonly locale?: string;
  readonly verified?: boolean;
  readonly email?: string | null;
  readonly flags?: UserFlags;
  readonly premium_type?: PremiumType;
  readonly public_flags?: UserFlags;
}

export interface BotUser extends BaseUser {
  readonly bot: true;
  readonly system?: false;
  readonly webhook?: false;
}

export interface RegularUser extends BaseUser {
  readonly bot?: false;
  readonly system?: false;
  readonly webhook?: false;
  readonly mfa_enabled?: boolean;
}

export interface SystemUser extends BaseUser {
  readonly bot?: false;
  readonly system: true;
  readonly webhook?: false;
}

export interface WebhookUser extends BaseUser {
  readonly bot?: false;
  readonly system?: false;
  readonly webhook: true;
}

/**
 * Advanced Guild type with comprehensive properties
 */
export interface APIGuild {
  readonly id: GuildSnowflake;
  readonly name: string;
  readonly icon?: string | null;
  readonly icon_hash?: string | null;
  readonly splash?: string | null;
  readonly discovery_splash?: string | null;
  readonly owner?: boolean;
  readonly owner_id: UserSnowflake;
  readonly permissions?: string;
  readonly region?: string | null;
  readonly afk_channel_id?: ChannelSnowflake | null;
  readonly afk_timeout: number;
  readonly widget_enabled?: boolean;
  readonly widget_channel_id?: ChannelSnowflake | null;
  readonly verification_level: VerificationLevel;
  readonly default_message_notifications: DefaultMessageNotificationLevel;
  readonly explicit_content_filter: ExplicitContentFilterLevel;
  readonly roles: APIRole[];
  readonly emojis: APIEmoji[];
  readonly features: readonly GuildFeature[];
  readonly mfa_level: MFALevel;
  readonly application_id?: string | null;
  readonly system_channel_id?: ChannelSnowflake | null;
  readonly system_channel_flags: SystemChannelFlags;
  readonly rules_channel_id?: ChannelSnowflake | null;
  readonly max_presences?: number | null;
  readonly max_members?: number;
  readonly vanity_url_code?: string | null;
  readonly description?: string | null;
  readonly banner?: string | null;
  readonly premium_tier: PremiumTier;
  readonly premium_subscription_count?: number;
  readonly preferred_locale: string;
  readonly public_updates_channel_id?: ChannelSnowflake | null;
  readonly max_video_channel_users?: number;
  readonly max_stage_video_channel_users?: number;
  readonly approximate_member_count?: number;
  readonly approximate_presence_count?: number;
  readonly welcome_screen?: WelcomeScreen;
  readonly nsfw_level: NSFWLevel;
  readonly stickers?: APISticker[];
  readonly premium_progress_bar_enabled: boolean;
  readonly safety_alerts_channel_id?: ChannelSnowflake | null;
}

/**
 * Advanced Channel type with discriminated unions
 */
export type APIChannel = GuildTextChannel;

interface BaseChannel<TType extends ChannelType, TId extends ChannelSnowflake = ChannelSnowflake> {
  readonly id: TId;
  readonly type: TType;
}

export interface GuildTextChannel extends BaseChannel<ChannelType.GUILD_TEXT> {
  readonly guild_id: GuildSnowflake;
  readonly position: number;
  readonly permission_overwrites: Overwrite[];
  readonly name: string;
  readonly topic?: string | null;
  readonly nsfw: boolean;
  readonly last_message_id?: MessageSnowflake | null;
  readonly rate_limit_per_user: number;
  readonly parent_id?: ChannelSnowflake | null;
  readonly last_pin_timestamp?: ISO8601Timestamp | null;
}

/**
 * Advanced Message type with sophisticated structure
 */
export interface APIMessage {
  readonly id: MessageSnowflake;
  readonly channel_id: ChannelSnowflake;
  readonly author: APIUser;
  readonly content: string;
  readonly timestamp: ISO8601Timestamp;
  readonly edited_timestamp?: ISO8601Timestamp | null;
  readonly tts: boolean;
  readonly mention_everyone: boolean;
  readonly mentions: APIUser[];
  readonly mention_roles: RoleSnowflake[];
  readonly mention_channels?: ChannelMention[];
  readonly attachments: Attachment[];
  readonly embeds: Embed[];
  readonly reactions?: Reaction[];
  readonly nonce?: number | string;
  readonly pinned: boolean;
  readonly webhook_id?: UserSnowflake;
  readonly type: MessageType;
  readonly activity?: MessageActivity;
  readonly application?: Partial<APIApplication>;
  readonly application_id?: string;
  readonly message_reference?: MessageReference;
  readonly flags?: MessageFlags;
  readonly referenced_message?: APIMessage | null;
  readonly interaction?: MessageInteraction;
  readonly thread?: APIChannel;
  readonly components?: MessageComponent[];
  readonly sticker_items?: StickerItem[];
  readonly position?: number;
  readonly role_subscription_data?: RoleSubscriptionData;
}

/**
 * Enum types with branded values
 */
export const enum ChannelType {
  GUILD_TEXT = 0,
  DM = 1,
  GUILD_VOICE = 2,
  GROUP_DM = 3,
  GUILD_CATEGORY = 4,
  GUILD_ANNOUNCEMENT = 5,
  ANNOUNCEMENT_THREAD = 10,
  PUBLIC_THREAD = 11,
  PRIVATE_THREAD = 12,
  GUILD_STAGE_VOICE = 13,
  GUILD_DIRECTORY = 14,
  GUILD_FORUM = 15,
  GUILD_MEDIA = 16,
}

export const enum MessageType {
  DEFAULT = 0,
  RECIPIENT_ADD = 1,
  RECIPIENT_REMOVE = 2,
  CALL = 3,
  CHANNEL_NAME_CHANGE = 4,
  CHANNEL_ICON_CHANGE = 5,
  CHANNEL_PINNED_MESSAGE = 6,
  USER_JOINED = 7,
  GUILD_BOOST = 8,
  GUILD_BOOST_TIER_1 = 9,
  GUILD_BOOST_TIER_2 = 10,
  GUILD_BOOST_TIER_3 = 11,
  CHANNEL_FOLLOW_ADD = 12,
  GUILD_DISCOVERY_DISQUALIFIED = 14,
  GUILD_DISCOVERY_REQUALIFIED = 15,
  GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING = 16,
  GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING = 17,
  THREAD_CREATED = 18,
  REPLY = 19,
  CHAT_INPUT_COMMAND = 20,
  THREAD_STARTER_MESSAGE = 21,
  GUILD_INVITE_REMINDER = 22,
  CONTEXT_MENU_COMMAND = 23,
  AUTO_MODERATION_ACTION = 24,
  ROLE_SUBSCRIPTION_PURCHASE = 25,
  INTERACTION_PREMIUM_UPSELL = 26,
  STAGE_START = 27,
  STAGE_END = 28,
  STAGE_SPEAKER = 29,
  STAGE_TOPIC = 31,
  GUILD_APPLICATION_PREMIUM_SUBSCRIPTION = 32,
}

// Additional supporting interfaces and types...
export interface APIRole {
  readonly id: RoleSnowflake;
  readonly name: string;
  readonly color: ColorValue;
  readonly hoist: boolean;
  readonly icon?: string | null;
  readonly unicode_emoji?: string | null;
  readonly position: number;
  readonly permissions: string;
  readonly managed: boolean;
  readonly mentionable: boolean;
  readonly tags?: RoleTags;
  readonly flags: RoleFlags;
}

export interface APIEmoji {
  readonly id?: EmojiSnowflake | null;
  readonly name?: string | null;
  readonly roles?: RoleSnowflake[];
  readonly user?: APIUser;
  readonly require_colons?: boolean;
  readonly managed?: boolean;
  readonly animated?: boolean;
  readonly available?: boolean;
}

// Additional types and enums would continue here...
export type UserFlags = number;
export type PremiumType = number;
export type VerificationLevel = number;
export type DefaultMessageNotificationLevel = number;
export type ExplicitContentFilterLevel = number;
export type MFALevel = number;
export type PremiumTier = number;
export type NSFWLevel = number;
export type SystemChannelFlags = number;
export type MessageFlags = number;
export type RoleFlags = number;
// Remove some unused types that are causing issues
export type ThreadAutoArchiveDuration = number;
export type SortOrderType = number;
export type ForumLayoutType = number;

export type GuildFeature = string;

// Supporting interfaces
export interface Overwrite {
  readonly id: string;
  readonly type: number;
  readonly allow: string;
  readonly deny: string;
}

export interface ChannelMention {
  readonly id: ChannelSnowflake;
  readonly guild_id: GuildSnowflake;
  readonly type: ChannelType;
  readonly name: string;
}

export interface Attachment {
  readonly id: string;
  readonly filename: string;
  readonly description?: string;
  readonly content_type?: string;
  readonly size: number;
  readonly url: URLString;
  readonly proxy_url: URLString;
  readonly height?: number | null;
  readonly width?: number | null;
  readonly ephemeral?: boolean;
  readonly duration_secs?: number;
  readonly waveform?: string;
  readonly flags?: number;
}

export interface Embed {
  readonly title?: string;
  readonly type?: EmbedType;
  readonly description?: string;
  readonly url?: URLString;
  readonly timestamp?: ISO8601Timestamp;
  readonly color?: ColorValue;
  readonly footer?: EmbedFooter;
  readonly image?: EmbedImage;
  readonly thumbnail?: EmbedThumbnail;
  readonly video?: EmbedVideo;
  readonly provider?: EmbedProvider;
  readonly author?: EmbedAuthor;
  readonly fields?: EmbedField[];
}

export interface EmbedFooter {
  readonly text: string;
  readonly icon_url?: URLString;
  readonly proxy_icon_url?: URLString;
}

export interface EmbedImage {
  readonly url: URLString;
  readonly proxy_url?: URLString;
  readonly height?: number;
  readonly width?: number;
}

export interface EmbedThumbnail {
  readonly url: URLString;
  readonly proxy_url?: URLString;
  readonly height?: number;
  readonly width?: number;
}

export interface EmbedVideo {
  readonly url?: URLString;
  readonly proxy_url?: URLString;
  readonly height?: number;
  readonly width?: number;
}

export interface EmbedProvider {
  readonly name?: string;
  readonly url?: URLString;
}

export interface EmbedAuthor {
  readonly name: string;
  readonly url?: URLString;
  readonly icon_url?: URLString;
  readonly proxy_icon_url?: URLString;
}

export interface EmbedField {
  readonly name: string;
  readonly value: string;
  readonly inline?: boolean;
}

export interface Reaction {
  readonly count: number;
  readonly me: boolean;
  readonly emoji: APIEmoji;
}

export interface MessageActivity {
  readonly type: MessageActivityType;
  readonly party_id?: string;
}

export interface APIApplication {
  readonly id: string;
  readonly name: string;
  readonly icon?: string | null;
  readonly description: string;
  readonly rpc_origins?: string[];
  readonly bot_public: boolean;
  readonly bot_require_code_grant: boolean;
  readonly terms_of_service_url?: URLString;
  readonly privacy_policy_url?: URLString;
  readonly owner?: Partial<APIUser>;
  readonly verify_key: string;
  readonly team?: APITeam | null;
  readonly guild_id?: GuildSnowflake;
  readonly primary_sku_id?: string;
  readonly slug?: string;
  readonly cover_image?: string;
  readonly flags?: ApplicationFlags;
  readonly tags?: string[];
  readonly install_params?: InstallParams;
  readonly custom_install_url?: URLString;
  readonly role_connections_verification_url?: URLString;
}

export interface MessageReference {
  readonly message_id?: MessageSnowflake;
  readonly channel_id?: ChannelSnowflake;
  readonly guild_id?: GuildSnowflake;
  readonly fail_if_not_exists?: boolean;
}

export interface MessageInteraction {
  readonly id: string;
  readonly type: InteractionType;
  readonly name: string;
  readonly user: APIUser;
  readonly member?: Partial<APIGuildMember>;
}

export interface MessageComponent {
  readonly type: ComponentType;
  readonly custom_id?: string;
  readonly disabled?: boolean;
  readonly style?: ButtonStyle;
  readonly label?: string;
  readonly emoji?: Partial<APIEmoji>;
  readonly url?: URLString;
  readonly options?: SelectOption[];
  readonly placeholder?: string;
  readonly min_values?: number;
  readonly max_values?: number;
  readonly components?: MessageComponent[];
}

export interface StickerItem {
  readonly id: string;
  readonly name: string;
  readonly format_type: StickerFormatType;
}

export interface APISticker {
  readonly id: string;
  readonly pack_id?: string;
  readonly name: string;
  readonly description?: string | null;
  readonly tags: string;
  readonly asset?: string;
  readonly type: StickerType;
  readonly format_type: StickerFormatType;
  readonly available?: boolean;
  readonly guild_id?: GuildSnowflake;
  readonly user?: APIUser;
  readonly sort_value?: number;
}

export interface WelcomeScreen {
  readonly description?: string | null;
  readonly welcome_channels: WelcomeScreenChannel[];
}

export interface WelcomeScreenChannel {
  readonly channel_id: ChannelSnowflake;
  readonly description: string;
  readonly emoji_id?: EmojiSnowflake | null;
  readonly emoji_name?: string | null;
}

export interface RoleTags {
  readonly bot_id?: UserSnowflake;
  readonly integration_id?: string;
  readonly premium_subscriber?: null;
  readonly subscription_listing_id?: string;
  readonly available_for_purchase?: null;
  readonly guild_connections?: null;
}

export interface APITeam {
  readonly icon?: string | null;
  readonly id: string;
  readonly members: APITeamMember[];
  readonly name: string;
  readonly owner_user_id: UserSnowflake;
}

export interface APITeamMember {
  readonly membership_state: TeamMembershipState;
  readonly permissions: string[];
  readonly team_id: string;
  readonly user: Partial<APIUser>;
}

export interface InstallParams {
  readonly scopes: string[];
  readonly permissions: string;
}

export interface APIGuildMember {
  readonly user?: APIUser;
  readonly nick?: string | null;
  readonly avatar?: string | null;
  readonly roles: RoleSnowflake[];
  readonly joined_at: ISO8601Timestamp;
  readonly premium_since?: ISO8601Timestamp | null;
  readonly deaf: boolean;
  readonly mute: boolean;
  readonly flags: GuildMemberFlags;
  readonly pending?: boolean;
  readonly permissions?: string;
  readonly communication_disabled_until?: ISO8601Timestamp | null;
}

export interface SelectOption {
  readonly label: string;
  readonly value: string;
  readonly description?: string;
  readonly emoji?: Partial<APIEmoji>;
  readonly default?: boolean;
}

export interface RoleSubscriptionData {
  readonly role_subscription_listing_id: string;
  readonly tier_name: string;
  readonly total_months_subscribed: number;
  readonly is_renewal: boolean;
}

// Enums
export type EmbedType = 'rich' | 'image' | 'video' | 'gifv' | 'article' | 'link';
export type MessageActivityType = number;
export type ApplicationFlags = number;
export type InteractionType = number;
export type ComponentType = number;
export type ButtonStyle = number;
export type StickerFormatType = number;
export type StickerType = number;
export type TeamMembershipState = number;
export type GuildMemberFlags = number;

// Type guards for discriminated unions
export const isBot = (user: APIUser): user is BotUser => 'bot' in user && user.bot === true;
export const isRegularUser = (user: APIUser): user is RegularUser => !('bot' in user) || user.bot !== true;
export const isSystemUser = (user: APIUser): user is SystemUser => 'system' in user && user.system === true;
export const isWebhookUser = (user: APIUser): user is WebhookUser => 'webhook' in user && user.webhook === true;