/**
 * Guild structure for OvenJS
 * Represents a Discord guild (server)
 */

import type { StructureOptions } from '@ovenjs/types';
import type { Guild as GuildData, GuildId, UserId, ChannelId, RoleId, EmojiId, ImageURL } from '@ovenjs/types';
import { Base } from './Base.js';

export class Guild extends Base {
  public readonly name: string;
  public readonly icon: string | null;
  public readonly iconHash: string | null;
  public readonly splash: string | null;
  public readonly discoverySplash: string | null;
  public readonly ownerId: UserId;
  public readonly permissions: string | null;
  public readonly region: string | null;
  public readonly afkChannelId: ChannelId | null;
  public readonly afkTimeout: number;
  public readonly widgetEnabled: boolean;
  public readonly widgetChannelId: ChannelId | null;
  public readonly verificationLevel: number;
  public readonly defaultMessageNotifications: number;
  public readonly explicitContentFilter: number;
  public readonly features: string[];
  public readonly mfaLevel: number;
  public readonly applicationId: string | null;
  public readonly systemChannelId: ChannelId | null;
  public readonly systemChannelFlags: number;
  public readonly rulesChannelId: ChannelId | null;
  public readonly maxPresences: number | null;
  public readonly maxMembers: number | null;
  public readonly vanityUrlCode: string | null;
  public readonly description: string | null;
  public readonly banner: string | null;
  public readonly premiumTier: number;
  public readonly premiumSubscriptionCount: number | null;
  public readonly preferredLocale: string;
  public readonly publicUpdatesChannelId: ChannelId | null;
  public readonly maxVideoChannelUsers: number | null;
  public readonly maxStageVideoChannelUsers: number | null;
  public readonly approximateMemberCount: number | null;
  public readonly approximatePresenceCount: number | null;
  public readonly nsfwLevel: number;
  public readonly premiumProgressBarEnabled: boolean;
  public readonly safetyAlertsChannelId: ChannelId | null;
  
  // Managers
  public readonly channels: any; // GuildChannelManager
  public readonly members: any; // GuildMemberManager
  public readonly roles: any; // GuildRoleManager
  public readonly emojis: any; // GuildEmojiManager
  public readonly stickers: any; // GuildStickerManager
  public readonly invites: any; // GuildInviteManager
  public readonly bans: any; // GuildBanManager
  public readonly presences: any; // GuildPresenceManager
  public readonly voiceStates: any; // GuildVoiceStateManager

  constructor(options: StructureOptions, data: GuildData) {
    super(options, data);
    
    this.name = data.name;
    this.icon = data.icon;
    this.iconHash = data.icon_hash ?? null;
    this.splash = data.splash;
    this.discoverySplash = data.discovery_splash;
    this.ownerId = data.owner_id;
    this.permissions = data.permissions ?? null;
    this.region = data.region ?? null;
    this.afkChannelId = data.afk_channel_id;
    this.afkTimeout = data.afk_timeout;
    this.widgetEnabled = data.widget_enabled ?? false;
    this.widgetChannelId = data.widget_channel_id ?? null;
    this.verificationLevel = data.verification_level;
    this.defaultMessageNotifications = data.default_message_notifications;
    this.explicitContentFilter = data.explicit_content_filter;
    this.features = data.features;
    this.mfaLevel = data.mfa_level;
    this.applicationId = data.application_id;
    this.systemChannelId = data.system_channel_id;
    this.systemChannelFlags = data.system_channel_flags;
    this.rulesChannelId = data.rules_channel_id;
    this.maxPresences = data.max_presences ?? null;
    this.maxMembers = data.max_members ?? null;
    this.vanityUrlCode = data.vanity_url_code;
    this.description = data.description;
    this.banner = data.banner;
    this.premiumTier = data.premium_tier;
    this.premiumSubscriptionCount = data.premium_subscription_count ?? null;
    this.preferredLocale = data.preferred_locale;
    this.publicUpdatesChannelId = data.public_updates_channel_id;
    this.maxVideoChannelUsers = data.max_video_channel_users ?? null;
    this.maxStageVideoChannelUsers = data.max_stage_video_channel_users ?? null;
    this.approximateMemberCount = data.approximate_member_count ?? null;
    this.approximatePresenceCount = data.approximate_presence_count ?? null;
    this.nsfwLevel = data.nsfw_level;
    this.premiumProgressBarEnabled = data.premium_progress_bar_enabled ?? false;
    this.safetyAlertsChannelId = data.safety_alerts_channel_id ?? null;

    // Initialize managers (these would be implemented)
    // this.channels = new GuildChannelManager({ client: this.client, guild: this });
    // this.members = new GuildMemberManager({ client: this.client, guild: this });
    // this.roles = new GuildRoleManager({ client: this.client, guild: this });
    // this.emojis = new GuildEmojiManager({ client: this.client, guild: this });
    // this.stickers = new GuildStickerManager({ client: this.client, guild: this });
    // this.invites = new GuildInviteManager({ client: this.client, guild: this });
    // this.bans = new GuildBanManager({ client: this.client, guild: this });
    // this.presences = new GuildPresenceManager({ client: this.client, guild: this });
    // this.voiceStates = new GuildVoiceStateManager({ client: this.client, guild: this });
  }

