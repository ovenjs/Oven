import type { 
  APIRequest, 
  APIResponse, 
  RESTOptions,
  CreateMessageData,
  EditMessageData,
  ModifyGuildData,
  CreateChannelData
} from '@ovenjs/types';
import { RequestHandler } from './RequestHandler';
import { Routes, HTTPMethods } from './constants';

export class RESTManager {
  private requestHandler: RequestHandler;
  private options: RESTOptions;

  constructor(options: RESTOptions = {}) {
    this.options = {
      version: '10',
      timeout: 15000,
      retries: 3,
      ...options,
    };

    this.requestHandler = new RequestHandler({
      timeout: this.options.timeout,
      retries: this.options.retries,
      userAgent: this.options.userAgentAppendix ? 
        `OvenJS (https://github.com/ovenjs/oven, 0.1.0) ${this.options.userAgentAppendix}` :
        undefined,
    });
  }

  public setToken(token: string): void {
    this.requestHandler.setToken(token);
  }

  // Gateway endpoints
  public async getGateway(): Promise<{ url: string }> {
    const response = await this.request({
      method: HTTPMethods.GET,
      path: Routes.GATEWAY,
    });
    return response.data;
  }

  public async getGatewayBot(): Promise<{ url: string; shards: number; session_start_limit: any }> {
    const response = await this.request({
      method: HTTPMethods.GET,
      path: Routes.GATEWAY_BOT,
    });
    return response.data;
  }

  // Channel endpoints
  public async getChannel(channelId: string): Promise<any> {
    const response = await this.request({
      method: HTTPMethods.GET,
      path: Routes.CHANNEL.replace('{channel.id}', channelId),
    });
    return response.data;
  }

  public async getChannelMessages(channelId: string, options: {
    around?: string;
    before?: string;
    after?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    const query = new URLSearchParams();
    
    if (options.around) query.append('around', options.around);
    if (options.before) query.append('before', options.before);
    if (options.after) query.append('after', options.after);
    if (options.limit) query.append('limit', options.limit.toString());

    const queryString = query.toString();
    const path = Routes.CHANNEL_MESSAGES.replace('{channel.id}', channelId) + 
                 (queryString ? `?${queryString}` : '');

    const response = await this.request({
      method: HTTPMethods.GET,
      path,
    });
    return response.data;
  }

  public async createMessage(channelId: string, data: CreateMessageData): Promise<any> {
    const response = await this.request({
      method: HTTPMethods.POST,
      path: Routes.CHANNEL_MESSAGES.replace('{channel.id}', channelId),
      data,
      files: data.files,
    });
    return response.data;
  }

  public async editMessage(channelId: string, messageId: string, data: EditMessageData): Promise<any> {
    const response = await this.request({
      method: HTTPMethods.PATCH,
      path: Routes.CHANNEL_MESSAGE
        .replace('{channel.id}', channelId)
        .replace('{message.id}', messageId),
      data,
      files: data.files,
    });
    return response.data;
  }

  public async deleteMessage(channelId: string, messageId: string): Promise<void> {
    await this.request({
      method: HTTPMethods.DELETE,
      path: Routes.CHANNEL_MESSAGE
        .replace('{channel.id}', channelId)
        .replace('{message.id}', messageId),
    });
  }

  public async triggerTyping(channelId: string): Promise<void> {
    await this.request({
      method: HTTPMethods.POST,
      path: Routes.CHANNEL_TYPING.replace('{channel.id}', channelId),
    });
  }

  // Guild endpoints
  public async getGuild(guildId: string): Promise<any> {
    const response = await this.request({
      method: HTTPMethods.GET,
      path: Routes.GUILD.replace('{guild.id}', guildId),
    });
    return response.data;
  }

  public async modifyGuild(guildId: string, data: ModifyGuildData): Promise<any> {
    const response = await this.request({
      method: HTTPMethods.PATCH,
      path: Routes.GUILD.replace('{guild.id}', guildId),
      data,
    });
    return response.data;
  }

  public async getGuildChannels(guildId: string): Promise<any[]> {
    const response = await this.request({
      method: HTTPMethods.GET,
      path: Routes.GUILD_CHANNELS.replace('{guild.id}', guildId),
    });
    return response.data;
  }

  public async createGuildChannel(guildId: string, data: CreateChannelData): Promise<any> {
    const response = await this.request({
      method: HTTPMethods.POST,
      path: Routes.GUILD_CHANNELS.replace('{guild.id}', guildId),
      data,
    });
    return response.data;
  }

  public async getGuildMember(guildId: string, userId: string): Promise<any> {
    const response = await this.request({
      method: HTTPMethods.GET,
      path: Routes.GUILD_MEMBER
        .replace('{guild.id}', guildId)
        .replace('{user.id}', userId),
    });
    return response.data;
  }

  public async getGuildMembers(guildId: string, options: {
    limit?: number;
    after?: string;
  } = {}): Promise<any[]> {
    const query = new URLSearchParams();
    
    if (options.limit) query.append('limit', options.limit.toString());
    if (options.after) query.append('after', options.after);

    const queryString = query.toString();
    const path = Routes.GUILD_MEMBERS.replace('{guild.id}', guildId) + 
                 (queryString ? `?${queryString}` : '');

    const response = await this.request({
      method: HTTPMethods.GET,
      path,
    });
    return response.data;
  }

  // User endpoints
  public async getUser(userId: string): Promise<any> {
    const response = await this.request({
      method: HTTPMethods.GET,
      path: Routes.USER.replace('{user.id}', userId),
    });
    return response.data;
  }

  public async getCurrentUser(): Promise<any> {
    const response = await this.request({
      method: HTTPMethods.GET,
      path: Routes.USER_ME,
    });
    return response.data;
  }

  public async getCurrentUserGuilds(): Promise<any[]> {
    const response = await this.request({
      method: HTTPMethods.GET,
      path: Routes.USER_ME_GUILDS,
    });
    return response.data;
  }

  // Generic request method
  private async request(requestData: {
    method: string;
    path: string;
    data?: any;
    files?: any[];
  }): Promise<APIResponse> {
    const request: APIRequest = {
      method: requestData.method,
      path: requestData.path,
      options: {},
      data: requestData.data,
      files: requestData.files,
    };

    return await this.requestHandler.request(request);
  }
}