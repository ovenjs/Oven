import { BaseManager } from './BaseManager';
import type { Bot } from '../Bot';

/**
 * Manager for user-related operations.
 *
 * @remarks
 * This class provides methods for managing Discord users.
 */
export class UserManager extends BaseManager {
  /**
   * Creates a new UserManager instance.
   *
   * @param bot - The bot instance this manager belongs to.
   */
  constructor(bot: Bot) {
    super(bot);
  }

  /**
   * Fetches a user by their ID.
   *
   * @param id - The user ID.
   * @param force - Whether to force a fetch from the API, bypassing the cache.
   * @returns A promise that resolves with the user.
   */
  public async fetch(id: string, force = false): Promise<any> {
    // Try to get from cache first if not forcing
    if (!force) {
      const cached = await this.cache.getUser(id);
      if (cached) {
        return cached;
      }
    }

    // Fetch from API
    const user = await this.rest.get(`/users/${id}`);

    // Cache the user
    await this.cache.setUser(user);

    return user;
  }

  /**
   * Fetches the current user.
   *
   * @param force - Whether to force a fetch from the API, bypassing the cache.
   * @returns A promise that resolves with the current user.
   */
  public async fetchCurrentUser(force = false): Promise<any> {
    // Try to get from cache first if not forcing
    if (!force) {
      const cached = await this.cache.getUser('current');
      if (cached) {
        return cached;
      }
    }

    // Fetch from API
    const user = await this.rest.get('/users/@me');

    // Cache the user
    await this.cache.setUser({ ...user, id: 'current' });
    await this.cache.setUser(user); // Also cache with actual ID

    return user;
  }

  /**
   * Edits the current user.
   *
   * @param options - The options for editing the current user.
   * @returns A promise that resolves with the edited user.
   */
  public async editCurrentUser(options: UserEditOptions): Promise<any> {
    const user = await this.rest.patch('/users/@me', { data: options });

    // Update the cache
    await this.cache.setUser(user);

    return user;
  }

  /**
   * Fetches a guild member.
   *
   * @param guildId - The guild ID.
   * @param userId - The user ID.
   * @param force - Whether to force a fetch from the API, bypassing the cache.
   * @returns A promise that resolves with the guild member.
   */
  public async fetchMember(guildId: string, userId: string, force = false): Promise<any> {
    // Try to get from cache first if not forcing
    if (!force) {
      const cached = await this.cache.getMember(guildId, userId);
      if (cached) {
        return cached;
      }
    }

    // Fetch from API
    const member = await this.rest.get(`/guilds/${guildId}/members/${userId}`);

    // Cache the member
    await this.cache.setMember(member);

    return member;
  }

  /**
   * Fetches all members in a guild.
   *
   * @param guildId - The guild ID.
   * @param options - The options for fetching members.
   * @returns A promise that resolves with an array of guild members.
   */
  public async fetchAllMembers(
    guildId: string,
    options: FetchMembersOptions = {}
  ): Promise<any[]> {
    const { limit = 1000, after } = options;

    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (after) params.append('after', after);

    const members = await this.rest.get(
      `/guilds/${guildId}/members?${params.toString()}`
    );

    // Cache the members
    for (const member of members) {
      await this.cache.setMember(member);
      // Also cache the user
      await this.cache.setUser(member.user);
    }

    return members;
  }

  /**
   * Edits a guild member.
   *
   * @param guildId - The guild ID.
   * @param userId - The user ID.
   * @param options - The options for editing the guild member.
   * @returns A promise that resolves with the edited guild member.
   */
  public async editMember(
    guildId: string,
    userId: string,
    options: MemberEditOptions
  ): Promise<any> {
    const member = await this.rest.patch(`/guilds/${guildId}/members/${userId}`, {
      data: options,
    });

    // Update the cache
    await this.cache.setMember(member);

    return member;
  }

  /**
   * Kicks a guild member.
   *
   * @param guildId - The guild ID.
   * @param userId - The user ID.
   * @param reason - The reason for kicking the member.
   * @returns A promise that resolves when the member is kicked.
   */
  public async kick(guildId: string, userId: string, reason?: string): Promise<void> {
    const options: any = {};
    if (reason) {
      options.headers = { 'X-Audit-Log-Reason': reason };
    }

    await this.rest.delete(`/guilds/${guildId}/members/${userId}`, options);

    // Remove from cache
    await this.cache.deleteMember(guildId, userId);
  }

