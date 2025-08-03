import { BaseManager } from './BaseManager';
import type { Bot } from '../Bot';

/**
 * Manager for role-related operations.
 *
 * @remarks
 * This class provides methods for managing Discord roles.
 */
export class RoleManager extends BaseManager {
  /**
   * Creates a new RoleManager instance.
   *
   * @param bot - The bot instance this manager belongs to.
   */
  constructor(bot: Bot) {
    super(bot);
  }

  /**
   * Fetches a role by its ID.
   *
   * @param guildId - The guild ID.
   * @param roleId - The role ID.
   * @param force - Whether to force a fetch from the API, bypassing the cache.
   * @returns A promise that resolves with the role.
   */
  public async fetch(guildId: string, roleId: string, force = false): Promise<any> {
    // Try to get from cache first if not forcing
    if (!force) {
      const cached = await this.cache.getRole(roleId);
      if (cached) {
        return cached;
      }
    }

    // Fetch from API
    const role = await this.rest.get(`/guilds/${guildId}/roles/${roleId}`);
    
    // Cache the role
    await this.cache.setRole(role);
    
    return role;
  }

  /**
   * Creates a new role in a guild.
   *
   * @param guildId - The guild ID.
   * @param options - The options for creating the role.
   * @returns A promise that resolves with the created role.
   */
  public async create(guildId: string, options: RoleCreateOptions): Promise<any> {
    const role = await this.rest.post(`/guilds/${guildId}/roles`, { data: options });
    
    // Cache the role
    await this.cache.setRole(role);
    
    return role;
  }

  /**
   * Edits a role.
   *
   * @param guildId - The guild ID.
   * @param roleId - The role ID.
   * @param options - The options for editing the role.
   * @returns A promise that resolves with the edited role.
   */
  public async edit(guildId: string, roleId: string, options: RoleEditOptions): Promise<any> {
    const role = await this.rest.patch(`/guilds/${guildId}/roles/${roleId}`, { data: options });
    
    // Update the cache
    await this.cache.setRole(role);
    
    return role;
  }

  /**
   * Deletes a role.
   *
   * @param guildId - The guild ID.
   * @param roleId - The role ID.
   * @param reason - The reason for deleting the role.
   * @returns A promise that resolves when the role is deleted.
   */
  public async delete(guildId: string, roleId: string, reason?: string): Promise<void> {
    const options: any = {};
    if (reason) {
      options.headers = { 'X-Audit-Log-Reason': reason };
    }
    
    await this.rest.delete(`/guilds/${guildId}/roles/${roleId}`, options);
    
    // Remove from cache
    await this.cache.deleteRole(roleId);
  }

  /**
   * Fetches all roles in a guild.
   *
   * @param guildId - The guild ID.
   * @param force - Whether to force a fetch from the API, bypassing the cache.
   * @returns A promise that resolves with an array of roles.
   */
  public async fetchAll(guildId: string, force = false): Promise<any[]> {
    // Try to get from cache first if not forcing
    if (!force) {
      // Note: This is a simplified approach. In a real implementation,
      // we would need to track which roles belong to which guild.
    }

    // Fetch from API
    const roles = await this.rest.get(`/guilds/${guildId}/roles`);
    
    // Cache the roles
    for (const role of roles) {
      await this.cache.setRole(role);
    }
    
    return roles;
  }

  /**
   * Adds a role to a guild member.
   *
   * @param guildId - The guild ID.
   * @param userId - The user ID.
   * @param roleId - The role ID.
   * @param reason - The reason for adding the role.
   * @returns A promise that resolves when the role is added.
   */
  public async addRole(guildId: string, userId: string, roleId: string, reason?: string): Promise<void> {
    const options: any = {};
    if (reason) {
      options.headers = { 'X-Audit-Log-Reason': reason };
    }
    
    await this.rest.put(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, options);
  }

  /**
   * Removes a role from a guild member.
   *
   * @param guildId - The guild ID.
   * @param userId - The user ID.
   * @param roleId - The role ID.
   * @param reason - The reason for removing the role.
   * @returns A promise that resolves when the role is removed.
   */
  public async removeRole(guildId: string, userId: string, roleId: string, reason?: string): Promise<void> {
    const options: any = {};
    if (reason) {
      options.headers = { 'X-Audit-Log-Reason': reason };
    }
    
    await this.rest.delete(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, options);
  }

  /**
   * Gets a role from the cache.
   *
   * @param id - The role ID.
   * @returns A promise that resolves with the role, or null if not found.
   */
  public async getFromCache(id: string): Promise<any | null> {
    return this.cache.getRole(id);
  }

  /**
   * Adds a role to the cache.
   *
   * @param role - The role to cache.
   * @returns A promise that resolves when the role is cached.
   */
  public async addToCache(role: any): Promise<void> {
    return this.cache.setRole(role);
  }

  /**
   * Removes a role from the cache.
   *
   * @param id - The role ID.
   * @returns A promise that resolves when the role is removed from the cache.
   */
  public async removeFromCache(id: string): Promise<void> {
    return this.cache.deleteRole(id);
  }
}

/**
 * Options for creating a role.
 */
export interface RoleCreateOptions {
  /**
   * The name of the role.
   */
  name?: string;

  /**
   * The color of the role.
   */
  color?: number;

  /**
   * Whether the role is hoisted.
   */
  hoist?: boolean;

  /**
   * Whether the role is mentionable.
   */
  mentionable?: boolean;

  /**
   * The permissions of the role.
   */
  permissions?: string;

  /**
   * The icon of the role.
   */
  icon?: string;

  /**
   * The unicode emoji of the role.
   */
  unicodeEmoji?: string;
}

/**
 * Options for editing a role.
 */
export interface RoleEditOptions {
  /**
   * The name of the role.
   */
  name?: string;

  /**
   * The color of the role.
   */
  color?: number | null;

  /**
   * Whether the role is hoisted.
   */
  hoist?: boolean;

  /**
   * Whether the role is mentionable.
   */
  mentionable?: boolean;

  /**
   * The permissions of the role.
   */
  permissions?: string | null;

  /**
   * The icon of the role.
   */
  icon?: string | null;

  /**
   * The unicode emoji of the role.
   */
  unicodeEmoji?: string | null;
}