/**
 * Heartbeat manager for WebSocket connection health monitoring
 * Handles Discord gateway heartbeat protocol
 */
import { DISCORD_TIMEOUTS } from '@ovenjs/types';
/**
 * Manages heartbeat protocol for Discord gateway connection
 */
export class HeartbeatManager {
    interval;
    lastSequence = null;
    lastHeartbeat = new Date();
    lastHeartbeatAck = new Date();
    missedAcks = 0;
    latencyHistory = [];
    options;
    isActive = false;
    constructor(options) {
        this.options = options;
    }
    /**
     * Start the heartbeat interval
     */
    start() {
        if (this.isActive) {
            this.stop();
        }
        this.isActive = true;
        this.missedAcks = 0;
        this.lastHeartbeat = new Date();
        this.lastHeartbeatAck = new Date();
        // Start heartbeat interval with jitter to avoid thundering herd
        const jitter = Math.random() * 1000;
        const intervalMs = this.options.interval + jitter;
        this.interval = setInterval(() => {
            this.sendHeartbeat();
        }, intervalMs);
        // Send initial heartbeat
        this.sendHeartbeat();
    }
    /**
     * Stop the heartbeat interval
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
        this.isActive = false;
    }
    /**
     * Update the last sequence number received
     */
    updateSequence(sequence) {
        this.lastSequence = sequence;
    }
    /**
     * Acknowledge a heartbeat response
     */
    ack() {
        const now = new Date();
        const latency = now.getTime() - this.lastHeartbeat.getTime();
        this.lastHeartbeatAck = now;
        this.missedAcks = 0;
        // Track latency history (keep last 10 measurements)
        this.latencyHistory.push(latency);
        if (this.latencyHistory.length > 10) {
            this.latencyHistory.shift();
        }
        this.options.onHeartbeatAck();
    }
    /**
     * Get current connection health status
     */
    getHealth() {
        const averageLatency = this.latencyHistory.length > 0
            ? this.latencyHistory.reduce((sum, lat) => sum + lat, 0) / this.latencyHistory.length
            : 0;
        return {
            isAlive: this.isAlive(),
            lastHeartbeat: this.lastHeartbeat,
            lastHeartbeatAck: this.lastHeartbeatAck,
            missedAcks: this.missedAcks,
            averageLatency,
            latencyHistory: [...this.latencyHistory],
        };
    }
    /**
     * Check if connection is considered alive
     */
    isAlive() {
        if (!this.isActive)
            return false;
        const now = Date.now();
        const timeSinceLastAck = now - this.lastHeartbeatAck.getTime();
        // Consider dead if we haven't received an ack in 2 intervals
        return timeSinceLastAck < (this.options.interval * 2);
    }
    /**
     * Get current heartbeat statistics
     */
    getStatistics() {
        return {
            isActive: this.isActive,
            missedAcks: this.missedAcks,
            averageLatency: this.getHealth().averageLatency,
            latencyHistory: [...this.latencyHistory],
            lastHeartbeat: this.lastHeartbeat.toISOString(),
            lastHeartbeatAck: this.lastHeartbeatAck.toISOString(),
        };
    }
    /**
     * Send a heartbeat to the gateway
     */
    sendHeartbeat() {
        const now = new Date();
        // Check if we missed too many acks (zombie connection)
        if (this.missedAcks >= 3) {
            this.options.onZombieConnection();
            return;
        }
        // Check if we haven't received an ack from the last heartbeat
        const timeSinceLastAck = now.getTime() - this.lastHeartbeatAck.getTime();
        if (timeSinceLastAck > DISCORD_TIMEOUTS.HEARTBEAT_ACK) {
            this.missedAcks++;
        }
        this.lastHeartbeat = now;
        this.options.onHeartbeat(this.lastSequence);
    }
    /**
     * Reset heartbeat state
     */
    reset() {
        this.lastSequence = null;
        this.missedAcks = 0;
        this.latencyHistory = [];
        this.lastHeartbeat = new Date();
        this.lastHeartbeatAck = new Date();
    }
    /**
     * Update heartbeat interval
     */
    updateInterval(interval) {
        const wasActive = this.isActive;
        if (wasActive) {
            this.stop();
        }
        // Update options with new interval
        this.options.interval = interval;
        if (wasActive) {
            this.start();
        }
    }
    /**
     * Destroy the heartbeat manager
     */
    destroy() {
        this.stop();
        this.reset();
    }
}
//# sourceMappingURL=HeartbeatManager.js.map