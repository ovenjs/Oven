import { AsyncEventEmitter } from '@vladfrangu/async_event_emitter';
import {
  GatewayDispatchPayload,
  GatewaySendPayload,
  GatewayOpcodes,
  GatewayCloseCodes,
  GatewayIdentifyData,
} from 'discord-api-types/v10';
import { WebSocket } from 'ws';

import type { WebSocketManagerOptions, WebSocketShardEvents } from '../types';
import { GATEWAY_VERSION, GATEWAY_ENCODING } from '../types';

export class WebSocketShard extends AsyncEventEmitter<WebSocketShardEvents> {
  private ws: WebSocket | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatAcked: boolean = true;
  private sequence: number | null = null;
  private sessionId: string | null = null;
  private readonly shardId: number;
  private readonly options: WebSocketManagerOptions;
  private connectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private connecting: boolean = false;
  private ready: boolean = false;

  constructor(shardId: number, options: WebSocketManagerOptions) {
    super();
    this.shardId = shardId;
    this.options = options;
  }

  async connect(): Promise<void> {
    if (this.connecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.connecting = true;
    this.destroy();

    try {
      const gatewayUrl = await this.getGatewayUrl();
      const url = `${gatewayUrl}?v=${GATEWAY_VERSION}&encoding=${GATEWAY_ENCODING}`;

      this.ws = new WebSocket(url);
      this.setupWebSocketListeners();

      // Set connection timeout
      this.connectTimeout = setTimeout(() => {
        this.connecting = false;
        this.destroy();
        this.emit('error', new Error(`Connection timeout for shard ${this.shardId}`));
      }, 30000);
    } catch (error) {
      this.connecting = false;
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      this.scheduleReconnect();
    }
  }

  private async getGatewayUrl(): Promise<string> {
    // For now, use standard gateway - later integrate with REST
    return 'wss://gateway.discord.gg';
  }

  private setupWebSocketListeners(): void {
    if (!this.ws) return;

    this.ws.on('open', () => {
      this.onOpen();
    });

    this.ws.on('message', data => {
      this.onMessage(data.toString());
    });

    this.ws.on('close', (code, reason) => {
      this.onClose(code, reason.toString());
    });

    this.ws.on('error', error => {
      this.onError(error);
    });
  }

  private onOpen(): void {
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }

    this.connecting = false;
    this.reconnectAttempts = 0;
    this.emit('open');
  }

  private async onMessage(data: string): Promise<void> {
    try {
      const payload = JSON.parse(data);

      switch (payload.op) {
        case GatewayOpcodes.Hello:
          this.onHello(payload.d);
          break;
        case GatewayOpcodes.Heartbeat:
          this.onHeartbeatAck();
          break;
        case GatewayOpcodes.Dispatch:
          await this.onDispatch(payload);
          break;
        case GatewayOpcodes.Reconnect:
          this.onReconnect();
          break;
        case GatewayOpcodes.InvalidSession:
          this.onInvalidSession(payload.d);
          break;
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to parse gateway message: ${error}`));
    }
  }

  private onHello(data: { heartbeat_interval: number }): void {
    const { heartbeat_interval } = data;

    // Start heartbeat
    this.startHeartbeat(heartbeat_interval);

    // Identify or Resume
    if (this.sessionId && this.sequence) {
      this.resume();
    } else {
      this.identify();
    }
  }

  private startHeartbeat(interval: number): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (!this.heartbeatAcked) {
        this.emit(
          'error',
          new Error(`Heartbeat not acknowledged for shard ${this.shardId}`)
        );
        this.destroy();
        this.scheduleReconnect();
        return;
      }

      this.heartbeatAcked = false;
      this.send({
        op: GatewayOpcodes.Heartbeat,
        d: this.sequence,
      });
    }, interval);
  }

  private identify(): void {
    const identifyData: GatewayIdentifyData = {
      token: this.options.token,
      properties: {
        os: this.options.properties?.os ?? process.platform,
        browser: this.options.properties?.browser ?? 'discord-wrapper',
        device: this.options.properties?.device ?? 'discord-wrapper',
      },
      intents: this.options.intents, // Type assertion needed due to discord-api-types
      shard: [this.shardId, this.options.totalShards ?? 1],
    };

    if (this.options.presence) {
      identifyData.presence = this.options.presence;
    }

    if (this.options.compress) {
      identifyData.compress = this.options.compress;
    }

    this.send({
      op: GatewayOpcodes.Identify,
      d: identifyData,
    });
  }

  private resume(): void {
    this.send({
      op: GatewayOpcodes.Resume,
      d: {
        token: this.options.token,
        session_id: this.sessionId!,
        seq: this.sequence!,
      },
    });
  }

  private async onDispatch(payload: GatewayDispatchPayload): Promise<void> {
    if (payload.s !== null) {
      this.sequence = payload.s;
    }

    switch (payload.t) {
      case 'READY':
        this.sessionId = payload.d.session_id;
        this.ready = true;
        this.emit('ready', payload.d);
        break;
      case 'RESUMED':
        this.ready = true;
        this.emit('resumed');
        break;
    }

    // Emit the general dispatch event
    this.emit('dispatch', payload);

    // Emit specific event with original casing for consistency
    // Cast to unknown first, then to the specific event type to satisfy TypeScript
    this.emit(payload.t, payload.d as never);
  }

  private onHeartbeatAck(): void {
    this.heartbeatAcked = true;
  }

  private onReconnect(): void {
    this.destroy();
    this.scheduleReconnect();
  }

  private onInvalidSession(resumable: boolean): void {
    if (resumable) {
      this.resume();
    } else {
      this.sessionId = null;
      this.sequence = null;
      this.ready = false;
      this.scheduleReconnect();
    }
  }

  private onClose(code: number, reason: string): void {
    this.connecting = false;
    this.ready = false;
    this.emit('close', { code, reason });

    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Handle specific close codes
    switch (code) {
      case GatewayCloseCodes.AuthenticationFailed:
        this.emit('error', new Error('Authentication failed'));
        break;
      case GatewayCloseCodes.InvalidShard:
      case GatewayCloseCodes.ShardingRequired:
      case GatewayCloseCodes.InvalidIntents:
      case GatewayCloseCodes.DisallowedIntents:
        this.emit('error', new Error(`Gateway closed with critical error: ${code}`));
        break;
      default:
        // Schedule reconnect for most cases
        this.scheduleReconnect();
    }
  }

  private onError(error: Error): void {
    this.emit('error', error);
  }

  private send(payload: GatewaySendPayload): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private scheduleReconnect(): void {
    // Exponential backoff
    const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts), 60000);
    this.reconnectAttempts++;

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.ready;
  }

  isConnecting(): boolean {
    return this.connecting;
  }

  getShardId(): number {
    return this.shardId;
  }

  destroy(): void {
    this.connecting = false;
    this.ready = false;

    // Clear timeouts
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.removeAllListeners();
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close();
      }
      this.ws = null;
    }
  }
}
