import type { APIGuildMember } from 'discord-api-types/v10';
import { BaseStructure } from './Base';
import { User } from './User';
import { Role } from './Role';
import type { Bot } from '../Bot';

/**
 * Represents a Discord guild member.
 *
 * @remarks
 * This class represents a member of a Discord guild, which is a user with guild-specific
 * properties such as roles, nickname, and join date.
 */
export class Member extends BaseStructure {
  /** The user this member represents */
  public user: User;

  /** The nickname of this member */
  public nick: string | null;

  /** The avatar hash of this member */
  public avatar: string | null;

  /** The roles this member has */
  public roles: string[];

  /** The date this member joined the guild */
  public joinedAt: Date | null;

  /** The date this member started boosting the guild */
  public premiumSince: Date | null;

  /** Whether this member is deafened */
  public deaf: boolean;

  /** Whether this member is muted */
  public mute: boolean;

  /** Whether this member has not yet passed the guild's membership screening */
  public pending: boolean;

  /** The permissions this member has in the guild */
  public permissions: string | null;

  /** The date this member's timeout will expire */
  public communicationDisabledUntil: Date | null;

  /** The ID of the guild this member belongs to */
  private readonly guildId: string;

  /**
   * Creates a new Member instance.
   *
   * @param bot - The bot instance this member belongs to.
   * @param data - The raw member data from the Discord API.
   * @param guildId - The ID of the guild this member belongs to.
   */
  constructor(bot: Bot, data: APIGuildMember, guildId: string) {
    super(bot, data.user?.id || '');
    this.guildId = guildId;
    this.user = new User(bot, data.user!);
    this._patch(data);
  }

  /**
   * Patches this member with raw data from the Discord API.
   *
   * @param data - The raw member data from the Discord API.
   * @returns This member instance for chaining.
   */
  public _patch(data: APIGuildMember): this {
    this.nick = data.nick ?? null;
    this.avatar = data.avatar ?? null;
    this.roles = data.roles ?? [];
    this.joinedAt = data.joined_at ? new Date(data.joined_at) : null;
    this.premiumSince = data.premium_since ? new Date(data.premium_since) : null;
    this.deaf = data.deaf ?? false;
    this.mute = data.mute ?? false;
    this.pending = data.pending ?? false;
    this.permissions = (data as any).permissions ?? null;
    this.communicationDisabledUntil = data.communication_disabled_until
      ? new Date(data.communication_disabled_until)
      : null;

    return this;
  }

  /**
   * The display name of this member (nickname or username).
   */
  public get displayName(): string {
    return this.nick || this.user.username;
  }

  /**
   * The URL of the member's avatar.
   */
  public get avatarURL(): string | null {
    if (!this.avatar) return this.user.displayAvatarURL;
    
    const format = this.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/guilds/${this.id}/users/${this.user.id}/avatars/${this.avatar}.${format}`;
  }

  /**
   * The URL of the member's display avatar (custom or user's avatar).
   */
  public get displayAvatarURL(): string {
    return this.avatarURL || this.user.displayAvatarURL;
  }

  /**
   * Whether this member is the owner of the guild.
   */
  public get isOwner(): boolean {
    // For now, we'll return false as we need to fetch the guild to check
    // This will be implemented when we have proper guild caching
    return false;
  }

  /**
   * Whether this member is boosting the guild.
   */
  public get isBoosting(): boolean {
    return this.premiumSince !== null;
  }

  /**
   * Whether this member is timed out.
   */
  public get isTimedOut(): boolean {
    if (!this.communicationDisabledUntil) return false;
    return this.communicationDisabledUntil > new Date();
  }

  /**
   * The highest role of this member.
   */
  public get highestRole(): Role | null {
    // For now, we'll return null as we need to fetch the roles to check
    // This will be implemented when we have proper role caching
    return null;
  }

  /**
   * The color of this member's highest colored role.
   */
  public get displayColor(): number {
    // For now, we'll return 0 as we need to fetch the roles to check
    // This will be implemented when we have proper role caching
    return 0;
  }

  /**
   * The hexadecimal color code of this member's highest colored role.
   */
  public get hexColor(): string {
    return `#${this.displayColor.toString(16).padStart(6, '0')}`;
  }

  /**
   * Kicks this member from the guild.
   *
   * @param reason - The reason for kicking the member.
   * @returns A promise that resolves when the member is kicked.
   */
  public async kick(reason?: string): Promise<void> {
    const options: any = {};
    if (reason) {
      options.headers = { 'X-Audit-Log-Reason': reason };
    }
    
    return this.bot.rest.delete(`/guilds/${this.guildId}/members/${this.user.id}`, options);
  }

