import type {
  GatewayIntentBits,
  GatewayPresenceUpdateData,
  GatewayIdentifyProperties,
} from 'discord-api-types/v10';
import type { FmtPackage } from '@ovendjs/utils';

export const PACKAGE_META: FmtPackage = {
  name: 'core',
  version: '[VI]{{inject}}[/VI]',
};

/**
 * Configuration options for the Bot client.
 *
 * @remarks
 * This interface defines the configuration options for creating a new Bot instance.
 * It includes settings for intents, presence, and other bot behaviors.
 */
export interface BotOptions {
  /**
   * The intents to use for the bot.
   *
   * @remarks
   * Intents determine which events your bot will receive from Discord.
   * You must specify the intents your bot needs to function properly.
   *
   * @example
   * ```ts
   * const bot = new Bot({
   *   intents: [
   *     GatewayIntentBits.Guilds,
   *     GatewayIntentBits.GuildMessages,
   *     GatewayIntentBits.MessageContent,
   *   ],
   * });
   * ```
   */
  intents: GatewayIntentBits[];

  /**
   * The presence data to send when the bot starts.
   *
   * @remarks
   * This is optional and will set the bot's initial status (online, idle, dnd, invisible)
   * and activity (playing, streaming, listening, watching, competing).
   *
   * @example
   * ```ts
   * const bot = new Bot({
   *   intents: [GatewayIntentBits.Guilds],
   *   presence: {
   *     status: 'idle',
   *     activities: [{
   *       name: 'with TypeScript',
   *       type: ActivityType.Playing,
   *     }],
   *   },
   * });
   * ```
   */
  presence?: GatewayPresenceUpdateData;

  /**
   * The identify properties to send when connecting to the gateway.
   *
   * @remarks
   * This is optional and Discord will use default values if not provided.
   *
   * @example
   * ```ts
   * const bot = new Bot({
   *   intents: [GatewayIntentBits.Guilds],
   *   properties: {
   *     browser: 'OvenJS',
   *     device: 'OvenJS',
   *     os: 'Linux',
   *   },
   * });
   * ```
   */
  properties?: GatewayIdentifyProperties;

  /**
   * The total number of shards to use for the bot.
   *
   * @remarks
   * This is optional and Discord will automatically determine the optimal number
   * of shards if not provided. Only set this if you know what you're doing.
   *
   * @default null (auto-sharding)
   */
  shardCount?: number;

  /**
   * The shard IDs to use for this bot instance.
   *
   * @remarks
   * This is optional and only needed if you're running multiple bot instances
   * with different shard ranges. If not provided, the bot will use all shards
   * specified in shardCount.
   *
   * @default [0, shardCount - 1]
   */
  shardIds?: number[];

  /**
   * Whether to disable caching for the bot.
   *
   * @remarks
   * This is optional and defaults to false. Disabling caching will reduce memory
   * usage but may impact performance as data will need to be fetched from the API
   * more often.
   *
   * @default false
   */
  disableCache?: boolean;

  /**
   * The cache settings for the bot.
   *
   * @remarks
   * This is optional and allows fine-tuning of the cache behavior.
   * You can specify which types of objects to cache and for how long.
   *
   * @example
   * ```ts
   * const bot = new Bot({
   *   intents: [GatewayIntentBits.Guilds],
   *   cache: {
   *     guilds: true,
   *     channels: true,
   *     users: true,
   *     members: true,
   *     roles: true,
   *     messages: false, // Don't cache messages to save memory
   *   },
   * });
   * ```
   */
  cache?: CacheOptions;

  /**
   * The REST client options for the bot.
   *
   * @remarks
   * This is optional and allows configuration of the HTTP client used for
   * making requests to the Discord API.
   */
  rest?: RESTOptions;

  /**
   * The gateway client options for the bot.
   *
   * @remarks
   * This is optional and allows configuration of the WebSocket client used for
   * connecting to the Discord Gateway.
   */
  gateway?: GatewayOptions;
}

/**
 * Cache options for the bot.
 *
 * @remarks
 * This interface defines which types of objects should be cached and for how long.
 * All properties are optional and default to true.
 */
export interface CacheOptions {
  /**
   * Whether to cache guild objects.
   *
   * @default true
   */
  guilds?: boolean;

  /**
   * Whether to cache channel objects.
   *
   * @default true
   */
  channels?: boolean;

  /**
   * Whether to cache user objects.
   *
   * @default true
   */
  users?: boolean;

