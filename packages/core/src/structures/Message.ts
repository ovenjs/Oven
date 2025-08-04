import type { APIMessage } from 'discord-api-types/v10';
import { BaseStructure } from './Base';
import { User } from './User';
import { Channel } from './Channel';
import { Attachment } from './Attachment';
import { Embed } from './Embed';
import type { Bot } from '../Bot';

/**
 * Represents a Discord message.
 *
 * @remarks
 * This class represents a Discord message, which can be a regular message,
 * a system message, or an embed. It provides properties and methods
 * for interacting with message data.
 */
export class Message extends BaseStructure {
  /**
   * The ID of the channel the message was sent in.
   */
  public channelId: string;

  /**
   * The ID of the guild the message was sent in.
   */
  public guildId: string | null;

  /**
   * The author of the message.
   */
  public author: User;

  /**
   * The member properties for the author.
   */
  public member: any | null;

  /**
   * The content of the message.
   */
  public content: string;

  /**
   * The timestamp when the message was sent.
   */
  public timestamp: Date;

  /**
   * The timestamp when the message was last edited.
   */
  public editedTimestamp: Date | null;

  /**
   * Whether the message is a TTS message.
   */
  public tts: boolean;

  /**
   * Whether the message mentions everyone.
   */
  public mentionsEveryone: boolean;

  /**
   * The users mentioned in the message.
   */
  public mentions: User[];

  /**
   * The roles mentioned in the message.
   */
  public mentionRoles: string[];

  /**
   * The channels mentioned in the message.
   */
  public mentionChannels: any[];

  /**
   * The attachments in the message.
   */
  public attachments: Attachment[];

  /**
   * The embeds in the message.
   */
  public embeds: Embed[];

  /**
   * The reactions in the message.
   */
  public reactions: any[];

  /**
   * The nonce of the message.
   */
  public nonce: string | number | null;

  /**
   * Whether the message is pinned.
   */
  public pinned: boolean;

  /**
   * The ID of the webhook that sent the message.
   */
  public webhookId: string | null;

  /**
   * The type of the message.
   */
  public type: number;

  /**
   * The activity associated with the message.
   */
  public activity: any | null;

  /**
   * The application associated with the message.
   */
  public application: any | null;

  /**
   * The ID of the message reference.
   */
  public messageReference: any | null;

  /**
   * The flags of the message.
   */
  public flags: number;

  /**
   * The message referenced in a reply.
   */
  public referencedMessage: Message | null;

  /**
   * The interaction associated with the message.
   */
  public interaction: any | null;

  /**
   * The thread started by this message.
   */
  public thread: Channel | null;

  /**
   * The components in the message.
   */
  public components: any[];

  /**
   * The sticker items in the message.
   */
  public stickerItems: any[];

  /**
   * The position of the message in a thread.
   */
  public position: number | null;

  /**
   * The role subscription data in the message.
   */
  public roleSubscriptionData: any | null;

  /**
   * Creates a new Message instance.
   *
   * @param bot - The bot instance this message belongs to.
   * @param data - The raw message data from the Discord API.
   */
  constructor(bot: Bot, data: APIMessage) {
    super(bot, data.id);
    this._patch(data);
  }

