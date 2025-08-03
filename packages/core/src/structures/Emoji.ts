import type { APIEmoji } from 'discord-api-types/v10';
import { BaseStructure } from './Base';
import { User } from './User';
import type { Bot } from '../Bot';

/**
 * Represents a Discord emoji.
 *
 * @remarks
 * This class represents a Discord emoji, which can be a standard emoji or a custom guild emoji.
 */
export class Emoji extends BaseStructure {
  /** The name of the emoji */
  public name: string | null;

  /** The roles this emoji is whitelisted for */
  public roles: string[];

  /** The user that created this emoji */
  public user: User | null;

  /** Whether this emoji must be wrapped in colons */
  public requireColons: boolean;

  /** Whether this emoji is managed */
  public managed: boolean;

  /** Whether this emoji is animated */
  public animated: boolean;

  /** Whether this emoji can be used */
  public available: boolean;

  /** The ID of the guild this emoji belongs to */
  private readonly guildId: string;

  /**
   * Creates a new Emoji instance.
   *
   * @param bot - The bot instance this emoji belongs to.
   * @param data - The raw emoji data from the Discord API.
   */
  constructor(bot: Bot, data: APIEmoji, guildId: string) {
    super(bot, data.id || '');
    this.guildId = guildId;
    this._patch(data);
  }

  /**
   * Patches this emoji with raw data from the Discord API.
   *
   * @param data - The raw emoji data from the Discord API.
   * @returns This emoji instance for chaining.
   */
  public _patch(data: APIEmoji): this {
    this.name = data.name ?? null;
    this.roles = data.roles ?? [];
    this.user = data.user ? new User(this.bot, data.user) : null;
    this.requireColons = data.require_colons ?? true;
    this.managed = data.managed ?? false;
    this.animated = data.animated ?? false;
    this.available = data.available ?? true;

    return this;
  }

  /**
   * The identifier of this emoji.
   */
  public get identifier(): string {
    if (!this.id) return encodeURIComponent(this.name!);
    return `${this.animated ? 'a' : ''}:${this.name}:${this.id}`;
  }

  /**
   * The URL of this emoji.
   */
  public get url(): string {
    if (!this.id) return '';
    const extension = this.animated ? 'gif' : 'png';
    return `https://cdn.discordapp.com/emojis/${this.id}.${extension}`;
  }

  /**
   * The URL of this emoji's image.
   */
  public get imageURL(): string {
    return this.url;
  }

  /**
   * Whether this emoji is a standard emoji.
   */
  public get isStandard(): boolean {
    return !this.id;
  }

  /**
   * Whether this emoji is a custom emoji.
   */
  public get isCustom(): boolean {
    return !!this.id;
  }

  /**
   * Whether this emoji is animated.
   */
  public get isAnimated(): boolean {
    return this.animated;
  }

  /**
   * Whether this emoji can be used by the bot.
   */
  public get canUse(): boolean {
    return this.available;
  }

  /**
   * The formatted string to use this emoji in a message.
   */
  public get format(): string {
    if (!this.id) return this.name!;
    return `<${this.animated ? 'a' : ''}:${this.name}:${this.id}>`;
  }

  /**
   * Deletes this emoji.
   *
   * @param reason - The reason for deleting the emoji.
   * @returns A promise that resolves when the emoji is deleted.
   */
  public async delete(reason?: string): Promise<void> {
    const options: any = {};
    if (reason) {
      options.headers = { 'X-Audit-Log-Reason': reason };
    }
    
    return this.bot.rest.delete(`/guilds/${this.guildId}/emojis/${this.id}`, options);
  }

  /**
   * Edits this emoji.
   *
   * @param options - The options for editing the emoji.
   * @returns A promise that resolves with the edited emoji.
   */
  public async edit(options: EmojiEditOptions): Promise<Emoji> {
    const data: any = {};
    
    if (options.name !== undefined) data.name = options.name;
    if (options.roles !== undefined) data.roles = options.roles;
    
    const requestOptions: any = { data };
    if (options.reason) {
      requestOptions.headers = { 'X-Audit-Log-Reason': options.reason };
    }
    
    const emoji = await this.bot.rest.patch(`/guilds/${this.guildId}/emojis/${this.id}`, requestOptions);
    return this._patch(emoji);
  }

  /**
   * Returns the URL to this emoji in the Discord API.
   *
   * @returns The URL to this emoji in the Discord API.
   */
  public get apiUrl(): string {
    if (!this.id) return '';
    return `https://discord.com/api/emojis/${this.id}`;
  }

  /**
   * Returns a string representation of this emoji.
   *
   * @returns A string representation of this emoji.
   */
  public toString(): string {
    return this.format;
  }
}

/**
 * Options for editing a guild emoji.
 */
export interface EmojiEditOptions {
  /**
   * The name of the emoji.
   */
  name?: string;

  /**
   * The roles this emoji is whitelisted for.
   */
  roles?: string[] | null;

  /**
   * The reason for editing the emoji.
   */
  reason?: string;
}