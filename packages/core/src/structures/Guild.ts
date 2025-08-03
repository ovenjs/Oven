import type { APIGuild } from 'discord-api-types/v10';
import { BaseStructure } from './Base';
import { User } from './User';
import { Role } from './Role';
import { Emoji } from './Emoji';
import type { Bot } from '../Bot';

/**
 * Represents a Discord guild (server).
 *
 * @remarks
 * This class represents a Discord guild, which is a collection of users and channels
 * that make up a community. It provides properties and methods for interacting with guild data.
 */
export class Guild extends BaseStructure {
  /**
   * The name of the guild.
   */
  public name: string;

  /**
   * The icon hash of the guild.
   */
  public icon: string | null;

  /**
   * The splash hash of the guild.
   */
  public splash: string | null;

  /**
   * The discovery splash hash of the guild.
   */
  public discoverySplash: string | null;

  /**
   * Whether the guild is considered large.
   */
  public large: boolean;

  /**
   * The owner of the guild.
   */
  public owner: User | null;

  /**
   * The ID of the owner of the guild.
   */
  public ownerId: string;

  /**
   * The AFK channel ID of the guild.
   */
  public afkChannelId: string | null;

  /**
   * The AFK timeout in seconds of the guild.
   */
  public afkTimeout: number;

  /**
   * The widget channel ID of the guild.
   */
  public widgetChannelId: string | null;

  /**
   * The verification level of the guild.
   */
  public verificationLevel: number;

  /**
   * The default message notification level of the guild.
   */
  public defaultMessageNotifications: number;

  /**
   * The explicit content filter level of the guild.
   */
  public explicitContentFilter: number;

  /**
   * The roles in the guild.
   */
  public roles: Role[];

  /**
   * The emojis in the guild.
   */
  public emojis: Emoji[];

  /**
   * The features of the guild.
   */
  public features: string[];

  /**
   * The MFA level of the guild.
   */
  public mfaLevel: number;

  /**
   * The application ID of the guild creator if it is bot-created.
   */
  public applicationId: string | null;

  /**
   * The system channel ID of the guild.
   */
  public systemChannelId: string | null;

  /**
   * The system channel flags of the guild.
   */
  public systemChannelFlags: number;

  /**
   * The rules channel ID of the guild.
   */
  public rulesChannelId: string | null;

  /**
   * The maximum number of presences for the guild.
   */
  public maxPresences: number | null;

  /**
   * The maximum number of members for the guild.
   */
  public maxMembers: number | null;

  /**
   * The vanity URL code of the guild.
   */
  public vanityUrlCode: string | null;

  /**
   * The description of the guild.
   */
  public description: string | null;

  /**
   * The banner hash of the guild.
   */
  public banner: string | null;

  /**
   * The premium tier of the guild.
   */
  public premiumTier: number;

  /**
   * The premium subscription count of the guild.
   */
  public premiumSubscriptionCount: number;

  /**
   * The preferred locale of the guild.
   */
  public preferredLocale: string;

  /**
   * The public updates channel ID of the guild.
   */
  public publicUpdatesChannelId: string | null;

  /**
   * The maximum number of video channel users in the guild.
   */
  public maxVideoChannelUsers: number | null;

  /**
   * The approximate number of members in the guild.
   */
  public approximateMemberCount: number | null;

  /**
   * The approximate number of non-offline members in the guild.
   */
  public approximatePresenceCount: number | null;

  /**
   * The welcome screen of the guild.
   */
  public welcomeScreen: any | null;

  /**
   * The NSFW level of the guild.
   */
  public nsfwLevel: number;

  /**
   * The stage instances in the guild.
   */
  public stageInstances: any[];

  /**
   * The stickers in the guild.
   */
  public stickers: any[];

  /**
   * Whether the guild has the progress bar enabled.
   */
  public premiumProgressBarEnabled: boolean;

  /**
   * Creates a new Guild instance.
   *
   * @param bot - The bot instance this guild belongs to.
   * @param data - The raw guild data from the Discord API.
   */
  constructor(bot: Bot, data: APIGuild) {
    super(bot, data.id);
    this._patch(data);
  }

