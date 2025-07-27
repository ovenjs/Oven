/**
 * Client-specific types for OvenJS
 */

import type { GatewayIntentBits } from 'discord-api-types/v10';
import type { BotToken } from '../primitives/brand.js';

/**
 * Configuration options for OvenClient
 */
export interface OvenClientOptions {
  /** Bot token for authentication */
  token?: BotToken;

  /** Gateway intents */
  intents: number | GatewayIntentBits[];

  /** Shard configuration */
  shards?: number | number[] | 'auto';

  /** REST API configuration */
  rest?: {
    timeout?: number;
    retries?: number;
    version?: number;
    baseURL?: string;
    userAgent?: string;
    rateLimitOffset?: number;
    globalRequestsPerSecond?: number;
  };

  /** WebSocket configuration */
  ws?: {
    compress?: boolean;
    encoding?: 'json' | 'etf';
    version?: number;
    largeThreshold?: number;
    presence?: PresenceData;
  };

  /** Cache configuration */
  cache?: {
    maxCachedUsers?: number;
    maxCachedGuilds?: number;
    maxCachedChannels?: number;
    messageSweepInterval?: number;
  };
}

/**
 * Client configuration interface
 */
export interface ClientConfig {
  token: BotToken;
  intents: number;
  shards: number | number[] | 'auto';
  restOptions: RESTConfig;
  wsOptions: WebSocketConfig;
  cacheConfig: CacheConfig;
}

/**
 * REST configuration
 */
export interface RESTConfig {
  timeout: number;
  retries: number;
  version: number;
  baseURL: string;
  userAgent: string;
  rateLimitOffset: number;
  globalRequestsPerSecond: number;
}

/**
 * WebSocket configuration
 */
export interface WebSocketConfig {
  compress: boolean;
  encoding: 'json' | 'etf';
  version: number;
  largeThreshold: number;
  presence?: PresenceData;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxCachedUsers: number;
  maxCachedGuilds: number;
  maxCachedChannels: number;
  messageSweepInterval: number;
}

/**
 * Presence data for client
 */
export interface PresenceData {
  activities?: ActivityData[];
  status?: 'online' | 'dnd' | 'idle' | 'invisible';
  afk?: boolean;
  since?: number | null;
}

/**
 * Activity data
 */
export interface ActivityData {
  name: string;
  type: number;
  url?: string;
}

/**
 * Client events interface
 */
export interface ClientEvents {
  ready: [user: any];
  error: [error: Error];
  warn: [message: string];
  debug: [message: string];
  guildCreate: [guild: any];
  guildUpdate: [oldGuild: any | null, newGuild: any];
  guildDelete: [guild: any];
  messageCreate: [message: any];
  messageUpdate: [oldMessage: any | null, newMessage: any];
  messageDelete: [message: any];
  userUpdate: [oldUser: any | null, newUser: any];
}

/**
 * Client error types
 */
export interface OvenClientError extends Error {
  code?: string;
  status?: number;
}