  /**
   * Bans this member from the guild.
   *
   * @param options - The options for banning the member.
   * @returns A promise that resolves when the member is banned.
   */
  public async ban(options?: { reason?: string; deleteMessageDays?: number }): Promise<void> {
    const params = new URLSearchParams();
    if (options?.reason) params.append('reason', options.reason);
    if (options?.deleteMessageDays) params.append('delete_message_days', options.deleteMessageDays.toString());
    
    const requestOptions: any = {};
    if (params.toString()) {
      requestOptions.query = params.toString();
    }
    
    return this.bot.rest.put(`/guilds/${this.guildId}/bans/${this.user.id}`, requestOptions);
  }

  /**
   * Edits this member.
   *
   * @param options - The options for editing the member.
   * @returns A promise that resolves with the edited member.
   */
  public async edit(options: MemberEditOptions): Promise<Member> {
    const data: any = {};
    
    if (options.nick !== undefined) data.nick = options.nick;
    if (options.roles !== undefined) data.roles = options.roles;
    if (options.mute !== undefined) data.mute = options.mute;
    if (options.deaf !== undefined) data.deaf = options.deaf;
    if (options.channelId !== undefined) data.channel_id = options.channelId;
    if (options.communicationDisabledUntil !== undefined) {
      data.communication_disabled_until = options.communicationDisabledUntil?.toISOString() || null;
    }
    
    const requestOptions: any = { data };
    if (options.reason) {
      requestOptions.headers = { 'X-Audit-Log-Reason': options.reason };
    }
    
    const member = await this.bot.rest.patch(`/guilds/${this.guildId}/members/${this.user.id}`, requestOptions);
    return this._patch(member);
  }

  /**
   * Adds a role to this member.
   *
   * @param roleId - The ID of the role to add.
   * @param reason - The reason for adding the role.
   * @returns A promise that resolves when the role is added.
   */
  public async addRole(roleId: string, reason?: string): Promise<void> {
    const options: any = {};
    if (reason) {
      options.headers = { 'X-Audit-Log-Reason': reason };
    }
    
    return this.bot.rest.put(`/guilds/${this.guildId}/members/${this.user.id}/roles/${roleId}`, options);
  }

  /**
   * Removes a role from this member.
   *
   * @param roleId - The ID of the role to remove.
   * @param reason - The reason for removing the role.
   * @returns A promise that resolves when the role is removed.
   */
  public async removeRole(roleId: string, reason?: string): Promise<void> {
    const options: any = {};
    if (reason) {
      options.headers = { 'X-Audit-Log-Reason': reason };
    }
    
    return this.bot.rest.delete(`/guilds/${this.guildId}/members/${this.user.id}/roles/${roleId}`, options);
  }

  /**
   * Sets the roles of this member.
   *
   * @param roleIds - The IDs of the roles to set.
   * @param reason - The reason for setting the roles.
   * @returns A promise that resolves when the roles are set.
   */
  public async setRoles(roleIds: string[], reason?: string): Promise<void> {
    const options: any = { data: { roles: roleIds } };
    if (reason) {
      options.headers = { 'X-Audit-Log-Reason': reason };
    }
    
    return this.bot.rest.patch(`/guilds/${this.guildId}/members/${this.user.id}`, options);
  }

  /**
   * Returns the URL to this member in the Discord API.
   *
   * @returns The URL to this member in the Discord API.
   */
  public get url(): string {
    return `https://discord.com/api/guilds/${this.id}/members/${this.user.id}`;
  }

  /**
   * Returns a string representation of this member.
   *
   * @returns A string representation of this member.
   */
  public toString(): string {
    return `<@!${this.user.id}>`;
  }
}

/**
 * Options for editing a guild member.
 */
export interface MemberEditOptions {
  /**
   * The nickname of the member.
   */
  nick?: string | null;

  /**
   * The roles of the member.
   */
  roles?: string[] | null;

  /**
   * Whether the member is muted.
   */
  mute?: boolean | null;

  /**
   * Whether the member is deafened.
   */
  deaf?: boolean | null;

  /**
   * The channel ID to move the member to.
   */
  channelId?: string | null;

  /**
   * The date when the member's timeout will expire.
   */
  communicationDisabledUntil?: Date | null;

  /**
   * The reason for editing the member.
   */
  reason?: string;
}