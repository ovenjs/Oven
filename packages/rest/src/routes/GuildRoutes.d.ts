/**
 * Guild-related API routes
 * Handles all guild operations like fetching, creating, updating guilds
 */
import { BaseRoute } from './BaseRoute.js';
import type { RequestOptions, GuildCreateOptions, GuildEditOptions } from '@ovenjs/types';
/**
 * Guild API routes implementation
 */
export declare class GuildRoutes extends BaseRoute {
    /**
     * Get a guild by ID
     */
    getGuild(guildId: string, withCounts?: boolean): RequestOptions;
    /**
     * Get guild preview
     */
    getGuildPreview(guildId: string): RequestOptions;
    /**
     * Create a new guild
     */
    createGuild(options: GuildCreateOptions): RequestOptions;
    /**
     * Modify a guild
     */
    editGuild(guildId: string, options: GuildEditOptions, reason?: string): RequestOptions;
    /**
     * Delete a guild
     */
    deleteGuild(guildId: string): RequestOptions;
    /**
     * Get guild channels
     */
    getGuildChannels(guildId: string): RequestOptions;
    /**
     * Create guild channel
     */
    createGuildChannel(guildId: string, options: any, reason?: string): RequestOptions;
    /**
     * Modify guild channel positions
     */
    modifyGuildChannelPositions(guildId: string, positions: Array<{
        id: string;
        position?: number;
        lock_permissions?: boolean;
        parent_id?: string | null;
    }>): RequestOptions;
    /**
     * Get guild member
     */
    getGuildMember(guildId: string, userId: string): RequestOptions;
    /**
     * List guild members
     */
    listGuildMembers(guildId: string, options?: {
        limit?: number;
        after?: string;
    }): RequestOptions;
    /**
     * Search guild members
     */
    searchGuildMembers(guildId: string, query: string, limit?: number): RequestOptions;
    /**
     * Add guild member
     */
    addGuildMember(guildId: string, userId: string, options: {
        access_token: string;
        nick?: string;
        roles?: string[];
        mute?: boolean;
        deaf?: boolean;
    }): RequestOptions;
    /**
     * Modify guild member
     */
    modifyGuildMember(guildId: string, userId: string, options: {
        nick?: string | null;
        roles?: string[];
        mute?: boolean;
        deaf?: boolean;
        channel_id?: string | null;
        communication_disabled_until?: string | null;
    }, reason?: string): RequestOptions;
    /**
     * Modify current member (bot)
     */
    modifyCurrentMember(guildId: string, options: {
        nick?: string | null;
    }, reason?: string): RequestOptions;
    /**
     * Add member role
     */
    addMemberRole(guildId: string, userId: string, roleId: string, reason?: string): RequestOptions;
    /**
     * Remove member role
     */
    removeMemberRole(guildId: string, userId: string, roleId: string, reason?: string): RequestOptions;
    /**
     * Remove guild member (kick)
     */
    removeGuildMember(guildId: string, userId: string, reason?: string): RequestOptions;
    /**
     * Get guild bans
     */
    getGuildBans(guildId: string, options?: {
        limit?: number;
        before?: string;
        after?: string;
    }): RequestOptions;
    /**
     * Get guild ban
     */
    getGuildBan(guildId: string, userId: string): RequestOptions;
    /**
     * Create guild ban
     */
    createGuildBan(guildId: string, userId: string, options?: {
        delete_message_days?: number;
        delete_message_seconds?: number;
    }, reason?: string): RequestOptions;
    /**
     * Remove guild ban
     */
    removeGuildBan(guildId: string, userId: string, reason?: string): RequestOptions;
    /**
     * Get guild roles
     */
    getGuildRoles(guildId: string): RequestOptions;
    /**
     * Create guild role
     */
    createGuildRole(guildId: string, options?: {
        name?: string;
        permissions?: string;
        color?: number;
        hoist?: boolean;
        icon?: string | null;
        unicode_emoji?: string | null;
        mentionable?: boolean;
    }, reason?: string): RequestOptions;
    /**
     * Modify guild role positions
     */
    modifyGuildRolePositions(guildId: string, positions: Array<{
        id: string;
        position?: number | null;
    }>): RequestOptions;
    /**
     * Modify guild role
     */
    modifyGuildRole(guildId: string, roleId: string, options: {
        name?: string | null;
        permissions?: string | null;
        color?: number | null;
        hoist?: boolean | null;
        icon?: string | null;
        unicode_emoji?: string | null;
        mentionable?: boolean | null;
    }, reason?: string): RequestOptions;
    /**
     * Delete guild role
     */
    deleteGuildRole(guildId: string, roleId: string, reason?: string): RequestOptions;
}
//# sourceMappingURL=GuildRoutes.d.ts.map