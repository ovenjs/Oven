/**
 * Individual shard implementation
 * Represents a single WebSocket connection to Discord gateway
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { inflateSync } from 'zlib';
import { 
  GatewayPayload, 
  GatewayOpcodes, 
  GatewayCloseCodes,
  HeartbeatInterval,
  BotToken 
} from '@ovenjs/types';
import { ms, DISCORD_TIMEOUTS } from '@ovenjs/types';
import { HeartbeatManager } from '../heartbeat/HeartbeatManager.js';

export interface ShardOptions {
  id: number;
  count: number;
  token: BotToken;
  intents: number;
  gatewayURL: string | undefined;
  version?: number | undefined;
  encoding?: 'json' | 'etf' | undefined;
  compress?: boolean | undefined;
  largeThreshold?: number | undefined;
  presence?: {
  activities?: any[];
  status?: 'online' | 'dnd' | 'idle' | 'invisible';
  afk?: boolean;
  since?: number | null;
} | undefined;
}

export interface ShardStatus {
  id: number;
  state: ShardState | undefined;
  ping: number;
  lastHeartbeat: Date;
  sessionId?: string | undefined;
  resumeGatewayURL?: string | undefined;
  sequence?: number | undefined;
  closeCode?: number | undefined;
  closeReason?: string | undefined;
}

export enum ShardState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  IDENTIFYING = 'identifying',
  READY = 'ready',
  RESUMING = 'resuming',
  RECONNECTING = 'reconnecting',
  ZOMBIE = 'zombie',
}

/**
 * Represents a single shard connection to Discord gateway
 */
export class Shard extends EventEmitter {
  private readonly options: ShardOptions;
  private ws?: WebSocket | undefined;
  private heartbeat?: HeartbeatManager | undefined;
  private state = ShardState.DISCONNECTED;
  private sequence: number | null = null;
  private sessionId?: string | undefined;
  private resumeGatewayURL?: string | undefined;
  private closeSequence = 0;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout?: NodeJS.Timeout | undefined;
  private connectTimeout?: NodeJS.Timeout | undefined;
  private identifyTimeout?: NodeJS.Timeout | undefined;

  constructor(options: ShardOptions) {
    super();
    this.options = options;
    this.setMaxListeners(0); // Remove EventEmitter limit
  }

