import { EventEmitter } from 'events';
import type { 
  ClientOptions, 
  ClientEvents, 
  User, 
  GatewayIntents,
  CreateMessageData,
  PresenceUpdate 
} from '@ovenjs/types';
import { RESTManager } from '@ovenjs/rest';
import { WebSocketManager } from '@ovenjs/ws';
import { GuildManager } from './managers/GuildManager';
import { ChannelManager } from './managers/ChannelManager';
import { UserManager } from './managers/UserManager';

export declare interface Client extends EventEmitter {
  on<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
  once<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
  emit<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]): boolean;
}

export class Client extends EventEmitter {
  public readonly rest: RESTManager;
  public readonly ws: WebSocketManager;
  
  // Managers
  public readonly guilds: GuildManager;
  public readonly channels: ChannelManager;
  public readonly users: UserManager;

  // Client properties
  public user?: User;
  public readyAt?: Date;
  public token?: string;

  private options: ClientOptions;
  private _readyTimestamp?: number;

  constructor(options?: Partial<ClientOptions>) {
    super();

    this.options = {
      intents: GatewayIntents.GUILDS | GatewayIntents.GUILD_MESSAGES,
      ...options,
    } as ClientOptions;

    // Initialize REST manager
    this.rest = new RESTManager({
      timeout: 15000,
      retries: 3,
    });

    // Initialize WebSocket manager (will be created on login)
    this.ws = new WebSocketManager({
      token: this.options.token,
      intents: this.options.intents,
      presence: this.options.presence,
    });

    // Initialize managers
    this.guilds = new GuildManager(this);
    this.channels = new ChannelManager(this);
    this.users = new UserManager(this);

    this.setupEventHandlers();
  }

  /**
   * Login to Discord with a bot token
   */
  public async login(token?: string): Promise<string> {
    const finalToken = token ?? this.options.token;
    
    if (!finalToken) {
      throw new Error('No token provided');
    }

    this.token = finalToken;
    this.rest.setToken(finalToken);

    try {
      // Test the token by fetching current user
      const user = await this.rest.getCurrentUser();
      this.user = user;

      // Connect to gateway
      await this.ws.connect();

      return finalToken;
    } catch (error) {
      throw new Error(`Failed to login: ${error}`);
    }
  }

  /**
   * Destroy the client
   */
  public destroy(): void {
    this.ws.disconnect();
    this.removeAllListeners();
    this._readyTimestamp = undefined;
    this.readyAt = undefined;
    this.user = undefined;
  }

  /**
   * Check if the client is ready
   */
  public isReady(): boolean {
    return this.ws.isConnected && !!this.user;
  }

  /**
   * Get the client's uptime in milliseconds
   */
  public get uptime(): number | null {
    return this._readyTimestamp ? Date.now() - this._readyTimestamp : null;
  }

  /**
   * Get the average ping of all shards
   */
  public get ping(): number {
    return this.ws.ping;
  }

  /**
   * Update the client's presence
   */
  public setPresence(presence: PresenceUpdate): void {
    this.ws.updatePresence(presence);
  }

  /**
   * Set the client's activity
   */
  public setActivity(name: string, options?: { type?: number; url?: string }): void {
    const presence: PresenceUpdate = {
      activities: [{
        name,
        type: options?.type ?? 0,
        url: options?.url,
      }],
      status: 'online',
      since: null,
      afk: false,
    };

    this.setPresence(presence);
  }

  /**
   * Set the client's status
   */
  public setStatus(status: 'online' | 'idle' | 'dnd' | 'invisible'): void {
    const presence: PresenceUpdate = {
      activities: [],
      status,
      since: null,
      afk: status === 'idle',
    };

    this.setPresence(presence);
  }

  private setupEventHandlers(): void {
    // WebSocket events
    this.ws.on('shardReady', (shardId, data) => {
      if (shardId === 0) {
        // Only emit ready for the first shard to avoid multiple ready events
        this._readyTimestamp = Date.now();
        this.readyAt = new Date(this._readyTimestamp);
        this.user = data.user;
        this.emit('ready', this);
      }
    });

    this.ws.on('message', (shardId, message) => {
      this.handleGatewayEvent(message);
    });

    this.ws.on('shardError', (shardId, error) => {
      this.emit('error', error);
    });

    this.ws.on('shardClose', (shardId, code, reason) => {
      if (code !== 1000) {
        this.emit('warn', `Shard ${shardId} closed with code ${code}: ${reason}`);
      }
    });

    this.ws.on('shardReconnect', (shardId) => {
      this.emit('debug', `Shard ${shardId} is reconnecting`);
    });

    this.ws.on('shardResume', (shardId) => {
      this.emit('debug', `Shard ${shardId} resumed`);
    });
  }

  private handleGatewayEvent(message: { type: string; data: any }): void {
    switch (message.type) {
      case 'MESSAGE_CREATE':
        this.emit('messageCreate', message.data);
        break;
      case 'MESSAGE_UPDATE':
        this.emit('messageUpdate', null, message.data); // Old message would need caching
        break;
      case 'MESSAGE_DELETE':
        this.emit('messageDelete', message.data);
        break;
      case 'GUILD_CREATE':
        this.emit('guildCreate', message.data);
        break;
      case 'GUILD_UPDATE':
        this.emit('guildUpdate', null, message.data); // Old guild would need caching
        break;
      case 'GUILD_DELETE':
        this.emit('guildDelete', message.data);
        break;
      case 'CHANNEL_CREATE':
        this.emit('channelCreate', message.data);
        break;
      case 'CHANNEL_UPDATE':
        this.emit('channelUpdate', null, message.data); // Old channel would need caching
        break;
      case 'CHANNEL_DELETE':
        this.emit('channelDelete', message.data);
        break;
      default:
        // Emit debug for unhandled events
        this.emit('debug', `Unhandled gateway event: ${message.type}`);
        break;
    }
  }

  // Utility methods for common operations
  
  /**
   * Send a message to a channel
   */
  public async sendMessage(channelId: string, content: string | CreateMessageData): Promise<any> {
    const data = typeof content === 'string' ? { content } : content;
    return await this.rest.createMessage(channelId, data);
  }

  /**
   * Fetch a user by ID
   */
  public async fetchUser(userId: string): Promise<any> {
    return await this.rest.getUser(userId);
  }

  /**
   * Fetch a guild by ID
   */
  public async fetchGuild(guildId: string): Promise<any> {
    return await this.rest.getGuild(guildId);
  }

  /**
   * Fetch a channel by ID
   */
  public async fetchChannel(channelId: string): Promise<any> {
    return await this.rest.getChannel(channelId);
  }
}