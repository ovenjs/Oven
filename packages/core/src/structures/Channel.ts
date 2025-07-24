import type { Channel as ChannelData, Snowflake, CreateMessageData, EditMessageData } from '@ovenjs/types';
import { Base } from './Base';

export class Channel extends Base {
  public type: number;
  public name?: string;
  public guildId?: Snowflake;
  public position?: number;
  public topic?: string | null;
  public nsfw?: boolean;
  public parentId?: Snowflake | null;

  constructor(client: any, data: ChannelData) {
    super(client, data);
    
    this.type = data.type;
    this.name = data.name;
    this.guildId = data.guild_id;
    this.position = data.position;
    this.topic = data.topic;
    this.nsfw = data.nsfw;
    this.parentId = data.parent_id;
  }

  /**
   * Send a message to this channel
   */
  public async send(data: string | CreateMessageData): Promise<any> {
    return await this.client.channels.send(this.id, data);
  }

  /**
   * Fetch messages from this channel
   */
  public async fetchMessages(options?: {
    around?: string;
    before?: string;
    after?: string;
    limit?: number;
  }): Promise<any[]> {
    return await this.client.channels.fetchMessages(this.id, options);
  }

  /**
   * Edit a message in this channel
   */
  public async editMessage(messageId: string, data: EditMessageData): Promise<any> {
    return await this.client.channels.editMessage(this.id, messageId, data);
  }

  /**
   * Delete a message from this channel
   */
  public async deleteMessage(messageId: string): Promise<void> {
    return await this.client.channels.deleteMessage(this.id, messageId);
  }

  /**
   * Trigger typing indicator in this channel
   */
  public async triggerTyping(): Promise<void> {
    return await this.client.channels.triggerTyping(this.id);
  }

  /**
   * Start typing indicator
   */
  public startTyping(): () => void {
    return this.client.channels.startTyping(this.id);
  }

  /**
   * Check if this is a text channel
   */
  public isText(): boolean {
    return this.client.channels.isTextChannel(this);
  }

  /**
   * Check if this is a voice channel
   */
  public isVoice(): boolean {
    return this.client.channels.isVoiceChannel(this);
  }

  /**
   * Check if this is a DM channel
   */
  public isDM(): boolean {
    return this.client.channels.isDMChannel(this);
  }

  /**
   * Check if this is a thread
   */
  public isThread(): boolean {
    return this.client.channels.isThread(this);
  }

  /**
   * Get channel mention string
   */
  public toString(): string {
    return this.client.channels.mention(this.id);
  }

  public toJSON(): ChannelData {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      guild_id: this.guildId,
      position: this.position,
      topic: this.topic,
      nsfw: this.nsfw,
      parent_id: this.parentId,
    } as ChannelData;
  }
}