  /**
   * Connect to the Discord gateway
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
   * Disconnect from the gateway
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
   * Send a payload to the gateway
   */
  send(payload: GatewayPayload): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Cannot send payload - shard ${this.options.id} not connected`);
    }

    const data = JSON.stringify(payload);
    this.ws.send(data);
    
    this.emit('debug', `[Shard ${this.options.id}] Sent: ${payload.op} ${payload.t || ''}`);
  }

  /**
   * Get current shard status
   */
  getStatus(): ShardStatus {
    return {
      id: this.options.id,
      state: this.state,
      ping: this.heartbeat?.getHealth().averageLatency || 0,
      lastHeartbeat: this.heartbeat?.getHealth().lastHeartbeat || new Date(),
      sessionId: this.sessionId,
      resumeGatewayURL: this.resumeGatewayURL,
      sequence: this.sequence || undefined,
      closeCode: this.closeSequence,
    };
  }

  /**
   * Get shard ID
   */
  getId(): number {
    return this.options.id;
  }

  /**
   * Check if shard is connected and ready
   */
  isReady(): boolean {
    return this.state === ShardState.READY;
  }

  /**
   * Create WebSocket connection
   */
  private async createConnection(): Promise<void> {
    const url = this.buildGatewayURL();
    
    this.ws = new WebSocket(url);
    this.setupWebSocketEvents();

    // Set connection timeout
    this.connectTimeout = setTimeout(() => {
      if (this.state === ShardState.CONNECTING) {
        this.ws?.close(4000, 'Connection timeout');
      }
    }, DISCORD_TIMEOUTS.GATEWAY_CONNECT);
  }

  /**
   * Setup WebSocket event handlers
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
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: WebSocket.Data): void {
    let payload: GatewayPayload;

    try {
      // Handle compressed data
      let rawData = data;
      if (this.options.compress && data instanceof Buffer) {
        rawData = inflateSync(data).toString();
      }

      payload = JSON.parse(rawData.toString());
    } catch (error) {
      this.emit('error', new Error(`Failed to parse gateway message: ${error}`));
      return;
    }

    // Update sequence number
    if (payload.s !== null && payload.s !== undefined) {
      this.sequence = payload.s;
      this.heartbeat?.updateSequence(payload.s);
    }

    this.emit('debug', `[Shard ${this.options.id}] Received: ${payload.op} ${payload.t || ''}`);

    // Handle different opcodes
    switch (payload.op) {
      case GatewayOpcodes.HELLO:
        this.handleHello(payload.d);
        break;
      case GatewayOpcodes.HEARTBEAT_ACK:
        this.handleHeartbeatAck();
        break;
      case GatewayOpcodes.HEARTBEAT:
        this.handleHeartbeatRequest();
        break;
      case GatewayOpcodes.RECONNECT:
        this.handleReconnectRequest();
        break;
      case GatewayOpcodes.INVALID_SESSION:
        this.handleInvalidSession(payload.d);
        break;
      case GatewayOpcodes.DISPATCH:
        this.handleDispatch(payload);
        break;
      default:
        this.emit('debug', `[Shard ${this.options.id}] Unknown opcode: ${payload.op}`);
    }
  }

  /**
   * Handle HELLO opcode - start heartbeat and identify
   */
  private handleHello(data: any): void {
    const interval = ms(data.heartbeat_interval) as HeartbeatInterval;
    
    // Setup heartbeat
    this.heartbeat = new HeartbeatManager({
      interval,
      onHeartbeat: (sequence) => this.sendHeartbeat(sequence),
      onHeartbeatAck: () => this.emit('debug', `[Shard ${this.options.id}] Heartbeat acknowledged`),
      onZombieConnection: () => this.handleZombieConnection(),
    });

    this.heartbeat.start();

    // Identify or resume
    if (this.sessionId && this.resumeGatewayURL) {
      this.resume();
    } else {
      this.identify();
    }
  }

  /**
   * Send heartbeat to gateway
   */
  private sendHeartbeat(sequence: number | null): void {
    this.send({
      op: GatewayOpcodes.HEARTBEAT,
      d: sequence,
    });
  }

  /**
   * Handle heartbeat acknowledgment
   */
  private handleHeartbeatAck(): void {
    this.heartbeat?.ack();
  }

  /**
   * Handle heartbeat request from gateway
   */
  private handleHeartbeatRequest(): void {
    this.sendHeartbeat(this.sequence);
  }

  /**
   * Handle reconnect request from gateway
   */
  private handleReconnectRequest(): void {
    this.emit('debug', `[Shard ${this.options.id}] Gateway requested reconnect`);
    this.reconnect();
  }

  /**
   * Handle invalid session
   */
  private handleInvalidSession(resumable: any): void {
    const canResume = Boolean(resumable);
    if (!canResume) {
      this.sessionId = undefined;
      this.resumeGatewayURL = undefined;
      this.sequence = null;
    }

    // Wait a bit before identifying again
    setTimeout(() => {
      if (canResume && this.sessionId) {
        this.resume();
      } else {
        this.identify();
      }
    }, Math.random() * 5000 + 1000);
  }

  /**
   * Handle dispatch events
   */
  private handleDispatch(payload: GatewayPayload): void {
    switch (payload.t) {
      case 'READY':
        this.handleReady(payload.d);
        break;
      case 'RESUMED':
        this.handleResumed();
        break;
      default:
        // Emit the event for the client to handle
        this.emit('dispatch', payload);
    }
  }

  /**
   * Handle READY event
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
   * Handle RESUMED event
   */
  private handleResumed(): void {
    this.setState(ShardState.READY);
    this.reconnectAttempts = 0;
    
    this.emit('resumed');
    this.emit('debug', `[Shard ${this.options.id}] Resumed`);
  }

  /**
   * Send identify payload
   */
  private identify(): void {
    if (this.state !== ShardState.CONNECTED) {
      return;
    }

    this.setState(ShardState.IDENTIFYING);

    const identifyPayload = {
      op: GatewayOpcodes.IDENTIFY,
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

    // Set identify timeout
    this.identifyTimeout = setTimeout(() => {
      if (this.state === ShardState.IDENTIFYING) {
        this.emit('error', new Error(`Identify timeout for shard ${this.options.id}`));
        this.reconnect();
      }
    }, DISCORD_TIMEOUTS.IDENTIFY_TIMEOUT);
  }

  /**
   * Send resume payload
   */
  private resume(): void {
    if (!this.sessionId || !this.sequence) {
      this.identify();
      return;
    }

    this.setState(ShardState.RESUMING);

    const resumePayload = {
      op: GatewayOpcodes.RESUME,
      d: {
        token: this.options.token,
        session_id: this.sessionId,
        seq: this.sequence,
      },
    };

    this.send(resumePayload);
  }

  /**
   * Handle WebSocket close
   */
  private handleClose(code: number, reason: string): void {
    this.closeSequence = code;
    this.clearTimeouts();
    
    if (this.heartbeat) {
      this.heartbeat.stop();
    }

    this.emit('debug', `[Shard ${this.options.id}] Closed: ${code} ${reason}`);

    // Check if we should reconnect
    if (this.shouldReconnect(code)) {
      this.reconnect();
    } else {
      this.setState(ShardState.DISCONNECTED);
      this.emit('close', code, reason);
    }
  }

  /**
   * Check if shard should reconnect based on close code
   */
  private shouldReconnect(code: number): boolean {
    // Don't reconnect on these codes
    const noReconnectCodes = [
      GatewayCloseCodes.AUTHENTICATION_FAILED,
      GatewayCloseCodes.INVALID_INTENTS,
      GatewayCloseCodes.DISALLOWED_INTENTS,
      GatewayCloseCodes.INVALID_API_VERSION,
      GatewayCloseCodes.INVALID_SHARD,
      GatewayCloseCodes.SHARDING_REQUIRED,
    ];

    return !noReconnectCodes.includes(code) && this.reconnectAttempts < this.maxReconnectAttempts;
  }

  /**
   * Reconnect to the gateway
   */
  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setState(ShardState.DISCONNECTED);
      this.emit('error', new Error(`Max reconnect attempts reached for shard ${this.options.id}`));
      return;
    }

    this.setState(ShardState.RECONNECTING);
    this.reconnectAttempts++;

    // Calculate backoff delay
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
   * Handle zombie connection
   */
  private handleZombieConnection(): void {
    this.setState(ShardState.ZOMBIE);
    this.emit('debug', `[Shard ${this.options.id}] Zombie connection detected`);
    this.reconnect();
  }

  /**
   * Build gateway URL with query parameters
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
   * Set shard state
   */
  private setState(state: ShardState): void {
    if (this.state !== state) {
      const oldState = this.state;
      this.state = state;
      this.emit('stateChange', state, oldState);
    }
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts(): void {
    this.clearTimeout('connect');
    this.clearTimeout('identify');
    this.clearTimeout('reconnect');
  }

  /**
   * Clear specific timeout
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
   * Destroy the shard
   */
  destroy(): void {
    this.removeAllListeners();
    this.disconnect();
    this.clearTimeouts();
  }
}