import { FmtPackage } from '@ovendjs/utils';
import type {
  GatewayDispatchPayload,
  GatewayPresenceUpdateData,
  GatewayReadyDispatchData,
  GatewayIntentBits,
  GatewayIdentifyProperties
} from 'discord-api-types/v10';
import { GatewayDispatchEvents } from 'discord-api-types/v10';

// Re-export GatewayDispatchEvents for use in other modules
export { GatewayDispatchEvents };

export const GATEWAY_VERSION = 10;
export const GATEWAY_ENCODING = 'json';
export const PACKAGE_META: FmtPackage = {
  name: 'gateway',
  version: '[VI]{{inject}}[/VI]',
};

export interface WebSocketManagerOptions {
  token: string;
  intents: GatewayIntentBits;
  shardCount?: number;
  presence?: GatewayPresenceUpdateData;
  properties?: GatewayIdentifyProperties;

  /**
   * Total number of shards to use
   * @default 1
   */
  totalShards?: number;

  /**
   * Comma-delimited list of guild IDs to limit the gateway connection to
   */
  guildSubscriptions?: string[];

  /**
   * Whether to compress data using zlib-stream
   * @default false
   */
  compress?: boolean;
}

/**
 * Event handler type for WebSocketManager events
 * @template TEvent - The event name
 * @template TArgs - The event arguments tuple
 */
export type EventHandler<TEvent extends string, TArgs extends any[] = any[]> = (...args: TArgs) => void | Promise<void>;

/**
 * Utility type to extract the payload type for a specific Gateway event
 * @template TEvent - The Gateway event name
 */
export type GatewayEventPayload<TEvent extends GatewayDispatchEvents> = Extract<GatewayDispatchPayload, { t: TEvent }>['d'];

/**
 * Type-safe event handler for WebSocketManager events
 * @template TEvent - The event name
 */
export type WebSocketManagerEventHandler<TEvent extends keyof WebSocketManagerEvents> =
  (...args: WebSocketManagerEvents[TEvent]) => void | Promise<void>;

/**
 * Type-safe event handler for WebSocketShard events
 * @template TEvent - The event name
 */
export type WebSocketShardEventHandler<TEvent extends keyof WebSocketShardEvents> =
  (...args: WebSocketShardEvents[TEvent]) => void | Promise<void>;

/**
 * Utility type to get all event names from an event map
 * @template TEvents - The event map type
 */
export type EventNames<TEvents extends Record<string, any[]>> = keyof TEvents;

/**
 * Utility type to get the payload type for a specific event
 * @template TEvents - The event map type
 * @template TEvent - The event name
 */
export type EventPayload<TEvents extends Record<string, any[]>, TEvent extends keyof TEvents> =
  TEvents[TEvent] extends [infer Payload] ? Payload : never;

/**
 * Utility type to check if an event is a Discord Gateway event
 * @template TEvent - The event name
 */
export type isGatewayEvent<TEvent extends string> =
  TEvent extends GatewayDispatchEvents ? true : false;

/**
 * Runtime function to check if an event is a Discord Gateway event
 * @param event - The event name to check
 * @returns True if the event is a Discord Gateway event
 */
export function isGatewayEventFn(event: string): event is GatewayDispatchEvents {
  return Object.values(GatewayDispatchEvents).includes(event as GatewayDispatchEvents);
}

/**
 * Type-safe event map for WebSocketManager
 * Provides autocompletion for all Discord Gateway events
 */
