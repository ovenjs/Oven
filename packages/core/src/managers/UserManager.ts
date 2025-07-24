import type { User } from '@ovenjs/types';
import { BaseManager } from './BaseManager';

export class UserManager extends BaseManager<User> {
  /**
   * Fetch a user by ID
   */
  public async fetch(userId: string): Promise<User> {
    const user = await this.client.rest.getUser(userId);
    this.set(userId, user);
    return user;
  }

  /**
   * Fetch the current user (bot)
   */
  public async fetchMe(): Promise<User> {
    const user = await this.client.rest.getCurrentUser();
    if (user) {
      this.set(user.id, user);
    }
    return user;
  }

  /**
   * Get user avatar URL
   */
  public avatarURL(user: User, options?: { 
    format?: 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif'; 
    size?: number; 
    dynamic?: boolean;
  }): string | null {
    if (!user.avatar) {
      // Return default avatar
      const defaultAvatarNum = parseInt(user.discriminator) % 5;
      return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNum}.png`;
    }
    
    const dynamic = options?.dynamic ?? true;
    const format = options?.format ?? (dynamic && user.avatar.startsWith('a_') ? 'gif' : 'webp');
    const size = options?.size ?? 256;
    
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${format}?size=${size}`;
  }

  /**
   * Get user banner URL
   */
  public bannerURL(user: User, options?: { 
    format?: 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif'; 
    size?: number; 
    dynamic?: boolean;
  }): string | null {
    if (!user.banner) return null;
    
    const dynamic = options?.dynamic ?? true;
    const format = options?.format ?? (dynamic && user.banner.startsWith('a_') ? 'gif' : 'webp');
    const size = options?.size ?? 512;
    
    return `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${format}?size=${size}`;
  }

  /**
   * Get the user's tag (username#discriminator)
   */
  public tag(user: User): string {
    return `${user.username}#${user.discriminator}`;
  }

  /**
   * Get user mention string
   */
  public mention(userId: string): string {
    return `<@${userId}>`;
  }

  /**
   * Get user mention string (nickname version)
   */
  public nicknameMention(userId: string): string {
    return `<@!${userId}>`;
  }

  /**
   * Check if user is a bot
   */
  public isBot(user: User): boolean {
    return user.bot === true;
  }

  /**
   * Check if user is a system user
   */
  public isSystem(user: User): boolean {
    return user.system === true;
  }

  /**
   * Get user creation timestamp
   */
  public createdAt(userId: string): Date {
    const timestamp = this.createdTimestamp(userId);
    return new Date(timestamp);
  }

  /**
   * Get user creation timestamp in milliseconds
   */
  public createdTimestamp(userId: string): number {
    // Discord snowflake timestamp extraction
    const snowflake = BigInt(userId);
    const timestamp = Number((snowflake >> 22n) + 1420070400000n);
    return timestamp;
  }

  /**
   * Get the default avatar URL for a user
   */
  public defaultAvatarURL(discriminator: string): string {
    const defaultAvatarNum = parseInt(discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNum}.png`;
  }
}