/**
 * User manager for OvenJS
 * Manages user cache and API interactions
 */

import type { UserManagerOptions, FetchOptions } from '@ovenjs/types';
import type { UserId } from '@ovenjs/types';
import { BaseManager } from './BaseManager.js';
import { User } from '../structures/User.js';

export class UserManager extends BaseManager<UserId, User> {
  constructor(options: UserManagerOptions) {
    super(options);
  }

  /**
   * Fetch a user from the API
   */
  override async fetch(id: UserId, options: FetchOptions = {}): Promise<User> {
    try {
      const userData = await this.client.rest.users.get(id);
      const user = new User({ client: this.client }, userData);
      
      if (options.cache !== false) {
        this.set(id, user);
      }
      
      return user;
    } catch (error) {
      throw new Error(`Failed to fetch user ${id}: ${error}`);
    }
  }

  /**
   * Resolve a user from cache or API
   */
  async resolve(id: UserId, options: FetchOptions = {}): Promise<User> {
    return super.resolve(id, options);
  }

  /**
   * Get the current user (bot)
   */
  async me(): Promise<User> {
    const userData = await this.client.rest.users.getCurrent();
    const user = new User({ client: this.client }, userData);
    
    // Cache the current user
    this.set(user.id as UserId, user);
    
    return user;
  }

  /**
   * Modify the current user
   */
  async modify(data: { username?: string; avatar?: string }): Promise<User> {
    const userData = await this.client.rest.users.modifyCurrent(data);
    const user = new User({ client: this.client }, userData);
    
    // Update cache
    this.set(user.id as UserId, user);
    
    return user;
  }

  /**
   * Get user guilds (for current user)
   */
  async getGuilds(): Promise<any[]> {
    return await this.client.rest.users.getCurrentGuilds();
  }

  /**
   * Leave a guild (for current user)
   */
  async leaveGuild(guildId: string): Promise<void> {
    await this.client.rest.users.leaveGuild(guildId);
  }

  /**
   * Create a DM channel with a user
   */
  async createDM(userId: UserId): Promise<any> {
    return await this.client.rest.users.createDM(userId);
  }

  /**
   * Get user connections (for current user)
   */
  async getConnections(): Promise<any[]> {
    return await this.client.rest.users.getCurrentConnections();
  }

  /**
   * Get user application role connection (for current user)
   */
  async getApplicationRoleConnection(applicationId: string): Promise<any> {
    return await this.client.rest.users.getCurrentApplicationRoleConnection(applicationId);
  }

  /**
   * Update user application role connection (for current user)
   */
  async updateApplicationRoleConnection(applicationId: string, data: any): Promise<any> {
    return await this.client.rest.users.updateCurrentApplicationRoleConnection(applicationId, data);
  }

  /**
   * Bulk resolve users
   */
  async bulkResolve(ids: UserId[], options: FetchOptions = {}): Promise<User[]> {
    const users: User[] = [];
    const toFetch: UserId[] = [];

    // Check cache first
    for (const id of ids) {
      const cached = this.get(id);
      if (cached && !options.force) {
        users.push(cached);
      } else {
        toFetch.push(id);
      }
    }

    // Fetch remaining users
    const fetchPromises = toFetch.map(id => this.fetch(id, options));
    const fetched = await Promise.allSettled(fetchPromises);

    for (const result of fetched) {
      if (result.status === 'fulfilled') {
        users.push(result.value);
      }
    }

    return users;
  }

  /**
   * Search for users by username
   */
  searchByUsername(username: string): User[] {
    return this.filter((user) => 
      user.username.toLowerCase().includes(username.toLowerCase())
    ).toArray();
  }

  /**
   * Search for users by display name
   */
  searchByDisplayName(displayName: string): User[] {
    return this.filter((user) => 
      user.displayName.toLowerCase().includes(displayName.toLowerCase())
    ).toArray();
  }

  /**
   * Get all bot users
   */
  getBots(): User[] {
    return this.filter((user) => user.bot).toArray();
  }

  /**
   * Get all human users
   */
  getHumans(): User[] {
    return this.filter((user) => !user.bot).toArray();
  }

  /**
   * Get users with specific flags
   */
  getUsersWithFlags(flags: number): User[] {
    return this.filter((user) => user.hasFlag(flags)).toArray();
  }

  /**
   * Get users with specific public flags
   */
  getUsersWithPublicFlags(flags: number): User[] {
    return this.filter((user) => user.hasPublicFlag(flags)).toArray();
  }
}