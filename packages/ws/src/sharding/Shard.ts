/**
 * Individual shard implementation for Discord gateway connections
 * Represents a single WebSocket connection to Discord with full lifecycle management
 * 
 * @author OvenJS Team
 * @since 0.1.0
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { inflateSync } from 'zlib';
import { 
  GatewayPayload, 
  GatewayOpcodes, 
  GatewayCloseCodes,
  HeartbeatInterval,
  ShardOptions,
  ShardStatus,
  ShardState,
  ms, 
  DISCORD_TIMEOUTS 
} from '@ovenjs/types';
import { HeartbeatManager } from '../heartbeat/HeartbeatManager.js';

/**
 * Represents a single shard connection to Discord gateway
 * 
 * Handles:
 * - WebSocket connection lifecycle
 * - Discord gateway protocol (identify, resume, heartbeat)
 * - Automatic reconnection with exponential backoff
 * - Event processing and forwarding
 * - Connection health monitoring
 * 
 * @example
 * ```typescript
 * const shard = new Shard({
 *   id: 0,
 *   count: 1,
 *   token: 'Bot YOUR_BOT_TOKEN' as BotToken,
 *   intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMessages
 * });
 * 
 * shard.on('ready', (data) => {
 *   console.log(`Shard ${shard.getId()} is ready!`);
 * });
 * 
 * await shard.connect();
 * ```
 */
export class Shard extends EventEmitter {
  private readonly options: ShardOptions;
  private ws?: WebSocket;
  private heartbeat?: HeartbeatManager;
  private state = ShardState.DISCONNECTED;
  private sequence: number | null = null;
  private sessionId?: string;
  private resumeGatewayURL?: string;
  private closeSequence = 0;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimeout?: NodeJS.Timeout;
  private connectTimeout?: NodeJS.Timeout;
  private identifyTimeout?: NodeJS.Timeout;

  /**
   * Creates a new Shard instance
   * 
   * @param options - Configuration options for the shard
   */
  constructor(options: ShardOptions) {
    super();
    this.options = options;
    this.setMaxListeners(0); // Remove EventEmitter limit for multiple listeners
  }

  /**
   * Connects to the Discord gateway
   * 
   * @throws {Error} If shard is not in DISCONNECTED state
   */
  async connect(): Promise<void> {
    if (this.state !== ShardState.DISCONNECTED) {
      throw new Error(`Cannot connect shard ${this.options.id} in state ${this.state}`);
    }

    this.setState(ShardState.CONNECTING);
    
    try {
      await this.createConnection();
    } catch (error) {
      this.setState(ShardState.DISCONNECTED);
      throw error;
    }
  }

  /**
   * Disconnects from the Discord gateway
   * 
   * @param code - WebSocket close code (default: 1000)
   * @param reason - Reason for disconnection (default: 'Requested')
   */
  async disconnect(code = 1000, reason = 'Requested'): Promise<void> {
    this.clearTimeouts();
    
    if (this.heartbeat) {
      this.heartbeat.destroy();
      this.heartbeat = undefined;
    }

    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = undefined;
    }

