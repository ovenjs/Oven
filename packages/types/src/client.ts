import { EventEmitter } from 'events';
import { User, Guild, Channel } from './discord';

export interface ClientOptions {
  token: string;
  intents: number;
  presence?: PresenceData;
  shards?: number | number[] | 'auto';
  shardCount?: number;
  makeCache?: CacheOptions;
  messageCacheLifetime?: number;
  messageSweepInterval?: number;
  invalidRequestWarningInterval?: number;
  partials?: Partials[];
  restTimeOffset?: number;
  restRequestTimeout?: number;
  restSweepInterval?: number;
  restGlobalTimeout?: number;
  retryLimit?: number;
  failIfNotExists?: boolean;
  userAgentSuffix?: string[];
  rejectOnRateLimit?: boolean | string[];
  ws?: WebsocketOptions;
}

export interface WebsocketOptions {
  large_threshold?: number;
  compress?: boolean;
  properties?: {
    $os?: string;
    $browser?: string;
    $device?: string;
  };
}

export interface PresenceData {
  status?: 'online' | 'idle' | 'invisible' | 'dnd';
  afk?: boolean;
  activities?: ActivityData[];
  shardId?: number | number[];
}

export interface ActivityData {
  name: string;
  type: ActivityType;
  url?: string;
}

export enum ActivityType {
  PLAYING = 0,
  STREAMING = 1,
  LISTENING = 2,
  WATCHING = 3,
  CUSTOM = 4,
  COMPETING = 5,
}

export interface CacheOptions {
  GuildManager?: boolean;
  ChannelManager?: boolean;
  UserManager?: boolean;
  MessageManager?: boolean;
  RoleManager?: boolean;
  EmojiManager?: boolean;
}

export enum Partials {
  USER = 'USER',
  CHANNEL = 'CHANNEL',
  GUILD_MEMBER = 'GUILD_MEMBER',
  MESSAGE = 'MESSAGE',
  REACTION = 'REACTION',
  GUILD_SCHEDULED_EVENT = 'GUILD_SCHEDULED_EVENT',
}

export interface ClientEvents {
  ready: [client: Client];
  messageCreate: [message: any];
  messageUpdate: [oldMessage: any, newMessage: any];
  messageDelete: [message: any];
  guildCreate: [guild: Guild];
  guildUpdate: [oldGuild: Guild, newGuild: Guild];
  guildDelete: [guild: Guild];
  channelCreate: [channel: Channel];
  channelUpdate: [oldChannel: Channel, newChannel: Channel];
  channelDelete: [channel: Channel];
  error: [error: Error];
  warn: [warning: string];
  debug: [message: string];
}

export declare interface Client extends EventEmitter {
  on<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
  once<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
  emit<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]): boolean;
}

export interface Client {
  token?: string;
  user?: User;
  readyAt?: Date;
  uptime?: number;
  ping: number;
  isReady(): boolean;
  login(token?: string): Promise<string>;
  destroy(): void;
}