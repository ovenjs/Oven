import { BaseClient } from './BaseClient';
import { MemoryCache } from '../cache/MemoryCache';
import type { CacheAdapter } from '../cache/CacheAdapter';
import type { Bot } from '../Bot';
import type { CacheOptions } from '../types';

/**
 * Client for handling data caching.
 *
 * @remarks
 * This class provides a unified interface for caching Discord objects.
 * It supports different cache backends through the CacheAdapter interface.
 */
export class CacheClient extends BaseClient {
  /**
   * The underlying cache adapter.
   */
  private adapter: CacheAdapter;

  /**
   * The cache options.
   */
  private options: CacheOptions;

  /**
   * Creates a new CacheClient instance.
   *
   * @param bot - The bot instance this client belongs to.
   * @param options - The options for the cache client.
   */
  constructor(bot: Bot, options: CacheOptions = {}) {
    super(bot);

    this.options = {
      guilds: true,
      channels: true,
      users: true,
      members: true,
      roles: true,
      emojis: true,
      voiceStates: true,
      messages: false,
      presences: false,
      ...options,
    };

    // Use the memory cache adapter by default
    this.adapter = new MemoryCache();
  }

  /**
   * Gets a value from the cache.
   *
   * @param key - The key to get.
   * @returns A promise that resolves with the cached value, or null if not found.
   */
  public async get<T = any>(key: string): Promise<T | null> {
    return this.adapter.get(key);
  }

