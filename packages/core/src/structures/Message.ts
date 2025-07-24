import type { Message as MessageData, Snowflake, EditMessageData, User, Embed } from '@ovenjs/types';
import { Base } from './Base';

export class Message extends Base {
  public channelId: Snowflake;
  public author: User;
  public content: string;
  public timestamp: string;
  public editedTimestamp?: string | null;
  public tts: boolean;
  public mentionEveryone: boolean;
  public embeds: Embed[];
  public pinned: boolean;

  constructor(client: any, data: MessageData) {
    super(client, data);
    
    this.channelId = data.channel_id;
    this.author = data.author;
    this.content = data.content;
    this.timestamp = data.timestamp;
    this.editedTimestamp = data.edited_timestamp;
    this.tts = data.tts;
    this.mentionEveryone = data.mention_everyone;
    this.embeds = data.embeds;
    this.pinned = data.pinned;
  }

  /**
   * Get the channel this message was sent in
   */
  public get channel(): Promise<any> {
    return this.client.channels.fetch(this.channelId);
  }

  /**
   * Get the creation timestamp as a Date
   */
  public get createdAt(): Date {
    return new Date(this.timestamp);
  }

  /**
   * Get the edit timestamp as a Date (if edited)
   */
  public get editedAt(): Date | null {
    return this.editedTimestamp ? new Date(this.editedTimestamp) : null;
  }

  /**
   * Check if the message was edited
   */
  public get edited(): boolean {
    return this.editedTimestamp !== null && this.editedTimestamp !== undefined;
  }

  /**
   * Edit this message
   */
  public async edit(data: EditMessageData): Promise<Message> {
    const updatedMessage = await this.client.channels.editMessage(this.channelId, this.id, data);
    return new Message(this.client, updatedMessage);
  }

  /**
   * Delete this message
   */
  public async delete(): Promise<void> {
    return await this.client.channels.deleteMessage(this.channelId, this.id);
  }

  /**
   * Reply to this message
   */
  public async reply(data: string | any): Promise<Message> {
    const messageData = typeof data === 'string' ? { content: data } : data;
    
    // Add message reference for reply
    messageData.message_reference = {
      message_id: this.id,
      channel_id: this.channelId,
    };

    const newMessage = await this.client.channels.send(this.channelId, messageData);
    return new Message(this.client, newMessage);
  }

  /**
   * React to this message
   */
  public async react(emoji: string): Promise<void> {
    // This would need to be implemented in the REST manager
    throw new Error('Message reactions not implemented yet');
  }

  /**
   * Pin this message
   */
  public async pin(): Promise<void> {
    // This would need to be implemented in the REST manager
    throw new Error('Message pinning not implemented yet');
  }

  /**
   * Unpin this message
   */
  public async unpin(): Promise<void> {
    // This would need to be implemented in the REST manager
    throw new Error('Message unpinning not implemented yet');
  }

  /**
   * Get the URL of this message
   */
  public get url(): string {
    const guildId = this.channel ? '@me' : 'guild_id'; // Would need proper guild detection
    return `https://discord.com/channels/${guildId}/${this.channelId}/${this.id}`;
  }

  public toJSON(): MessageData {
    return {
      id: this.id,
      channel_id: this.channelId,
      author: this.author,
      content: this.content,
      timestamp: this.timestamp,
      edited_timestamp: this.editedTimestamp,
      tts: this.tts,
      mention_everyone: this.mentionEveryone,
      embeds: this.embeds,
      pinned: this.pinned,
    } as MessageData;
  }
}