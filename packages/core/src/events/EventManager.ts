import { AsyncEventEmitter } from '@vladfrangu/async_event_emitter';
import type { GatewayDispatchPayload } from 'discord-api-types/v10';

import type { Bot } from '../Bot';
import type { BotEvents } from './Events';

/**
 * Manager for handling Discord events.
 *
 * @remarks
 * This class provides a centralized way to handle Discord events
 * and route them to the appropriate handlers.
 */
export class EventManager {
  /**
   * The bot instance this manager belongs to.
   */
  private readonly bot: Bot;

  /**
   * The event emitter for bot events.
   */
  private readonly emitter: AsyncEventEmitter<BotEvents>;

  /**
   * Creates a new EventManager instance.
   *
   * @param bot - The bot instance this manager belongs to.
   */
  constructor(bot: Bot) {
    this.bot = bot;
    this.emitter = new AsyncEventEmitter();
  }

  /**
   * Handles a gateway dispatch payload.
   *
   * @param payload - The gateway dispatch payload to handle.
   */
  public handle(payload: GatewayDispatchPayload): void {
    if (!payload.t) {
      return;
    }

    // Emit the event with the payload data
    this.emitter.emit(payload.t as any, payload.d);
  }

  /**
   * Listens for an event.
   *
   * @param event - The event to listen for.
   * @param listener - The listener to call when the event is emitted.
   * @returns The event manager instance for chaining.
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
   * @returns The event manager instance for chaining.
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
   * @returns The event manager instance for chaining.
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

  /**
   * Gets the event emitter instance.
   *
   * @returns The event emitter instance.
   */
  public getEmitter(): AsyncEventEmitter<BotEvents> {
    return this.emitter;
  }

  /**
   * Removes all listeners for all events.
   *
   * @returns The event manager instance for chaining.
   */
  public removeAllListeners(): this {
    this.emitter.removeAllListeners();
    return this;
  }

  /**
   * Gets the number of listeners for an event.
   *
   * @param event - The event to get the listener count for.
   * @returns The number of listeners for the event.
   */
  public listenerCount(event: string): number {
    return this.emitter.listenerCount(event);
  }

  /**
   * Gets the event names.
   *
   * @returns An array of event names.
   */
  public eventNames(): string[] {
    return this.emitter.eventNames() as string[];
  }
}
