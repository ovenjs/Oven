/**
 * Main OvenJS client
 * Orchestrates REST and WebSocket connections
 */

import { EventEmitter } from 'events';
import { RESTClient } from '@ovenjs/rest';
import { WebSocketClient } from '@ovenjs/ws';
import type { 
  OvenClientOptions, 
  ClientEvents, 
  ClientConfig,
  BotToken,
  OvenClientError,
  User as UserData,
  Guild as GuildData,
  Message as MessageData 
} from '@ovenjs/types';

import { ConfigManager } from '../config/ConfigManager.js';
import { UserManager } from '../managers/UserManager.js';
import { GuildManager } from '../managers/GuildManager.js';
import { ChannelManager } from '../managers/ChannelManager.js';
import { User } from '../structures/User.js';
import { Guild } from '../structures/Guild.js';

export class OvenClient extends EventEmitter {
  public readonly config: ConfigManager;
  public readonly rest: RESTClient;
  public readonly ws: WebSocketClient;
  
  // Managers
  public readonly users: UserManager;
  public readonly guilds: GuildManager;
  public readonly channels: ChannelManager;
  
  // Client state
  public user: User | null = null;
  public readyAt: Date | null = null;
  public isReady: boolean = false;
  
  private _token: BotToken | null = null;

  constructor(options: OvenClientOptions) {
    super();
    
    // Initialize configuration
    this.config = new ConfigManager(options);
    
    // Initialize REST client
    this.rest = new RESTClient({
      token: this.config.getToken(),
      ...this.config.getRestOptions(),
    });
    
    // Initialize WebSocket client
    this.ws = new WebSocketClient({
      token: this.config.getToken(),
      intents: this.config.getIntents(),
      shards: this.config.getShards(),
      ...this.config.getWebSocketOptions(),
    });
    
    // Initialize managers
    const cacheConfig = this.config.getCacheConfig();
    
    this.users = new UserManager({
      client: this,
      maxSize: cacheConfig.maxCachedUsers,
      sweepInterval: cacheConfig.messageSweepInterval,
    });
    
    this.guilds = new GuildManager({
      client: this,
      maxSize: cacheConfig.maxCachedGuilds,
      sweepInterval: cacheConfig.messageSweepInterval,
    });
    
    this.channels = new ChannelManager({
      client: this,
      maxSize: cacheConfig.maxCachedChannels,
      sweepInterval: cacheConfig.messageSweepInterval,
    });
    
    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for WebSocket events
   */
  private setupEventHandlers(): void {
    // Ready event
    this.ws.on('ready', (data: any) => {
      this.user = new User({ client: this }, data.user);
      this.readyAt = new Date();
      this.isReady = true;
      this.emit('ready', this.user);
    });

    // Guild events
    this.ws.on('guildCreate', (data: GuildData) => {
      const guild = new Guild({ client: this }, data);
      this.guilds.set(guild.id as any, guild);
      this.emit('guildCreate', guild);
    });

    this.ws.on('guildUpdate', (data: GuildData) => {
      const oldGuild = this.guilds.get(data.id as any);
      const newGuild = new Guild({ client: this }, data);
      this.guilds.set(data.id as any, newGuild);
      this.emit('guildUpdate', oldGuild, newGuild);
    });

    this.ws.on('guildDelete', (data: GuildData) => {
      const guild = this.guilds.get(data.id as any);
      if (guild) {
        this.guilds.delete(data.id as any);
        this.emit('guildDelete', guild);
      }
    });

    // Message events
    this.ws.on('messageCreate', (data: MessageData) => {
      // Create Message structure and emit event
      this.emit('messageCreate', data);
    });

    this.ws.on('messageUpdate', (data: MessageData) => {
      // Handle message update
      this.emit('messageUpdate', null, data);
    });

    this.ws.on('messageDelete', (data: any) => {
      // Handle message delete
      this.emit('messageDelete', data);
    });

    // User events
    this.ws.on('userUpdate', (data: UserData) => {
      if (data.id === this.user?.id) {
        this.user = new User({ client: this }, data);
      }
      
      const user = new User({ client: this }, data);
      this.users.set(data.id as any, user);
    });

    // Error handling
    this.ws.on('error', (error: Error) => {
      this.emit('error', error);
    });

    this.ws.on('warn', (message: string) => {
      this.emit('warn', message);
    });

    this.ws.on('debug', (message: string) => {
      this.emit('debug', message);
    });
  }

  /**
   * Login and connect to Discord
   */
  async login(token?: BotToken): Promise<void> {
    if (token) {
      this._token = token;
      this.config.update({ token });
    }

    if (!this._token) {
      throw new Error('No token provided');
    }

    try {
      // Connect WebSocket
      await this.ws.connect();
      
      this.emit('debug', 'Client logged in successfully');
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Logout and disconnect from Discord
   */
  async logout(): Promise<void> {
    try {
      await this.ws.disconnect();
      this.user = null;
      this.readyAt = null;
      this.isReady = false;
      this._token = null;
      
      this.emit('debug', 'Client logged out successfully');
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Destroy the client and clean up resources
   */
  async destroy(): Promise<void> {
    await this.logout();
    
    // Clean up managers
    this.users.destroy();
    this.guilds.destroy();
    this.channels.destroy();
    
    // Remove all listeners
    this.removeAllListeners();
    
    this.emit('debug', 'Client destroyed successfully');
  }

  /**
   * Get the client's uptime in milliseconds
   */
  get uptime(): number | null {
    return this.readyAt ? Date.now() - this.readyAt.getTime() : null;
  }

  /**
   * Get the client's ping to Discord
   */
  get ping(): number {
    return 0; // TODO: Implement ping calculation
  }

  /**
   * Get the number of guilds the client is in
   */
  get guildCount(): number {
    return this.guilds.size;
  }

  /**
   * Get the number of users the client can see
   */
  get userCount(): number {
    return this.users.size;
  }

  /**
   * Get the number of channels the client can see
   */
  get channelCount(): number {
    return this.channels.size;
  }

  /**
   * Set the client's presence
   */
  async setPresence(presence: any): Promise<void> {
    await this.ws.updatePresence(presence);
  }

  /**
   * Set the client's activity
   */
  async setActivity(activity: any): Promise<void> {
    await this.setPresence({
      activities: [activity],
      status: 'online',
    });
  }

  /**
   * Set the client's status
   */
  async setStatus(status: 'online' | 'idle' | 'dnd' | 'invisible'): Promise<void> {
    await this.setPresence({
      activities: [],
      status,
    });
  }

  /**
   * Broadcast a message to all shards
   */
  broadcast(payload: any): Promise<number> {
    return Promise.resolve(this.ws.broadcast(payload));
  }

  /**
   * Get client statistics
   */
  getStats(): {
    guilds: number;
    users: number;
    channels: number;
    uptime: number | null;
    ping: number;
    memoryUsage: NodeJS.MemoryUsage;
  } {
    return {
      guilds: this.guildCount,
      users: this.userCount,
      channels: this.channelCount,
      uptime: this.uptime,
      ping: this.ping,
      memoryUsage: process.memoryUsage(),
    };
  }

  /**
   * Wait for the client to be ready
   */
  async waitForReady(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isReady) {
        resolve();
      } else {
        this.once('ready', () => resolve());
      }
    });
  }

  /**
   * Get application information
   */
  async fetchApplication(): Promise<any> {
    return await this.rest.request({ method: 'GET', path: '/applications/@me' });
  }

  /**
   * Get client invite link
   */
  generateInvite(options: {
    scopes?: string[];
    permissions?: string;
    guildId?: string;
    disableGuildSelect?: boolean;
  } = {}): string {
    const defaultScopes = ['bot', 'applications.commands'];
    const scopes = options.scopes ?? defaultScopes;
    const permissions = options.permissions ?? '0';
    
    const params = new URLSearchParams();
    params.set('client_id', this.user?.id || '');
    params.set('scope', scopes.join(' '));
    params.set('permissions', permissions);
    
    if (options.guildId) {
      params.set('guild_id', options.guildId);
    }
    
    if (options.disableGuildSelect) {
      params.set('disable_guild_select', 'true');
    }
    
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Convert to JSON representation
   */
  override toJSON(): Record<string, any> {
    return {
      user: this.user?.toJSON(),
      guilds: this.guildCount,
      users: this.userCount,
      channels: this.channelCount,
      uptime: this.uptime,
      ping: this.ping,
      isReady: this.isReady,
      readyAt: this.readyAt?.toISOString(),
    };
  }

  /**
   * String representation
   */
  toString(): string {
    return `OvenClient(${this.user?.tag || 'Not logged in'})`;
  }
}