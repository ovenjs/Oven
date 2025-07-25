/**
 * User structure for OvenJS
 * Represents a Discord user
 */

import type { StructureOptions } from '@ovenjs/types';
import type { User as UserData, UserId, ImageURL } from '@ovenjs/types';
import { Base } from './Base.js';

export class User extends Base {
  public readonly username: string;
  public readonly globalName: string | null;
  public readonly discriminator: string;
  public readonly avatar: string | null;
  public readonly bot: boolean;
  public readonly system: boolean;
  public readonly mfaEnabled: boolean;
  public readonly banner: string | null;
  public readonly accentColor: number | null;
  public readonly locale: string | null;
  public readonly verified: boolean;
  public readonly email: string | null;
  public readonly flags: number;
  public readonly premiumType: number;
  public readonly publicFlags: number;
  public readonly avatarDecoration: string | null;

  constructor(options: StructureOptions, data: UserData) {
    super(options, data);
    
    this.username = data.username;
    this.globalName = data.global_name ?? null;
    this.discriminator = data.discriminator;
    this.avatar = data.avatar ?? null;
    this.bot = data.bot ?? false;
    this.system = data.system ?? false;
    this.mfaEnabled = data.mfa_enabled ?? false;
    this.banner = data.banner ?? null;
    this.accentColor = data.accent_color ?? null;
    this.locale = data.locale ?? null;
    this.verified = data.verified ?? false;
    this.email = data.email ?? null;
    this.flags = data.flags ?? 0;
    this.premiumType = data.premium_type ?? 0;
    this.publicFlags = data.public_flags ?? 0;
    this.avatarDecoration = data.avatar_decoration ?? null;
  }

  /**
   * Get the user's display name
   */
  get displayName(): string {
    return this.globalName ?? this.username;
  }

  /**
   * Get the user's tag (username#discriminator)
   */
  get tag(): string {
    return `${this.username}#${this.discriminator}`;
  }

  /**
   * Get the user's avatar URL
   */
  avatarURL(options: { format?: 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif'; size?: number } = {}): ImageURL | null {
    if (!this.avatar) return null;
    
    const format = options.format ?? 'png';
    const size = options.size ?? 256;
    
    const url = `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.${format}?size=${size}`;
    return url as ImageURL;
  }

  /**
   * Get the user's default avatar URL
   */
  defaultAvatarURL(): ImageURL {
    const index = this.discriminator === '0' 
      ? (Number(this.id) >> 22) % 6 
      : parseInt(this.discriminator) % 5;
    
    const url = `https://cdn.discordapp.com/embed/avatars/${index}.png`;
    return url as ImageURL;
  }

  /**
   * Get the user's display avatar URL (avatar or default)
   */
  displayAvatarURL(options: { format?: 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif'; size?: number } = {}): ImageURL {
    return this.avatarURL(options) ?? this.defaultAvatarURL();
  }

  /**
   * Get the user's banner URL
   */
  bannerURL(options: { format?: 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif'; size?: number } = {}): ImageURL | null {
    if (!this.banner) return null;
    
    const format = options.format ?? 'png';
    const size = options.size ?? 512;
    
    const url = `https://cdn.discordapp.com/banners/${this.id}/${this.banner}.${format}?size=${size}`;
    return url as ImageURL;
  }

  /**
   * Check if the user has a specific flag
   */
  hasFlag(flag: number): boolean {
    return (this.flags & flag) === flag;
  }

  /**
   * Check if the user has a specific public flag
   */
  hasPublicFlag(flag: number): boolean {
    return (this.publicFlags & flag) === flag;
  }

  /**
   * Send a direct message to this user
   */
  async send(content: string | any): Promise<any> {
    // This would be implemented to create a DM channel and send a message
    throw new Error('Not implemented yet');
  }

  /**
   * Fetch the user's profile
   */
  async fetch(): Promise<User> {
    const userData = await this.client.rest.users.get(this.id);
    return new User(this.client, userData);
  }

  /**
   * Convert to JSON representation
   */
  override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      username: this.username,
      globalName: this.globalName,
      discriminator: this.discriminator,
      avatar: this.avatar,
      bot: this.bot,
      system: this.system,
      mfaEnabled: this.mfaEnabled,
      banner: this.banner,
      accentColor: this.accentColor,
      locale: this.locale,
      verified: this.verified,
      email: this.email,
      flags: this.flags,
      premiumType: this.premiumType,
      publicFlags: this.publicFlags,
      avatarDecoration: this.avatarDecoration,
    };
  }

  /**
   * String representation
   */
  override toString(): string {
    return `<@${this.id}>`;
  }
}