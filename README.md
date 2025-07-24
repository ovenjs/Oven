# OvenJS - Modern Discord API Wrapper

OvenJS is a modern, TypeScript-first Discord API wrapper for Node.js, designed to be powerful, flexible, and easy to use.

## Features

- 🚀 **Modern TypeScript** - Built with TypeScript 5.0+ with full type safety
- 📦 **Modular Architecture** - Monorepo structure with specialized packages
- 🔌 **Plugin System** - Extensible architecture for custom functionality
- ⚡ **Performance Focused** - Optimized for speed and memory efficiency
- 🛡️ **Built-in Rate Limiting** - Automatic rate limit handling
- 🔄 **Auto-Reconnection** - Robust WebSocket connection management
- 📚 **Comprehensive Types** - Complete Discord API type definitions

## Packages

OvenJS is split into several focused packages:

- `@ovenjs/core` - Main client and high-level abstractions
- `@ovenjs/rest` - REST API client with rate limiting
- `@ovenjs/ws` - WebSocket gateway client
- `@ovenjs/types` - TypeScript definitions for Discord API
- `@ovenjs/builders` - Utilities for building Discord objects (embeds, components, etc.)

## Quick Start

```bash
npm install @ovenjs/core
# or
yarn add @ovenjs/core
```

### Basic Bot Example

```typescript
import { Client, Intents, EmbedBuilder } from '@ovenjs/core';

const client = new Client({
  intents: [
    Intents.GUILDS,
    Intents.GUILD_MESSAGES,
    Intents.MESSAGE_CONTENT
  ]
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.username}!`);
});

client.on('messageCreate', async (message) => {
  if (message.content === '!ping') {
    const embed = new EmbedBuilder()
      .setTitle('Pong!')
      .setDescription(`Latency: ${client.ping}ms`)
      .setColor(0x00ff00)
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
});

client.login('YOUR_BOT_TOKEN');
```

### Advanced Usage

```typescript
import { 
  Client, 
  Intents, 
  EmbedBuilder, 
  ButtonBuilder, 
  ActionRowBuilder,
  ButtonStyle 
} from '@ovenjs/core';

const client = new Client({
  intents: [Intents.GUILDS, Intents.GUILD_MESSAGES, Intents.MESSAGE_CONTENT]
});

client.on('messageCreate', async (message) => {
  if (message.content === '!interactive') {
    const embed = new EmbedBuilder()
      .setTitle('Interactive Example')
      .setDescription('Click the button below!')
      .setColor(0x5865F2);

    const button = new ButtonBuilder()
      .setCustomId('example_button')
      .setLabel('Click Me!')
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder()
      .addComponents(button);

    await message.channel.send({
      embeds: [embed],
      components: [actionRow]
    });
  }
});

// Handle button interactions
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId === 'example_button') {
    await interaction.reply('Button clicked!');
  }
});

client.login('YOUR_BOT_TOKEN');
```

## Development Status

This is a work-in-progress Discord API wrapper. The basic structure and core functionality have been implemented:

✅ **Completed:**
- Monorepo structure with TypeScript packages
- Core Client class with event handling
- REST API client with rate limiting
- WebSocket gateway client with auto-reconnection
- Comprehensive Discord API type definitions
- Builder classes for embeds, messages, buttons, and select menus
- Manager classes for guilds, channels, and users
- Basic structure classes

🚧 **In Development:**
- Advanced caching system
- Slash command support
- Voice connection support
- Additional REST endpoints
- Comprehensive testing
- Documentation website

## Package Structure

```
packages/
├── core/           # Main client and high-level API
├── rest/           # REST API client
├── ws/             # WebSocket gateway client  
├── types/          # TypeScript definitions
└── builders/       # Object builders (embeds, components)
```

## Architecture Overview

OvenJS follows a modular architecture where each package has a specific responsibility:

- **@ovenjs/types**: Provides comprehensive TypeScript definitions for all Discord API objects
- **@ovenjs/rest**: Handles HTTP requests to Discord's REST API with built-in rate limiting
- **@ovenjs/ws**: Manages WebSocket connections to Discord's Gateway with automatic reconnection
- **@ovenjs/builders**: Utilities for constructing Discord objects like embeds and message components
- **@ovenjs/core**: Main client that orchestrates all other packages and provides a high-level API

This design allows developers to use individual packages if they only need specific functionality, or use the core package for a complete Discord bot framework.

---

**Note**: This is a development version. For production use, please wait for the stable release.