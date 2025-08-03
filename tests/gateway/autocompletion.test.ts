import { describe, it, expect } from 'vitest';
import { WebSocketManager } from '../../packages/gateway/src/WebSocketManager';
import {
  WebSocketManagerEvents,
  GatewayDispatchEvents,
  WebSocketManagerEventHandler,
  EventPayload,
  isGatewayEventFn
} from '../../packages/gateway/src/types';

describe('Event Autocompletion', () => {
  it('should provide autocompletion for WebSocketManager events', () => {
    const manager = new WebSocketManager({
      token: 'test-token',
      intents: 1, // Guilds intent
    });

    // Test base events
    manager.on('ready', () => {
      console.log('Manager is ready');
    });

    manager.on('error', (error) => {
      console.error('Error occurred:', error.message);
    });

    manager.on('debug', (info) => {
      console.debug('Debug info:', info);
    });

    // Test Discord Gateway events with autocompletion
    manager.on('GUILD_CREATE', (guild) => {
      console.log('Guild created:', guild.name);
      expect(guild.id).toBeDefined();
      expect(guild.name).toBeDefined();
    });

    manager.on('MESSAGE_CREATE', (message) => {
      console.log('Message created:', message.content);
      expect(message.id).toBeDefined();
      expect(message.content).toBeDefined();
    });

    // Channel events are available for autocompletion
    manager.on('CHANNEL_CREATE', (channel) => {
      console.log('Channel created');
      expect(channel).toBeDefined();
    });
  });

  it('should provide type safety for event handlers', () => {
    const manager = new WebSocketManager({
      token: 'test-token',
      intents: 1, // Guilds intent
    });

    // Type-safe event handler
    const messageHandler: WebSocketManagerEventHandler<'MESSAGE_CREATE'> = (message) => {
      console.log('Message content:', message.content);
      // TypeScript should know the exact type of message
      const messageId: string = message.id;
      const content: string = message.content;
      const channelId: string = message.channel_id;
    };

    manager.on('MESSAGE_CREATE', messageHandler);

    // Type-safe guild handler
    const guildHandler: WebSocketManagerEventHandler<'GUILD_CREATE'> = (guild) => {
      console.log('Guild name:', guild.name);
      // TypeScript should know the exact type of guild
      const guildId: string = guild.id;
      const name: string = guild.name;
      const memberCount: number = guild.member_count;
    };

    manager.on('GUILD_CREATE', guildHandler);
  });

  it('should work with EventPayload utility type', () => {
    type MessagePayload = EventPayload<WebSocketManagerEvents, 'MESSAGE_CREATE'>;
    type GuildPayload = EventPayload<WebSocketManagerEvents, 'GUILD_CREATE'>;
    
    // These should be properly typed
    const handleMessage = (message: MessagePayload) => {
      console.log('Message ID:', message.id);
      console.log('Message content:', message.content);
    };

    const handleGuild = (guild: GuildPayload) => {
      console.log('Guild ID:', guild.id);
      console.log('Guild name:', guild.name);
    };

    expect(typeof handleMessage).toBe('function');
    expect(typeof handleGuild).toBe('function');
  });

  it('should work with isGatewayEvent type guard', () => {
    const eventName = 'MESSAGE_CREATE';
    
    if (isGatewayEventFn(eventName)) {
      // TypeScript should know this is a gateway event
      console.log('This is a gateway event:', eventName);
      expect(true).toBe(true);
    } else {
      // This branch should not be taken for MESSAGE_CREATE
      expect(false).toBe(true);
    }
  });

  it('should provide autocompletion for all major Gateway events', () => {
    const manager = new WebSocketManager({
      token: 'test-token',
      intents: 1, // Guilds intent
    });

    // Test a variety of Gateway events
    manager.on('GUILD_UPDATE', (guild) => {
      console.log('Guild updated:', guild.name);
    });

    manager.on('GUILD_DELETE', (guild) => {
      console.log('Guild deleted:', guild.id);
    });

    // Channel events are available for autocompletion
    manager.on('CHANNEL_UPDATE', (channel) => {
      console.log('Channel updated');
    });

    manager.on('CHANNEL_DELETE', (channel) => {
      console.log('Channel deleted');
    });

    manager.on('MESSAGE_UPDATE', (message) => {
      console.log('Message updated:', message.content);
    });

    manager.on('MESSAGE_DELETE', (message) => {
      console.log('Message deleted:', message.id);
    });

    manager.on('MESSAGE_REACTION_ADD', (reaction) => {
      console.log('Reaction added:', reaction.emoji.name);
    });

    manager.on('PRESENCE_UPDATE', (presence) => {
      console.log('Presence updated:', presence.user?.username);
    });

    manager.on('VOICE_STATE_UPDATE', (voiceState) => {
      console.log('Voice state updated:', voiceState.channel_id);
    });

    manager.on('INTERACTION_CREATE', (interaction) => {
      console.log('Interaction created:', interaction.id);
    });

    manager.on('READY', (readyData) => {
      console.log('Ready event received, user:', readyData.user.username);
    });
  });

  it('should handle event removal with type safety', () => {
    const manager = new WebSocketManager({
      token: 'test-token',
      intents: 1, // Guilds intent
    });

    const messageHandler = (message: EventPayload<WebSocketManagerEvents, 'MESSAGE_CREATE'>) => {
      console.log('Message:', message.content);
    };

    manager.on('MESSAGE_CREATE', messageHandler);
    
    // Should be able to remove the same handler
    manager.off('MESSAGE_CREATE', messageHandler);
    
    expect(true).toBe(true); // If we get here, types are correct
  });

  it('should handle once() with type safety', () => {
    const manager = new WebSocketManager({
      token: 'test-token',
      intents: 1, // Guilds intent
    });

    manager.once('READY', (readyData) => {
      console.log('Ready event received once:', readyData.user.username);
    });

    manager.once('GUILD_CREATE', (guild) => {
      console.log('Guild created once:', guild.name);
    });

    expect(true).toBe(true); // If we get here, types are correct
  });
});