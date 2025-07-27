/**
 * Constants for OvenJS
 */

export const API_VERSION = 10;
export const API_BASE_URL = 'https://discord.com/api';
export const CDN_BASE_URL = 'https://cdn.discordapp.com';
export const GATEWAY_VERSION = 10;

/**
 * Discord timeout constants
 */
export const DISCORD_TIMEOUTS = {
  RATE_LIMIT_RESET: 1000,
  REQUEST_TIMEOUT: 15000,
  WEBSOCKET_TIMEOUT: 30000,
  HEARTBEAT_ACK_TIMEOUT: 10000,
} as const;

/**
 * Rate limit constants
 */
export const RATE_LIMIT = {
  GLOBAL_LIMIT: 50,
  MAJOR_PARAMETER_LIMIT: 5,
  MINOR_PARAMETER_LIMIT: 10,
  RESET_AFTER_OFFSET: 50,
} as const;