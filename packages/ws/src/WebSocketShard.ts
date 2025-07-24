import WebSocket from 'ws';
import { EventEmitter } from 'events';
import type {
  GatewayPayload,
  GatewayIdentify,
  GatewayResume,
  GatewayHello,
  ReadyEvent,
  PresenceUpdate,
} from '@ovenjs/types';
import { GatewayOPCodes, GatewayCloseCodes, GatewayIntents } from '@ovenjs/types';

export interface WebSocketShardOptions {
  token: string;
  intents: number;
  shardId?: number;
  totalShards?: number;
  presence?: PresenceUpdate;
  gatewayURL?: string;
}

export interface ShardEvents {
  ready: [ReadyEvent];
  message: [any];
  error: [Error];
  close: [number, string];
  reconnect: [];
  resumed: [];
}

export declare interface WebSocketShard extends EventEmitter {
  on<K extends keyof ShardEvents>(event: K, listener: (...args: ShardEvents[K]) => void): this;
  once<K extends keyof ShardEvents>(event: K, listener: (...args: ShardEvents[K]) => void): this;
  emit<K extends keyof ShardEvents>(event: K, ...args: ShardEvents[K]): boolean;
}

export class WebSocketShard extends EventEmitter {
  public readonly id: number;
  public readonly totalShards: number;
  
  private ws?: WebSocket;
  private token: string;
  private intents: number;
  private presence?: PresenceUpdate;
  private gatewayURL: string;
  
  private heartbeatInterval?: NodeJS.Timeout;
  private lastHeartbeat?: number;
  private lastHeartbeatAck?: number;
  private sequence: number | null = null;
  private sessionId?: string;
  private resumeURL?: string;
  
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(options: WebSocketShardOptions) {
    super();
    
    this.id = options.shardId ?? 0;
    this.totalShards = options.totalShards ?? 1;
    this.token = options.token;
    this.intents = options.intents;
    this.presence = options.presence;
    this.gatewayURL = options.gatewayURL ?? 'wss://gateway.discord.gg/?v=10&encoding=json';
  }

  public connect(): void {
    if (this.connectionState !== 'disconnected') {
      return;
    }

    this.connectionState = 'connecting';
    this.ws = new WebSocket(this.gatewayURL);
    
    this.ws.on('open', this.onOpen.bind(this));
    this.ws.on('message', this.onMessage.bind(this));
    this.ws.on('close', this.onClose.bind(this));
    this.ws.on('error', this.onError.bind(this));
  }

