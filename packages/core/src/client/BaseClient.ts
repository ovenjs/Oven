import type { Bot } from '../Bot';

/**
 * Base class for all clients.
 *
 * @remarks
 * This class provides common functionality for all client implementations.
 */
export abstract class BaseClient {
  /**
   * The bot instance this client belongs to.
   */
  protected readonly bot: Bot;

  /**
   * Creates a new BaseClient instance.
   *
   * @param bot - The bot instance this client belongs to.
   */
  constructor(bot: Bot) {
    this.bot = bot;
  }
}
