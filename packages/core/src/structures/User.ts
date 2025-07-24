import type { User as UserData } from '@ovenjs/types';
import { Base } from './Base';

export class User extends Base {
  public username: string;
  public discriminator: string;
  public avatar?: string | null;
  public banner?: string | null;
  public bot?: boolean;
  public system?: boolean;

  constructor(client: any, data: UserData) {
    super(client, data);
    
    this.username = data.username;
    this.discriminator = data.discriminator;
    this.avatar = data.avatar;
    this.banner = data.banner;
    this.bot = data.bot;
    this.system = data.system;
  }

  /**
   * Get the user's tag (username#discriminator)
   */
  public get tag(): string {
    return this.client.users.tag(this);
  }

  /**
   * Get user avatar URL
   */
  public avatarURL(options?: { 
    format?: 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif'; 
    size?: number; 
    dynamic?: boolean;
  }): string | null {
    return this.client.users.avatarURL(this, options);
  }

  /**
   * Get user banner URL
   */
  public bannerURL(options?: { 
    format?: 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif'; 
    size?: number; 
    dynamic?: boolean;
  }): string | null {
    return this.client.users.bannerURL(this, options);
  }

  /**
   * Check if user is a bot
   */
  public isBot(): boolean {
    return this.client.users.isBot(this);
  }

  /**
   * Check if user is a system user
   */
  public isSystem(): boolean {
    return this.client.users.isSystem(this);
  }

  /**
   * Get user mention string
   */
  public toString(): string {
    return this.client.users.mention(this.id);
  }

  /**
   * Send a DM to this user
   */
  public async send(data: any): Promise<any> {
    // This would require creating a DM channel first
    // Implementation would need to be added to the REST manager
    throw new Error('DM sending not implemented yet');
  }

  public toJSON(): UserData {
    return {
      id: this.id,
      username: this.username,
      discriminator: this.discriminator,
      avatar: this.avatar,
      banner: this.banner,
      bot: this.bot,
      system: this.system,
    } as UserData;
  }
}