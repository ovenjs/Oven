/**
 * Heartbeat manager for WebSocket connection health monitoring
 * Handles Discord gateway heartbeat protocol with comprehensive health tracking
 * 
 * @author OvenJS Team
 * @since 0.1.0
 */

import type { 
  HeartbeatInterval, 
  HeartbeatOptions, 
  ConnectionHealth,
  DISCORD_TIMEOUTS 
} from '@ovenjs/types';

/**
 * Manages heartbeat protocol for Discord gateway connection
 * 
 * This class handles:
 * - Sending periodic heartbeats to Discord
 * - Tracking heartbeat acknowledgments
 * - Monitoring connection health
 * - Detecting zombie connections
 * 
 * @example
 * ```typescript
 * const heartbeat = new HeartbeatManager({
 *   interval: ms(41250) as HeartbeatInterval,
 *   onHeartbeat: (seq) => shard.send({ op: 1, d: seq }),
 *   onHeartbeatAck: () => console.log('Heartbeat acknowledged'),
 *   onZombieConnection: () => shard.reconnect()
 * });
 * 
 * heartbeat.start();
 * ```
 */
export class HeartbeatManager {
  private interval?: NodeJS.Timeout;
  private lastSequence: number | null = null;
  private lastHeartbeat = new Date();
  private lastHeartbeatAck = new Date();
  private missedAcks = 0;
  private latencyHistory: number[] = [];
  private readonly options: HeartbeatOptions;
  private isActive = false;

  /**
   * Creates a new HeartbeatManager instance
   * 
   * @param options - Configuration options for the heartbeat manager
   */
  constructor(options: HeartbeatOptions) {
    this.options = options;
  }

  /**
   * Starts the heartbeat interval with jitter to prevent thundering herd
   * 
   * @throws {Error} If heartbeat is already active
   */
  start(): void {
    if (this.isActive) {
      this.stop();
    }

    this.isActive = true;
    this.missedAcks = 0;
    this.lastHeartbeat = new Date();
    this.lastHeartbeatAck = new Date();

    // Add jitter to prevent thundering herd effect
    const jitter = Math.random() * 1000;
    const intervalMs = this.options.interval + jitter;

    this.interval = setInterval(() => {
      this.sendHeartbeat();
    }, intervalMs);

    // Send initial heartbeat immediately
    this.sendHeartbeat();
  }

  /**
   * Stops the heartbeat interval
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    this.isActive = false;
  }

  /**
   * Updates the last sequence number received from Discord
   * 
   * @param sequence - The sequence number from the last received event
   */
  updateSequence(sequence: number | null): void {
    this.lastSequence = sequence;
  }

  /**
   * Acknowledges a heartbeat response from Discord
   * 
   * This method should be called when receiving a HEARTBEAT_ACK opcode.
   * It calculates latency and updates connection health metrics.
   */
  ack(): void {
    const now = new Date();
    const latency = now.getTime() - this.lastHeartbeat.getTime();
    
    this.lastHeartbeatAck = now;
    this.missedAcks = 0;
    
    // Track latency history (keep last 10 measurements for averaging)
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > 10) {
      this.latencyHistory.shift();
    }

    this.options.onHeartbeatAck();
  }

  /**
   * Gets comprehensive connection health information
   * 
   * @returns Current connection health status and statistics
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
   * Checks if the connection is considered alive based on heartbeat timing
   * 
   * @returns True if connection is healthy, false if potentially dead
   */
  isAlive(): boolean {
    if (!this.isActive) return false;

    const now = Date.now();
    const timeSinceLastAck = now - this.lastHeartbeatAck.getTime();
    
    // Consider connection dead if no ACK received in 2 intervals
    return timeSinceLastAck < (this.options.interval * 2);
  }

  /**
   * Gets current heartbeat statistics for monitoring
   * 
   * @returns Object containing current heartbeat statistics
   */
  getStats() {
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
   * Sends a heartbeat to Discord gateway
   * 
   * This method tracks missed ACKs and detects zombie connections.
   * If too many ACKs are missed, it triggers the zombie connection callback.
   * 
   * @private
   */
  private sendHeartbeat(): void {
    const now = new Date();
    
    // Check if we've missed too many ACKs (zombie connection)
    if (this.missedAcks >= 3) {
      this.options.onZombieConnection();
      return;
    }

    // Check if we haven't received an ACK from the last heartbeat
    const timeSinceLastAck = now.getTime() - this.lastHeartbeatAck.getTime();
    if (timeSinceLastAck > DISCORD_TIMEOUTS.HEARTBEAT_ACK) {
      this.missedAcks++;
    }

    this.lastHeartbeat = now;
    this.options.onHeartbeat(this.lastSequence);
  }

  /**
   * Resets all heartbeat state to initial values
   * 
   * Useful when reconnecting or resuming a session.
   */
  reset(): void {
    this.lastSequence = null;
    this.missedAcks = 0;
    this.latencyHistory = [];
    this.lastHeartbeat = new Date();
    this.lastHeartbeatAck = new Date();
  }

  /**
   * Updates the heartbeat interval and restarts if active
   * 
   * @param interval - New heartbeat interval from Discord
   */
  updateInterval(interval: HeartbeatInterval): void {
    const wasActive = this.isActive;
    
    if (wasActive) {
      this.stop();
    }

    // Update the interval in options
    (this.options as any).interval = interval;

    if (wasActive) {
      this.start();
    }
  }

  /**
   * Destroys the heartbeat manager and cleans up resources
   * 
   * After calling this method, the manager cannot be reused.
   */
  destroy(): void {
    this.stop();
    this.reset();
  }
}