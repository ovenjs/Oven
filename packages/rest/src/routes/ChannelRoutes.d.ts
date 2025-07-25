/**
 * Channel-related API routes
 * Handles all channel operations like messages, invites, permissions
 */
import { BaseRoute } from './BaseRoute.js';
import type { RequestOptions, MessageCreateOptions, MessageEditOptions, ChannelEditOptions } from '@ovenjs/types';
/**
 * Channel API routes implementation
 */
export declare class ChannelRoutes extends BaseRoute {
    /**
     * Get a channel by ID
     */
    getChannel(channelId: string): RequestOptions;
    /**
     * Modify a channel
     */
    modifyChannel(channelId: string, options: ChannelEditOptions, reason?: string): RequestOptions;
    /**
     * Delete a channel
     */
    deleteChannel(channelId: string, reason?: string): RequestOptions;
    /**
     * Get channel messages
     */
    getChannelMessages(channelId: string, options?: {
        around?: string;
        before?: string;
        after?: string;
        limit?: number;
    }): RequestOptions;
    /**
     * Get a channel message
     */
    getChannelMessage(channelId: string, messageId: string): RequestOptions;
    /**
     * Create a channel message
     */
    createMessage(channelId: string, options: MessageCreateOptions): RequestOptions;
    /**
     * Crosspost a message (publish in announcement channel)
     */
    crosspostMessage(channelId: string, messageId: string): RequestOptions;
    /**
     * Create reaction on message
     */
    createReaction(channelId: string, messageId: string, emoji: string): RequestOptions;
    /**
     * Delete own reaction
     */
    deleteOwnReaction(channelId: string, messageId: string, emoji: string): RequestOptions;
    /**
     * Delete user reaction
     */
    deleteUserReaction(channelId: string, messageId: string, emoji: string, userId: string): RequestOptions;
    /**
     * Get reactions for message
     */
    getReactions(channelId: string, messageId: string, emoji: string, options?: {
        after?: string;
        limit?: number;
    }): RequestOptions;
    /**
     * Delete all reactions from message
     */
    deleteAllReactions(channelId: string, messageId: string): RequestOptions;
    /**
     * Delete all reactions for specific emoji
     */
    deleteAllReactionsForEmoji(channelId: string, messageId: string, emoji: string): RequestOptions;
    /**
     * Edit a message
     */
    editMessage(channelId: string, messageId: string, options: MessageEditOptions): RequestOptions;
    /**
     * Delete a message
     */
    deleteMessage(channelId: string, messageId: string, reason?: string): RequestOptions;
    /**
     * Bulk delete messages
     */
    bulkDeleteMessages(channelId: string, messageIds: string[], reason?: string): RequestOptions;
    /**
     * Edit channel permissions
     */
    editChannelPermissions(channelId: string, overwriteId: string, options: {
        allow?: string;
        deny?: string;
        type: 0 | 1;
    }, reason?: string): RequestOptions;
    /**
     * Get channel invites
     */
    getChannelInvites(channelId: string): RequestOptions;
    /**
     * Create channel invite
     */
    createChannelInvite(channelId: string, options?: {
        max_age?: number;
        max_uses?: number;
        temporary?: boolean;
        unique?: boolean;
        target_type?: number;
        target_user_id?: string;
        target_application_id?: string;
    }, reason?: string): RequestOptions;
    /**
     * Delete channel permission
     */
    deleteChannelPermission(channelId: string, overwriteId: string, reason?: string): RequestOptions;
    /**
     * Follow announcement channel
     */
    followAnnouncementChannel(channelId: string, webhookChannelId: string): RequestOptions;
    /**
     * Trigger typing indicator
     */
    triggerTypingIndicator(channelId: string): RequestOptions;
    /**
     * Get pinned messages
     */
    getPinnedMessages(channelId: string): RequestOptions;
    /**
     * Pin message
     */
    pinMessage(channelId: string, messageId: string, reason?: string): RequestOptions;
    /**
     * Unpin message
     */
    unpinMessage(channelId: string, messageId: string, reason?: string): RequestOptions;
}
//# sourceMappingURL=ChannelRoutes.d.ts.map