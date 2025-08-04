import { AsyncEventEmitter } from '@vladfrangu/async_event_emitter';
import { WebSocketManager } from '@ovendjs/gateway';
import type {
  GatewayDispatchPayload,
  GatewayReadyDispatchData,
} from 'discord-api-types/v10';

import { BaseClient } from './BaseClient';
import type { Bot } from '../Bot';
import type { GatewayOptions } from '../types';

/**
 * Client for handling Gateway connections.
 *
 * @remarks
 * This class wraps the WebSocketManager from @ovendjs/gateway and provides
 * a simplified interface for the core package.
 */
export class GatewayClient extends BaseClient {
  /**
   * The underlying WebSocketManager instance.
   */
  private manager: WebSocketManager | null = null;

  /**
   * The event emitter for gateway events.
   */
  private readonly emitter: AsyncEventEmitter;

  /**
   * Creates a new GatewayClient instance.
   *
   * @param bot - The bot instance this client belongs to.
   * @param options - The options for the gateway client.
   */
  constructor(bot: Bot, options: GatewayOptions = {}) {
    super(bot);
    this.emitter = new AsyncEventEmitter();
  }

  /**
   * Connects to the Discord Gateway.
   *
   * @param token - The bot token to use for authentication.
   * @returns A promise that resolves when the connection is established.
   */
  public async connect(token: string): Promise<void> {
    if (this.manager) {
      throw new Error('Gateway is already connected');
    }

    // Create the WebSocketManager with the bot's options
    // Convert intents array to bitmask
    const intents = this.bot.options.intents.reduce((acc, intent) => acc | intent, 0);

    this.manager = new WebSocketManager({
      token,
      intents,
      presence: this.bot.options.presence,
      properties: this.bot.options.properties,
      shardCount: this.bot.options.shardCount,
    });

    // Set up event handlers
    this.setupEventHandlers();

    // Connect to the gateway
    await this.manager.connect();
  }

  /**
   * Disconnects from the Discord Gateway.
   *
   * @returns A promise that resolves when the connection is closed.
   */
  public async disconnect(): Promise<void> {
    if (!this.manager) {
      return;
    }

    await this.manager.disconnect();
    this.manager = null;
  }

  /**
   * Sets up the event handlers for the gateway.
   */
  private setupEventHandlers(): void {
    if (!this.manager) {
      return;
    }

    // Forward ready event
    this.manager.on('READY', (data: GatewayReadyDispatchData) => {
      this.emitter.emit('ready', data);
    });

    // Forward all dispatch events
    this.manager.on('dispatch', (payload: GatewayDispatchPayload) => {
      this.emitter.emit('dispatch', payload);

      // Forward specific events with proper typing
      if (payload.t) {
        this.emitter.emit(payload.t, payload.d);
      }
    });

    // Forward error events
    this.manager.on('error', error => {
      this.emitter.emit('error', error);
    });
  }

  /**
   * Listens for an event.
   *
   * @param event - The event to listen for.
   * @param listener - The listener to call when the event is emitted.
   * @returns The gateway client instance for chaining.
   */
  public on(event: string, listener: (...args: any[]) => void | Promise<void>): this {
    this.emitter.on(event, listener);
    return this;
  }

  /**
   * Listens for an event once.
   *
   * @param event - The event to listen for.
   * @param listener - The listener to call when the event is emitted.
   * @returns The gateway client instance for chaining.
   */
  public once(event: string, listener: (...args: any[]) => void | Promise<void>): this {
    this.emitter.once(event, listener);
    return this;
  }

  /**
   * Removes a listener for an event.
   *
   * @param event - The event to remove the listener for.
   * @param listener - The listener to remove.
   * @returns The gateway client instance for chaining.
   */
  public off(event: string, listener: (...args: any[]) => void | Promise<void>): this {
    this.emitter.off(event, listener);
    return this;
  }

  /**
   * Emits an event.
   *
   * @param event - The event to emit.
   * @param args - The arguments to pass to the listeners.
   * @returns Whether the event had listeners.
   */
  public emit(event: string, ...args: any[]): boolean {
    return this.emitter.emit(event, ...args);
  }
}
