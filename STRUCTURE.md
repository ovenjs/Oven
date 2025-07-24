# OvenJS Project Structure

```
ovenjs/
├── README.md                 # Main project documentation
├── LICENSE                   # MIT License
├── package.json              # Root package configuration
├── tsconfig.json             # TypeScript configuration
├── rollup.config.js          # Build configuration
├── jest.config.js            # Test configuration
├── .eslintrc.js              # Linting configuration
├── test.js                   # Demo/test script
├── example.js                # Usage example
│
├── packages/
│   ├── types/                # @ovenjs/types
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts      # Main exports
│   │       ├── discord.ts    # Discord API types
│   │       ├── client.ts     # Client types
│   │       ├── gateway.ts    # Gateway/WebSocket types
│   │       └── rest.ts       # REST API types
│   │
│   ├── rest/                 # @ovenjs/rest
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts      # Main exports
│   │       ├── RESTManager.ts         # Main REST client
│   │       ├── RequestHandler.ts      # HTTP request handling
│   │       └── constants.ts           # API constants
│   │
│   ├── ws/                   # @ovenjs/ws
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts      # Main exports
│   │       ├── WebSocketManager.ts    # WebSocket management
│   │       └── WebSocketShard.ts      # Individual shard handling
│   │
│   ├── builders/             # @ovenjs/builders
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts      # Main exports
│   │       ├── EmbedBuilder.ts        # Embed construction
│   │       ├── MessageBuilder.ts      # Message construction
│   │       ├── ButtonBuilder.ts       # Button construction
│   │       └── SelectMenuBuilder.ts   # Select menu construction
│   │
│   └── core/                 # @ovenjs/core
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts      # Main exports
│           ├── Client.ts     # Main client class
│           ├── managers/     # Resource managers
│           │   ├── index.ts
│           │   ├── BaseManager.ts
│           │   ├── GuildManager.ts
│           │   ├── ChannelManager.ts
│           │   └── UserManager.ts
│           └── structures/   # Discord object representations
│               ├── index.ts
│               ├── Base.ts
│               ├── Guild.ts
│               ├── Channel.ts
│               ├── User.ts
│               └── Message.ts
```

## Package Details

### @ovenjs/types
- **Purpose**: Complete TypeScript definitions for Discord API
- **Key Features**:
  - Gateway intents and opcodes
  - REST API request/response types
  - Discord object definitions (User, Guild, Channel, Message, etc.)
  - Client configuration types

### @ovenjs/rest
- **Purpose**: HTTP client for Discord REST API
- **Key Features**:
  - Automatic rate limit handling
  - Request queuing and retry logic
  - Support for file uploads
  - Comprehensive endpoint coverage

### @ovenjs/ws
- **Purpose**: WebSocket client for Discord Gateway
- **Key Features**:
  - Automatic reconnection
  - Shard management
  - Heartbeat handling
  - Event dispatching

### @ovenjs/builders
- **Purpose**: Utilities for constructing Discord objects
- **Key Features**:
  - EmbedBuilder for rich embeds
  - MessageBuilder for complex messages
  - ButtonBuilder for interactive buttons
  - SelectMenuBuilder for dropdown menus
  - ActionRowBuilder for component layout

### @ovenjs/core
- **Purpose**: Main client and high-level API
- **Key Features**:
  - Event-driven architecture
  - Resource managers (guilds, channels, users)
  - Integrated REST and WebSocket clients
  - Structure classes for Discord objects
  - Caching system

## Development Workflow

1. **Install Dependencies**: `yarn install`
2. **Build Packages**: `yarn build`
3. **Run Tests**: `yarn test`
4. **Lint Code**: `yarn lint`
5. **Run Demo**: `node test.js`

## Usage Patterns

### Basic Bot
```typescript
import { Client, Intents } from '@ovenjs/core';

const client = new Client({
  intents: [Intents.GUILDS, Intents.GUILD_MESSAGES]
});

client.on('ready', () => console.log('Ready!'));
client.login('token');
```

### Advanced Usage
```typescript
import { Client, EmbedBuilder, ButtonBuilder } from '@ovenjs/core';

// Rich embeds
const embed = new EmbedBuilder()
  .setTitle('Hello')
  .setColor(0x00ff00);

// Interactive components
const button = new ButtonBuilder()
  .setLabel('Click Me')
  .setStyle(1);
```

## Design Philosophy

1. **Modular**: Each package serves a specific purpose
2. **Type-Safe**: Full TypeScript support throughout
3. **Performance**: Optimized for speed and memory usage
4. **Developer-Friendly**: Intuitive API design
5. **Extensible**: Plugin system for custom functionality