  /**
   * Patches this guild with raw data from the Discord API.
   *
   * @param data - The raw guild data from the Discord API.
   * @returns This guild instance for chaining.
   */
  public _patch(data: APIGuild): this {
    this.name = data.name;
    this.icon = data.icon ?? null;
    this.splash = data.splash ?? null;
    this.discoverySplash = data.discovery_splash ?? null;
    this.large = (data as any).large ?? false;
    this.ownerId = data.owner_id;
    this.afkChannelId = data.afk_channel_id ?? null;
    this.afkTimeout = data.afk_timeout;
    this.widgetChannelId = data.widget_channel_id ?? null;
    this.verificationLevel = data.verification_level;
    this.defaultMessageNotifications = data.default_message_notifications;
    this.explicitContentFilter = data.explicit_content_filter;
    this.roles = (data.roles ?? []).map(role => {
      const roleObj = new Role(this.bot, role);
      // Add guild ID to the role for future reference
      (roleObj as any).guildId = this.id;
      return roleObj;
    });
    this.emojis = (data.emojis ?? []).map(emoji => new Emoji(this.bot, emoji, this.id));
    this.features = data.features ?? [];
    this.mfaLevel = data.mfa_level;
    this.applicationId = data.application_id ?? null;
    this.systemChannelId = data.system_channel_id ?? null;
    this.systemChannelFlags = data.system_channel_flags;
    this.rulesChannelId = data.rules_channel_id ?? null;
    this.maxPresences = data.max_presences ?? null;
    this.maxMembers = data.max_members ?? null;
    this.vanityUrlCode = data.vanity_url_code ?? null;
    this.description = data.description ?? null;
    this.banner = data.banner ?? null;
    this.premiumTier = data.premium_tier;
    this.premiumSubscriptionCount = data.premium_subscription_count ?? 0;
    this.preferredLocale = data.preferred_locale;
    this.publicUpdatesChannelId = data.public_updates_channel_id ?? null;
    this.maxVideoChannelUsers = data.max_video_channel_users ?? null;
    this.approximateMemberCount = data.approximate_member_count ?? null;
    this.approximatePresenceCount = data.approximate_presence_count ?? null;
    this.welcomeScreen = data.welcome_screen ?? null;
    this.nsfwLevel = data.nsfw_level;
    this.stageInstances = (data as any).stage_instances ?? [];
    this.stickers = data.stickers ?? [];
    this.premiumProgressBarEnabled = data.premium_progress_bar_enabled ?? false;

    // Set the owner if available
    if (data.owner_id) {
      this.owner = new User(this.bot, {
        id: data.owner_id,
        username: '',
        discriminator: '',
        avatar: null,
        global_name: null,
        bot: false,
        system: false,
        public_flags: undefined,
        banner: null,
        accent_color: null
      });
    } else {
      this.owner = null;
    }

    return this;
  }

  /**
   * The URL of the guild's icon.
   */
  public get iconURL(): string | null {
    if (!this.icon) return null;
    
    const format = this.icon.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/icons/${this.id}/${this.icon}.${format}`;
  }

  /**
   * The URL of the guild's splash.
   */
  public get splashURL(): string | null {
    if (!this.splash) return null;
    
    const format = this.splash.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/splashes/${this.id}/${this.splash}.${format}`;
  }

  /**
   * The URL of the guild's banner.
   */
  public get bannerURL(): string | null {
    if (!this.banner) return null;
    
    const format = this.banner.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/banners/${this.id}/${this.banner}.${format}`;
  }

  /**
   * The URL of the guild's discovery splash.
   */
  public get discoverySplashURL(): string | null {
    if (!this.discoverySplash) return null;
    
    const format = this.discoverySplash.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/discovery-splashes/${this.id}/${this.discoverySplash}.${format}`;
  }

  /**
   * The vanity URL of the guild.
   */
  public get vanityURL(): string | null {
    if (!this.vanityUrlCode) return null;
    return `https://discord.gg/${this.vanityUrlCode}`;
  }