  /**
   * Sets a value in the cache.
   *
   * @param key - The key to set.
   * @param value - The value to set.
   * @param ttl - The time-to-live in milliseconds.
   * @returns A promise that resolves when the value is set.
   */
  public async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    return this.adapter.set(key, value, ttl);
  }

  /**
   * Deletes a value from the cache.
   *
   * @param key - The key to delete.
   * @returns A promise that resolves when the value is deleted.
   */
  public async delete(key: string): Promise<void> {
    return this.adapter.delete(key);
  }

  /**
   * Checks if a key exists in the cache.
   *
   * @param key - The key to check.
   * @returns A promise that resolves with true if the key exists, false otherwise.
   */
  public async has(key: string): Promise<boolean> {
    return this.adapter.has(key);
  }

  /**
   * Clears all values from the cache.
   *
   * @returns A promise that resolves when the cache is cleared.
   */
  public async clear(): Promise<void> {
    return this.adapter.clear();
  }

  /**
   * Gets a guild from the cache.
   *
   * @param id - The guild ID.
   * @returns A promise that resolves with the guild, or null if not found.
   */
  public async getGuild(id: string): Promise<any | null> {
    if (!this.options.guilds) return null;
    return this.get(`guild:${id}`);
  }

  /**
   * Sets a guild in the cache.
   *
   * @param guild - The guild to cache.
   * @returns A promise that resolves when the guild is cached.
   */
  public async setGuild(guild: any): Promise<void> {
    if (!this.options.guilds) return;
    return this.set(`guild:${guild.id}`, guild, this.options.ttl);
  }

  /**
   * Deletes a guild from the cache.
   *
   * @param id - The guild ID.
   * @returns A promise that resolves when the guild is deleted.
   */
  public async deleteGuild(id: string): Promise<void> {
    return this.delete(`guild:${id}`);
  }

  /**
   * Gets a channel from the cache.
   *
   * @param id - The channel ID.
   * @returns A promise that resolves with the channel, or null if not found.
   */
  public async getChannel(id: string): Promise<any | null> {
    if (!this.options.channels) return null;
    return this.get(`channel:${id}`);
  }

  /**
   * Sets a channel in the cache.
   *
   * @param channel - The channel to cache.
   * @returns A promise that resolves when the channel is cached.
   */
  public async setChannel(channel: any): Promise<void> {
    if (!this.options.channels) return;
    return this.set(`channel:${channel.id}`, channel, this.options.ttl);
  }

  /**
   * Deletes a channel from the cache.
   *
   * @param id - The channel ID.
   * @returns A promise that resolves when the channel is deleted.
   */
  public async deleteChannel(id: string): Promise<void> {
    return this.delete(`channel:${id}`);
  }

  /**
   * Gets a user from the cache.
   *
   * @param id - The user ID.
   * @returns A promise that resolves with the user, or null if not found.
   */
  public async getUser(id: string): Promise<any | null> {
    if (!this.options.users) return null;
    return this.get(`user:${id}`);
  }

  /**
   * Sets a user in the cache.
   *
   * @param user - The user to cache.
   * @returns A promise that resolves when the user is cached.
   */
  public async setUser(user: any): Promise<void> {
    if (!this.options.users) return;
    return this.set(`user:${user.id}`, user, this.options.ttl);
  }

  /**
   * Deletes a user from the cache.
   *
   * @param id - The user ID.
   * @returns A promise that resolves when the user is deleted.
   */
  public async deleteUser(id: string): Promise<void> {
    return this.delete(`user:${id}`);
  }

  /**
   * Gets a guild member from the cache.
   *
   * @param guildId - The guild ID.
   * @param userId - The user ID.
   * @returns A promise that resolves with the guild member, or null if not found.
   */
  public async getMember(guildId: string, userId: string): Promise<any | null> {
    if (!this.options.members) return null;
    return this.get(`member:${guildId}:${userId}`);
  }

  /**
   * Sets a guild member in the cache.
   *
   * @param member - The guild member to cache.
   * @returns A promise that resolves when the guild member is cached.
   */
  public async setMember(member: any): Promise<void> {
    if (!this.options.members) return;
    return this.set(
      `member:${member.guild.id}:${member.user.id}`,
      member,
      this.options.ttl
    );
  }

  /**
   * Deletes a guild member from the cache.
   *
   * @param guildId - The guild ID.
   * @param userId - The user ID.
   * @returns A promise that resolves when the guild member is deleted.
   */
  public async deleteMember(guildId: string, userId: string): Promise<void> {
    return this.delete(`member:${guildId}:${userId}`);
  }

  /**
   * Gets a role from the cache.
   *
   * @param id - The role ID.
   * @returns A promise that resolves with the role, or null if not found.
   */
  public async getRole(id: string): Promise<any | null> {
    if (!this.options.roles) return null;
    return this.get(`role:${id}`);
  }

  /**
   * Sets a role in the cache.
   *
   * @param role - The role to cache.
   * @returns A promise that resolves when the role is cached.
   */
  public async setRole(role: any): Promise<void> {
    if (!this.options.roles) return;
    return this.set(`role:${role.id}`, role, this.options.ttl);
  }

  /**
   * Deletes a role from the cache.
   *
   * @param id - The role ID.
   * @returns A promise that resolves when the role is deleted.
   */
  public async deleteRole(id: string): Promise<void> {
    return this.delete(`role:${id}`);
  }

  /**
   * Gets an emoji from the cache.
   *
   * @param id - The emoji ID.
   * @returns A promise that resolves with the emoji, or null if not found.
   */
  public async getEmoji(id: string): Promise<any | null> {
    if (!this.options.emojis) return null;
    return this.get(`emoji:${id}`);
  }

  /**
   * Sets an emoji in the cache.
   *
   * @param emoji - The emoji to cache.
   * @returns A promise that resolves when the emoji is cached.
   */
  public async setEmoji(emoji: any): Promise<void> {
    if (!this.options.emojis) return;
    return this.set(`emoji:${emoji.id}`, emoji, this.options.ttl);
  }

  /**
   * Deletes an emoji from the cache.
   *
   * @param id - The emoji ID.
   * @returns A promise that resolves when the emoji is deleted.
   */
  public async deleteEmoji(id: string): Promise<void> {
    return this.delete(`emoji:${id}`);
  }
}
