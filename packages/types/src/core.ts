/**
 * Core client types for OvenJS
 * Types for the main client, managers, and structures
 */

import type { 
  ClientUser, 
  Guild,
  Message, 
} from './discord/index.js';
import type { 
  UserId,
  GuildId,
  ChannelId,
  MessageId,
  RoleId,
  BotToken
} from './primitives/index.js';

// ========================= CLIENT TYPES =========================

export interface OvenClientOptions {
  token: BotToken;
  intents: number;
  shards?: number | 'auto';
  restOptions?: any;
  wsOptions?: any;
  presence?: PresenceData;
}

export interface PresenceData {
  activities?: ActivityData[];
  status?: 'online' | 'idle' | 'dnd' | 'invisible';
  afk?: boolean;
  since?: number;
}

export interface ActivityData {
  name: string;
  type: ActivityType;
  url?: string;
}

export enum ActivityType {
  Playing = 0,
  Streaming = 1,
  Listening = 2,
  Watching = 3,
  Custom = 4,
  Competing = 5,
}

export interface ClientEvents {
  ready: [client: ClientUser];
  guildCreate: [guild: Guild];
  guildDelete: [guild: Guild];
  guildUpdate: [oldGuild: Guild, newGuild: Guild];
  messageCreate: [message: Message];
  messageUpdate: [oldMessage: Message, newMessage: Message];
  messageDelete: [message: Message];
  error: [error: Error];
  warn: [message: string];
  debug: [message: string];
}

// ========================= MANAGER TYPES =========================

export interface BaseManagerOptions {
  client: any; // Will be OvenClient
  maxSize?: number;
  sweepInterval?: number;
}

export interface CacheManager<K extends string, V> {
  cache: Map<K, V>;
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  size: number;
}

export interface FetchOptions {
  force?: boolean;
  cache?: boolean;
}

// ========================= GUILD MANAGER TYPES =========================

export interface GuildManagerOptions extends BaseManagerOptions {}

export interface GuildCreateData {
  name: string;
  region?: string;
  icon?: string;
  verificationLevel?: number;
  defaultMessageNotifications?: number;
  explicitContentFilter?: number;
  roles?: RoleCreateData[];
  channels?: ChannelCreateData[];
  afkChannelId?: ChannelId;
  afkTimeout?: number;
  systemChannelId?: ChannelId;
}

export interface RoleCreateData {
  name: string;
  permissions?: string;
  color?: number;
  hoist?: boolean;
  mentionable?: boolean;
}

export interface ChannelCreateData {
  name: string;
  type: number;
  topic?: string;
  bitrate?: number;
  userLimit?: number;
  rateLimitPerUser?: number;
  position?: number;
  parentId?: ChannelId;
  nsfw?: boolean;
}

// ========================= USER MANAGER TYPES =========================

export interface UserManagerOptions extends BaseManagerOptions {}

// ========================= CHANNEL MANAGER TYPES =========================

export interface ChannelManagerOptions extends BaseManagerOptions {}

// ========================= MESSAGE MANAGER TYPES =========================

export interface MessageManagerOptions extends BaseManagerOptions {}

// ========================= GUILD CHANNEL MANAGER TYPES =========================

export interface GuildChannelManagerOptions extends BaseManagerOptions {
  guild: Guild;
}

// ========================= GUILD MEMBER MANAGER TYPES =========================

export interface GuildMemberManagerOptions extends BaseManagerOptions {
  guild: Guild;
}

// ========================= STRUCTURE TYPES =========================

export interface StructureOptions {
  client: any; // Will be OvenClient
}

export interface GuildResolvable {
  id: GuildId;
}

export interface UserResolvable {
  id: UserId;
}

export interface ChannelResolvable {
  id: ChannelId;
}

export interface MessageResolvable {
  id: MessageId;
}

export interface RoleResolvable {
  id: RoleId;
}

// ========================= CONFIGURATION TYPES =========================

export interface ClientConfig {
  token: BotToken;
  intents: number;
  shards?: number;
  maxCachedGuilds?: number;
  maxCachedUsers?: number;
  maxCachedChannels?: number;
  maxCachedMessages?: number;
  messageSweepInterval?: number;
  messageCacheLifetime?: number;
  presence?: PresenceData;
  restOptions?: any;
  wsOptions?: any;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
}

// ========================= COLLECTION TYPES =========================

export interface CollectionOptions {
  maxSize?: number;
  sweepInterval?: number;
  lifetime?: number;
}

export interface SweepOptions {
  filter?: (value: any, key: string) => boolean;
  lifetime?: number;
}

// ========================= ERROR TYPES =========================

export class OvenError extends Error {
  public code: string | undefined;
  
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'OvenError';
    this.code = code;
  }
}

export class OvenClientError extends OvenError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'OvenClientError';
  }
}

export class OvenAPIError extends OvenError {
  public status: number | undefined;
  
  constructor(message: string, code?: string, status?: number) {
    super(message, code);
    this.name = 'OvenAPIError';
    this.status = status;
  }
}