/**
 * Guild manager for OvenJS
 * Manages guild cache and API interactions
 */

import type { GuildManagerOptions, FetchOptions, GuildCreateData } from '@ovenjs/types';
import type { GuildId } from '@ovenjs/types';
import { BaseManager } from './BaseManager.js';
import { Guild } from '../structures/Guild.js';

export class GuildManager extends BaseManager<GuildId, Guild> {
  constructor(options: GuildManagerOptions) {
    super(options);
  }

  /**
   * Fetch a guild from the API
   */
  async fetch(id: GuildId, options: FetchOptions = {}): Promise<Guild> {
    try {
      const guildData = await this.client.rest.guilds.get(id);
      const guild = new Guild({ client: this.client }, guildData);
      
      if (options.cache !== false) {
        this.set(id, guild);
      }
      
      return guild;
    } catch (error) {
      throw new Error(`Failed to fetch guild ${id}: ${error}`);
    }
  }

  /**
   * Create a new guild
   */
  async create(data: GuildCreateData): Promise<Guild> {
    try {
      const guildData = await this.client.rest.guilds.create(data);
      const guild = new Guild({ client: this.client }, guildData);
      
      this.set(guild.id as GuildId, guild);
      
      return guild;
    } catch (error) {
      throw new Error(`Failed to create guild: ${error}`);
    }
  }

  /**
   * Get guilds available to the current user
   */
  async fetchAvailable(): Promise<Guild[]> {
    const guildsData = await this.client.rest.users.getCurrentGuilds();
    const guilds: Guild[] = [];
    
    for (const guildData of guildsData) {
      const guild = new Guild({ client: this.client }, guildData);
      this.set(guild.id as GuildId, guild);
      guilds.push(guild);
    }
    
    return guilds;
  }

  /**
   * Get guild preview
   */
  async fetchPreview(id: GuildId): Promise<any> {
    return await this.client.rest.guilds.getPreview(id);
  }

  /**
   * Get guild widget
   */
  async fetchWidget(id: GuildId): Promise<any> {
    return await this.client.rest.guilds.getWidget(id);
  }

  /**
   * Search for guilds by name
   */
  searchByName(name: string): Guild[] {
    return this.filter((guild) => 
      guild.name.toLowerCase().includes(name.toLowerCase())
    ).toArray();
  }

  /**
   * Get guilds by owner
   */
  getByOwner(ownerId: string): Guild[] {
    return this.filter((guild) => guild.ownerId === ownerId).toArray();
  }

  /**
   * Get guilds with specific features
   */
  getWithFeatures(features: string[]): Guild[] {
    return this.filter((guild) => 
      features.every(feature => guild.hasFeature(feature))
    ).toArray();
  }

  /**
   * Get verified guilds
   */
  getVerified(): Guild[] {
    return this.filter((guild) => guild.verified).toArray();
  }

  /**
   * Get partnered guilds
   */
  getPartnered(): Guild[] {
    return this.filter((guild) => guild.partnered).toArray();
  }

  /**
   * Get community guilds
   */
  getCommunity(): Guild[] {
    return this.filter((guild) => guild.community).toArray();
  }

  /**
   * Get boosted guilds
   */
  getBoosted(): Guild[] {
    return this.filter((guild) => guild.boosted).toArray();
  }

  /**
   * Get guilds by premium tier
   */
  getByPremiumTier(tier: number): Guild[] {
    return this.filter((guild) => guild.premiumTier === tier).toArray();
  }

  /**
   * Get guilds by verification level
   */
  getByVerificationLevel(level: number): Guild[] {
    return this.filter((guild) => guild.verificationLevel === level).toArray();
  }

  /**
   * Get guilds by explicit content filter level
   */
  getByExplicitContentFilter(level: number): Guild[] {
    return this.filter((guild) => guild.explicitContentFilter === level).toArray();
  }

  /**
   * Get guilds by MFA level
   */
  getByMfaLevel(level: number): Guild[] {
    return this.filter((guild) => guild.mfaLevel === level).toArray();
  }

  /**
   * Get guilds by region
   */
  getByRegion(region: string): Guild[] {
    return this.filter((guild) => guild.region === region).toArray();
  }

  /**
   * Get guilds by member count range
   */
  getByMemberCount(min: number, max: number): Guild[] {
    return this.filter((guild) => {
      const count = guild.memberCount;
      return count >= min && count <= max;
    }).toArray();
  }

  /**
   * Get largest guilds
   */
  getLargest(limit: number = 10): Guild[] {
    return this.toArray()
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, limit);
  }

  /**
   * Get smallest guilds
   */
  getSmallest(limit: number = 10): Guild[] {
    return this.toArray()
      .sort((a, b) => a.memberCount - b.memberCount)
      .slice(0, limit);
  }

  /**
   * Get newest guilds
   */
  getNewest(limit: number = 10): Guild[] {
    return this.toArray()
      .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
      .slice(0, limit);
  }

  /**
   * Get oldest guilds
   */
  getOldest(limit: number = 10): Guild[] {
    return this.toArray()
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      .slice(0, limit);
  }
}