    this.setState(ShardState.DISCONNECTED);
    this.reconnectAttempts = 0;
  }

  /**
   * Sends a payload to the Discord gateway
   * 
   * @param payload - Gateway payload to send
   * @throws {Error} If shard is not connected
   */
  send(payload: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Cannot send payload - shard ${this.options.id} not connected`);
    }

    const data = JSON.stringify(payload);
    this.ws.send(data);
    
    this.emit('debug', `[Shard ${this.options.id}] Sent: ${payload.op} ${(payload as any).t || ''}`);
  }

  /**
   * Gets current shard status and health information
   * 
   * @returns Comprehensive shard status
   */
  getStatus(): ShardStatus {
    return {
      id: this.options.id,
      state: this.state,
      ping: this.heartbeat?.getHealth().averageLatency || 0,
      lastHeartbeat: this.heartbeat?.getHealth().lastHeartbeat || new Date(),
      lastHeartbeatAck: this.heartbeat?.getHealth().lastHeartbeatAck || new Date(),
      sessionId: this.sessionId,
      resumeGatewayURL: this.resumeGatewayURL,
      sequence: this.sequence || undefined,
      closeCode: this.closeSequence,
    };
  }

  /**
   * Gets the shard ID
   * 
   * @returns Shard identifier
   */
  getId(): number {
    return this.options.id;
  }

  /**
   * Checks if shard is connected and ready to receive events
   * 
   * @returns True if shard is in READY state
   */
  isReady(): boolean {
    return this.state === ShardState.READY;
  }

  /**
   * Creates the WebSocket connection to Discord gateway
   * 
   * @private
   */
  private async createConnection(): Promise<void> {
    const url = this.buildGatewayURL();
    
    this.ws = new WebSocket(url);
    this.setupWebSocketEvents();

    // Set connection timeout to prevent hanging
    this.connectTimeout = setTimeout(() => {
      if (this.state === ShardState.CONNECTING) {
        this.ws?.close(4000, 'Connection timeout');
      }
    }, DISCORD_TIMEOUTS.GATEWAY_CONNECT);
  }

  /**
   * Sets up WebSocket event handlers
   * 
   * @private
   */
  private setupWebSocketEvents(): void {
    if (!this.ws) return;

    this.ws.on('open', () => {
      this.clearTimeout('connect');
      this.setState(ShardState.CONNECTED);
      this.emit('debug', `[Shard ${this.options.id}] Connected to gateway`);
    });

    this.ws.on('message', (data) => {
      this.handleMessage(data);
    });

    this.ws.on('close', (code, reason) => {
      this.handleClose(code, reason.toString());
    });

    this.ws.on('error', (error) => {
      this.emit('error', error);
    });
  }

  /**
   * Handles incoming WebSocket messages and processes gateway payloads
   * 
   * @param data - Raw WebSocket message data
   * @private
   */
  private handleMessage(data: WebSocket.Data): void {
    let payload: GatewayPayload;

    try {
      // Handle compressed data if compression is enabled
      let rawData = data;
      if (this.options.compress && data instanceof Buffer) {
        rawData = inflateSync(data).toString();
      }

      payload = JSON.parse(rawData.toString());
    } catch (error) {
      this.emit('error', new Error(`Failed to parse gateway message: ${error}`));
      return;
    }

    // Update sequence number for heartbeat tracking
    if (payload.s !== null && payload.s !== undefined) {
      this.sequence = payload.s;
      this.heartbeat?.updateSequence(payload.s);
    }

    this.emit('debug', `[Shard ${this.options.id}] Received: ${payload.op} ${(payload as any).t || ''}`);

    // Handle different gateway opcodes
    switch (payload.op) {
      case GatewayOpcodes.Hello:
        this.handleHello(payload.d);
        break;
      case GatewayOpcodes.HeartbeatAck:
        this.handleHeartbeatAck();
        break;
      case GatewayOpcodes.Heartbeat:
        this.handleHeartbeatRequest();
        break;
      case GatewayOpcodes.Reconnect:
        this.handleReconnectRequest();
        break;
      case GatewayOpcodes.InvalidSession:
        this.handleInvalidSession(payload.d);
        break;
      case GatewayOpcodes.Dispatch:
        this.handleDispatch(payload);
        break;
      default:
        this.emit('debug', `[Shard ${this.options.id}] Unknown opcode: ${payload.op}`);
    }
  }

  /**
   * Handles HELLO opcode - initializes heartbeat and starts identification
   * 
   * @param data - Hello payload data containing heartbeat interval
   * @private
   */
  private handleHello(data: any): void {
    const interval = ms(data.heartbeat_interval) as HeartbeatInterval;
    
    this.heartbeat = new HeartbeatManager({
      interval,
      onHeartbeat: (sequence) => this.sendHeartbeat(sequence),
      onHeartbeatAck: () => this.emit('debug', `[Shard ${this.options.id}] Heartbeat acknowledged`),
      onZombieConnection: () => this.handleZombieConnection(),
    });

    this.heartbeat.start();

    // Identify or resume based on session state
    if (this.sessionId && this.resumeGatewayURL) {
      this.resume();
    } else {
      this.identify();
    }
  }

  /**
   * Sends heartbeat to maintain connection
   * 
   * @param sequence - Current sequence number
   * @private
   */
  private sendHeartbeat(sequence: number | null): void {
    this.send({
      op: GatewayOpcodes.Heartbeat,
      d: sequence,
    });
  }

  /**
   * Handles heartbeat acknowledgment from Discord
   * 
   * @private
   */
  private handleHeartbeatAck(): void {
    this.heartbeat?.ack();
  }

  /**
   * Handles heartbeat request from Discord gateway
   * 
   * @private
   */
  private handleHeartbeatRequest(): void {
    this.sendHeartbeat(this.sequence);
  }

  /**
   * Handles reconnect request from Discord
   * 
   * @private
   */
  private handleReconnectRequest(): void {
    this.emit('debug', `[Shard ${this.options.id}] Gateway requested reconnect`);
    this.reconnect();
  }

  /**
   * Handles invalid session response from Discord
   * 
   * @param resumable - Whether the session can be resumed
   * @private
   */
  private handleInvalidSession(resumable: any): void {
    const canResume = Boolean(resumable);
    if (!canResume) {
      // Clear session data for fresh identification
      this.sessionId = undefined;
      this.resumeGatewayURL = undefined;
      this.sequence = null;
    }

    // Wait random time before identifying again to prevent rate limits
    setTimeout(() => {
      if (canResume && this.sessionId) {
        this.resume();
      } else {
        this.identify();
      }
    }, Math.random() * 5000 + 1000);
  }

  /**
   * Handles dispatch events from Discord
   * 
   * @param payload - Dispatch payload
   * @private
   */
  private handleDispatch(payload: GatewayPayload): void {
    switch ((payload as any).t) {
      case 'READY':
        this.handleReady(payload.d);
        break;
      case 'RESUMED':
        this.handleResumed();
        break;
      default:
        // Forward event to client for processing
        this.emit('dispatch', payload);
    }
  }

  /**
   * Handles READY event - shard is now ready to receive events
   * 
   * @param data - Ready event data
   * @private
   */
  private handleReady(data: any): void {
    this.sessionId = data.session_id;
    this.resumeGatewayURL = data.resume_gateway_url;
    this.setState(ShardState.READY);
    this.reconnectAttempts = 0;
    
    this.emit('ready', data);
    this.emit('debug', `[Shard ${this.options.id}] Ready`);
  }

  /**
   * Handles RESUMED event - shard has successfully resumed
   * 
   * @private
   */
  private handleResumed(): void {
    this.setState(ShardState.READY);
    this.reconnectAttempts = 0;
    
    this.emit('resumed');
    this.emit('debug', `[Shard ${this.options.id}] Resumed`);
  }

  /**
   * Sends identify payload to Discord
   * 
   * @private
   */
  private identify(): void {
    if (this.state !== ShardState.CONNECTED) {
      return;
    }

    this.setState(ShardState.IDENTIFYING);

    const identifyPayload = {
      op: GatewayOpcodes.Identify,
      d: {
        token: this.options.token,
        intents: this.options.intents,
        properties: {
          os: process.platform,
          browser: 'OvenJS',
          device: 'OvenJS',
        },
        shard: [this.options.id, this.options.count],
        large_threshold: this.options.largeThreshold || 50,
        presence: this.options.presence,
      },
    };

    this.send(identifyPayload);

    // Set identify timeout to detect hanging identification
    this.identifyTimeout = setTimeout(() => {
      if (this.state === ShardState.IDENTIFYING) {
        this.emit('error', new Error(`Identify timeout for shard ${this.options.id}`));
        this.reconnect();
      }
    }, DISCORD_TIMEOUTS.IDENTIFY_TIMEOUT);
  }

  /**
   * Sends resume payload to Discord
   * 
   * @private
   */
  private resume(): void {
    if (!this.sessionId || !this.sequence) {
      this.identify();
      return;
    }

    this.setState(ShardState.RESUMING);

    const resumePayload = {
      op: GatewayOpcodes.Resume,
      d: {
        token: this.options.token,
        session_id: this.sessionId,
        seq: this.sequence,
      },
    };

    this.send(resumePayload);
  }

  /**
   * Handles WebSocket close events
   * 
   * @param code - Close code
   * @param reason - Close reason
   * @private
   */
  private handleClose(code: number, reason: string): void {
    this.closeSequence = code;
    this.clearTimeouts();
    
    if (this.heartbeat) {
      this.heartbeat.stop();
    }

    this.emit('debug', `[Shard ${this.options.id}] Closed: ${code} ${reason}`);

    // Determine if we should attempt reconnection
    if (this.shouldReconnect(code)) {
      this.reconnect();
    } else {
      this.setState(ShardState.DISCONNECTED);
      this.emit('disconnect', code, reason);
    }
  }

  /**
   * Determines if shard should reconnect based on close code
   * 
   * @param code - WebSocket close code
   * @returns True if reconnection should be attempted
   * @private
   */
  private shouldReconnect(code: number): boolean {
    // Don't reconnect on these fatal codes
    const noReconnectCodes = [
      GatewayCloseCodes.AuthenticationFailed,
      GatewayCloseCodes.InvalidIntents,
      GatewayCloseCodes.DisallowedIntents,
      GatewayCloseCodes.InvalidAPIVersion,
      GatewayCloseCodes.InvalidShard,
      GatewayCloseCodes.ShardingRequired,
    ];

    return !noReconnectCodes.includes(code) && this.reconnectAttempts < this.maxReconnectAttempts;
  }

  /**
   * Attempts to reconnect with exponential backoff
   * 
   * @private
   */
  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setState(ShardState.DISCONNECTED);
      this.emit('error', new Error(`Max reconnect attempts reached for shard ${this.options.id}`));
      return;
    }

    this.setState(ShardState.RECONNECTING);
    this.reconnectAttempts++;

    // Calculate exponential backoff delay with maximum cap
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    this.emit('debug', `[Shard ${this.options.id}] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.createConnection();
      } catch (error) {
        this.emit('error', error);
        this.reconnect();
      }
    }, delay);
  }

  /**
   * Handles zombie connection detection
   * 
   * @private
   */
  private handleZombieConnection(): void {
    this.setState(ShardState.ZOMBIE);
    this.emit('debug', `[Shard ${this.options.id}] Zombie connection detected`);
    this.reconnect();
  }

  /**
   * Builds the complete gateway URL with query parameters
   * 
   * @returns Complete gateway URL
   * @private
   */
  private buildGatewayURL(): string {
    const params = new URLSearchParams({
      v: (this.options.version || 10).toString(),
      encoding: this.options.encoding || 'json',
    });

    if (this.options.compress) {
      params.set('compress', 'zlib-stream');
    }

    return `${this.options.gatewayURL}?${params.toString()}`;
  }

  /**
   * Sets shard state and emits state change event
   * 
   * @param state - New shard state
   * @private
   */
  private setState(state: ShardState): void {
    if (this.state !== state) {
      const oldState = this.state;
      this.state = state;
      this.emit('stateChange', state, oldState);
    }
  }

  /**
   * Clears all active timeouts
   * 
   * @private
   */
  private clearTimeouts(): void {
    this.clearTimeout('connect');
    this.clearTimeout('identify');
    this.clearTimeout('reconnect');
  }

  /**
   * Clears a specific timeout by type
   * 
   * @param type - Type of timeout to clear
   * @private
   */
  private clearTimeout(type: 'connect' | 'identify' | 'reconnect'): void {
    switch (type) {
      case 'connect':
        if (this.connectTimeout) {
          clearTimeout(this.connectTimeout);
          this.connectTimeout = undefined;
        }
        break;
      case 'identify':
        if (this.identifyTimeout) {
          clearTimeout(this.identifyTimeout);
          this.identifyTimeout = undefined;
        }
        break;
      case 'reconnect':
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = undefined;
        }
        break;
    }
  }

  /**
   * Destroys the shard and cleans up all resources
   * 
   * After calling this method, the shard cannot be reused.
   */
  destroy(): void {
    this.removeAllListeners();
    this.disconnect();
    this.clearTimeouts();
  }
}