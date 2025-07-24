import type { Guild, ModifyGuildData, CreateChannelData } from '@ovenjs/types';
import { BaseManager } from './BaseManager';

export class GuildManager extends BaseManager<Guild> {
  /**
   * Fetch a guild by ID
   */
  public async fetch(guildId: string): Promise<Guild> {
    const guild = await this.client.rest.getGuild(guildId);
    this.set(guildId, guild);
    return guild;
  }

  /**
   * Modify a guild
   */
  public async edit(guildId: string, data: ModifyGuildData): Promise<Guild> {
    const guild = await this.client.rest.modifyGuild(guildId, data);
    this.set(guildId, guild);
    return guild;
  }

  /**
   * Get guild channels
   */
  public async fetchChannels(guildId: string): Promise<any[]> {
    return await this.client.rest.getGuildChannels(guildId);
  }

  /**
   * Create a guild channel
   */
  public async createChannel(guildId: string, data: CreateChannelData): Promise<any> {
    return await this.client.rest.createGuildChannel(guildId, data);
  }

  /**
   * Get guild members
   */
  public async fetchMembers(guildId: string, options?: { limit?: number; after?: string }): Promise<any[]> {
    return await this.client.rest.getGuildMembers(guildId, options);
  }

  /**
   * Get a specific guild member
   */
  public async fetchMember(guildId: string, userId: string): Promise<any> {
    return await this.client.rest.getGuildMember(guildId, userId);
  }

  /**
   * Leave a guild
   */
  public async leave(guildId: string): Promise<void> {
    // This would typically involve a DELETE request to /users/@me/guilds/{guild_id}
    // Implementation would be added to RESTManager
    throw new Error('Not implemented yet');
  }

  /**
   * Get the guild's icon URL
   */
  public iconURL(guild: Guild, options?: { format?: 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif'; size?: number }): string | null {
    if (!guild.icon) return null;
    
    const format = options?.format ?? 'webp';
    const size = options?.size ?? 256;
    
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${format}?size=${size}`;
  }

  /**
   * Get the guild's banner URL
   */
  public bannerURL(guild: Guild, options?: { format?: 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif'; size?: number }): string | null {
    if (!guild.banner) return null;
    
    const format = options?.format ?? 'webp';
    const size = options?.size ?? 512;
    
    return `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.${format}?size=${size}`;
  }

  /**
   * Get the guild's splash URL
   */
  public splashURL(guild: Guild, options?: { format?: 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif'; size?: number }): string | null {
    if (!guild.splash) return null;
    
    const format = options?.format ?? 'webp';
    const size = options?.size ?? 512;
    
    return `https://cdn.discordapp.com/splashes/${guild.id}/${guild.splash}.${format}?size=${size}`;
  }
}