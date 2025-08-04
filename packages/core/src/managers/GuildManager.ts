import { BaseManager } from './BaseManager';
import type { Bot } from '../Bot';

/**
 * Manager for guild-related operations.
 *
 * @remarks
 * This class provides methods for managing Discord guilds (servers).
 */
export class GuildManager extends BaseManager {
  /**
   * Creates a new GuildManager instance.
   *
   * @param bot - The bot instance this manager belongs to.
   */
  constructor(bot: Bot) {
    super(bot);
  }

  /**
   * Fetches a guild by its ID.
   *
   * @param id - The guild ID.
   * @param force - Whether to force a fetch from the API, bypassing the cache.
   * @returns A promise that resolves with the guild.
   */
  public async fetch(id: string, force = false): Promise<any> {
    // Try to get from cache first if not forcing
    if (!force) {
      const cached = await this.cache.getGuild(id);
      if (cached) {
        return cached;
      }
    }

    // Fetch from API
    const guild = await this.rest.get(`/guilds/${id}`);

    // Cache the guild
    await this.cache.setGuild(guild);

    return guild;
  }

  /**
   * Creates a new guild.
   *
   * @param options - The options for creating the guild.
   * @returns A promise that resolves with the created guild.
   */
  public async create(options: GuildCreateOptions): Promise<any> {
    const guild = await this.rest.post('/guilds', { data: options });

    // Cache the guild
    await this.cache.setGuild(guild);

    return guild;
  }

  /**
   * Edits a guild.
   *
   * @param id - The guild ID.
   * @param options - The options for editing the guild.
   * @returns A promise that resolves with the edited guild.
   */
  public async edit(id: string, options: GuildEditOptions): Promise<any> {
    const guild = await this.rest.patch(`/guilds/${id}`, { data: options });

    // Update the cache
    await this.cache.setGuild(guild);

    return guild;
  }

  /**
   * Deletes a guild.
   *
   * @param id - The guild ID.
   * @returns A promise that resolves when the guild is deleted.
   */
  public async delete(id: string): Promise<void> {
    await this.rest.delete(`/guilds/${id}`);

    // Remove from cache
    await this.cache.deleteGuild(id);
  }

  /**
   * Leaves a guild.
   *
   * @param id - The guild ID.
   * @returns A promise that resolves when the bot has left the guild.
   */
  public async leave(id: string): Promise<void> {
    await this.rest.delete(`/users/@me/guilds/${id}`);

    // Remove from cache
    await this.cache.deleteGuild(id);
  }

  /**
   * Fetches all guilds the bot is in.
   *
   * @param options - The options for fetching guilds.
   * @returns A promise that resolves with an array of guilds.
   */
  public async fetchAll(options: FetchGuildsOptions = {}): Promise<any[]> {
    const { limit = 100, before, after } = options;

    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (before) params.append('before', before);
    if (after) params.append('after', after);

    const guilds = await this.rest.get(`/users/@me/guilds?${params.toString()}`);

    // Cache the guilds
    for (const guild of guilds) {
      await this.cache.setGuild(guild);
    }

    return guilds;
  }

  /**
   * Gets a guild from the cache.
   *
   * @param id - The guild ID.
   * @returns A promise that resolves with the guild, or null if not found.
   */
  public async getFromCache(id: string): Promise<any | null> {
    return this.cache.getGuild(id);
  }

  /**
   * Adds a guild to the cache.
   *
   * @param guild - The guild to cache.
   * @returns A promise that resolves when the guild is cached.
   */
  public async addToCache(guild: any): Promise<void> {
    return this.cache.setGuild(guild);
  }

  /**
   * Removes a guild from the cache.
   *
   * @param id - The guild ID.
   * @returns A promise that resolves when the guild is removed from the cache.
   */
  public async removeFromCache(id: string): Promise<void> {
    return this.cache.deleteGuild(id);
  }
}

/**
 * Options for creating a guild.
 */
export interface GuildCreateOptions {
  /**
   * The name of the guild.
   */
  name: string;

  /**
   * The icon of the guild.
   */
  icon?: string;

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
   * The roles for the guild.
   */
  roles?: any[];

  /**
   * The channels for the guild.
   */
  channels?: any[];

  /**
   * The AFK channel ID for the guild.
   */
  afkChannelId?: string;

  /**
   * The AFK timeout in seconds for the guild.
   */
  afkTimeout?: number;

  /**
   * The system channel ID for the guild.
   */
  systemChannelId?: string;

  /**
   * The system channel flags for the guild.
   */
  systemChannelFlags?: number;
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

/**
 * Options for fetching guilds.
 */
export interface FetchGuildsOptions {
  /**
   * The maximum number of guilds to return.
   */
  limit?: number;

  /**
   * Get guilds before this guild ID.
   */
  before?: string;

  /**
   * Get guilds after this guild ID.
   */
  after?: string;
}
