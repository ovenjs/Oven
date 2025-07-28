# OvenJS - Modern Discord API Wrapper

OvenJS is a modern, TypeScript-first Discord API wrapper for Node.js, designed to be powerful, flexible, and easy to use. Built with a modular monorepo architecture for optimal performance and developer experience.

## ✨ Features

- 🚀 **Modern TypeScript** - Built with TypeScript 5.0+ with full type safety using discord-api-types
- 📦 **Modular Architecture** - Clean monorepo structure with specialized packages
- 🔌 **Plugin System** - Extensible architecture for custom functionality
- ⚡ **Performance Focused** - Optimized for speed and memory efficiency
- 🛡️ **Built-in Rate Limiting** - Automatic rate limit handling with intelligent bucketing
- 🔄 **Auto-Reconnection** - Robust WebSocket connection management with sharding support
- 📚 **Comprehensive Types** - Full integration with discord-api-types for complete Discord API coverage
- 🏗️ **Type-Safe Builders** - Fluent API for creating embeds, components, and commands

## 📦 Packages

OvenJS is organized into focused packages for maximum flexibility:

- **`@ovenjs/core`** - Main client orchestrating REST and WebSocket connections
- **`@ovenjs/rest`** - Advanced REST API client with intelligent rate limiting
- **`@ovenjs/ws`** - WebSocket gateway client with sharding and auto-reconnection
- **`@ovenjs/types`** - Package-specific TypeScript definitions + discord-api-types integration
- **`@ovenjs/builders`** - Type-safe builders for Discord objects (embeds, components, etc.)

## 🚀 Quick Start

### Installation

```bash
npm install @ovenjs/core
# or
yarn add @ovenjs/core
```

### Basic Bot Example

```typescript
import { OvenClient } from '@ovenjs/core';
import { GatewayIntentBits } from 'discord-api-types/v10';

const client = new OvenClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('ready', user => {
  console.log(`Logged in as ${user.username}!`);
});

client.on('messageCreate', async message => {
  if (message.content === '!ping') {
    await message.channel.send('Pong!');
  }
});

client.login('YOUR_BOT_TOKEN');
```

### Advanced Usage with Builders

```typescript
import { OvenClient } from '@ovenjs/core';
import { EmbedBuilder, ButtonBuilder, ActionRowBuilder } from '@ovenjs/builders';
import { GatewayIntentBits, ButtonStyle } from 'discord-api-types/v10';

const client = new OvenClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('messageCreate', async message => {
  if (message.content === '!interactive') {
    const embed = new EmbedBuilder()
      .setTitle('Interactive Example')
      .setDescription('Click the button below!')
      .setColor(0x5865f2)
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId('example_button')
      .setLabel('Click Me!')
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder().addComponents(button);

    await message.channel.send({
      embeds: [embed.toJSON()],
      components: [actionRow.toJSON()],
    });
  }
});

// Handle button interactions
client.on('interactionCreate', async interaction => {
  if (interaction.isButton() && interaction.customId === 'example_button') {
    await interaction.reply('Button clicked!');
  }
});

client.login('YOUR_BOT_TOKEN');
```

### Using Individual Packages

For specialized use cases, you can use individual packages:

```typescript
// REST-only usage
import { RESTClient } from '@ovenjs/rest';
import { Routes } from 'discord-api-types/v10';

const rest = new RESTClient({ token: 'YOUR_BOT_TOKEN' });
const user = await rest.request({
  method: 'GET',
  path: Routes.user(),
});

// WebSocket-only usage
import { WebSocketClient } from '@ovenjs/ws';
import { GatewayIntentBits } from 'discord-api-types/v10';

const ws = new WebSocketClient({
  token: 'YOUR_BOT_TOKEN',
  intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMessages,
});

ws.on('ready', () => console.log('WebSocket ready!'));
await ws.connect();
```

## 🏗️ Architecture Overview

OvenJS follows a clean, modular architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                         @ovenjs/core                       │
│                     (Main Client)                          │
├─────────────────────────┬───────────────────────────────────┤
│      @ovenjs/rest       │         @ovenjs/ws                │
│   (HTTP API Client)     │    (WebSocket Gateway)            │
├─────────────────────────┼───────────────────────────────────┤
│     @ovenjs/builders    │       @ovenjs/types               │
│   (Object Builders)     │   (TypeScript Definitions)       │
└─────────────────────────┴───────────────────────────────────┘
```

### Package Responsibilities

- **@ovenjs/types**: Provides package-specific types and re-exports discord-api-types for seamless Discord API integration
- **@ovenjs/rest**: Handles HTTP requests with advanced rate limiting, batching, and retry logic
- **@ovenjs/ws**: Manages WebSocket connections with automatic sharding, reconnection, and event processing
- **@ovenjs/builders**: Offers fluent APIs for constructing Discord objects with full type safety
- **@ovenjs/core**: Orchestrates all packages and provides a unified, high-level Discord bot framework

## 🔧 Development Setup

### Prerequisites

- Node.js 18+
- Yarn (package manager)
- TypeScript 5.0+

### Building from Source

```bash
# Clone the repository
git clone https://github.com/ovenjs/oven.git
cd oven

# Install dependencies
yarn install

# Build all packages
yarn build

# Run type checking
yarn workspaces run typecheck

# Run tests
yarn test
```

### Package Scripts

Each package supports these scripts:

- `yarn build` - Build the package with tsup
- `yarn dev` - Build in watch mode
- `yarn typecheck` - Run TypeScript type checking
- `yarn clean` - Clean build artifacts

## 📈 Development Status

### ✅ Completed Features

- **✅ Monorepo Architecture** - Clean workspace structure with yarn workspaces
- **✅ TypeScript Integration** - Full discord-api-types integration with package-specific types
- **✅ Build System** - Standardized tsup-based build system across all packages
- **✅ REST API Client** - Complete with rate limiting, batching, and error handling
- **✅ WebSocket Gateway** - With sharding, auto-reconnection, and event processing
- **✅ Type-Safe Builders** - For embeds, buttons, select menus, and other Discord objects
- **✅ Core Client** - Event-driven architecture with manager classes
- **✅ Comprehensive Types** - Package-focused types with discord-api-types integration

### 🚧 In Development

- **🔄 Advanced Caching** - Intelligent cache management with TTL and size limits
- **🔄 Slash Commands** - Full application command support with auto-registration
- **🔄 Voice Connections** - Voice channel support with audio streaming
- **🔄 Additional REST Endpoints** - Complete Discord API coverage
- **🔄 Testing Suite** - Comprehensive unit and integration tests
- **🔄 Documentation Website** - Full API documentation with examples

### 🗺️ Roadmap

- **Q1 2024**: Stable v1.0 release with core features
- **Q2 2024**: Voice support and advanced caching
- **Q3 2024**: Plugin ecosystem and additional integrations
- **Q4 2024**: Performance optimizations and enterprise features

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run `yarn build` and `yarn test`
5. Submit a pull request

### Code Standards

- TypeScript strict mode enabled
- ESLint with TypeScript rules
- Prettier for code formatting
- Comprehensive JSDoc comments
- Integration with discord-api-types for Discord API objects

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation**: [Coming Soon]
- **Discord Server**: [Coming Soon]
- **GitHub**: https://github.com/ovenjs/oven
- **NPM**: https://www.npmjs.com/org/ovenjs

---

**Note**: This project is under active development. While the core functionality is implemented, some features are still being refined. For production use, please wait for the stable v1.0 release or use at your own discretion.

Built with ❤️ by the OvenJS Team
