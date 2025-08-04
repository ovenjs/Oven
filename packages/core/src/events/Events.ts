import type {
  GatewayGuildAuditLogEntryCreateDispatchData,
  GatewayPresenceUpdateDispatchData,
  GatewayVoiceStateUpdateDispatchData,
  GatewayVoiceServerUpdateDispatchData,
  GatewayInteractionCreateDispatchData,
  GatewayInviteCreateDispatchData,
  GatewayInviteDeleteDispatchData,
  GatewayApplicationCommandPermissionsUpdateDispatchData,
  GatewayAutoModerationRuleCreateDispatchData,
  GatewayAutoModerationRuleUpdateDispatchData,
  GatewayAutoModerationRuleDeleteDispatchData,
  GatewayAutoModerationActionExecutionDispatchData,
  GatewayDispatchPayload,
} from 'discord-api-types/v10';

import type { User } from '../structures/User';
import type { Guild } from '../structures/Guild';
import type { Channel } from '../structures/Channel';
import type { Message } from '../structures/Message';
import type { Member } from '../structures/Member';
import type { Role } from '../structures/Role';
import type { Emoji } from '../structures/Emoji';
import type { Attachment } from '../structures/Attachment';
import type { Embed } from '../structures/Embed';
import type { Bot } from '../Bot';

/**
 * Interface for all bot events.
 * This interface defines the event names and their corresponding listener signatures.
 */
export interface BotEvents {
  /**
   * Emitted when the bot becomes ready.
   * @param bot The bot instance
   */
  ready: () => void;

  /**
   * Emitted when an error occurs.
   * @param error The error that occurred
   */
  error: (error: Error) => void;

  /**
   * Emitted when a guild is created or the bot joins a guild.
   * @param guild The guild that was created
   */
  guildCreate: (guild: Guild) => void;

  /**
   * Emitted when a guild is updated.
   * @param oldGuild The guild before the update
   * @param newGuild The guild after the update
   */
  guildUpdate: (oldGuild: Guild, newGuild: Guild) => void;

  /**
   * Emitted when the bot leaves or is removed from a guild.
   * @param guild The guild that was deleted
   */
  guildDelete: (guild: Guild) => void;

  /**
   * Emitted when a guild audit log entry is created.
   * @param guild The guild where the audit log entry was created
   * @param auditLogEntry The audit log entry that was created
   */
  guildAuditLogEntryCreate: (
    guild: Guild,
    auditLogEntry: GatewayGuildAuditLogEntryCreateDispatchData
  ) => void;

  /**
   * Emitted when a user is banned from a guild.
   * @param guild The guild where the user was banned
   * @param user The user that was banned
   */
  guildBanAdd: (guild: Guild, user: User) => void;

  /**
   * Emitted when a user is unbanned from a guild.
   * @param guild The guild where the user was unbanned
   * @param user The user that was unbanned
   */
  guildBanRemove: (guild: Guild, user: User) => void;

  /**
   * Emitted when a guild's emojis are updated.
   * @param guild The guild where the emojis were updated
   * @param oldEmojis The emojis before the update
   * @param newEmojis The emojis after the update
   */
  guildEmojisUpdate: (guild: Guild, oldEmojis: Emoji[], newEmojis: Emoji[]) => void;

  /**
   * Emitted when a guild's integrations are updated.
   * @param guild The guild where the integrations were updated
   */
  guildIntegrationsUpdate: (guild: Guild) => void;

  /**
   * Emitted when a user joins a guild.
   * @param member The member that joined
   */
  guildMemberAdd: (member: Member) => void;

  /**
   * Emitted when a user leaves or is removed from a guild.
   * @param member The member that was removed
   */
  guildMemberRemove: (member: Member) => void;

  /**
   * Emitted when a guild member is updated.
   * @param oldMember The member before the update
   * @param newMember The member after the update
   */
  guildMemberUpdate: (oldMember: Member, newMember: Member) => void;

