/**
 * Gateway event handler for processing Discord events
 * Parses and validates incoming gateway events
 */
import { EventEmitter } from 'events';
import type { GatewayPayload } from '@ovenjs/types';
export interface EventHandlerOptions {
    validateEvents?: boolean;
    debugMode?: boolean;
}
export interface ProcessedEvent {
    type: string;
    data: any;
    shardId: number;
    sequence?: number;
    timestamp: Date;
}
/**
 * Handles and processes Discord gateway events
 */
export declare class EventHandler extends EventEmitter {
    private readonly options;
    private eventCounts;
    private lastEventTime;
    constructor(options?: EventHandlerOptions);
    /**
     * Process a gateway event payload
     */
    processEvent(shardId: number, payload: GatewayPayload): ProcessedEvent | null;
    /**
     * Get event statistics
     */
    getEventStats(): Record<string, number>;
    /**
     * Get total events processed
     */
    getTotalEvents(): number;
    /**
     * Reset event statistics
     */
    resetStats(): void;
    /**
     * Get most common events
     */
    getTopEvents(limit?: number): Array<{
        type: string;
        count: number;
    }>;
    /**
     * Get events per second (rough estimate)
     */
    getEventsPerSecond(): number;
    /**
     * Validate event data (basic validation)
     */
    private validateEvent;
    /**
     * Validate READY event
     */
    private validateReadyEvent;
    /**
     * Validate guild events
     */
    private validateGuildEvent;
    /**
     * Validate message events
     */
    private validateMessageEvent;
    /**
     * Validate channel events
     */
    private validateChannelEvent;
    /**
     * Validate member events
     */
    private validateMemberEvent;
    /**
     * Update event statistics
     */
    private updateEventStats;
    /**
     * Filter events by type
     */
    createEventFilter(eventTypes: string[]): (event: ProcessedEvent) => boolean;
    /**
     * Create event transformer
     */
    createEventTransformer<T>(eventType: string, transformer: (data: any) => T): (event: ProcessedEvent) => T | null;
    /**
     * Destroy the event handler
     */
    destroy(): void;
}
//# sourceMappingURL=EventHandler.d.ts.map