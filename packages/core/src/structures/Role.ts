import type { APIRole } from 'discord-api-types/v10';
import { BaseStructure } from './Base';
import type { Bot } from '../Bot';

/**
 * Represents a Discord role.
 *
 * @see {@link https://discord.com/developers/docs/topics/permissions#role-object}
 */
export class Role extends BaseStructure {
  /** The role name */
  public name: string;

  /** The role color in integer representation */
  public color: number;

  /** Whether this role is hoisted (displayed separately in the user list) */
  public hoist: boolean;

  /** The role icon hash */
  public icon: string | null;

  /** The role unicode emoji */
  public unicodeEmoji: string | null;

  /** The position of this role */
  public position: number;

  /** The permissions bitfield */
  public permissions: string;

  /** Whether this role is managed by an integration */
  public managed: boolean;

  /** Whether this role is mentionable */
  public mentionable: boolean;

  /** The role tags */
  public tags?: {
    /** The id of the bot this role belongs to */
    botId?: string;
    /** The id of the integration this role belongs to */
    integrationId?: string;
    /** Whether this is the guild's premium subscriber role */
    premiumSubscriber?: boolean;
  };

  /** The flags for this role */
  public flags: number;

  /**
   * @param bot - The bot instance
   * @param data - The role data from the Discord API
   */
  constructor(bot: Bot, data: APIRole) {
    super(bot, data.id);
    this._patch(data);
  }

  /**
   * Patches this role with raw data from the Discord API.
   *
   * @param data - The raw role data from the Discord API.
   * @returns This role instance for chaining.
   */
  public _patch(data: APIRole): this {
    this.name = data.name;
    this.color = data.color;
    this.hoist = data.hoist;
    this.icon = data.icon ?? null;
    this.unicodeEmoji = data.unicode_emoji ?? null;
    this.position = data.position;
    this.permissions = data.permissions;
    this.managed = data.managed;
    this.mentionable = data.mentionable;
    this.tags = data.tags
      ? {
          botId: data.tags.bot_id,
          integrationId: data.tags.integration_id,
          premiumSubscriber: data.tags.premium_subscriber ?? false,
        }
      : undefined;
    this.flags = data.flags || 0;

    return this;
  }

  /**
   * The hexadecimal color code of the role
   */
  public get hexColor(): string {
    return `#${this.color.toString(16).padStart(6, '0')}`;
  }

  /**
   * Whether the role has the Administrator permission
   */
  public get administrator(): boolean {
    return (BigInt(this.permissions) & BigInt(1 << 3)) === BigInt(1 << 3);
  }

  /**
   * Whether the role can be mentioned by everyone
   */
  public get canMention(): boolean {
    return this.mentionable;
  }

  /**
   * Whether the role is displayed separately in the user list
   */
  public get isHoisted(): boolean {
    return this.hoist;
  }

  /**
   * Whether the role is managed by an integration
   */
  public get isManaged(): boolean {
    return this.managed;
  }

  /**
   * Whether the role is the default everyone role
   */
  public get isDefault(): boolean {
    return this.name === '@everyone';
  }

  /**
   * The URL of the role's icon
   * @param options - The options for the icon URL
   * @returns The URL of the role's icon
   */
  public iconURL(
    options: { size?: number; format?: 'png' | 'jpg' | 'webp' } = {}
  ): string | null {
    if (!this.icon) return null;
    const { size = 128, format = 'png' } = options;
    return `https://cdn.discordapp.com/role-icons/${this.id}/${this.icon}.${format}?size=${size}`;
  }

  /**
   * Creates a mention for this role
   * @returns The role mention
   */
  public toString(): string {
    return `<@&${this.id}>`;
  }

  /**
   * Returns the URL to this role in the Discord API.
   *
   * @returns The URL to this role in the Discord API.
   */
  public get url(): string {
    return `https://discord.com/api/roles/${this.id}`;
  }
}