  public disconnect(code = 1000, reason = 'Disconnected'): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = undefined;
    }

    this.connectionState = 'disconnected';
  }

  public send(data: GatewayPayload): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(JSON.stringify(data));
  }

  private onOpen(): void {
    this.connectionState = 'connected';
    this.reconnectAttempts = 0;
  }

  private onMessage(data: WebSocket.Data): void {
    let payload: GatewayPayload;
    
    try {
      payload = JSON.parse(data.toString());
    } catch (error) {
      this.emit('error', new Error('Failed to parse gateway payload'));
      return;
    }

    this.handlePayload(payload);
  }

  private onClose(code: number, reason: Buffer): void {
    const reasonString = reason.toString();
    this.emit('close', code, reasonString);

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    this.ws = undefined;
    this.connectionState = 'disconnected';

    // Check if we should reconnect
    if (this.shouldReconnect(code)) {
      this.reconnect();
    }
  }

  private onError(error: Error): void {
    this.emit('error', error);
  }

  private handlePayload(payload: GatewayPayload): void {
    // Update sequence number
    if (payload.s !== null && payload.s !== undefined) {
      this.sequence = payload.s;
    }

    switch (payload.op) {
      case GatewayOPCodes.DISPATCH:
        this.handleDispatch(payload);
        break;
      case GatewayOPCodes.HEARTBEAT:
        this.sendHeartbeat();
        break;
      case GatewayOPCodes.RECONNECT:
        this.reconnect();
        break;
      case GatewayOPCodes.INVALID_SESSION:
        this.handleInvalidSession(payload.d);
        break;
      case GatewayOPCodes.HELLO:
        this.handleHello(payload.d);
        break;
      case GatewayOPCodes.HEARTBEAT_ACK:
        this.lastHeartbeatAck = Date.now();
        break;
    }
  }

  private handleDispatch(payload: GatewayPayload): void {
    switch (payload.t) {
      case 'READY':
        this.handleReady(payload.d);
        break;
      case 'RESUMED':
        this.emit('resumed');
        break;
      default:
        // Emit the event for the client to handle
        this.emit('message', {
          type: payload.t,
          data: payload.d,
        });
        break;
    }
  }

  private handleReady(data: ReadyEvent): void {
    this.sessionId = data.session_id;
    this.resumeURL = data.resume_gateway_url;
    this.emit('ready', data);
  }

  private handleHello(data: GatewayHello): void {
    // Start heartbeat
    this.startHeartbeat(data.heartbeat_interval);
    
    // Send identify or resume
    if (this.sessionId && this.resumeURL) {
      this.resume();
    } else {
      this.identify();
    }
  }

  private handleInvalidSession(resumable: boolean): void {
    if (resumable && this.sessionId) {
      // Wait a bit before resuming
      setTimeout(() => this.resume(), Math.random() * 5000 + 1000);
    } else {
      // Clear session and identify again
      this.sessionId = undefined;
      this.resumeURL = undefined;
      this.sequence = null;
      
      setTimeout(() => this.identify(), Math.random() * 5000 + 1000);
    }
  }

  private startHeartbeat(interval: number): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, interval);

    // Send initial heartbeat
    this.sendHeartbeat();
  }

  private sendHeartbeat(): void {
    this.lastHeartbeat = Date.now();
    this.send({
      op: GatewayOPCodes.HEARTBEAT,
      d: this.sequence,
    });
  }

  private identify(): void {
    const identifyPayload: GatewayIdentify = {
      token: this.token,
      properties: {
        $os: process.platform,
        $browser: 'OvenJS',
        $device: 'OvenJS',
      },
      intents: this.intents,
    };

    if (this.totalShards > 1) {
      identifyPayload.shard = [this.id, this.totalShards];
    }

    if (this.presence) {
      identifyPayload.presence = this.presence;
    }

    this.send({
      op: GatewayOPCodes.IDENTIFY,
      d: identifyPayload,
    });
  }

  private resume(): void {
    if (!this.sessionId || !this.token) {
      this.identify();
      return;
    }

    const resumePayload: GatewayResume = {
      token: this.token,
      session_id: this.sessionId,
      seq: this.sequence ?? 0,
    };

    this.send({
      op: GatewayOPCodes.RESUME,
      d: resumePayload,
    });
  }

  private shouldReconnect(closeCode: number): boolean {
    // Don't reconnect for certain close codes
    const noReconnectCodes = [
      GatewayCloseCodes.AUTHENTICATION_FAILED,
      GatewayCloseCodes.INVALID_SHARD,
      GatewayCloseCodes.SHARDING_REQUIRED,
      GatewayCloseCodes.INVALID_API_VERSION,
      GatewayCloseCodes.INVALID_INTENTS,
      GatewayCloseCodes.DISALLOWED_INTENTS,
    ];

    return !noReconnectCodes.includes(closeCode) && 
           this.reconnectAttempts < this.maxReconnectAttempts;
  }

  private reconnect(): void {
    if (this.connectionState === 'reconnecting') {
      return;
    }

    this.connectionState = 'reconnecting';
    this.reconnectAttempts++;

    const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 30000);
    
    setTimeout(() => {
      this.emit('reconnect');
      
      // Use resume URL if available
      const url = this.resumeURL && this.sessionId ? 
        `${this.resumeURL}?v=10&encoding=json` : 
        this.gatewayURL;
        
      this.gatewayURL = url;
      this.connect();
    }, delay);
  }

  public updatePresence(presence: PresenceUpdate): void {
    this.presence = presence;
    
    this.send({
      op: GatewayOPCodes.PRESENCE_UPDATE,
      d: presence,
    });
  }

  public get latency(): number {
    if (!this.lastHeartbeat || !this.lastHeartbeatAck) {
      return -1;
    }
    
    return this.lastHeartbeatAck - this.lastHeartbeat;
  }

  public get isConnected(): boolean {
    return this.connectionState === 'connected';
  }
}