export type WebSocketManagerEvents = {
  // Base WebSocketManager events
  /**
   * Emitted when all shards are ready
   */
  ready: [];
  
  /**
   * Emitted when a shard resumes connection
   */
  resumed: [];
  
  /**
   * Emitted when an error occurs
   * @param error - The error that occurred
   */
  error: [error: Error];
  
  /**
   * Emitted when the manager disconnects
   */
  disconnect: [];
  
  /**
   * Emitted when the manager is reconnecting
   */
  reconnecting: [];
  
  /**
   * Emitted for debug information
   * @param info - Debug message
   */
  debug: [info: string];
  
  /**
   * Emitted for any gateway dispatch event
   * @param payload - The dispatch payload
   */
  dispatch: [payload: GatewayDispatchPayload];

  // Discord Gateway events with proper typing
  /**
   * Emitted when a guild becomes available
   * @param payload - Guild create data
   */
  GUILD_CREATE: [payload: GatewayEventPayload<GatewayDispatchEvents.GuildCreate>];
  
  /**
   * Emitted when a guild is updated
   * @param payload - Guild update data
   */
  GUILD_UPDATE: [payload: GatewayEventPayload<GatewayDispatchEvents.GuildUpdate>];
  
  /**
   * Emitted when a guild is unavailable
   * @param payload - Guild delete data
   */
  GUILD_DELETE: [payload: GatewayEventPayload<GatewayDispatchEvents.GuildDelete>];
  
  /**
   * Emitted when a guild member joins
   * @param payload - Guild member add data
   */
  GUILD_MEMBER_ADD: [payload: GatewayEventPayload<GatewayDispatchEvents.GuildMemberAdd>];
  
  /**
   * Emitted when a guild member is removed
   * @param payload - Guild member remove data
   */
  GUILD_MEMBER_REMOVE: [payload: GatewayEventPayload<GatewayDispatchEvents.GuildMemberRemove>];
  
  /**
   * Emitted when a guild member is updated
   * @param payload - Guild member update data
   */
  GUILD_MEMBER_UPDATE: [payload: GatewayEventPayload<GatewayDispatchEvents.GuildMemberUpdate>];
  
  /**
   * Emitted when guild members are chunked
   * @param payload - Guild members chunk data
   */
  GUILD_MEMBERS_CHUNK: [payload: GatewayEventPayload<GatewayDispatchEvents.GuildMembersChunk>];
  
  /**
   * Emitted when a guild role is created
   * @param payload - Guild role create data
   */
  GUILD_ROLE_CREATE: [payload: GatewayEventPayload<GatewayDispatchEvents.GuildRoleCreate>];
  
  /**
   * Emitted when a guild role is updated
   * @param payload - Guild role update data
   */
  GUILD_ROLE_UPDATE: [payload: GatewayEventPayload<GatewayDispatchEvents.GuildRoleUpdate>];
  
  /**
   * Emitted when a guild role is deleted
   * @param payload - Guild role delete data
   */
  GUILD_ROLE_DELETE: [payload: GatewayEventPayload<GatewayDispatchEvents.GuildRoleDelete>];
  
  /**
   * Emitted when a channel is created
   * @param payload - Channel create data
   */
  CHANNEL_CREATE: [payload: GatewayEventPayload<GatewayDispatchEvents.ChannelCreate>];
  
  /**
   * Emitted when a channel is updated
   * @param payload - Channel update data
   */
  CHANNEL_UPDATE: [payload: GatewayEventPayload<GatewayDispatchEvents.ChannelUpdate>];
  
  /**
   * Emitted when a channel is deleted
   * @param payload - Channel delete data
   */
  CHANNEL_DELETE: [payload: GatewayEventPayload<GatewayDispatchEvents.ChannelDelete>];
  
  /**
   * Emitted when channel pins are updated
   * @param payload - Channel pins update data
   */
  CHANNEL_PINS_UPDATE: [payload: GatewayEventPayload<GatewayDispatchEvents.ChannelPinsUpdate>];
  
  /**
   * Emitted when a message is created
   * @param payload - Message create data
   */
  MESSAGE_CREATE: [payload: GatewayEventPayload<GatewayDispatchEvents.MessageCreate>];
  
  /**
   * Emitted when a message is updated
   * @param payload - Message update data
   */
  MESSAGE_UPDATE: [payload: GatewayEventPayload<GatewayDispatchEvents.MessageUpdate>];
  
  /**
   * Emitted when a message is deleted
   * @param payload - Message delete data
   */
  MESSAGE_DELETE: [payload: GatewayEventPayload<GatewayDispatchEvents.MessageDelete>];
  
  /**
   * Emitted when multiple messages are deleted
   * @param payload - Message delete bulk data
   */
  MESSAGE_DELETE_BULK: [payload: GatewayEventPayload<GatewayDispatchEvents.MessageDeleteBulk>];
  
  /**
   * Emitted when a reaction is added to a message
   * @param payload - Message reaction add data
   */
  MESSAGE_REACTION_ADD: [payload: GatewayEventPayload<GatewayDispatchEvents.MessageReactionAdd>];
  
  /**
   * Emitted when a reaction is removed from a message
   * @param payload - Message reaction remove data
   */
  MESSAGE_REACTION_REMOVE: [payload: GatewayEventPayload<GatewayDispatchEvents.MessageReactionRemove>];
  
  /**
   * Emitted when all reactions are removed from a message
   * @param payload - Message reaction remove all data
   */
  MESSAGE_REACTION_REMOVE_ALL: [payload: GatewayEventPayload<GatewayDispatchEvents.MessageReactionRemoveAll>];
  
  /**
   * Emitted when all reactions of a specific emoji are removed from a message
   * @param payload - Message reaction remove emoji data
   */
  MESSAGE_REACTION_REMOVE_EMOJI: [payload: GatewayEventPayload<GatewayDispatchEvents.MessageReactionRemoveEmoji>];
  
  /**
   * Emitted when a user starts typing
   * @param payload - Typing start data
   */
  TYPING_START: [payload: GatewayEventPayload<GatewayDispatchEvents.TypingStart>];
  
  /**
   * Emitted when a user's presence is updated
   * @param payload - Presence update data
   */
  PRESENCE_UPDATE: [payload: GatewayEventPayload<GatewayDispatchEvents.PresenceUpdate>];
  
  /**
   * Emitted when a voice state is updated
   * @param payload - Voice state update data
   */
  VOICE_STATE_UPDATE: [payload: GatewayEventPayload<GatewayDispatchEvents.VoiceStateUpdate>];
  
  /**
   * Emitted when a voice server is updated
   * @param payload - Voice server update data
   */
  VOICE_SERVER_UPDATE: [payload: GatewayEventPayload<GatewayDispatchEvents.VoiceServerUpdate>];
  
  /**
   * Emitted when an interaction is created
   * @param payload - Interaction create data
   */
  INTERACTION_CREATE: [payload: GatewayEventPayload<GatewayDispatchEvents.InteractionCreate>];
  
  /**
   * Emitted when a thread is created
   * @param payload - Thread create data
   */
  THREAD_CREATE: [payload: GatewayEventPayload<GatewayDispatchEvents.ThreadCreate>];
  
  /**
   * Emitted when a thread is updated
   * @param payload - Thread update data
   */
  THREAD_UPDATE: [payload: GatewayEventPayload<GatewayDispatchEvents.ThreadUpdate>];
  
  /**
   * Emitted when a thread is deleted
   * @param payload - Thread delete data
   */
  THREAD_DELETE: [payload: GatewayEventPayload<GatewayDispatchEvents.ThreadDelete>];
  
  /**
   * Emitted when thread members are updated
   * @param payload - Thread members update data
   */
  THREAD_MEMBERS_UPDATE: [payload: GatewayEventPayload<GatewayDispatchEvents.ThreadMembersUpdate>];
  
  /**
   * Emitted when a thread member is updated
   * @param payload - Thread member update data
   */
  THREAD_MEMBER_UPDATE: [payload: GatewayEventPayload<GatewayDispatchEvents.ThreadMemberUpdate>];
  
  /**
   * Emitted when a stage instance is created
   * @param payload - Stage instance create data
   */
  STAGE_INSTANCE_CREATE: [payload: GatewayEventPayload<GatewayDispatchEvents.StageInstanceCreate>];
  
  /**
   * Emitted when a stage instance is updated
   * @param payload - Stage instance update data
   */
  STAGE_INSTANCE_UPDATE: [payload: GatewayEventPayload<GatewayDispatchEvents.StageInstanceUpdate>];
  
  /**
   * Emitted when a stage instance is deleted
   * @param payload - Stage instance delete data
   */
  STAGE_INSTANCE_DELETE: [payload: GatewayEventPayload<GatewayDispatchEvents.StageInstanceDelete>];
  
  /**
   * Emitted when the client becomes ready
   * @param payload - Ready data
   */
  READY: [payload: GatewayEventPayload<GatewayDispatchEvents.Ready>];
  
  /**
   * Emitted when a connection is resumed
   */
  RESUMED: [payload: GatewayEventPayload<GatewayDispatchEvents.Resumed>];
} & {
  // Include all other GatewayDispatchEvents dynamically
  [K in GatewayDispatchEvents]: [payload: GatewayEventPayload<K>];
};

/**
 * Type-safe event map for WebSocketShard
 * Provides autocompletion for all shard-specific events
 */
export type WebSocketShardEvents = {
  /**
   * Emitted when the WebSocket connection is established
   */
  open: [];
  
  /**
   * Emitted when the WebSocket connection is closed
   * @param closeEvent - The close event details
   */
  close: [closeEvent: { code: number; reason: string }];
  
  /**
   * Emitted when an error occurs
   * @param error - The error that occurred
   */
  error: [error: Error];
  
  /**
   * Emitted when the shard becomes ready
   * @param data - The ready dispatch data
   */
  ready: [data: GatewayReadyDispatchData];
  
  /**
   * Emitted when the shard resumes a connection
   */
  resumed: [];
  
  /**
   * Emitted for any gateway dispatch event
   * @param payload - The dispatch payload
   */
  dispatch: [payload: GatewayDispatchPayload];

  // Include all GatewayDispatchEvents for individual event emission
} & {
  [K in GatewayDispatchEvents]: [payload: GatewayEventPayload<K>];
};