  /**
   * Patches this message with raw data from the Discord API.
   *
   * @param data - The raw message data from the Discord API.
   * @returns This message instance for chaining.
   */
  public _patch(data: APIMessage): this {
    this.channelId = data.channel_id;
    this.guildId = (data as any).guild_id ?? null;
    this.author = new User(this.bot, data.author);
    this.member = (data as any).member ?? null;
    this.content = data.content;
    this.timestamp = new Date(data.timestamp);
    this.editedTimestamp = data.edited_timestamp ? new Date(data.edited_timestamp) : null;
    this.tts = data.tts;
    this.mentionsEveryone = data.mention_everyone;
    this.mentions = data.mentions.map(mention => new User(this.bot, mention));
    this.mentionRoles = data.mention_roles ?? [];
    this.mentionChannels = data.mention_channels ?? [];
    this.attachments = (data.attachments ?? []).map(
      attachment => new Attachment(this.bot, attachment)
    );
    this.embeds = (data.embeds ?? []).map(embed => new Embed(this.bot, embed));
    this.reactions = data.reactions ?? [];
    this.nonce = data.nonce ?? null;
    this.pinned = data.pinned;
    this.webhookId = data.webhook_id ?? null;
    this.type = data.type;
    this.activity = data.activity ?? null;
    this.application = data.application ?? null;
    this.messageReference = data.message_reference ?? null;
    this.flags = data.flags ?? 0;
    this.referencedMessage = data.referenced_message
      ? new Message(this.bot, data.referenced_message)
      : null;
    this.interaction = data.interaction ?? null;
    this.thread = data.thread ? new Channel(this.bot, data.thread) : null;
    this.components = data.components ?? [];
    this.stickerItems = data.sticker_items ?? [];
    this.position = data.position ?? null;
    this.roleSubscriptionData = data.role_subscription_data ?? null;

    return this;
  }

  /**
   * The URL of the message.
   */
  public get url(): string {
    if (!this.guildId) {
      return `https://discord.com/channels/@me/${this.channelId}/${this.id}`;
    }
    return `https://discord.com/channels/${this.guildId}/${this.channelId}/${this.id}`;
  }

  /**
   * Whether the message was sent by the bot.
   */
  public get isBot(): boolean {
    return this.author.isBot;
  }

  /**
   * Whether the message was edited.
   */
  public get isEdited(): boolean {
    return this.editedTimestamp !== null;
  }

  /**
   * Whether the message mentions the bot.
   */
  public get mentionsBot(): boolean {
    return this.mentions.some(user => user.id === this.bot.user?.id);
  }

  /**
   * Whether the message is a reply.
   */
  public get isReply(): boolean {
    return this.referencedMessage !== null || this.messageReference !== null;
  }

  /**
   * Whether the message is a system message.
   */
  public get isSystem(): boolean {
    return this.type > 0 && this.type < 7;
  }

  /**
   * The channel the message was sent in.
   */
  public get channel(): Promise<Channel> {
    return this.bot.channels.fetch(this.channelId);
  }

  /**
   * The guild the message was sent in.
   */
  public get guild(): Promise<any> | null {
    if (!this.guildId) return null;
    return this.bot.guilds.fetch(this.guildId);
  }

  /**
   * Deletes the message.
   *
   * @param reason - The reason for deleting the message.
   * @returns A promise that resolves when the message is deleted.
   */
  public async delete(reason?: string): Promise<void> {
    return this.bot.rest.delete(`/channels/${this.channelId}/messages/${this.id}`, {
      reason,
    });
  }

  /**
   * Edits the message.
   *
   * @param options - The options for editing the message.
   * @returns A promise that resolves with the edited message.
   */
  public async edit(options: MessageEditOptions): Promise<Message> {
    const message = await this.bot.rest.patch(
      `/channels/${this.channelId}/messages/${this.id}`,
      { data: options }
    );
    return this._patch(message);
  }

  /**
   * Replies to the message.
   *
   * @param content - The content of the reply.
   * @param options - Additional options for the reply.
   * @returns A promise that resolves with the sent message.
   */
  public async reply(
    content: string,
    options: MessageReplyOptions = {}
  ): Promise<Message> {
    const message = await this.bot.rest.post(`/channels/${this.channelId}/messages`, {
      data: {
        content,
        message_reference: {
          message_id: this.id,
          channel_id: this.channelId,
          guild_id: this.guildId,
        },
        ...options,
      },
    });
    return new Message(this.bot, message);
  }

