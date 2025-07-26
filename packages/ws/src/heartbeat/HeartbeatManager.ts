/**
 * Heartbeat manager for WebSocket connection health monitoring
 * Handles Discord gateway heartbeat protocol
 */

import type { HeartbeatInterval } from '@ovenjs/types';
import { DISCORD_TIMEOUTS } from '@ovenjs/types';

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
export class HeartbeatManager {
  private interval?: NodeJS.Timeout | undefined;
  private lastSequence: number | null = null;
  private lastHeartbeat = new Date();
  private lastHeartbeatAck = new Date();
  private missedAcks = 0;
  private latencyHistory: number[] = [];
  private readonly options: HeartbeatOptions;
  private isActive = false;

  constructor(options: HeartbeatOptions) {
    this.options = options;
  }

  /**
   * Start the heartbeat interval
   */
  start(): void {
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
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    this.isActive = false;
  }

  /**
   * Update the last sequence number received
   */
  updateSequence(sequence: number | null): void {
    this.lastSequence = sequence;
  }

  /**
   * Acknowledge a heartbeat response
   */
  ack(): void {
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
  getHealth(): ConnectionHealth {
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
  isAlive(): boolean {
    if (!this.isActive) return false;

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
  private sendHeartbeat(): void {
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
  reset(): void {
    this.lastSequence = null;
    this.missedAcks = 0;
    this.latencyHistory = [];
    this.lastHeartbeat = new Date();
    this.lastHeartbeatAck = new Date();
  }

  /**
   * Update heartbeat interval
   */
  updateInterval(interval: HeartbeatInterval): void {
    const wasActive = this.isActive;
    
    if (wasActive) {
      this.stop();
    }

    // Update options with new interval
    (this.options as any).interval = interval;

    if (wasActive) {
      this.start();
    }
  }

  /**
   * Destroy the heartbeat manager
   */
  destroy(): void {
    this.stop();
    this.reset();
  }
}