  /**
   * Whether to cache guild member objects.
   *
   * @default true
   */
  members?: boolean;

  /**
   * Whether to cache role objects.
   *
   * @default true
   */
  roles?: boolean;

  /**
   * Whether to cache emoji objects.
   *
   * @default true
   */
  emojis?: boolean;

  /**
   * Whether to cache message objects.
   *
   * @default false
   */
  messages?: boolean;

  /**
   * Whether to cache presence objects.
   *
   * @default false
   */
  presences?: boolean;

  /**
   * Whether to cache voice state objects.
   *
   * @default true
   */
  voiceStates?: boolean;

  /**
   * The time-to-live for cached objects in milliseconds.
   *
   * @remarks
   * This is optional and defaults to Infinity (no expiration).
   * Set this to a value to automatically remove old objects from the cache.
   *
   * @default Infinity
   */
  ttl?: number;
}

/**
 * REST client options for the bot.
 *
 * @remarks
 * This interface defines configuration options for the HTTP client used for
 * making requests to the Discord API.
 */
export interface RESTOptions {
  /**
   * The API version to use.
   *
   * @remarks
   * This is optional and defaults to 10, which is the latest stable version.
   *
   * @default 10
   */
  version?: number;

  /**
   * The timeout for HTTP requests in milliseconds.
   *
   * @remarks
   * This is optional and defaults to 15000 (15 seconds).
   *
   * @default 15000
   */
  timeout?: number;

  /**
   * The base URL for the Discord API.
   *
   * @remarks
   * This is optional and defaults to 'https://discord.com/api'.
   * Only change this if you're using a custom API endpoint.
   *
   * @default 'https://discord.com/api'
   */
  apiURL?: string;

  /**
   * The User-Agent string to send with requests.
   *
   * @remarks
   * This is optional and will be automatically generated if not provided.
   *
   * @default 'OvenJS (https://github.com/ovenjs, 0.0.0)'
   */
  userAgent?: string;

  /**
   * Whether to automatically retry requests on rate limits.
   *
   * @remarks
   * This is optional and defaults to true.
   *
   * @default true
   */
  retryOnRateLimit?: boolean;

  /**
   * The maximum number of retries for a request.
   *
   * @remarks
   * This is optional and defaults to 3.
   *
   * @default 3
   */
  maxRetries?: number;

  /**
   * The delay between retries in milliseconds.
   *
   * @remarks
   * This is optional and defaults to 1000 (1 second).
   *
   * @default 1000
   */
  retryDelay?: number;
}

/**
 * Gateway client options for the bot.
 *
 * @remarks
 * This interface defines configuration options for the WebSocket client used for
 * connecting to the Discord Gateway.
 */
export interface GatewayOptions {
  /**
   * Whether to compress gateway data.
   *
   * @remarks
   * This is optional and defaults to false.
   * Enabling compression can reduce bandwidth usage but increases CPU usage.
   *
   * @default false
   */
  compress?: boolean;

  /**
   * The large threshold for guild member chunks.
   *
   * @remarks
   * This is optional and defaults to 50.
   * This value determines how many members a guild needs to have before
   * the gateway sends member chunks instead of all members at once.
   *
   * @default 50
   */
  largeThreshold?: number;

  /**
   * The gateway URL to connect to.
   *
   * @remarks
   * This is optional and will be automatically fetched from Discord if not provided.
   * Only change this if you're using a custom gateway endpoint.
   *
   * @default null (auto-fetch)
   */
  gatewayURL?: string;

  /**
   * The timeout for gateway operations in milliseconds.
   *
   * @remarks
   * This is optional and defaults to 30000 (30 seconds).
   *
   * @default 30000
   */
  timeout?: number;

  /**
   * The interval for heartbeats in milliseconds.
   *
   * @remarks
   * This is optional and will be automatically determined by Discord if not provided.
   * Only change this if you know what you're doing.
   *
   * @default null (auto-determine)
   */
  heartbeatInterval?: number;

  /**
   * Whether to automatically reconnect on disconnection.
   *
   * @remarks
   * This is optional and defaults to true.
   *
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * The maximum number of reconnection attempts.
   *
   * @remarks
   * This is optional and defaults to 5.
   *
   * @default 5
   */
  maxReconnectAttempts?: number;

  /**
   * The delay between reconnection attempts in milliseconds.
   *
   * @remarks
   * This is optional and defaults to 5000 (5 seconds).
   *
   * @default 5000
   */
  reconnectDelay?: number;
}