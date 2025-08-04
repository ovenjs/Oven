import type { APIEmbed, EmbedType } from 'discord-api-types/v10';
import { BaseStructure } from './Base';
import type { Bot } from '../Bot';

/**
 * Represents a Discord embed.
 *
 * @remarks
 * This class represents a Discord embed, which is a rich content object that can be
 * included in messages.
 */
export class Embed extends BaseStructure {
  /** The title of the embed */
  public title: string | null;

  /** The type of the embed */
  public type: EmbedType;

  /** The description of the embed */
  public description: string | null;

  /** The URL of the embed */
  public embedUrl: string | null;

  /** The timestamp of the embed */
  public timestamp: Date | null;

  /** The color of the embed */
  public color: number | null;

  /** The footer of the embed */
  public footer: {
    text: string;
    iconUrl?: string;
    proxyIconUrl?: string;
  } | null;

  /** The image of the embed */
  public image: {
    url: string;
    proxyUrl?: string;
    height?: number;
    width?: number;
  } | null;

  /** The thumbnail of the embed */
  public thumbnail: {
    url: string;
    proxyUrl?: string;
    height?: number;
    width?: number;
  } | null;

  /** The video of the embed */
  public video: {
    url?: string;
    height?: number;
    width?: number;
  } | null;

  /** The provider of the embed */
  public provider: {
    name?: string;
    url?: string;
  } | null;

  /** The author of the embed */
  public author: {
    name?: string;
    url?: string;
    iconUrl?: string;
    proxyIconUrl?: string;
  } | null;

  /** The fields of the embed */
  public fields: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;

  /**
   * Creates a new Embed instance.
   *
   * @param bot - The bot instance this embed belongs to.
   * @param data - The raw embed data from the Discord API.
   */
  constructor(bot: Bot, data: APIEmbed) {
    super(bot, '');
    this._patch(data);
  }

  /**
   * Patches this embed with raw data from the Discord API.
   *
   * @param data - The raw embed data from the Discord API.
   * @returns This embed instance for chaining.
   */
  public _patch(data: APIEmbed): this {
    this.title = data.title ?? null;
    this.type = data.type || ('rich' as EmbedType);
    this.description = data.description ?? null;
    this.embedUrl = data.url ?? null;
    this.timestamp = data.timestamp ? new Date(data.timestamp) : null;
    this.color = data.color ?? null;
    this.footer = data.footer
      ? {
          text: data.footer.text,
          iconUrl: data.footer.icon_url,
          proxyIconUrl: data.footer.proxy_icon_url,
        }
      : null;
    this.image = data.image
      ? {
          url: data.image.url,
          proxyUrl: data.image.proxy_url,
          height: data.image.height,
          width: data.image.width,
        }
      : null;
    this.thumbnail = data.thumbnail
      ? {
          url: data.thumbnail.url,
          proxyUrl: data.thumbnail.proxy_url,
          height: data.thumbnail.height,
          width: data.thumbnail.width,
        }
      : null;
    this.video = data.video
      ? {
          url: data.video.url,
          height: data.video.height,
          width: data.video.width,
        }
      : null;
    this.provider = data.provider
      ? {
          name: data.provider.name,
          url: data.provider.url,
        }
      : null;
    this.author = data.author
      ? {
          name: data.author.name,
          url: data.author.url,
          iconUrl: data.author.icon_url,
          proxyIconUrl: data.author.proxy_icon_url,
        }
      : null;
    this.fields = data.fields ?? [];

    return this;
  }

  /**
   * The hexadecimal color code of the embed.
   */
  public get hexColor(): string | null {
    if (this.color === null) return null;
    return `#${this.color.toString(16).padStart(6, '0')}`;
  }

  /**
   * The length of the embed's title.
   */
  public get titleLength(): number {
    return this.title?.length ?? 0;
  }

  /**
   * The length of the embed's description.
   */
  public get descriptionLength(): number {
    return this.description?.length ?? 0;
  }

  /**
   * The total length of the embed's fields.
   */
  public get fieldsLength(): number {
    return this.fields.reduce(
      (acc, field) => acc + field.name.length + field.value.length,
      0
    );
  }

  /**
   * The total length of the embed.
   */
  public get totalLength(): number {
    return this.titleLength + this.descriptionLength + this.fieldsLength;
  }

  /**
   * Whether the embed is empty.
   */
  public get isEmpty(): boolean {
    return (
      !this.title &&
      !this.description &&
      !this.embedUrl &&
      !this.timestamp &&
      this.color === null &&
      !this.footer &&
      !this.image &&
      !this.thumbnail &&
      !this.video &&
      !this.provider &&
      !this.author &&
      this.fields.length === 0
    );
  }

  /**
   * Returns the URL to this embed in the Discord API.
   *
   * @returns The URL to this embed in the Discord API.
   */
  public get url(): string {
    return this.embedUrl || '';
  }

  /**
   * Returns a JSON representation of this embed.
   *
   * @returns A JSON representation of this embed.
   */
  public toJSON(): APIEmbed {
    const embed: APIEmbed = {};

    if (this.title) embed.title = this.title;
    if (this.type) embed.type = this.type as EmbedType;
    if (this.description) embed.description = this.description;
    if (this.url) embed.url = this.url;
    if (this.timestamp) embed.timestamp = this.timestamp.toISOString();
    if (this.color !== null) embed.color = this.color;
    if (this.footer) {
      embed.footer = {
        text: this.footer.text,
      };
      if (this.footer.iconUrl) embed.footer.icon_url = this.footer.iconUrl;
    }
    if (this.image) {
      embed.image = {
        url: this.image.url,
      };
      if (this.image.proxyUrl) embed.image.proxy_url = this.image.proxyUrl;
      if (this.image.height) embed.image.height = this.image.height;
      if (this.image.width) embed.image.width = this.image.width;
    }
    if (this.thumbnail) {
      embed.thumbnail = {
        url: this.thumbnail.url,
      };
      if (this.thumbnail.proxyUrl) embed.thumbnail.proxy_url = this.thumbnail.proxyUrl;
      if (this.thumbnail.height) embed.thumbnail.height = this.thumbnail.height;
      if (this.thumbnail.width) embed.thumbnail.width = this.thumbnail.width;
    }
    if (this.video) {
      embed.video = {};
      if (this.video.url) embed.video.url = this.video.url;
      if (this.video.height) embed.video.height = this.video.height;
      if (this.video.width) embed.video.width = this.video.width;
    }
    if (this.provider) {
      embed.provider = {};
      if (this.provider.name) embed.provider.name = this.provider.name;
      if (this.provider.url) embed.provider.url = this.provider.url;
    }
    if (this.author) {
      if (this.author.name) {
        embed.author = {
          name: this.author.name,
        };
        if (this.author.url) embed.author.url = this.author.url;
        if (this.author.iconUrl) embed.author.icon_url = this.author.iconUrl;
        if (this.author.proxyIconUrl)
          embed.author.proxy_icon_url = this.author.proxyIconUrl;
      }
    }
    if (this.fields.length > 0) {
      embed.fields = this.fields.map(field => ({
        name: field.name,
        value: field.value,
        inline: field.inline,
      }));
    }

    return embed;
  }
}
