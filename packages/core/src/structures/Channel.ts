import type { APIChannel } from 'discord-api-types/v10';
import { BaseStructure } from './Base';
import type { Bot } from '../Bot';

/**
 * Represents a Discord channel.
 *
 * @remarks
 * This class represents a Discord channel, which can be a text channel,
 * voice channel, category, or other channel types. It provides properties
 * and methods for interacting with channel data.
 */
export class Channel extends BaseStructure {
  /**
   * The type of the channel.
   */
  public type: number;

  /**
   * The ID of the guild the channel belongs to.
   */
  public guildId: string | null;

  /**
   * The position of the channel.
   */
  public position: number;

  /**
   * The permission overwrites of the channel.
   */
  public permissionOverwrites: any[];

  /**
   * The name of the channel.
   */
  public name: string | null;

  /**
   * The topic of the channel.
   */
  public topic: string | null;

  /**
   * Whether the channel is NSFW.
   */
  public nsfw: boolean;

  /**
   * The ID of the last message sent in the channel.
   */
  public lastMessageId: string | null;

  /**
   * The bitrate of the channel (voice only).
   */
  public bitrate: number | null;

  /**
   * The user limit of the channel (voice only).
   */
  public userLimit: number | null;

  /**
   * The rate limit per user of the channel.
   */
  public rateLimitPerUser: number | null;

  /**
   * The recipients of the channel (DM only).
   */
  public recipients: any[];

  /**
   * The icon hash of the channel.
   */
  public icon: string | null;

  /**
   * The owner ID of the channel (group DM only).
   */
  public ownerId: string | null;

  /**
   * The application ID of the channel (group DM only).
   */
  public applicationId: string | null;

  /**
   * The ID of the parent category of the channel.
   */
  public parentId: string | null;

  /**
   * The timestamp of the last pin in the channel.
   */
  public lastPinTimestamp: Date | null;

  /**
   * The RTC region of the channel (voice only).
   */
  public rtcRegion: string | null;

  /**
   * The video quality mode of the channel (voice only).
   */
  public videoQualityMode: number | null;

  /**
   * The number of members in the channel (voice only).
   */
  public memberCount: number | null;

  /**
   * The thread metadata of the channel (thread only).
   */
  public threadMetadata: any | null;

  /**
   * The member that started the thread (thread only).
   */
  public member: any | null;

  /**
   * The default auto archive duration for threads in the channel.
   */
  public defaultAutoArchiveDuration: number | null;

  /**
   * The computed permissions for the invoking user in the channel.
   */
  public permissions: string | null;

  /**
   * The flags of the channel.
   */
  public flags: number;

  /**
   * The number of messages ever sent in the thread (thread only).
   */
  public totalMessageSent: number | null;

  /**
   * The number of messages sent in the thread (thread only).
   */
  public messageCount: number | null;

  /**
   * The ID of the thread that was archived (thread only).
   */
  public archivedThreadId: string | null;

  /**
   * The ID of the thread that was auto archived (thread only).
   */
  public autoArchiveThreadId: string | null;

  /**
   * Creates a new Channel instance.
   *
   * @param bot - The bot instance this channel belongs to.
   * @param data - The raw channel data from the Discord API.
   */
  constructor(bot: Bot, data: APIChannel) {
    super(bot, data.id);
    this._patch(data);
  }

  /**
   * Patches this channel with raw data from the Discord API.
   *
   * @param data - The raw channel data from the Discord API.
   * @returns This channel instance for chaining.
   */
  public _patch(data: APIChannel): this {
    this.type = data.type;
    this.guildId = (data as any).guild_id ?? null;
    this.position = (data as any).position ?? 0;
    this.permissionOverwrites = (data as any).permission_overwrites ?? [];
    this.name = (data as any).name ?? null;
    this.topic = (data as any).topic ?? null;
    this.nsfw = (data as any).nsfw ?? false;
    this.lastMessageId = (data as any).last_message_id ?? null;
    this.bitrate = (data as any).bitrate ?? null;
    this.userLimit = (data as any).user_limit ?? null;
    this.rateLimitPerUser = (data as any).rate_limit_per_user ?? null;
    this.recipients = (data as any).recipients ?? [];
    this.icon = (data as any).icon ?? null;
    this.ownerId = (data as any).owner_id ?? null;
    this.applicationId = (data as any).application_id ?? null;
    this.parentId = (data as any).parent_id ?? null;
    this.lastPinTimestamp = (data as any).last_pin_timestamp ? new Date((data as any).last_pin_timestamp) : null;
    this.rtcRegion = (data as any).rtc_region ?? null;
    this.videoQualityMode = (data as any).video_quality_mode ?? null;
    this.memberCount = (data as any).member_count ?? null;
    this.threadMetadata = (data as any).thread_metadata ?? null;
    this.member = (data as any).member ?? null;
    this.defaultAutoArchiveDuration = (data as any).default_auto_archive_duration ?? null;
    this.permissions = (data as any).permissions ?? null;
    this.flags = (data as any).flags ?? 0;
    this.totalMessageSent = (data as any).total_message_sent ?? null;
    this.messageCount = (data as any).message_count ?? null;
    this.archivedThreadId = (data as any).archived_thread_id ?? null;
    this.autoArchiveThreadId = (data as any).auto_archive_thread_id ?? null;

    return this;
  }

