import type { Bot } from '../Bot';

/**
 * Base class for all managers.
 *
 * @remarks
 * This class provides common functionality for all manager implementations.
 */
export abstract class BaseManager {
  /**
   * The bot instance this manager belongs to.
   */
  protected readonly bot: Bot;

  /**
   * Creates a new BaseManager instance.
   *
   * @param bot - The bot instance this manager belongs to.
   */
  constructor(bot: Bot) {
    this.bot = bot;
  }

  /**
   * Gets the cache client for this manager.
   *
   * @returns The cache client.
   */
  protected get cache() {
    return this.bot.cache;
  }

  /**
   * Gets the REST client for this manager.
   *
   * @returns The REST client.
   */
  protected get rest() {
    return this.bot.rest;
  }

  /**
   * Gets the event manager for this manager.
   *
   * @returns The event manager.
   */
  protected get events() {
    return this.bot.events;
  }
}
