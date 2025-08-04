import type { APIUser } from 'discord-api-types/v10';
import { BaseStructure } from './Base';
import type { Bot } from '../Bot';

/**
 * Represents a Discord user.
 *
 * @remarks
 * This class represents a Discord user, which can be a regular user,
 * a bot user, or a system user. It provides properties and methods
 * for interacting with user data.
 */
export class User extends BaseStructure {
  /**
   * The username of the user.
   */
  public username: string;

  /**
   * The user's 4-digit discriminator.
   */
  public discriminator: string;

  /**
   * The user's avatar hash.
   */
  public avatar: string | null;

  /**
   * Whether this user is a bot.
   */
  public isBot: boolean;

  /**
   * Whether this user is a system user.
   */
  public system: boolean;

  /**
   * The user's public flags.
   */
  public flags: number;

  /**
   * The user's banner hash.
   */
  public banner: string | null;

  /**
   * The user's accent color.
   */
  public accentColor: number | null;

  /**
   * Creates a new User instance.
   *
   * @param bot - The bot instance this user belongs to.
   * @param data - The raw user data from the Discord API.
   */
  constructor(bot: Bot, data: APIUser) {
    super(bot, data.id);
    this._patch(data);
  }

  /**
   * Patches this user with raw data from the Discord API.
   *
   * @param data - The raw user data from the Discord API.
   * @returns This user instance for chaining.
   */
  public _patch(data: APIUser): this {
    this.username = data.username;
    this.discriminator = data.discriminator;
    this.avatar = data.avatar ?? null;
    this.isBot = data.bot ?? false;
    this.system = data.system ?? false;
    this.flags = data.public_flags ?? 0;
    this.banner = data.banner ?? null;
    this.accentColor = data.accent_color ?? null;

    return this;
  }

  /**
   * The user's tag (username#discriminator).
   */
  public get tag(): string {
    return `${this.username}#${this.discriminator}`;
  }

  /**
   * The URL of the user's avatar.
   */
  public get avatarURL(): string | null {
    if (!this.avatar) return null;

    const format = this.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.${format}`;
  }

  /**
   * The URL of the user's default avatar.
   */
  public get defaultAvatarURL(): string {
    // Default avatar is determined by the discriminator modulo 5
    const index = parseInt(this.discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }

  /**
   * The URL of the user's display avatar (custom or default).
   */
  public get displayAvatarURL(): string {
    return this.avatarURL ?? this.defaultAvatarURL;
  }

  /**
   * The URL of the user's banner.
   */
  public get bannerURL(): string | null {
    if (!this.banner) return null;

    const format = this.banner.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/banners/${this.id}/${this.banner}.${format}`;
  }

  /**
   * Creates a DM channel with this user.
   *
   * @returns A promise that resolves with the created DM channel.
   */
  public async createDM(): Promise<any> {
    return this.bot.rest.post('/users/@me/channels', { data: { recipient_id: this.id } });
  }

  /**
   * Returns the URL to this user in the Discord API.
   *
   * @returns The URL to this user in the Discord API.
   */
  public get url(): string {
    return `https://discord.com/users/${this.id}`;
  }

  /**
   * Returns a string representation of this user.
   *
   * @returns A string representation of this user.
   */
  public toString(): string {
    return `<@${this.id}>`;
  }
}
