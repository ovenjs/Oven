import type { Guild as GuildData, Snowflake } from '@ovenjs/types';
import { Base } from './Base';

export class Guild extends Base {
  public name: string;
  public icon?: string | null;
  public splash?: string | null;
  public banner?: string | null;
  public description?: string | null;
  public ownerId: Snowflake;
  public memberCount?: number;

  constructor(client: any, data: GuildData) {
    super(client, data);
    
    this.name = data.name;
    this.icon = data.icon;
    this.splash = data.splash;
    this.banner = data.banner;
    this.description = data.description;
    this.ownerId = data.owner_id;
    this.memberCount = data.approximate_member_count;
  }

  /**
   * Get the guild's icon URL
   */
  public iconURL(options?: { format?: 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif'; size?: number }): string | null {
    return this.client.guilds.iconURL(this, options);
  }

  /**
   * Get the guild's banner URL
   */
  public bannerURL(options?: { format?: 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif'; size?: number }): string | null {
    return this.client.guilds.bannerURL(this, options);
  }

  /**
   * Get the guild's splash URL
   */
  public splashURL(options?: { format?: 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif'; size?: number }): string | null {
    return this.client.guilds.splashURL(this, options);
  }

  /**
   * Fetch the guild's channels
   */
  public async fetchChannels(): Promise<any[]> {
    return await this.client.guilds.fetchChannels(this.id);
  }

  /**
   * Fetch the guild's members
   */
  public async fetchMembers(options?: { limit?: number; after?: string }): Promise<any[]> {
    return await this.client.guilds.fetchMembers(this.id, options);
  }

  /**
   * Edit this guild
   */
  public async edit(data: any): Promise<Guild> {
    const updatedGuild = await this.client.guilds.edit(this.id, data);
    return new Guild(this.client, updatedGuild);
  }

  /**
   * Leave this guild
   */
  public async leave(): Promise<void> {
    return await this.client.guilds.leave(this.id);
  }

  public toJSON(): GuildData {
    return {
      id: this.id,
      name: this.name,
      icon: this.icon,
      splash: this.splash,
      banner: this.banner,
      description: this.description,
      owner_id: this.ownerId,
      approximate_member_count: this.memberCount,
    } as GuildData;
  }
}