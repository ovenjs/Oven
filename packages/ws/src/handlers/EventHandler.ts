/**
 * Gateway event handler for processing Discord events
 * Parses, validates, and processes incoming Discord gateway events
 * 
 * @author OvenJS Team
 * @since 0.1.0
 */

import { EventEmitter } from 'events';
import type { 
  GatewayPayload, 
  EventHandlerOptions, 
  ProcessedEvent 
} from '@ovenjs/types';
import { isObject, isString, isNumber } from '@ovenjs/types';

/**
 * Handles and processes Discord gateway events with validation and statistics
 * 
 * This class provides:
 * - Event validation and filtering
 * - Event processing statistics
 * - Type-safe event transformation
 * - Performance monitoring
 * 
 * @example
 * ```typescript
 * const handler = new EventHandler({
 *   validateEvents: true,
 *   debugMode: false
 * });
 * 
 * handler.on('event', (event) => {
 *   console.log(`Received ${event.type} from shard ${event.shardId}`);
 * });
 * 
 * const processed = handler.processEvent(0, gatewayPayload);
 * ```
 */
export class EventHandler extends EventEmitter {
  private readonly options: Required<EventHandlerOptions>;
  private eventCounts = new Map<string, number>();
  private lastEventTime = new Date();

  /**
   * Creates a new EventHandler instance
   * 
   * @param options - Configuration options for event handling
   */
  constructor(options: EventHandlerOptions = {}) {
    super();
    
    this.options = {
      validateEvents: options.validateEvents ?? true,
      debugMode: options.debugMode ?? false,
    };

    this.setMaxListeners(0);
  }

  /**
   * Processes a Discord gateway event payload
   * 
   * @param shardId - ID of the shard that received the event
   * @param payload - Gateway payload from Discord
   * @returns Processed event object or null if invalid/non-dispatch event
   */
  processEvent(shardId: number, payload: GatewayPayload): ProcessedEvent | null {
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
    const processedEvent: ProcessedEvent = {
      type: eventType,
      data: eventData,
      shardId,
      sequence: payload.s ?? undefined,
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
   * Gets event processing statistics
   * 
   * @returns Record of event types and their counts
   */
  getEventStats(): Record<string, number> {
    return Object.fromEntries(this.eventCounts);
  }

  /**
   * Gets the total number of events processed
   * 
   * @returns Total event count across all types
   */
  getTotalEvents(): number {
    return Array.from(this.eventCounts.values()).reduce((sum, count) => sum + count, 0);
  }

  /**
   * Resets all event statistics
   */
  resetStats(): void {
    this.eventCounts.clear();
    this.lastEventTime = new Date();
  }

  /**
   * Gets the most frequently occurring events
   * 
   * @param limit - Maximum number of events to return (default: 10)
   * @returns Array of events sorted by frequency
   */
  getTopEvents(limit = 10): Array<{ type: string; count: number }> {
    return Array.from(this.eventCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Gets rough estimate of events processed per second
   * 
   * @returns Events per second rate
   */
  getEventsPerSecond(): number {
    const totalEvents = this.getTotalEvents();
    const timeDiff = (Date.now() - this.lastEventTime.getTime()) / 1000;
    return timeDiff > 0 ? totalEvents / timeDiff : 0;
  }

  /**
   * Creates a filter function for specific event types
   * 
   * @param eventTypes - Array of event type names to filter for
   * @returns Filter function that returns true for matching events
   */
  createEventFilter(eventTypes: string[]): (event: ProcessedEvent) => boolean {
    const lowerCaseTypes = eventTypes.map(type => type.toLowerCase());
    return (event: ProcessedEvent) => lowerCaseTypes.includes(event.type.toLowerCase());
  }

  /**
   * Creates a transformer function for a specific event type
   * 
   * @param eventType - Event type to transform
   * @param transformer - Function to transform the event data
   * @returns Transformer function that returns transformed data or null
   */
  createEventTransformer<T>(
    eventType: string,
    transformer: (data: any) => T
  ): (event: ProcessedEvent) => T | null {
    return (event: ProcessedEvent) => {
      if (event.type.toLowerCase() === eventType.toLowerCase()) {
        try {
          return transformer(event.data);
        } catch (error) {
          this.emit('error', new Error(`Event transformation failed for ${eventType}: ${error}`));
          return null;
        }
      }
      return null;
    };
  }

  /**
   * Validates event data based on Discord API specifications
   * 
   * @param type - Event type name
   * @param data - Event data payload
   * @returns True if event data is valid
   * @private
   */
  private validateEvent(type: string, data: any): boolean {
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
   * Validates READY event data
   * 
   * @param data - Event data to validate
   * @returns True if valid READY event
   * @private
   */
  private validateReadyEvent(data: any): boolean {
    return (
      isString(data.session_id) &&
      isObject(data.user) &&
      isString(data.user.id) &&
      Array.isArray(data.guilds)
    );
  }

  /**
   * Validates guild event data
   * 
   * @param data - Event data to validate
   * @returns True if valid guild event
   * @private
   */
  private validateGuildEvent(data: any): boolean {
    return (
      isString(data.id) &&
      isString(data.name) &&
      isString(data.owner_id) &&
      Array.isArray(data.roles) &&
      Array.isArray(data.emojis)
    );
  }

  /**
   * Validates message event data
   * 
   * @param data - Event data to validate
   * @returns True if valid message event
   * @private
   */
  private validateMessageEvent(data: any): boolean {
    return (
      isString(data.id) &&
      isString(data.channel_id) &&
      isObject(data.author) &&
      isString(data.author.id) &&
      isString(data.content) &&
      isString(data.timestamp)
    );
  }

  /**
   * Validates channel event data
   * 
   * @param data - Event data to validate
   * @returns True if valid channel event
   * @private
   */
  private validateChannelEvent(data: any): boolean {
    return (
      isString(data.id) &&
      isNumber(data.type)
    );
  }

  /**
   * Validates member event data
   * 
   * @param data - Event data to validate
   * @returns True if valid member event
   * @private
   */
  private validateMemberEvent(data: any): boolean {
    return (
      isObject(data.user) &&
      isString(data.user.id) &&
      Array.isArray(data.roles) &&
      isString(data.joined_at)
    );
  }

  /**
   * Updates event processing statistics
   * 
   * @param eventType - Type of event to increment
   * @private
   */
  private updateEventStats(eventType: string): void {
    const current = this.eventCounts.get(eventType) || 0;
    this.eventCounts.set(eventType, current + 1);
  }

  /**
   * Destroys the event handler and cleans up resources
   */
  destroy(): void {
    this.removeAllListeners();
    this.eventCounts.clear();
  }
}