  /**
   * Emitted when a chunk of guild members is received.
   * @param guild The guild where the members are from
   * @param members The members that were received
   */
  guildMembersChunk: (guild: Guild, members: Member[]) => void;

  /**
   * Emitted when a guild role is created.
   * @param role The role that was created
   */
  guildRoleCreate: (role: Role) => void;

  /**
   * Emitted when a guild role is updated.
   * @param oldRole The role before the update
   * @param newRole The role after the update
   */
  guildRoleUpdate: (oldRole: Role, newRole: Role) => void;

  /**
   * Emitted when a guild role is deleted.
   * @param role The role that was deleted
   */
  guildRoleDelete: (role: Role) => void;

  /**
   * Emitted when a channel is created.
   * @param channel The channel that was created
   */
  channelCreate: (channel: Channel) => void;

  /**
   * Emitted when a channel is updated.
   * @param oldChannel The channel before the update
   * @param newChannel The channel after the update
   */
  channelUpdate: (oldChannel: Channel, newChannel: Channel) => void;

  /**
   * Emitted when a channel is deleted.
   * @param channel The channel that was deleted
   */
  channelDelete: (channel: Channel) => void;

  /**
   * Emitted when a channel's pins are updated.
   * @param channel The channel where the pins were updated
   * @param timestamp The timestamp when the pins were updated
   */
  channelPinsUpdate: (channel: Channel, timestamp: Date) => void;

  /**
   * Emitted when a thread is created.
   * @param thread The thread that was created
   * @param newlyCreated Whether the thread was newly created
   */
  threadCreate: (thread: Channel, newlyCreated: boolean) => void;

  /**
   * Emitted when a thread is updated.
   * @param oldThread The thread before the update
   * @param newThread The thread after the update
   */
  threadUpdate: (oldThread: Channel, newThread: Channel) => void;

  /**
   * Emitted when a thread is deleted.
   * @param thread The thread that was deleted
   */
  threadDelete: (thread: Channel) => void;

  /**
   * Emitted when the current user gains access to a channel.
   * @param threads The threads that the user gained access to
   * @param channels The channels that the user gained access to
   */
  threadListSync: (threads: Channel[], channels: Channel[]) => void;

  /**
   * Emitted when a thread member is updated.
   * @param oldMember The thread member before the update
   * @param newMember The thread member after the update
   */
  threadMemberUpdate: (oldMember: Member, newMember: Member) => void;

  /**
   * Emitted when thread members are updated.
   * @param thread The thread where the members were updated
   * @param addedMembers The members that were added
   * @param removedMembers The members that were removed
   */
  threadMembersUpdate: (
    thread: Channel,
    addedMembers: Member[],
    removedMembers: Member[]
  ) => void;

  /**
   * Emitted when a message is created.
   * @param message The message that was created
   */
  messageCreate: (message: Message) => void;

  /**
   * Emitted when a message is updated.
   * @param oldMessage The message before the update
   * @param newMessage The message after the update
   */
  messageUpdate: (oldMessage: Message, newMessage: Message) => void;

  /**
   * Emitted when a message is deleted.
   * @param message The message that was deleted
   */
  messageDelete: (message: Message) => void;

  /**
   * Emitted when multiple messages are deleted at once.
   * @param messages The messages that were deleted
   * @param channel The channel where the messages were deleted
   */
  messageDeleteBulk: (messages: Message[], channel: Channel) => void;

  /**
   * Emitted when a reaction is added to a message.
   * @param message The message where the reaction was added
   * @param emoji The emoji that was added
   * @param userId The ID of the user who added the reaction
   */
  messageReactionAdd: (message: Message, emoji: Emoji, userId: string) => void;

  /**
   * Emitted when a reaction is removed from a message.
   * @param message The message where the reaction was removed
   * @param emoji The emoji that was removed
   * @param userId The ID of the user who removed the reaction
   */
  messageReactionRemove: (message: Message, emoji: Emoji, userId: string) => void;

