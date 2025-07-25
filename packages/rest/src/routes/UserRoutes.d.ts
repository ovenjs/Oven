/**
 * User-related API routes
 * Handles user operations and DM channels
 */
import { BaseRoute } from './BaseRoute.js';
import type { RequestOptions } from '@ovenjs/types';
/**
 * User API routes implementation
 */
export declare class UserRoutes extends BaseRoute {
    /**
     * Get current user (bot)
     */
    getCurrentUser(): RequestOptions;
    /**
     * Get user by ID
     */
    getUser(userId: string): RequestOptions;
    /**
     * Modify current user
     */
    modifyCurrentUser(options: {
        username?: string;
        avatar?: string | null;
    }): RequestOptions;
    /**
     * Get current user guilds
     */
    getCurrentUserGuilds(options?: {
        before?: string;
        after?: string;
        limit?: number;
        with_counts?: boolean;
    }): RequestOptions;
    /**
     * Get current user guild member
     */
    getCurrentUserGuildMember(guildId: string): RequestOptions;
    /**
     * Leave guild
     */
    leaveGuild(guildId: string): RequestOptions;
    /**
     * Create DM channel
     */
    createDM(recipientId: string): RequestOptions;
    /**
     * Create group DM
     */
    createGroupDM(accessTokens: string[], nicks: Record<string, string>): RequestOptions;
    /**
     * Get user connections (OAuth2)
     */
    getUserConnections(): RequestOptions;
    /**
     * Get user application role connection
     */
    getUserApplicationRoleConnection(applicationId: string): RequestOptions;
    /**
     * Update user application role connection
     */
    updateUserApplicationRoleConnection(applicationId: string, options: {
        platform_name?: string;
        platform_username?: string;
        metadata?: Record<string, string | number>;
    }): RequestOptions;
}
//# sourceMappingURL=UserRoutes.d.ts.map