import type { APIAttachment } from 'discord-api-types/v10';
import { BaseStructure } from './Base';
import type { Bot } from '../Bot';

/**
 * Represents a Discord attachment.
 *
 * @remarks
 * This class represents a Discord attachment, which is a file uploaded to a message.
 */
export class Attachment extends BaseStructure {
  /** The filename of the attachment */
  public filename: string;

  /** The title of the attachment */
  public title: string | null;

  /** The description of the attachment */
  public description: string | null;

  /** The content type of the attachment */
  public contentType: string | null;

  /** The size of the attachment in bytes */
  public size: number;

  /** The URL of the attachment */
  public attachmentUrl: string;

  /** The proxy URL of the attachment */
  public proxyUrl: string;

  /** The height of the attachment (if it's an image or video) */
  public height: number | null;

  /** The width of the attachment (if it's an image or video) */
  public width: number | null;

  /** Whether this attachment is ephemeral */
  public ephemeral: boolean;

  /** The duration of the attachment (if it's a video or audio) */
  public duration_secs: number | null;

  /** The waveform of the attachment (if it's an audio) */
  public waveform: string | null;

  /** The flags of the attachment */
  public flags: number;

  /**
   * Creates a new Attachment instance.
   *
   * @param bot - The bot instance this attachment belongs to.
   * @param data - The raw attachment data from the Discord API.
   */
  constructor(bot: Bot, data: APIAttachment) {
    super(bot, data.id);
    this._patch(data);
  }

  /**
   * Patches this attachment with raw data from the Discord API.
   *
   * @param data - The raw attachment data from the Discord API.
   * @returns This attachment instance for chaining.
   */
  public _patch(data: APIAttachment): this {
    this.filename = data.filename;
    this.title = data.title ?? null;
    this.description = data.description ?? null;
    this.contentType = data.content_type ?? null;
    this.size = data.size;
    this.attachmentUrl = data.url;
    this.proxyUrl = data.proxy_url;
    this.height = data.height ?? null;
    this.width = data.width ?? null;
    this.ephemeral = data.ephemeral ?? false;
    this.duration_secs = (data as any).duration_secs ?? null;
    this.waveform = (data as any).waveform ?? null;
    this.flags = data.flags ?? 0;

    return this;
  }

  /**
   * Whether this attachment is an image.
   */
  public get isImage(): boolean {
    if (!this.contentType) return false;
    return this.contentType.startsWith('image/');
  }

  /**
   * Whether this attachment is a video.
   */
  public get isVideo(): boolean {
    if (!this.contentType) return false;
    return this.contentType.startsWith('video/');
  }

  /**
   * Whether this attachment is an audio file.
   */
  public get isAudio(): boolean {
    if (!this.contentType) return false;
    return this.contentType.startsWith('audio/');
  }

  /**
   * Whether this attachment has dimensions (is an image or video).
   */
  public get hasDimensions(): boolean {
    return this.height !== null && this.width !== null;
  }

  /**
   * Whether this attachment is a spoiler.
   */
  public get isSpoiler(): boolean {
    return this.filename.startsWith('SPOILER_');
  }

  /**
   * The extension of the attachment.
   */
  public get extension(): string | null {
    const parts = this.filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : null;
  }

  /**
   * Returns the URL to this attachment in the Discord API.
   *
   * @returns The URL to this attachment in the Discord API.
   */
  public get url(): string {
    return this.attachmentUrl;
  }

  /**
   * Returns a string representation of this attachment.
   *
   * @returns A string representation of this attachment.
   */
  public toString(): string {
    return this.filename;
  }
}
