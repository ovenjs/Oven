export interface GatewayBotResponse {
    url: string | undefined;
    shards: number;
    session_start_limit: GatewayBotSessionLimitData;
}

export interface GatewayBotSessionLimitData {
    total: number;
    remaining: number;
    reset_after: number;
    max_concurrency: number;
}

export interface GatewayPayload<T = unknown> {
    /**
     * op - Indicates the payload type
     */
    op: GatewayOpcodes;

    /**
     * d - Event data
     */
    d: T;

    /**
     * s - Sequence number of event used for resuming sessions and heartbeating
     */
    s?: number;

    /**
     * t - Event name
     */
    t?: string;
}

/**
 * @link https://discord.com/developers/docs/topics/opcodes-and-status-codes#gateway
 */
export const enum GatewayOpcodes {
    DISPATCH              = 0,
    HEARTBEAT             = 1,
    IDENTIFY              = 2,
    PRESENCE_UPDATE       = 3,
    VOICE_STATE_UPDATE    = 4,
    RESUME                = 6,
    RECONNECT             = 7,
    REQUEST_GUILD_MEMBERS = 8,
    INVALID_SESSION       = 9,
    HELLO                 = 10,
    HEARTBEAT_ACK         = 11
}

/**
 * @link https://discord.com/developers/docs/topics/opcodes-and-status-codes#gateway-gateway-close-event-codes
 */
export const enum GatewayCloseCodes {
    UNKNOWN_ERROR         = 4000,
    UNKNOWN_OPCODE        = 4001,
    DECODE_ERROR          = 4002,
    NOT_AUTHENTICATED     = 4003,
    AUTHENTICATION_FAILED = 4004,
    ALREADY_AUTHENTICATED = 4005,
    INVALID_SEQ           = 4007,
    RATE_LIMITED          = 4008,
    SESSION_TIMED_OUT     = 4009,
    INVALID_SHARD         = 4010,
    SHARDING_REQUIRED     = 4011,
    INVALID_API_VERSION   = 4012,
    INVALID_INTENTS       = 4013,
    DISALLOWED_INTENTS    = 4014,
}

/**
 * @link https://discord.com/developers/docs/events/gateway#list-of-intents
 */
export const enum GatewayIntentBits {
  Guilds                       = 1 << 0,
  Members                      = 1 << 1,
  Moderation                   = 1 << 2,
  EmojisAndStickers            = 1 << 3,
  Integrations                 = 1 << 4,
  Webhooks                     = 1 << 5,
  Invites                      = 1 << 6,
  VoiceState                   = 1 << 7,
  Presences                    = 1 << 8,
  Messages                     = 1 << 9,
  MessageReactions             = 1 << 10,
  Typing                       = 1 << 11,
  DirectMessages               = 1 << 12,
  DirectMessageReactions       = 1 << 13,
  DirectMessageTyping          = 1 << 14,
  Content                      = 1 << 15,
  ScheduledEvents              = 1 << 16,
  AutoModerationConfiguration  = 1 << 20,
  AutoModerationExecution      = 1 << 21,
  Polls                        = 1 << 24,
  DirectMessagePolls           = 1 << 25
}