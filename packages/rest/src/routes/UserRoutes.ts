/**
 * User-related API routes
 * Handles user operations and DM channels
 */

import { BaseRoute } from './BaseRoute.js';
import type { RequestOptions, User } from '@ovenjs/types';

/**
 * User API routes implementation
 */
export class UserRoutes extends BaseRoute {
  /**
   * Get current user (bot)
   */
  getCurrentUser(): RequestOptions {
    return this.createRequestOptions('GET', '/users/@me');
  }

  /**
   * Get user by ID
   */
  getUser(userId: string): RequestOptions {
    this.validateSnowflake(userId, 'User ID');
    
    return this.createRequestOptions('GET', `/users/${userId}`);
  }

  /**
   * Modify current user
   */
  modifyCurrentUser(options: {
    username?: string;
    avatar?: string | null;
  }): RequestOptions {
    if (options.username) {
      if (options.username.length < 2 || options.username.length > 32) {
        throw new Error('Username must be between 2 and 32 characters');
      }

      // Basic validation for username format
      if (!/^[a-zA-Z0-9_.]+$/.test(options.username)) {
        throw new Error('Username can only contain alphanumeric characters, periods, and underscores');
      }
    }

    return this.createRequestOptions('PATCH', '/users/@me', {
      body: options,
    });
  }

  /**
   * Get current user guilds
   */
  getCurrentUserGuilds(options: {
    before?: string;
    after?: string;
    limit?: number;
    with_counts?: boolean;
  } = {}): RequestOptions {
    const { before, after, limit = 200, with_counts = false } = options;

    if (limit < 1 || limit > 200) {
      throw new Error('Limit must be between 1 and 200');
    }

    if (before) this.validateSnowflake(before, 'Before ID');
    if (after) this.validateSnowflake(after, 'After ID');

    const query = this.buildQuery({ before, after, limit, with_counts });
    
    return this.createRequestOptions('GET', `/users/@me/guilds${query}`);
  }

  /**
   * Get current user guild member
   */
  getCurrentUserGuildMember(guildId: string): RequestOptions {
    this.validateSnowflake(guildId, 'Guild ID');
    
    return this.createRequestOptions('GET', `/users/@me/guilds/${guildId}/member`);
  }

  /**
   * Leave guild
   */
  leaveGuild(guildId: string): RequestOptions {
    this.validateSnowflake(guildId, 'Guild ID');
    
    return this.createRequestOptions('DELETE', `/users/@me/guilds/${guildId}`);
  }

  /**
   * Create DM channel
   */
  createDM(recipientId: string): RequestOptions {
    this.validateSnowflake(recipientId, 'Recipient ID');
    
    return this.createRequestOptions('POST', '/users/@me/channels', {
      body: { recipient_id: recipientId },
    });
  }

  /**
   * Create group DM
   */
  createGroupDM(accessTokens: string[], nicks: Record<string, string>): RequestOptions {
    if (accessTokens.length < 1) {
      throw new Error('At least one access token is required');
    }

    if (accessTokens.length > 10) {
      throw new Error('Group DMs can have at most 10 participants');
    }

    return this.createRequestOptions('POST', '/users/@me/channels', {
      body: {
        access_tokens: accessTokens,
        nicks,
      },
    });
  }

  /**
   * Get user connections (OAuth2)
   */
  getUserConnections(): RequestOptions {
    return this.createRequestOptions('GET', '/users/@me/connections');
  }

  /**
   * Get user application role connection
   */
  getUserApplicationRoleConnection(applicationId: string): RequestOptions {
    this.validateSnowflake(applicationId, 'Application ID');
    
    return this.createRequestOptions('GET', `/users/@me/applications/${applicationId}/role-connection`);
  }

  /**
   * Update user application role connection
   */
  updateUserApplicationRoleConnection(applicationId: string, options: {
    platform_name?: string;
    platform_username?: string;
    metadata?: Record<string, string | number>;
  }): RequestOptions {
    this.validateSnowflake(applicationId, 'Application ID');

    if (options.platform_name && options.platform_name.length > 50) {
      throw new Error('Platform name must be 50 characters or less');
    }

    if (options.platform_username && options.platform_username.length > 100) {
      throw new Error('Platform username must be 100 characters or less');
    }

    return this.createRequestOptions('PUT', `/users/@me/applications/${applicationId}/role-connection`, {
      body: options,
    });
  }
}