  /**
   * Get the guild's icon URL
   */
  iconURL(options: { format?: 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif'; size?: number } = {}): ImageURL | null {
    if (!this.icon) return null;
    
    const format = options.format ?? 'png';
    const size = options.size ?? 256;
    
    const url = `https://cdn.discordapp.com/icons/${this.id}/${this.icon}.${format}?size=${size}`;
    return url as ImageURL;
  }

  /**
   * Get the guild's splash URL
   */
  splashURL(options: { format?: 'png' | 'jpg' | 'jpeg' | 'webp'; size?: number } = {}): ImageURL | null {
    if (!this.splash) return null;
    
    const format = options.format ?? 'png';
    const size = options.size ?? 512;
    
    const url = `https://cdn.discordapp.com/splashes/${this.id}/${this.splash}.${format}?size=${size}`;
    return url as ImageURL;
  }

  /**
   * Get the guild's discovery splash URL
   */
  discoverySplashURL(options: { format?: 'png' | 'jpg' | 'jpeg' | 'webp'; size?: number } = {}): ImageURL | null {
    if (!this.discoverySplash) return null;
    
    const format = options.format ?? 'png';
    const size = options.size ?? 512;
    
    const url = `https://cdn.discordapp.com/discovery-splashes/${this.id}/${this.discoverySplash}.${format}?size=${size}`;
    return url as ImageURL;
  }

  /**
   * Get the guild's banner URL
   */
  bannerURL(options: { format?: 'png' | 'jpg' | 'jpeg' | 'webp'; size?: number } = {}): ImageURL | null {
    if (!this.banner) return null;
    
    const format = options.format ?? 'png';
    const size = options.size ?? 512;
    
    const url = `https://cdn.discordapp.com/banners/${this.id}/${this.banner}.${format}?size=${size}`;
    return url as ImageURL;
  }

  /**
   * Get the guild's owner
   */
  async fetchOwner(): Promise<any> {
    return await this.client.users.fetch(this.ownerId);
  }

  /**
   * Check if the guild has a specific feature
   */
  hasFeature(feature: string): boolean {
    return this.features.includes(feature);
  }

  /**
   * Get the guild's member count
   */
  get memberCount(): number {
    return this.approximateMemberCount ?? this.members?.cache.size ?? 0;
  }

  /**
   * Get the guild's online member count
   */
  get onlineCount(): number {
    return this.approximatePresenceCount ?? this.presences?.cache.size ?? 0;
  }

  /**
   * Check if the guild is verified
   */
  get verified(): boolean {
    return this.hasFeature('VERIFIED');
  }

  /**
   * Check if the guild is partnered
   */
  get partnered(): boolean {
    return this.hasFeature('PARTNERED');
  }

  /**
   * Check if the guild is a community server
   */
  get community(): boolean {
    return this.hasFeature('COMMUNITY');
  }

  /**
   * Check if the guild has boost features
   */
  get boosted(): boolean {
    return this.premiumTier > 0;
  }

  /**
   * Fetch the guild from the API
   */
  async fetch(): Promise<Guild> {
    const guildData = await this.client.rest.guilds.get(this.id);
    return new Guild({ client: this.client }, guildData);
  }

  /**
   * Edit the guild
   */
  async edit(data: any): Promise<Guild> {
    const guildData = await this.client.rest.guilds.modify(this.id, data);
    return new Guild({ client: this.client }, guildData);
  }

  /**
   * Delete the guild
   */
  async delete(): Promise<void> {
    await this.client.rest.guilds.delete(this.id);
  }

  /**
   * Leave the guild
   */
  async leave(): Promise<void> {
    await this.client.rest.users.leaveGuild(this.id);
  }

  /**
   * Get guild audit log
   */
  async fetchAuditLog(options: any = {}): Promise<any> {
    return await this.client.rest.guilds.getAuditLog(this.id, options);
  }

  /**
   * Get guild widget
   */
  async fetchWidget(): Promise<any> {
    return await this.client.rest.guilds.getWidget(this.id);
  }

  /**
   * Get guild widget settings
   */
  async fetchWidgetSettings(): Promise<any> {
    return await this.client.rest.guilds.getWidgetSettings(this.id);
  }

  /**
   * Edit guild widget settings
   */
  async editWidgetSettings(data: any): Promise<any> {
    return await this.client.rest.guilds.modifyWidgetSettings(this.id, data);
  }

  /**
   * Get guild vanity URL
   */
  async fetchVanityURL(): Promise<any> {
    return await this.client.rest.guilds.getVanityURL(this.id);
  }

  /**
   * Convert to JSON representation
   */
  override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      name: this.name,
      icon: this.icon,
      iconHash: this.iconHash,
      splash: this.splash,
      discoverySplash: this.discoverySplash,
      ownerId: this.ownerId,
      permissions: this.permissions,
      region: this.region,
      afkChannelId: this.afkChannelId,
      afkTimeout: this.afkTimeout,
      widgetEnabled: this.widgetEnabled,
      widgetChannelId: this.widgetChannelId,
      verificationLevel: this.verificationLevel,
      defaultMessageNotifications: this.defaultMessageNotifications,
      explicitContentFilter: this.explicitContentFilter,
      features: this.features,
      mfaLevel: this.mfaLevel,
      applicationId: this.applicationId,
      systemChannelId: this.systemChannelId,
      systemChannelFlags: this.systemChannelFlags,
      rulesChannelId: this.rulesChannelId,
      maxPresences: this.maxPresences,
      maxMembers: this.maxMembers,
      vanityUrlCode: this.vanityUrlCode,
      description: this.description,
      banner: this.banner,
      premiumTier: this.premiumTier,
      premiumSubscriptionCount: this.premiumSubscriptionCount,
      preferredLocale: this.preferredLocale,
      publicUpdatesChannelId: this.publicUpdatesChannelId,
      maxVideoChannelUsers: this.maxVideoChannelUsers,
      maxStageVideoChannelUsers: this.maxStageVideoChannelUsers,
      approximateMemberCount: this.approximateMemberCount,
      approximatePresenceCount: this.approximatePresenceCount,
      nsfwLevel: this.nsfwLevel,
      premiumProgressBarEnabled: this.premiumProgressBarEnabled,
      safetyAlertsChannelId: this.safetyAlertsChannelId,
    };
  }

  /**
   * String representation
   */
  override toString(): string {
    return this.name;
  }
}