  /**
   * Reacts to the message with an emoji.
   *
   * @param emoji - The emoji to react with.
   * @returns A promise that resolves when the reaction is added.
   */
  public async react(emoji: string): Promise<void> {
    const encodedEmoji = encodeURIComponent(emoji);
    return this.bot.rest.put(
      `/channels/${this.channelId}/messages/${this.id}/reactions/${encodedEmoji}/@me`
    );
  }

  /**
   * Pins the message.
   *
   * @returns A promise that resolves when the message is pinned.
   */
  public async pin(): Promise<void> {
    return this.bot.rest.put(`/channels/${this.channelId}/pins/${this.id}`);
  }

  /**
   * Unpins the message.
   *
   * @returns A promise that resolves when the message is unpinned.
   */
  public async unpin(): Promise<void> {
    return this.bot.rest.delete(`/channels/${this.channelId}/pins/${this.id}`);
  }

  /**
   * Crossposts the message to following channels.
   *
   * @returns A promise that resolves with the crossposted message.
   */
  public async crosspost(): Promise<Message> {
    const message = await this.bot.rest.post(
      `/channels/${this.channelId}/messages/${this.id}/crosspost`
    );
    return this._patch(message);
  }

  /**
   * Adds a reaction to the message.
   *
   * @param emoji - The emoji to add.
   * @returns A promise that resolves when the reaction is added.
   */
  public async addReaction(emoji: string): Promise<void> {
    return this.react(emoji);
  }

  /**
   * Removes a reaction from the message.
   *
   * @param emoji - The emoji to remove.
   * @param userId - The user ID of the reaction to remove, or '@me' for the bot's reaction.
   * @returns A promise that resolves when the reaction is removed.
   */
  public async removeReaction(emoji: string, userId: string = '@me'): Promise<void> {
    const encodedEmoji = encodeURIComponent(emoji);
    return this.bot.rest.delete(
      `/channels/${this.channelId}/messages/${this.id}/reactions/${encodedEmoji}/${userId}`
    );
  }

  /**
   * Removes all reactions from the message.
   *
   * @returns A promise that resolves when all reactions are removed.
   */
  public async removeAllReactions(): Promise<void> {
    return this.bot.rest.delete(
      `/channels/${this.channelId}/messages/${this.id}/reactions`
    );
  }

  /**
   * Removes a specific emoji reaction from the message.
   *
   * @param emoji - The emoji to remove.
   * @returns A promise that resolves when the reaction is removed.
   */
  public async removeEmojiReaction(emoji: string): Promise<void> {
    const encodedEmoji = encodeURIComponent(emoji);
    return this.bot.rest.delete(
      `/channels/${this.channelId}/messages/${this.id}/reactions/${encodedEmoji}`
    );
  }

  /**
   * Returns the URL to this message in the Discord API.
   *
   * @returns The URL to this message in the Discord API.
   */
  public get apiUrl(): string {
    return `https://discord.com/api/channels/${this.channelId}/messages/${this.id}`;
  }

  /**
   * Returns a string representation of this message.
   *
   * @returns A string representation of this message.
   */
  public toString(): string {
    return this.content;
  }
}

/**
 * Options for editing a message.
 */
export interface MessageEditOptions {
  /**
   * The content of the message.
   */
  content?: string | null;

  /**
   * The embeds in the message.
   */
  embeds?: Embed[] | null;

  /**
   * The flags of the message.
   */
  flags?: number | null;

  /**
   * The allowed mentions for the message.
   */
  allowedMentions?: any | null;

  /**
   * The attachments in the message.
   */
  attachments?: any[] | null;

  /**
   * The components in the message.
   */
  components?: any[] | null;
}

/**
 * Options for replying to a message.
 */
export interface MessageReplyOptions {
  /**
   * The embeds in the message.
   */
  embeds?: Embed[];

  /**
   * The allowed mentions for the message.
   */
  allowedMentions?: any;

  /**
   * The attachments in the message.
   */
  attachments?: any[];

  /**
   * The components in the message.
   */
  components?: any[];

  /**
   * Whether the message is TTS.
   */
  tts?: boolean;
}
