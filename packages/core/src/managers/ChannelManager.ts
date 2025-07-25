/**
 * Channel manager for OvenJS
 * Manages channel cache and API interactions
 */

import type { ChannelManagerOptions, FetchOptions } from '@ovenjs/types';
import type { ChannelId } from '@ovenjs/types';
import { BaseManager } from './BaseManager.js';

export class ChannelManager extends BaseManager<ChannelId, any> {
  constructor(options: ChannelManagerOptions) {
    super(options);
  }

  /**
   * Fetch a channel from the API
   */
  async fetch(id: ChannelId, options: FetchOptions = {}): Promise<any> {
    try {
      const channelData = await this.client.rest.channels.get(id);
      // This would create the appropriate Channel structure based on type
      const channel = this.createChannel(channelData);
      
      if (options.cache !== false) {
        this.set(id, channel);
      }
      
      return channel;
    } catch (error) {
      throw new Error(`Failed to fetch channel ${id}: ${error}`);
    }
  }

  /**
   * Create a channel structure from data
   */
  private createChannel(data: any): any {
    // This would create the appropriate channel type (TextChannel, VoiceChannel, etc.)
    // For now, returning data as-is
    return data;
  }

  /**
   * Get text channels
   */
  getTextChannels(): any[] {
    return this.filter((channel) => channel.type === 0).toArray();
  }

  /**
   * Get voice channels
   */
  getVoiceChannels(): any[] {
    return this.filter((channel) => channel.type === 2).toArray();
  }

  /**
   * Get category channels
   */
  getCategoryChannels(): any[] {
    return this.filter((channel) => channel.type === 4).toArray();
  }

  /**
   * Get news channels
   */
  getNewsChannels(): any[] {
    return this.filter((channel) => channel.type === 5).toArray();
  }

  /**
   * Get thread channels
   */
  getThreadChannels(): any[] {
    return this.filter((channel) => [10, 11, 12].includes(channel.type)).toArray();
  }

  /**
   * Get stage channels
   */
  getStageChannels(): any[] {
    return this.filter((channel) => channel.type === 13).toArray();
  }

  /**
   * Get forum channels
   */
  getForumChannels(): any[] {
    return this.filter((channel) => channel.type === 15).toArray();
  }

  /**
   * Search channels by name
   */
  searchByName(name: string): any[] {
    return this.filter((channel) => 
      channel.name && channel.name.toLowerCase().includes(name.toLowerCase())
    ).toArray();
  }

  /**
   * Get channels by type
   */
  getByType(type: number): any[] {
    return this.filter((channel) => channel.type === type).toArray();
  }

  /**
   * Get NSFW channels
   */
  getNSFWChannels(): any[] {
    return this.filter((channel) => channel.nsfw === true).toArray();
  }

  /**
   * Get channels by parent (category)
   */
  getByParent(parentId: ChannelId): any[] {
    return this.filter((channel) => channel.parentId === parentId).toArray();
  }
}