  /**
   * Whether the guild is partnered.
   */
  public get partnered(): boolean {
    return this.features.includes('PARTNERED');
  }

  /**
   * Whether the guild is verified.
   */
  public get verified(): boolean {
    return this.features.includes('VERIFIED');
  }

  /**
   * Fetches the owner of the guild.
   *
   * @returns A promise that resolves with the owner of the guild.
   */
  public async fetchOwner(): Promise<User> {
    const owner = await this.bot.users.fetch(this.ownerId);
    this.owner = owner;
    return owner;
  }

  /**
   * Leaves the guild.
   *
   * @returns A promise that resolves when the bot has left the guild.
   */
  public async leave(): Promise<void> {
    return this.bot.guilds.leave(this.id);
  }

  /**
   * Deletes the guild.
   *
   * @remarks
   * This requires the bot to be the owner of the guild.
   *
   * @returns A promise that resolves when the guild is deleted.
   */
  public async delete(): Promise<void> {
    return this.bot.guilds.delete(this.id);
  }

  /**
   * Edits the guild.
   *
   * @param options - The options for editing the guild.
   * @returns A promise that resolves with the edited guild.
   */
  public async edit(options: GuildEditOptions): Promise<Guild> {
    const guild = await this.bot.guilds.edit(this.id, options);
    return this._patch(guild);
  }

  /**
   * Fetches all channels in the guild.
   *
   * @returns A promise that resolves with an array of channels in the guild.
   */
  public async fetchChannels(): Promise<any[]> {
    return this.bot.channels.fetchAll(this.id);
  }

  /**
   * Fetches a channel in the guild by its ID.
   *
   * @param id - The channel ID.
   * @returns A promise that resolves with the channel.
   */
  public async fetchChannel(id: string): Promise<any> {
    return this.bot.channels.fetch(id);
  }

  /**
   * Creates a channel in the guild.
   *
   * @param options - The options for creating the channel.
   * @returns A promise that resolves with the created channel.
   */
  public async createChannel(options: any): Promise<any> {
    return this.bot.channels.create(this.id, options);
  }

  /**
   * Returns the URL to this guild in the Discord API.
   *
   * @returns The URL to this guild in the Discord API.
   */
  public get url(): string {
    return `https://discord.com/api/guilds/${this.id}`;
  }

  /**
   * Returns a string representation of this guild.
   *
   * @returns A string representation of this guild.
   */
  public toString(): string {
    return this.name;
  }
}

/**
 * Options for editing a guild.
 */
export interface GuildEditOptions {
  /**
   * The name of the guild.
   */
  name?: string;

  /**
   * The icon of the guild.
   */
  icon?: string | null;

  /**
   * The splash of the guild.
   */
  splash?: string | null;

  /**
   * The discovery splash of the guild.
   */
  discoverySplash?: string | null;

  /**
   * The banner of the guild.
   */
  banner?: string | null;

  /**
   * The verification level of the guild.
   */
  verificationLevel?: number;

  /**
   * The default message notification level of the guild.
   */
  defaultMessageNotifications?: number;

  /**
   * The explicit content filter level of the guild.
   */
  explicitContentFilter?: number;

  /**
   * The AFK channel ID for the guild.
   */
  afkChannelId?: string | null;

  /**
   * The AFK timeout in seconds for the guild.
   */
  afkTimeout?: number;

  /**
   * The system channel ID for the guild.
   */
  systemChannelId?: string | null;

  /**
   * The system channel flags for the guild.
   */
  systemChannelFlags?: number;

  /**
   * The rules channel ID for the guild.
   */
  rulesChannelId?: string | null;

  /**
   * The public updates channel ID for the guild.
   */
  publicUpdatesChannelId?: string | null;

  /**
   * The preferred locale of the guild.
   */
  preferredLocale?: string;

  /**
   * The features of the guild.
   */
  features?: string[];

  /**
   * The description of the guild.
   */
  description?: string | null;
}