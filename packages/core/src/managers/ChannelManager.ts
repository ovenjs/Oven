import { BaseManager } from './BaseManager';
import type { Bot } from '../Bot';

/**
 * Manager for channel-related operations.
 *
 * @remarks
 * This class provides methods for managing Discord channels.
 */
export class ChannelManager extends BaseManager {
  /**
   * Creates a new ChannelManager instance.
   *
   * @param bot - The bot instance this manager belongs to.
   */
  constructor(bot: Bot) {
    super(bot);
  }

  /**
   * Fetches a channel by its ID.
   *
   * @param id - The channel ID.
   * @param force - Whether to force a fetch from the API, bypassing the cache.
   * @returns A promise that resolves with the channel.
   */
  public async fetch(id: string, force = false): Promise<any> {
    // Try to get from cache first if not forcing
    if (!force) {
      const cached = await this.cache.getChannel(id);
      if (cached) {
        return cached;
      }
    }

    // Fetch from API
    const channel = await this.rest.get(`/channels/${id}`);

    // Cache the channel
    await this.cache.setChannel(channel);

    return channel;
  }

  /**
   * Creates a new channel in a guild.
   *
   * @param guildId - The guild ID.
   * @param options - The options for creating the channel.
   * @returns A promise that resolves with the created channel.
   */
  public async create(guildId: string, options: ChannelCreateOptions): Promise<any> {
    const channel = await this.rest.post(`/guilds/${guildId}/channels`, {
      data: options,
    });

    // Cache the channel
    await this.cache.setChannel(channel);

    return channel;
  }

  /**
   * Edits a channel.
   *
   * @param id - The channel ID.
   * @param options - The options for editing the channel.
   * @returns A promise that resolves with the edited channel.
   */
  public async edit(id: string, options: ChannelEditOptions): Promise<any> {
    const channel = await this.rest.patch(`/channels/${id}`, { data: options });

    // Update the cache
    await this.cache.setChannel(channel);

    return channel;
  }

  /**
   * Deletes a channel.
   *
   * @param id - The channel ID.
   * @returns A promise that resolves with the deleted channel.
   */
  public async delete(id: string): Promise<any> {
    const channel = await this.rest.delete(`/channels/${id}`);

    // Remove from cache
    await this.cache.deleteChannel(id);

    return channel;
  }

  /**
   * Fetches all channels in a guild.
   *
   * @param guildId - The guild ID.
   * @param force - Whether to force a fetch from the API, bypassing the cache.
   * @returns A promise that resolves with an array of channels.
   */
  public async fetchAll(guildId: string, force = false): Promise<any[]> {
    // Try to get from cache first if not forcing
    if (!force) {
      // Note: This is a simplified approach. In a real implementation,
      // we would need to track which channels belong to which guild.
    }

    // Fetch from API
    const channels = await this.rest.get(`/guilds/${guildId}/channels`);

    // Cache the channels
    for (const channel of channels) {
      await this.cache.setChannel(channel);
    }

    return channels;
  }

  /**
   * Gets a channel from the cache.
   *
   * @param id - The channel ID.
   * @returns A promise that resolves with the channel, or null if not found.
   */
  public async getFromCache(id: string): Promise<any | null> {
    return this.cache.getChannel(id);
  }

  /**
   * Adds a channel to the cache.
   *
   * @param channel - The channel to cache.
   * @returns A promise that resolves when the channel is cached.
   */
  public async addToCache(channel: any): Promise<void> {
    return this.cache.setChannel(channel);
  }

  /**
   * Removes a channel from the cache.
   *
   * @param id - The channel ID.
   * @returns A promise that resolves when the channel is removed from the cache.
   */
  public async removeFromCache(id: string): Promise<void> {
    return this.cache.deleteChannel(id);
  }
}

/**
 * Options for creating a channel.
 */
export interface ChannelCreateOptions {
  /**
   * The name of the channel.
   */
  name: string;

  /**
   * The type of the channel.
   */
  type?: number;

  /**
   * The topic of the channel.
   */
  topic?: string;

  /**
   * The bitrate of the channel (voice only).
   */
  bitrate?: number;

  /**
   * The user limit of the channel (voice only).
   */
  userLimit?: number;

  /**
   * The rate limit per user of the channel.
   */
  rateLimitPerUser?: number;

  /**
   * The position of the channel.
   */
  position?: number;

  /**
   * The permission overwrites of the channel.
   */
  permissionOverwrites?: any[];

  /**
   * The ID of the parent category of the channel.
   */
  parentId?: string;

  /**
   * Whether the channel is NSFW.
   */
  nsfw?: boolean;
}

/**
 * Options for editing a channel.
 */
export interface ChannelEditOptions {
  /**
   * The name of the channel.
   */
  name?: string;

  /**
   * The topic of the channel.
   */
  topic?: string | null;

  /**
   * The bitrate of the channel (voice only).
   */
  bitrate?: number;

  /**
   * The user limit of the channel (voice only).
   */
  userLimit?: number;

  /**
   * The rate limit per user of the channel.
   */
  rateLimitPerUser?: number | null;

  /**
   * The position of the channel.
   */
  position?: number;

  /**
   * The permission overwrites of the channel.
   */
  permissionOverwrites?: any[];

  /**
   * The ID of the parent category of the channel.
   */
  parentId?: string | null;

  /**
   * Whether the channel is NSFW.
   */
  nsfw?: boolean;
}
