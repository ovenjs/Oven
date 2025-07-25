/**
 * Heartbeat manager for WebSocket connection health monitoring
 * Handles Discord gateway heartbeat protocol
 */
import type { HeartbeatInterval } from '@ovenjs/types';
export interface HeartbeatOptions {
    interval: HeartbeatInterval;
    onHeartbeat: (sequence: number | null) => void;
    onHeartbeatAck: () => void;
    onZombieConnection: () => void;
}
export interface ConnectionHealth {
    isAlive: boolean;
    lastHeartbeat: Date;
    lastHeartbeatAck: Date;
    missedAcks: number;
    averageLatency: number;
    latencyHistory: number[];
}
/**
 * Manages heartbeat protocol for Discord gateway connection
 */
export declare class HeartbeatManager {
    private interval?;
    private lastSequence;
    private lastHeartbeat;
    private lastHeartbeatAck;
    private missedAcks;
    private latencyHistory;
    private readonly options;
    private isActive;
    constructor(options: HeartbeatOptions);
    /**
     * Start the heartbeat interval
     */
    start(): void;
    /**
     * Stop the heartbeat interval
     */
    stop(): void;
    /**
     * Update the last sequence number received
     */
    updateSequence(sequence: number | null): void;
    /**
     * Acknowledge a heartbeat response
     */
    ack(): void;
    /**
     * Get current connection health status
     */
    getHealth(): ConnectionHealth;
    /**
     * Check if connection is considered alive
     */
    isAlive(): boolean;
    /**
     * Get current heartbeat statistics
     */
    getStatistics(): {
        isActive: boolean;
        missedAcks: number;
        averageLatency: number;
        latencyHistory: number[];
        lastHeartbeat: string;
        lastHeartbeatAck: string;
    };
    /**
     * Send a heartbeat to the gateway
     */
    private sendHeartbeat;
    /**
     * Reset heartbeat state
     */
    reset(): void;
    /**
     * Update heartbeat interval
     */
    updateInterval(interval: HeartbeatInterval): void;
    /**
     * Destroy the heartbeat manager
     */
    destroy(): void;
}
//# sourceMappingURL=HeartbeatManager.d.ts.map