  /**
   * Bans a guild member.
   *
   * @param guildId - The guild ID.
   * @param userId - The user ID.
   * @param options - The options for banning the member.
   * @returns A promise that resolves when the member is banned.
   */
  public async ban(
    guildId: string,
    userId: string,
    options: BanOptions = {}
  ): Promise<void> {
    const requestOptions: any = { data: options };
    if (options.reason) {
      requestOptions.headers = { 'X-Audit-Log-Reason': options.reason };
      delete options.reason;
    }

    await this.rest.put(`/guilds/${guildId}/bans/${userId}`, requestOptions);

    // Remove from cache
    await this.cache.deleteMember(guildId, userId);
  }

  /**
   * Unbans a user.
   *
   * @param guildId - The guild ID.
   * @param userId - The user ID.
   * @param reason - The reason for unbanning the user.
   * @returns A promise that resolves when the user is unbanned.
   */
  public async unban(guildId: string, userId: string, reason?: string): Promise<void> {
    const options: any = {};
    if (reason) {
      options.headers = { 'X-Audit-Log-Reason': reason };
    }

    await this.rest.delete(`/guilds/${guildId}/bans/${userId}`, options);
  }

  /**
   * Gets a user from the cache.
   *
   * @param id - The user ID.
   * @returns A promise that resolves with the user, or null if not found.
   */
  public async getUserFromCache(id: string): Promise<any | null> {
    return this.cache.getUser(id);
  }

  /**
   * Adds a user to the cache.
   *
   * @param user - The user to cache.
   * @returns A promise that resolves when the user is cached.
   */
  public async addUserToCache(user: any): Promise<void> {
    return this.cache.setUser(user);
  }

  /**
   * Removes a user from the cache.
   *
   * @param id - The user ID.
   * @returns A promise that resolves when the user is removed from the cache.
   */
  public async removeUserFromCache(id: string): Promise<void> {
    return this.cache.deleteUser(id);
  }

  /**
   * Gets a guild member from the cache.
   *
   * @param guildId - The guild ID.
   * @param userId - The user ID.
   * @returns A promise that resolves with the guild member, or null if not found.
   */
  public async getMemberFromCache(guildId: string, userId: string): Promise<any | null> {
    return this.cache.getMember(guildId, userId);
  }

  /**
   * Adds a guild member to the cache.
   *
   * @param member - The guild member to cache.
   * @returns A promise that resolves when the guild member is cached.
   */
  public async addMemberToCache(member: any): Promise<void> {
    return this.cache.setMember(member);
  }

  /**
   * Removes a guild member from the cache.
   *
   * @param guildId - The guild ID.
   * @param userId - The user ID.
   * @returns A promise that resolves when the guild member is removed from the cache.
   */
  public async removeMemberFromCache(guildId: string, userId: string): Promise<void> {
    return this.cache.deleteMember(guildId, userId);
  }
}

/**
 * Options for editing the current user.
 */
export interface UserEditOptions {
  /**
   * The username of the user.
   */
  username?: string;

  /**
   * The avatar of the user.
   */
  avatar?: string | null;

  /**
   * The banner of the user.
   */
  banner?: string | null;
}

/**
 * Options for fetching members.
 */
export interface FetchMembersOptions {
  /**
   * The maximum number of members to return.
   */
  limit?: number;

  /**
   * Get members after this user ID.
   */
  after?: string;
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
  roles?: string[];

  /**
   * Whether the member is muted.
   */
  mute?: boolean;

  /**
   * Whether the member is deafened.
   */
  deaf?: boolean;

  /**
   * The channel ID to move the member to.
   */
  channelId?: string | null;

  /**
   * When the member's timeout will expire.
   */
  communicationDisabledUntil?: Date | null;
}

/**
 * Options for banning a user.
 */
export interface BanOptions {
  /**
   * The number of days to delete messages for.
   */
  deleteMessageDays?: number;

  /**
   * The reason for the ban.
   */
  reason?: string;
}