  /**
   * Emitted when all reactions are removed from a message.
   * @param message The message where the reactions were removed
   */
  messageReactionRemoveAll: (message: Message) => void;

  /**
   * Emitted when all reactions of a specific emoji are removed from a message.
   * @param message The message where the reactions were removed
   * @param emoji The emoji that was removed
   */
  messageReactionRemoveEmoji: (message: Message, emoji: Emoji) => void;

  /**
   * Emitted when a user's presence is updated.
   * @param oldPresence The presence before the update
   * @param newPresence The presence after the update
   */
  presenceUpdate: (
    oldPresence: GatewayPresenceUpdateDispatchData,
    newPresence: GatewayPresenceUpdateDispatchData
  ) => void;

  /**
   * Emitted when a user starts typing in a channel.
   * @param channel The channel where the user started typing
   * @param user The user who started typing
   */
  typingStart: (channel: Channel, user: User) => void;

  /**
   * Emitted when a user is updated.
   * @param oldUser The user before the update
   * @param newUser The user after the update
   */
  userUpdate: (oldUser: User, newUser: User) => void;

  /**
   * Emitted when a voice state is updated.
   * @param oldState The voice state before the update
   * @param newState The voice state after the update
   */
  voiceStateUpdate: (
    oldState: GatewayVoiceStateUpdateDispatchData,
    newState: GatewayVoiceStateUpdateDispatchData
  ) => void;

  /**
   * Emitted when a voice server is updated.
   * @param data The voice server data
   */
  voiceServerUpdate: (data: GatewayVoiceServerUpdateDispatchData) => void;

  /**
   * Emitted when a channel's webhooks are updated.
   * @param channel The channel where the webhooks were updated
   */
  webhooksUpdate: (channel: Channel) => void;

  /**
   * Emitted when an interaction is created.
   * @param interaction The interaction that was created
   */
  interactionCreate: (interaction: GatewayInteractionCreateDispatchData) => void;

  /**
   * Emitted when an invite is created.
   * @param invite The invite that was created
   */
  inviteCreate: (invite: GatewayInviteCreateDispatchData) => void;

  /**
   * Emitted when an invite is deleted.
   * @param invite The invite that was deleted
   */
  inviteDelete: (invite: GatewayInviteDeleteDispatchData) => void;

  /**
   * Emitted when application command permissions are updated.
   * @param data The application command permissions data
   */
  applicationCommandPermissionsUpdate: (
    data: GatewayApplicationCommandPermissionsUpdateDispatchData
  ) => void;

  /**
   * Emitted when an auto moderation rule is created.
   * @param rule The auto moderation rule that was created
   */
  autoModerationRuleCreate: (rule: GatewayAutoModerationRuleCreateDispatchData) => void;

  /**
   * Emitted when an auto moderation rule is updated.
   * @param rule The auto moderation rule that was updated
   */
  autoModerationRuleUpdate: (rule: GatewayAutoModerationRuleUpdateDispatchData) => void;

  /**
   * Emitted when an auto moderation rule is deleted.
   * @param rule The auto moderation rule that was deleted
   */
  autoModerationRuleDelete: (rule: GatewayAutoModerationRuleDeleteDispatchData) => void;

  /**
   * Emitted when an auto moderation action is executed.
   * @param action The auto moderation action that was executed
   */
  autoModerationActionExecution: (
    action: GatewayAutoModerationActionExecutionDispatchData
  ) => void;

  /**
   * Emitted when a raw gateway dispatch is received.
   * @param payload The gateway dispatch payload
   */
  raw: (payload: GatewayDispatchPayload) => void;

  /**
   * Emitted when a warning is logged.
   * @param warning The warning that was logged
   */
  warn: (warning: string) => void;

  /**
   * Emitted when debug information is logged.
   * @param message The debug message that was logged
   */
  debug: (message: string) => void;

  /**
   * Emitted when any event is triggered.
   * @param event The event name
   * @param args The arguments passed to the event
   */
  event: (event: string, ...args: any[]) => void;
}