  /**
   * The URL of the channel's icon.
   */
  public get iconURL(): string | null {
    if (!this.icon) return null;
    
    const format = this.icon.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/channel-icons/${this.id}/${this.icon}.${format}`;
  }

  /**
   * Whether the channel is a text channel.
   */
  public get isText(): boolean {
    return this.type === 0; // GUILD_TEXT
  }

  /**
   * Whether the channel is a DM channel.
   */
  public get isDM(): boolean {
    return this.type === 1; // DM
  }

  /**
   * Whether the channel is a voice channel.
   */
  public get isVoice(): boolean {
    return this.type === 2; // GUILD_VOICE
  }

  /**
   * Whether the channel is a category.
   */
  public get isCategory(): boolean {
    return this.type === 4; // GUILD_CATEGORY
  }

  /**
   * Whether the channel is a news channel.
   */
  public get isNews(): boolean {
    return this.type === 5; // GUILD_NEWS
  }

  /**
   * Whether the channel is a store channel.
   */
  public get isStore(): boolean {
    return this.type === 6; // GUILD_STORE
  }

  /**
   * Whether the channel is a thread.
   */
  public get isThread(): boolean {
    return [10, 11, 12].includes(this.type); // GUILD_NEWS_THREAD, GUILD_PUBLIC_THREAD, GUILD_PRIVATE_THREAD
  }

  /**
   * Whether the channel is a stage channel.
   */
  public get isStage(): boolean {
    return this.type === 13; // GUILD_STAGE_VOICE
  }

  /**
   * Deletes the channel.
   *
   * @returns A promise that resolves with the deleted channel.
   */
  public async delete(): Promise<any> {
    return this.bot.channels.delete(this.id);
  }

  /**
   * Edits the channel.
   *
   * @param options - The options for editing the channel.
   * @returns A promise that resolves with the edited channel.
   */
  public async edit(options: ChannelEditOptions): Promise<Channel> {
    const channel = await this.bot.channels.edit(this.id, options);
    return this._patch(channel);
  }

  /**
   * Fetches the channel.
   *
   * @param force - Whether to force a fetch from the API, bypassing the cache.
   * @returns A promise that resolves with the channel.
   */
  public async fetch(force = false): Promise<Channel> {
    const channel = await this.bot.channels.fetch(this.id, force);
    return this._patch(channel);
  }

  /**
   * Returns the URL to this channel in the Discord API.
   *
   * @returns The URL to this channel in the Discord API.
   */
  public get url(): string {
    return `https://discord.com/api/channels/${this.id}`;
  }

  /**
   * Returns a string representation of this channel.
   *
   * @returns A string representation of this channel.
   */
  public toString(): string {
    return this.name ? `#${this.name}` : `<#${this.id}>`;
  }
}

/**
 * Options for editing a channel.
 */
export interface ChannelEditOptions {
  /**
   * The name of the channel.
   */
  name?: string;

  /**
   * The topic of the channel.
   */
  topic?: string | null;

  /**
   * The bitrate of the channel (voice only).
   */
  bitrate?: number;

  /**
   * The user limit of the channel (voice only).
   */
  userLimit?: number;

  /**
   * The rate limit per user of the channel.
   */
  rateLimitPerUser?: number | null;

  /**
   * The position of the channel.
   */
  position?: number;

  /**
   * The permission overwrites of the channel.
   */
  permissionOverwrites?: any[];

  /**
   * The ID of the parent category of the channel.
   */
  parentId?: string | null;

  /**
   * Whether the channel is NSFW.
   */
  nsfw?: boolean;

  /**
   * The RTC region of the channel (voice only).
   */
  rtcRegion?: string | null;

  /**
   * The video quality mode of the channel (voice only).
   */
  videoQualityMode?: number | null;

  /**
   * The default auto archive duration for threads in the channel.
   */
  defaultAutoArchiveDuration?: number | null;

  /**
   * The flags of the channel.
   */
  flags?: number;
}