/**
 * Gateway event handler for processing Discord events
 * Parses and validates incoming gateway events
 */
import { EventEmitter } from 'events';
import { isObject, isString, isNumber } from '@ovenjs/types';
/**
 * Handles and processes Discord gateway events
 */
export class EventHandler extends EventEmitter {
    options;
    eventCounts = new Map();
    lastEventTime = new Date();
    constructor(options = {}) {
        super();
        this.options = {
            validateEvents: options.validateEvents ?? true,
            debugMode: options.debugMode ?? false,
        };
        this.setMaxListeners(0);
    }
    /**
     * Process a gateway event payload
     */
    processEvent(shardId, payload) {
        if (!payload.t || !payload.d) {
            return null; // Not a dispatch event
        }
        const eventType = payload.t;
        const eventData = payload.d;
        // Validate event if enabled
        if (this.options.validateEvents && !this.validateEvent(eventType, eventData)) {
            this.emit('debug', `Invalid event data for ${eventType}`);
            return null;
        }
        // Update statistics
        this.updateEventStats(eventType);
        // Create processed event
        const processedEvent = {
            type: eventType,
            data: eventData,
            shardId,
            sequence: payload.s || undefined,
            timestamp: new Date(),
        };
        // Emit the processed event
        this.emit('event', processedEvent);
        this.emit(eventType.toLowerCase(), processedEvent);
        if (this.options.debugMode) {
            this.emit('debug', `Processed event: ${eventType} from shard ${shardId}`);
        }
        return processedEvent;
    }
    /**
     * Get event statistics
     */
    getEventStats() {
        return Object.fromEntries(this.eventCounts);
    }
    /**
     * Get total events processed
     */
    getTotalEvents() {
        return Array.from(this.eventCounts.values()).reduce((sum, count) => sum + count, 0);
    }
    /**
     * Reset event statistics
     */
    resetStats() {
        this.eventCounts.clear();
        this.lastEventTime = new Date();
    }
    /**
     * Get most common events
     */
    getTopEvents(limit = 10) {
        return Array.from(this.eventCounts.entries())
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
    /**
     * Get events per second (rough estimate)
     */
    getEventsPerSecond() {
        const totalEvents = this.getTotalEvents();
        const timeDiff = (Date.now() - this.lastEventTime.getTime()) / 1000;
        return timeDiff > 0 ? totalEvents / timeDiff : 0;
    }
    /**
     * Validate event data (basic validation)
     */
    validateEvent(type, data) {
        if (!isObject(data)) {
            return false;
        }
        // Basic validation for common event types
        switch (type) {
            case 'READY':
                return this.validateReadyEvent(data);
            case 'GUILD_CREATE':
            case 'GUILD_UPDATE':
                return this.validateGuildEvent(data);
            case 'MESSAGE_CREATE':
            case 'MESSAGE_UPDATE':
                return this.validateMessageEvent(data);
            case 'CHANNEL_CREATE':
            case 'CHANNEL_UPDATE':
                return this.validateChannelEvent(data);
            case 'GUILD_MEMBER_ADD':
            case 'GUILD_MEMBER_UPDATE':
                return this.validateMemberEvent(data);
            default:
                // For unknown events, just check it's an object
                return true;
        }
    }
    /**
     * Validate READY event
     */
    validateReadyEvent(data) {
        return (isString(data.session_id) &&
            isObject(data.user) &&
            isString(data.user.id) &&
            Array.isArray(data.guilds));
    }
    /**
     * Validate guild events
     */
    validateGuildEvent(data) {
        return (isString(data.id) &&
            isString(data.name) &&
            isString(data.owner_id) &&
            Array.isArray(data.roles) &&
            Array.isArray(data.emojis));
    }
    /**
     * Validate message events
     */
    validateMessageEvent(data) {
        return (isString(data.id) &&
            isString(data.channel_id) &&
            isObject(data.author) &&
            isString(data.author.id) &&
            isString(data.content) &&
            isString(data.timestamp));
    }
    /**
     * Validate channel events
     */
    validateChannelEvent(data) {
        return (isString(data.id) &&
            isNumber(data.type));
    }
    /**
     * Validate member events
     */
    validateMemberEvent(data) {
        return (isObject(data.user) &&
            isString(data.user.id) &&
            Array.isArray(data.roles) &&
            isString(data.joined_at));
    }
    /**
     * Update event statistics
     */
    updateEventStats(eventType) {
        const current = this.eventCounts.get(eventType) || 0;
        this.eventCounts.set(eventType, current + 1);
    }
    /**
     * Filter events by type
     */
    createEventFilter(eventTypes) {
        const lowerCaseTypes = eventTypes.map(type => type.toLowerCase());
        return (event) => lowerCaseTypes.includes(event.type.toLowerCase());
    }
    /**
     * Create event transformer
     */
    createEventTransformer(eventType, transformer) {
        return (event) => {
            if (event.type.toLowerCase() === eventType.toLowerCase()) {
                try {
                    return transformer(event.data);
                }
                catch (error) {
                    this.emit('error', new Error(`Event transformation failed for ${eventType}: ${error}`));
                    return null;
                }
            }
            return null;
        };
    }
    /**
     * Destroy the event handler
     */
    destroy() {
        this.removeAllListeners();
        this.eventCounts.clear();
    }
}
//# sourceMappingURL=EventHandler.js.map