import { BaseManager } from './BaseManager';
import type { Bot } from '../Bot';

/**
 * Manager for emoji-related operations.
 *
 * @remarks
 * This class provides methods for managing Discord emojis.
 */
export class EmojiManager extends BaseManager {
  /**
   * Creates a new EmojiManager instance.
   *
   * @param bot - The bot instance this manager belongs to.
   */
  constructor(bot: Bot) {
    super(bot);
  }

  /**
   * Fetches an emoji by its ID.
   *
   * @param guildId - The guild ID.
   * @param emojiId - The emoji ID.
   * @param force - Whether to force a fetch from the API, bypassing the cache.
   * @returns A promise that resolves with the emoji.
   */
  public async fetch(guildId: string, emojiId: string, force = false): Promise<any> {
    // Try to get from cache first if not forcing
    if (!force) {
      const cached = await this.cache.getEmoji(emojiId);
      if (cached) {
        return cached;
      }
    }

    // Fetch from API
    const emoji = await this.rest.get(`/guilds/${guildId}/emojis/${emojiId}`);

    // Cache the emoji
    await this.cache.setEmoji(emoji);

    return emoji;
  }

  /**
   * Creates a new emoji in a guild.
   *
   * @param guildId - The guild ID.
   * @param options - The options for creating the emoji.
   * @returns A promise that resolves with the created emoji.
   */
  public async create(guildId: string, options: EmojiCreateOptions): Promise<any> {
    const formData = new FormData();
    formData.append('name', options.name);
    formData.append('image', options.image);

    if (options.roles) {
      formData.append('roles', JSON.stringify(options.roles));
    }

    const emoji = await this.rest.post(`/guilds/${guildId}/emojis`, {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Cache the emoji
    await this.cache.setEmoji(emoji);

    return emoji;
  }

  /**
   * Edits an emoji.
   *
   * @param guildId - The guild ID.
   * @param emojiId - The emoji ID.
   * @param options - The options for editing the emoji.
   * @returns A promise that resolves with the edited emoji.
   */
  public async edit(
    guildId: string,
    emojiId: string,
    options: EmojiEditOptions
  ): Promise<any> {
    const emoji = await this.rest.patch(`/guilds/${guildId}/emojis/${emojiId}`, {
      data: options,
    });

    // Update the cache
    await this.cache.setEmoji(emoji);

    return emoji;
  }

  /**
   * Deletes an emoji.
   *
   * @param guildId - The guild ID.
   * @param emojiId - The emoji ID.
   * @param reason - The reason for deleting the emoji.
   * @returns A promise that resolves when the emoji is deleted.
   */
  public async delete(guildId: string, emojiId: string, reason?: string): Promise<void> {
    const options: any = {};
    if (reason) {
      options.headers = { 'X-Audit-Log-Reason': reason };
    }

    await this.rest.delete(`/guilds/${guildId}/emojis/${emojiId}`, options);

    // Remove from cache
    await this.cache.deleteEmoji(emojiId);
  }

  /**
   * Fetches all emojis in a guild.
   *
   * @param guildId - The guild ID.
   * @param force - Whether to force a fetch from the API, bypassing the cache.
   * @returns A promise that resolves with an array of emojis.
   */
  public async fetchAll(guildId: string, force = false): Promise<any[]> {
    // Try to get from cache first if not forcing
    if (!force) {
      // Note: This is a simplified approach. In a real implementation,
      // we would need to track which emojis belong to which guild.
    }

    // Fetch from API
    const emojis = await this.rest.get(`/guilds/${guildId}/emojis`);

    // Cache the emojis
    for (const emoji of emojis) {
      await this.cache.setEmoji(emoji);
    }

    return emojis;
  }

  /**
   * Gets an emoji from the cache.
   *
   * @param id - The emoji ID.
   * @returns A promise that resolves with the emoji, or null if not found.
   */
  public async getFromCache(id: string): Promise<any | null> {
    return this.cache.getEmoji(id);
  }

  /**
   * Adds an emoji to the cache.
   *
   * @param emoji - The emoji to cache.
   * @returns A promise that resolves when the emoji is cached.
   */
  public async addToCache(emoji: any): Promise<void> {
    return this.cache.setEmoji(emoji);
  }

  /**
   * Removes an emoji from the cache.
   *
   * @param id - The emoji ID.
   * @returns A promise that resolves when the emoji is removed from the cache.
   */
  public async removeFromCache(id: string): Promise<void> {
    return this.cache.deleteEmoji(id);
  }
}

/**
 * Options for creating an emoji.
 */
export interface EmojiCreateOptions {
  /**
   * The name of the emoji.
   */
  name: string;

  /**
   * The image of the emoji.
   */
  image: string;

  /**
   * The roles that can use this emoji.
   */
  roles?: string[];
}

/**
 * Options for editing an emoji.
 */
export interface EmojiEditOptions {
  /**
   * The name of the emoji.
   */
  name?: string;

  /**
   * The roles that can use this emoji.
   */
  roles?: string[] | null;
}
