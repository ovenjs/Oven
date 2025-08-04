import { AsyncEventEmitter } from '@vladfrangu/async_event_emitter';
import { fmt } from '@ovendjs/utils';
import type { GatewayReadyDispatchData } from 'discord-api-types/v10';

import { GatewayClient } from './client/GatewayClient';
import { RESTClient } from './client/RESTClient';
import { CacheClient } from './client/CacheClient';
import { EventManager } from './events/EventManager';
import { GuildManager } from './managers/GuildManager';
import { ChannelManager } from './managers/ChannelManager';
import { UserManager } from './managers/UserManager';
import { RoleManager } from './managers/RoleManager';
import { EmojiManager } from './managers/EmojiManager';
import type { BotOptions } from './types';
import { PACKAGE_META } from './types';
import type { BotEvents } from './events/Events';

/**
 * The main Bot class for creating and managing Discord bots.
 *
 * @remarks
 * This is the primary entry point for the OvenJS Core package. It provides a unified interface
 * for interacting with the Discord API, managing resources, and handling events.
 *
 * @example
 * ```ts
 * import { Bot, GatewayIntentBits } from '@ovendjs/core';
 *
 * const bot = new Bot({
 *   intents: [
 *     GatewayIntentBits.Guilds,
 *     GatewayIntentBits.GuildMessages,
 *     GatewayIntentBits.MessageContent,
 *   ],
 * });
 *
 * bot.on('ready', () => {
 *   console.log(`Logged in as ${bot.user.tag}`);
 * });
 *
 * bot.on('messageCreate', (message) => {
 *   if (message.content === '!ping') {
 *     message.reply('Pong!');
 *   }
 * });
 *
 * bot.login('YOUR_BOT_TOKEN');
 * ```
 */
export class Bot extends AsyncEventEmitter<BotEvents> {
  /**
   * The options used to configure the bot.
   */
  public readonly options: BotOptions;

  /**
   * The gateway client for WebSocket connections.
   */
  public readonly gateway: GatewayClient;

  /**
   * The REST client for HTTP requests.
   */
  public readonly rest: RESTClient;

  /**
   * The cache client for data storage.
   */
  public readonly cache: CacheClient;

  /**
   * The event manager for handling events.
   */
  public readonly events: EventManager;

  /**
   * The guild manager for guild-related operations.
   */
  public readonly guilds: GuildManager;

  /**
   * The channel manager for channel-related operations.
   */
  public readonly channels: ChannelManager;

  /**
   * The user manager for user-related operations.
   */
  public readonly users: UserManager;

  /**
   * The role manager for role-related operations.
   */
  public readonly roles: RoleManager;

  /**
   * The emoji manager for emoji-related operations.
   */
  public readonly emojis: EmojiManager;

  /**
   * The bot user. This will be null until the bot is ready.
   */
  public user: GatewayReadyDispatchData['user'] | null = null;

  /**
   * The application object. This will be null until the bot is ready.
   */
  public application: GatewayReadyDispatchData['application'] | null = null;

  /**
   * Whether the bot is ready.
   */
  public isReady: boolean = false;

  /**
   * The debug formatter using @ovendjs/utils
   */
  private readonly debug = fmt(PACKAGE_META);

  /**
   * Creates a new Bot instance.
   *
   * @param options - The options to configure the bot.
   */
  constructor(options: BotOptions) {
    super();

    this.options = options;

    // Initialize clients
    this.cache = new CacheClient(this, options.cache);
    this.rest = new RESTClient(this, options.rest);
    this.gateway = new GatewayClient(this, options.gateway);
    this.events = new EventManager(this);

    // Initialize managers
    this.guilds = new GuildManager(this);
    this.channels = new ChannelManager(this);
    this.users = new UserManager(this);
    this.roles = new RoleManager(this);
    this.emojis = new EmojiManager(this);

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Logs the bot in with the provided token.
   *
   * @param token - The bot token to use for authentication.
   * @returns A promise that resolves when the bot is ready.
   */
  public async login(token: string): Promise<void> {
    this.debug.debug('Logging in...');

    // Set the token for the REST client
    this.rest.setToken(token);

    // Connect to the gateway
    await this.gateway.connect(token);

    this.debug.debug('Login complete');
  }

  /**
   * Destroys the bot and cleans up resources.
   */
  public async destroy(): Promise<void> {
    this.debug.debug('Destroying bot...');

    // Disconnect from the gateway
    await this.gateway.disconnect();

    // Clear the cache
    await this.cache.clear();

    // Remove all event listeners
    this.removeAllListeners();

    this.debug.debug('Bot destroyed');
  }

  /**
   * Sets up the event handlers for the bot.
   */
  private setupEventHandlers(): void {
    // Handle ready event
    this.gateway.on('ready', data => {
      this.user = data.user;
      this.application = data.application;
      this.isReady = true;
      this.events.emit('ready');
      this.debug.debug(`Bot ready as ${this.user?.username}`);
    });

    // Handle other gateway events
    this.gateway.on('dispatch', payload => {
      this.events.handle(payload);
    });

    // Handle errors
    this.gateway.on('error', error => {
      const err = error instanceof Error ? error : new Error(error.message);
      this.events.emit('error', err);
      this.debug.debug(`Gateway error: ${error.message}`);
    });
  }
}
