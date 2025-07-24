import type { Channel, CreateMessageData, EditMessageData } from '@ovenjs/types';
import { BaseManager } from './BaseManager';

export class ChannelManager extends BaseManager<Channel> {
  /**
   * Fetch a channel by ID
   */
  public async fetch(channelId: string): Promise<Channel> {
    const channel = await this.client.rest.getChannel(channelId);
    this.set(channelId, channel);
    return channel;
  }

  /**
   * Send a message to a channel
   */
  public async send(channelId: string, data: string | CreateMessageData): Promise<any> {
    const messageData = typeof data === 'string' ? { content: data } : data;
    return await this.client.rest.createMessage(channelId, messageData);
  }

  /**
   * Fetch messages from a channel
   */
  public async fetchMessages(channelId: string, options?: {
    around?: string;
    before?: string;
    after?: string;
    limit?: number;
  }): Promise<any[]> {
    return await this.client.rest.getChannelMessages(channelId, options);
  }

  /**
   * Edit a message in a channel
   */
  public async editMessage(channelId: string, messageId: string, data: EditMessageData): Promise<any> {
    return await this.client.rest.editMessage(channelId, messageId, data);
  }

  /**
   * Delete a message from a channel
   */
  public async deleteMessage(channelId: string, messageId: string): Promise<void> {
    return await this.client.rest.deleteMessage(channelId, messageId);
  }

  /**
   * Trigger typing indicator in a channel
   */
  public async triggerTyping(channelId: string): Promise<void> {
    return await this.client.rest.triggerTyping(channelId);
  }

  /**
   * Start typing indicator that automatically stops after 10 seconds
   * Can be stopped early by calling the returned function
   */
  public startTyping(channelId: string): () => void {
    let stopped = false;
    
    const startTyping = async () => {
      while (!stopped) {
        await this.triggerTyping(channelId);
        await new Promise(resolve => setTimeout(resolve, 8000)); // Typing lasts ~10 seconds, refresh every 8
      }
    };
    
    startTyping().catch(() => {}); // Ignore errors
    
    // Auto-stop after 60 seconds to prevent infinite typing
    const autoStop = setTimeout(() => {
      stopped = true;
    }, 60000);
    
    return () => {
      stopped = true;
      clearTimeout(autoStop);
    };
  }

  /**
   * Check if a channel is a text channel
   */
  public isTextChannel(channel: Channel): boolean {
    return [0, 5, 10, 11, 12].includes(channel.type); // GUILD_TEXT, GUILD_ANNOUNCEMENT, GUILD_ANNOUNCEMENT_THREAD, GUILD_PUBLIC_THREAD, GUILD_PRIVATE_THREAD
  }

  /**
   * Check if a channel is a voice channel
   */
  public isVoiceChannel(channel: Channel): boolean {
    return [2, 13].includes(channel.type); // GUILD_VOICE, GUILD_STAGE_VOICE
  }

  /**
   * Check if a channel is a DM channel
   */
  public isDMChannel(channel: Channel): boolean {
    return channel.type === 1; // DM
  }

  /**
   * Check if a channel is a group DM channel
   */
  public isGroupDMChannel(channel: Channel): boolean {
    return channel.type === 3; // GROUP_DM
  }

  /**
   * Check if a channel is a thread
   */
  public isThread(channel: Channel): boolean {
    return [10, 11, 12].includes(channel.type); // GUILD_ANNOUNCEMENT_THREAD, GUILD_PUBLIC_THREAD, GUILD_PRIVATE_THREAD
  }

  /**
   * Check if a channel is a category
   */
  public isCategory(channel: Channel): boolean {
    return channel.type === 4; // GUILD_CATEGORY
  }

  /**
   * Get channel mention string
   */
  public mention(channelId: string): string {
    return `<#${channelId}>`;
  }
}