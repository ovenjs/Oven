/**
 * Guild-related API routes
 * Handles all guild operations like fetching, creating, updating guilds
 */
import { BaseRoute } from './BaseRoute.js';
/**
 * Guild API routes implementation
 */
export class GuildRoutes extends BaseRoute {
    /**
     * Get a guild by ID
     */
    getGuild(guildId, withCounts = false) {
        this.validateSnowflake(guildId, 'Guild ID');
        const query = withCounts ? '?with_counts=true' : '';
        return this.createRequestOptions('GET', `/guilds/${guildId}${query}`);
    }
    /**
     * Get guild preview
     */
    getGuildPreview(guildId) {
        this.validateSnowflake(guildId, 'Guild ID');
        return this.createRequestOptions('GET', `/guilds/${guildId}/preview`);
    }
    /**
     * Create a new guild
     */
    createGuild(options) {
        this.validateRequired(options.name, 'Guild name');
        if (options.name.length < 2 || options.name.length > 100) {
            throw new Error('Guild name must be between 2 and 100 characters');
        }
        return this.createRequestOptions('POST', '/guilds', {
            body: options,
        });
    }
    /**
     * Modify a guild
     */
    editGuild(guildId, options, reason) {
        this.validateSnowflake(guildId, 'Guild ID');
        return this.createRequestOptions('PATCH', `/guilds/${guildId}`, {
            body: options,
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Delete a guild
     */
    deleteGuild(guildId) {
        this.validateSnowflake(guildId, 'Guild ID');
        return this.createRequestOptions('DELETE', `/guilds/${guildId}`);
    }
    /**
     * Get guild channels
     */
    getGuildChannels(guildId) {
        this.validateSnowflake(guildId, 'Guild ID');
        return this.createRequestOptions('GET', `/guilds/${guildId}/channels`);
    }
    /**
     * Create guild channel
     */
    createGuildChannel(guildId, options, reason) {
        this.validateSnowflake(guildId, 'Guild ID');
        this.validateRequired(options.name, 'Channel name');
        return this.createRequestOptions('POST', `/guilds/${guildId}/channels`, {
            body: options,
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Modify guild channel positions
     */
    modifyGuildChannelPositions(guildId, positions) {
        this.validateSnowflake(guildId, 'Guild ID');
        // Validate position data
        for (const pos of positions) {
            this.validateSnowflake(pos.id, 'Channel ID');
            if (pos.parent_id) {
                this.validateSnowflake(pos.parent_id, 'Parent ID');
            }
        }
        return this.createRequestOptions('PATCH', `/guilds/${guildId}/channels`, {
            body: positions,
        });
    }
    /**
     * Get guild member
     */
    getGuildMember(guildId, userId) {
        this.validateSnowflake(guildId, 'Guild ID');
        this.validateSnowflake(userId, 'User ID');
        return this.createRequestOptions('GET', `/guilds/${guildId}/members/${userId}`);
    }
    /**
     * List guild members
     */
    listGuildMembers(guildId, options = {}) {
        this.validateSnowflake(guildId, 'Guild ID');
        const { limit = 1, after } = options;
        if (limit < 1 || limit > 1000) {
            throw new Error('Limit must be between 1 and 1000');
        }
        if (after) {
            this.validateSnowflake(after, 'After ID');
        }
        const query = this.buildQuery({ limit, after });
        return this.createRequestOptions('GET', `/guilds/${guildId}/members${query}`);
    }
    /**
     * Search guild members
     */
    searchGuildMembers(guildId, query, limit = 1) {
        this.validateSnowflake(guildId, 'Guild ID');
        this.validateRequired(query, 'Search query');
        if (limit < 1 || limit > 1000) {
            throw new Error('Limit must be between 1 and 1000');
        }
        const queryString = this.buildQuery({ query, limit });
        return this.createRequestOptions('GET', `/guilds/${guildId}/members/search${queryString}`);
    }
    /**
     * Add guild member
     */
    addGuildMember(guildId, userId, options) {
        this.validateSnowflake(guildId, 'Guild ID');
        this.validateSnowflake(userId, 'User ID');
        this.validateRequired(options.access_token, 'Access token');
        return this.createRequestOptions('PUT', `/guilds/${guildId}/members/${userId}`, {
            body: options,
        });
    }
    /**
     * Modify guild member
     */
    modifyGuildMember(guildId, userId, options, reason) {
        this.validateSnowflake(guildId, 'Guild ID');
        this.validateSnowflake(userId, 'User ID');
        if (options.channel_id) {
            this.validateSnowflake(options.channel_id, 'Channel ID');
        }
        if (options.roles) {
            options.roles.forEach(roleId => this.validateSnowflake(roleId, 'Role ID'));
        }
        return this.createRequestOptions('PATCH', `/guilds/${guildId}/members/${userId}`, {
            body: options,
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Modify current member (bot)
     */
    modifyCurrentMember(guildId, options, reason) {
        this.validateSnowflake(guildId, 'Guild ID');
        return this.createRequestOptions('PATCH', `/guilds/${guildId}/members/@me`, {
            body: options,
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Add member role
     */
    addMemberRole(guildId, userId, roleId, reason) {
        this.validateSnowflake(guildId, 'Guild ID');
        this.validateSnowflake(userId, 'User ID');
        this.validateSnowflake(roleId, 'Role ID');
        return this.createRequestOptions('PUT', `/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Remove member role
     */
    removeMemberRole(guildId, userId, roleId, reason) {
        this.validateSnowflake(guildId, 'Guild ID');
        this.validateSnowflake(userId, 'User ID');
        this.validateSnowflake(roleId, 'Role ID');
        return this.createRequestOptions('DELETE', `/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Remove guild member (kick)
     */
    removeGuildMember(guildId, userId, reason) {
        this.validateSnowflake(guildId, 'Guild ID');
        this.validateSnowflake(userId, 'User ID');
        return this.createRequestOptions('DELETE', `/guilds/${guildId}/members/${userId}`, {
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Get guild bans
     */
    getGuildBans(guildId, options = {}) {
        this.validateSnowflake(guildId, 'Guild ID');
        const { limit, before, after } = options;
        if (limit && (limit < 1 || limit > 1000)) {
            throw new Error('Limit must be between 1 and 1000');
        }
        if (before)
            this.validateSnowflake(before, 'Before ID');
        if (after)
            this.validateSnowflake(after, 'After ID');
        const query = this.buildQuery({ limit, before, after });
        return this.createRequestOptions('GET', `/guilds/${guildId}/bans${query}`);
    }
    /**
     * Get guild ban
     */
    getGuildBan(guildId, userId) {
        this.validateSnowflake(guildId, 'Guild ID');
        this.validateSnowflake(userId, 'User ID');
        return this.createRequestOptions('GET', `/guilds/${guildId}/bans/${userId}`);
    }
    /**
     * Create guild ban
     */
    createGuildBan(guildId, userId, options = {}, reason) {
        this.validateSnowflake(guildId, 'Guild ID');
        this.validateSnowflake(userId, 'User ID');
        const { delete_message_days, delete_message_seconds } = options;
        if (delete_message_days && (delete_message_days < 0 || delete_message_days > 7)) {
            throw new Error('delete_message_days must be between 0 and 7');
        }
        if (delete_message_seconds && (delete_message_seconds < 0 || delete_message_seconds > 604800)) {
            throw new Error('delete_message_seconds must be between 0 and 604800 (7 days)');
        }
        return this.createRequestOptions('PUT', `/guilds/${guildId}/bans/${userId}`, {
            body: options,
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Remove guild ban
     */
    removeGuildBan(guildId, userId, reason) {
        this.validateSnowflake(guildId, 'Guild ID');
        this.validateSnowflake(userId, 'User ID');
        return this.createRequestOptions('DELETE', `/guilds/${guildId}/bans/${userId}`, {
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Get guild roles
     */
    getGuildRoles(guildId) {
        this.validateSnowflake(guildId, 'Guild ID');
        return this.createRequestOptions('GET', `/guilds/${guildId}/roles`);
    }
    /**
     * Create guild role
     */
    createGuildRole(guildId, options = {}, reason) {
        this.validateSnowflake(guildId, 'Guild ID');
        return this.createRequestOptions('POST', `/guilds/${guildId}/roles`, {
            body: options,
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Modify guild role positions
     */
    modifyGuildRolePositions(guildId, positions) {
        this.validateSnowflake(guildId, 'Guild ID');
        for (const pos of positions) {
            this.validateSnowflake(pos.id, 'Role ID');
        }
        return this.createRequestOptions('PATCH', `/guilds/${guildId}/roles`, {
            body: positions,
        });
    }
    /**
     * Modify guild role
     */
    modifyGuildRole(guildId, roleId, options, reason) {
        this.validateSnowflake(guildId, 'Guild ID');
        this.validateSnowflake(roleId, 'Role ID');
        return this.createRequestOptions('PATCH', `/guilds/${guildId}/roles/${roleId}`, {
            body: options,
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Delete guild role
     */
    deleteGuildRole(guildId, roleId, reason) {
        this.validateSnowflake(guildId, 'Guild ID');
        this.validateSnowflake(roleId, 'Role ID');
        return this.createRequestOptions('DELETE', `/guilds/${guildId}/roles/${roleId}`, {
            reason: this.sanitizeReason(reason),
        });
    }
}
//# sourceMappingURL=GuildRoutes.js.map