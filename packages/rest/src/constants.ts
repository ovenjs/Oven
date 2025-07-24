export const API_VERSION = '10';
export const BASE_URL = 'https://discord.com/api/v' + API_VERSION;
export const CDN_URL = 'https://cdn.discordapp.com';

export const USER_AGENT = `OvenJS (https://github.com/ovenjs/oven, 0.1.0)`;

export const RATE_LIMIT_RESET_AFTER = 'x-ratelimit-reset-after';
export const RATE_LIMIT_REMAINING = 'x-ratelimit-remaining';
export const RATE_LIMIT_LIMIT = 'x-ratelimit-limit';
export const RATE_LIMIT_BUCKET = 'x-ratelimit-bucket';
export const RATE_LIMIT_GLOBAL = 'x-ratelimit-global';
export const RATE_LIMIT_SCOPE = 'x-ratelimit-scope';

export const RETRY_AFTER = 'retry-after';

export enum HTTPMethods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export enum Routes {
  // Channel endpoints
  CHANNEL = '/channels/{channel.id}',
  CHANNEL_MESSAGE = '/channels/{channel.id}/messages/{message.id}',
  CHANNEL_MESSAGES = '/channels/{channel.id}/messages',
  CHANNEL_TYPING = '/channels/{channel.id}/typing',
  
  // Guild endpoints
  GUILD = '/guilds/{guild.id}',
  GUILD_CHANNELS = '/guilds/{guild.id}/channels',
  GUILD_MEMBER = '/guilds/{guild.id}/members/{user.id}',
  GUILD_MEMBERS = '/guilds/{guild.id}/members',
  GUILD_ROLES = '/guilds/{guild.id}/roles',
  GUILD_ROLE = '/guilds/{guild.id}/roles/{role.id}',
  
  // User endpoints
  USER = '/users/{user.id}',
  USER_ME = '/users/@me',
  USER_ME_GUILDS = '/users/@me/guilds',
  
  // Gateway endpoints
  GATEWAY = '/gateway',
  GATEWAY_BOT = '/gateway/bot',
}