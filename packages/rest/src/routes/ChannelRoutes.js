/**
 * Channel-related API routes
 * Handles all channel operations like messages, invites, permissions
 */
import { BaseRoute } from './BaseRoute.js';
/**
 * Channel API routes implementation
 */
export class ChannelRoutes extends BaseRoute {
    /**
     * Get a channel by ID
     */
    getChannel(channelId) {
        this.validateSnowflake(channelId, 'Channel ID');
        return this.createRequestOptions('GET', `/channels/${channelId}`);
    }
    /**
     * Modify a channel
     */
    modifyChannel(channelId, options, reason) {
        this.validateSnowflake(channelId, 'Channel ID');
        return this.createRequestOptions('PATCH', `/channels/${channelId}`, {
            body: options,
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Delete a channel
     */
    deleteChannel(channelId, reason) {
        this.validateSnowflake(channelId, 'Channel ID');
        return this.createRequestOptions('DELETE', `/channels/${channelId}`, {
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Get channel messages
     */
    getChannelMessages(channelId, options = {}) {
        this.validateSnowflake(channelId, 'Channel ID');
        const { around, before, after, limit = 50 } = options;
        if (limit < 1 || limit > 100) {
            throw new Error('Limit must be between 1 and 100');
        }
        if (around)
            this.validateSnowflake(around, 'Around ID');
        if (before)
            this.validateSnowflake(before, 'Before ID');
        if (after)
            this.validateSnowflake(after, 'After ID');
        // Only one of around, before, or after can be specified
        const queryParams = [around, before, after].filter(Boolean);
        if (queryParams.length > 1) {
            throw new Error('Only one of around, before, or after can be specified');
        }
        const query = this.buildQuery({ around, before, after, limit });
        return this.createRequestOptions('GET', `/channels/${channelId}/messages${query}`);
    }
    /**
     * Get a channel message
     */
    getChannelMessage(channelId, messageId) {
        this.validateSnowflake(channelId, 'Channel ID');
        this.validateSnowflake(messageId, 'Message ID');
        return this.createRequestOptions('GET', `/channels/${channelId}/messages/${messageId}`);
    }
    /**
     * Create a channel message
     */
    createMessage(channelId, options) {
        this.validateSnowflake(channelId, 'Channel ID');
        // Validate message content
        if (!options.content && !options.embeds?.length && !options.files?.length && !options.sticker_ids?.length) {
            throw new Error('Messages must have content, embeds, files, or stickers');
        }
        if (options.content && options.content.length > 2000) {
            throw new Error('Message content must be 2000 characters or less');
        }
        if (options.embeds && options.embeds.length > 10) {
            throw new Error('Messages can have at most 10 embeds');
        }
        return this.createRequestOptions('POST', `/channels/${channelId}/messages`, {
            body: options,
            files: options.files,
        });
    }
    /**
     * Crosspost a message (publish in announcement channel)
     */
    crosspostMessage(channelId, messageId) {
        this.validateSnowflake(channelId, 'Channel ID');
        this.validateSnowflake(messageId, 'Message ID');
        return this.createRequestOptions('POST', `/channels/${channelId}/messages/${messageId}/crosspost`);
    }
    /**
     * Create reaction on message
     */
    createReaction(channelId, messageId, emoji) {
        this.validateSnowflake(channelId, 'Channel ID');
        this.validateSnowflake(messageId, 'Message ID');
        this.validateRequired(emoji, 'Emoji');
        // URL encode the emoji
        const encodedEmoji = encodeURIComponent(emoji);
        return this.createRequestOptions('PUT', `/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/@me`);
    }
    /**
     * Delete own reaction
     */
    deleteOwnReaction(channelId, messageId, emoji) {
        this.validateSnowflake(channelId, 'Channel ID');
        this.validateSnowflake(messageId, 'Message ID');
        this.validateRequired(emoji, 'Emoji');
        const encodedEmoji = encodeURIComponent(emoji);
        return this.createRequestOptions('DELETE', `/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/@me`);
    }
    /**
     * Delete user reaction
     */
    deleteUserReaction(channelId, messageId, emoji, userId) {
        this.validateSnowflake(channelId, 'Channel ID');
        this.validateSnowflake(messageId, 'Message ID');
        this.validateSnowflake(userId, 'User ID');
        this.validateRequired(emoji, 'Emoji');
        const encodedEmoji = encodeURIComponent(emoji);
        return this.createRequestOptions('DELETE', `/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/${userId}`);
    }
    /**
     * Get reactions for message
     */
    getReactions(channelId, messageId, emoji, options = {}) {
        this.validateSnowflake(channelId, 'Channel ID');
        this.validateSnowflake(messageId, 'Message ID');
        this.validateRequired(emoji, 'Emoji');
        const { after, limit = 25 } = options;
        if (limit < 1 || limit > 100) {
            throw new Error('Limit must be between 1 and 100');
        }
        if (after)
            this.validateSnowflake(after, 'After ID');
        const encodedEmoji = encodeURIComponent(emoji);
        const query = this.buildQuery({ after, limit });
        return this.createRequestOptions('GET', `/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}${query}`);
    }
    /**
     * Delete all reactions from message
     */
    deleteAllReactions(channelId, messageId) {
        this.validateSnowflake(channelId, 'Channel ID');
        this.validateSnowflake(messageId, 'Message ID');
        return this.createRequestOptions('DELETE', `/channels/${channelId}/messages/${messageId}/reactions`);
    }
    /**
     * Delete all reactions for specific emoji
     */
    deleteAllReactionsForEmoji(channelId, messageId, emoji) {
        this.validateSnowflake(channelId, 'Channel ID');
        this.validateSnowflake(messageId, 'Message ID');
        this.validateRequired(emoji, 'Emoji');
        const encodedEmoji = encodeURIComponent(emoji);
        return this.createRequestOptions('DELETE', `/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}`);
    }
    /**
     * Edit a message
     */
    editMessage(channelId, messageId, options) {
        this.validateSnowflake(channelId, 'Channel ID');
        this.validateSnowflake(messageId, 'Message ID');
        if (options.content && options.content.length > 2000) {
            throw new Error('Message content must be 2000 characters or less');
        }
        if (options.embeds && options.embeds.length > 10) {
            throw new Error('Messages can have at most 10 embeds');
        }
        return this.createRequestOptions('PATCH', `/channels/${channelId}/messages/${messageId}`, {
            body: options,
            files: options.files,
        });
    }
    /**
     * Delete a message
     */
    deleteMessage(channelId, messageId, reason) {
        this.validateSnowflake(channelId, 'Channel ID');
        this.validateSnowflake(messageId, 'Message ID');
        return this.createRequestOptions('DELETE', `/channels/${channelId}/messages/${messageId}`, {
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Bulk delete messages
     */
    bulkDeleteMessages(channelId, messageIds, reason) {
        this.validateSnowflake(channelId, 'Channel ID');
        if (messageIds.length < 2 || messageIds.length > 100) {
            throw new Error('Must delete between 2 and 100 messages');
        }
        messageIds.forEach(id => this.validateSnowflake(id, 'Message ID'));
        return this.createRequestOptions('POST', `/channels/${channelId}/messages/bulk-delete`, {
            body: { messages: messageIds },
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Edit channel permissions
     */
    editChannelPermissions(channelId, overwriteId, options, reason) {
        this.validateSnowflake(channelId, 'Channel ID');
        this.validateSnowflake(overwriteId, 'Overwrite ID');
        this.validateRequired(options.type, 'Permission type');
        if (options.type !== 0 && options.type !== 1) {
            throw new Error('Permission type must be 0 (role) or 1 (member)');
        }
        return this.createRequestOptions('PUT', `/channels/${channelId}/permissions/${overwriteId}`, {
            body: options,
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Get channel invites
     */
    getChannelInvites(channelId) {
        this.validateSnowflake(channelId, 'Channel ID');
        return this.createRequestOptions('GET', `/channels/${channelId}/invites`);
    }
    /**
     * Create channel invite
     */
    createChannelInvite(channelId, options = {}, reason) {
        this.validateSnowflake(channelId, 'Channel ID');
        const { max_age = 86400, max_uses = 0 } = options;
        if (max_age < 0 || max_age > 604800) {
            throw new Error('max_age must be between 0 and 604800 seconds (7 days)');
        }
        if (max_uses < 0 || max_uses > 100) {
            throw new Error('max_uses must be between 0 and 100');
        }
        if (options.target_user_id) {
            this.validateSnowflake(options.target_user_id, 'Target User ID');
        }
        if (options.target_application_id) {
            this.validateSnowflake(options.target_application_id, 'Target Application ID');
        }
        return this.createRequestOptions('POST', `/channels/${channelId}/invites`, {
            body: { ...options, max_age, max_uses },
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Delete channel permission
     */
    deleteChannelPermission(channelId, overwriteId, reason) {
        this.validateSnowflake(channelId, 'Channel ID');
        this.validateSnowflake(overwriteId, 'Overwrite ID');
        return this.createRequestOptions('DELETE', `/channels/${channelId}/permissions/${overwriteId}`, {
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Follow announcement channel
     */
    followAnnouncementChannel(channelId, webhookChannelId) {
        this.validateSnowflake(channelId, 'Channel ID');
        this.validateSnowflake(webhookChannelId, 'Webhook Channel ID');
        return this.createRequestOptions('POST', `/channels/${channelId}/followers`, {
            body: { webhook_channel_id: webhookChannelId },
        });
    }
    /**
     * Trigger typing indicator
     */
    triggerTypingIndicator(channelId) {
        this.validateSnowflake(channelId, 'Channel ID');
        return this.createRequestOptions('POST', `/channels/${channelId}/typing`);
    }
    /**
     * Get pinned messages
     */
    getPinnedMessages(channelId) {
        this.validateSnowflake(channelId, 'Channel ID');
        return this.createRequestOptions('GET', `/channels/${channelId}/pins`);
    }
    /**
     * Pin message
     */
    pinMessage(channelId, messageId, reason) {
        this.validateSnowflake(channelId, 'Channel ID');
        this.validateSnowflake(messageId, 'Message ID');
        return this.createRequestOptions('PUT', `/channels/${channelId}/pins/${messageId}`, {
            reason: this.sanitizeReason(reason),
        });
    }
    /**
     * Unpin message
     */
    unpinMessage(channelId, messageId, reason) {
        this.validateSnowflake(channelId, 'Channel ID');
        this.validateSnowflake(messageId, 'Message ID');
        return this.createRequestOptions('DELETE', `/channels/${channelId}/pins/${messageId}`, {
            reason: this.sanitizeReason(reason),
        });
    }
}
//# sourceMappingURL=ChannelRoutes.js.map