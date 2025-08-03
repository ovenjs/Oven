# Core Package Architecture

## Overview

The core package is the main Discord API wrapper that users will interact with. It provides a comprehensive client that includes data structures, managers, and unified API access. The primary entry point is the `Bot` class, which serves as the main interface for creating and managing Discord bots.

## Package Structure

```
packages/core/
├── src/
│   ├── Bot.ts                 # Main Bot class - primary entry point
│   ├── index.ts               # Package exports
│   ├── types.ts               # Type definitions
│   ├── structures/            # Discord data structures and transformers
│   │   ├── Base.ts            # Base structure class
│   │   ├── User.ts            # User structure
│   │   ├── Guild.ts           # Guild structure
│   │   ├── Channel.ts         # Channel structure
│   │   ├── Message.ts         # Message structure
│   │   └── ...                # Other Discord structures
│   ├── managers/              # Resource managers
│   │   ├── BaseManager.ts     # Base manager class
│   │   ├── GuildManager.ts    # Guild resource management
│   │   ├── ChannelManager.ts  # Channel resource management
│   │   ├── UserManager.ts     # User resource management
│   │   ├── RoleManager.ts     # Role resource management
│   │   └── ...                # Other resource managers
│   ├── client/                # Client implementations
│   │   ├── BaseClient.ts      # Base client class
│   │   ├── GatewayClient.ts   # Gateway integration
│   │   ├── RESTClient.ts      # REST integration
│   │   └── CacheClient.ts     # Cache implementation
│   ├── events/                # Event handling
│   │   ├── EventManager.ts    # Event management system
│   │   ├── EventHandlers.ts   # Event handler implementations
│   │   └── EventEmitter.ts    # Custom event emitter
│   ├── utils/                 # Utility functions
│   │   ├── transformers.ts    # Data transformation utilities
│   │   ├── validators.ts      # Data validation utilities
│   │   └── helpers.ts         # Helper functions
│   └── cache/                 # Caching system
│       ├── BaseCache.ts       # Base cache implementation
│       ├── MemoryCache.ts     # In-memory cache
│       └── CacheAdapter.ts    # Cache adapter interface
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

## Core Components

### 1. Bot Class

The `Bot` class is the primary entry point for users. It integrates all other components and provides a unified interface.

```typescript
class Bot {
  // Configuration
  private options: BotOptions;
  
  // Clients
  private gateway: GatewayClient;
  private rest: RESTClient;
  private cache: CacheClient;
  
  // Managers
  public guilds: GuildManager;
  public channels: ChannelManager;
  public users: UserManager;
  public roles: RoleManager;
  // ... other managers
  
  // Event management
  private events: EventManager;
  
  constructor(options: BotOptions);
  
  // Lifecycle methods
  async login(token: string): Promise<void>;
  async destroy(): Promise<void>;
  
  // Utility methods
  on(event: string, listener: Function): this;
  once(event: string, listener: Function): this;
  emit(event: string, ...args: any[]): boolean;
  off(event: string, listener: Function): this;
}
```

### 2. Data Structures

Discord API objects are represented as structured classes with methods for manipulation and transformation.

```typescript
abstract class BaseStructure {
  protected client: Bot;
  public id: string;
  public createdAt: Date;
  
  constructor(client: Bot, data: any);
  abstract _patch(data: any): this;
  
  toJSON(): any;
  toString(): string;
}

class User extends BaseStructure {
  public username: string;
  public discriminator: string;
  public avatar: string | null;
  public bot: boolean;
  public system: boolean;
  public flags: UserFlags;
  
  // Methods
  get tag(): string;
  get displayAvatarURL(): string;
  createDM(): Promise<DMChannel>;
  // ... other methods
}

class Guild extends BaseStructure {
  public name: string;
  public icon: string | null;
  public owner: User | null;
  public members: Collection<string, GuildMember>;
  public channels: Collection<string, Channel>;
  public roles: Collection<string, Role>;
  
  // Methods
  get iconURL(): string;
  get splashURL(): string;
  leave(): Promise<Guild>;
  delete(): Promise<Guild>;
  // ... other methods
}
```

### 3. Managers

Managers handle CRUD operations for Discord resources and provide a clean API for users.

```typescript
abstract class BaseManager {
  protected client: Bot;
  public cache: Collection<string, any>;
  
  constructor(client: Bot);
  
  abstract fetch(id: string): Promise<any>;
  abstract add(data: any): Promise<any>;
  abstract update(id: string, data: any): Promise<any>;
  abstract remove(id: string): Promise<any>;
}

class GuildManager extends BaseManager {
  public cache: Collection<string, Guild>;
  
  fetch(id: string): Promise<Guild>;
  create(options: GuildCreateOptions): Promise<Guild>;
  fetchActive(): Promise<Collection<string, Guild>>;
  search(query: GuildSearchQuery): Promise<Collection<string, Guild>>;
}

class ChannelManager extends BaseManager {
  public cache: Collection<string, Channel>;
  
  fetch(id: string): Promise<Channel>;
  create(guildId: string, options: ChannelCreateOptions): Promise<Channel>;
  fetchActive(guildId?: string): Promise<Collection<string, Channel>>;
}
```

### 4. Client Integration

The core package integrates with the gateway and rest packages through client adapters.

```typescript
class GatewayClient {
  private manager: WebSocketManager;
  private bot: Bot;
  
  constructor(bot: Bot, options: GatewayOptions);
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  on(event: string, listener: Function): this;
}

class RESTClient {
  private rest: REST;
  private bot: Bot;
  
  constructor(bot: Bot, options: RESTOptions);
  
  request(method: string, path: string, options?: any): Promise<any>;
  get(path: string, options?: any): Promise<any>;
  post(path: string, options?: any): Promise<any>;
  put(path: string, options?: any): Promise<any>;
  patch(path: string, options?: any): Promise<any>;
  delete(path: string, options?: any): Promise<any>;
}
```

### 5. Event System

The event system provides a clean interface for handling Discord events.

```typescript
class EventManager {
  private emitter: EventEmitter;
  private handlers: Map<string, Function[]>;
  
  constructor();
  
  on(event: string, listener: Function): this;
  once(event: string, listener: Function): this;
  off(event: string, listener: Function): this;
  emit(event: string, ...args: any[]): boolean;
  
  registerHandler(event: string, handler: Function): this;
  unregisterHandler(event: string, handler: Function): this;
}

// Example event handlers
class GuildEventHandler {
  static guildCreate(bot: Bot, guild: Guild): void;
  static guildDelete(bot: Bot, guild: Guild): void;
  static guildUpdate(bot: Bot, oldGuild: Guild, newGuild: Guild): void;
}
```

### 6. Caching System

The caching system provides efficient storage and retrieval of Discord objects.

```typescript
interface CacheAdapter {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

class MemoryCache implements CacheAdapter {
  private cache: Map<string, { value: any; expires?: number }>;
  
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

class CacheClient {
  private adapter: CacheAdapter;
  
  constructor(adapter: CacheAdapter);
  
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}
```

## Implementation Plan

### Phase 1: Basic Structure
1. Set up package.json, tsconfig.json, and tsup.config.ts
2. Create the main Bot class with basic structure
3. Implement base classes for structures and managers
4. Set up the event system

### Phase 2: Core Functionality
1. Implement gateway and rest client integration
2. Create basic data structures (User, Guild, Channel, Message)
3. Implement basic managers (GuildManager, ChannelManager, UserManager)
4. Set up the caching system

### Phase 3: Advanced Features
1. Implement advanced data structures and methods
2. Create additional managers (RoleManager, EmojiManager, etc.)
3. Add event handlers for all Discord events
4. Implement utility methods and helpers

### Phase 4: Polish and Documentation
1. Add comprehensive type definitions
2. Write documentation and examples
3. Add tests for all functionality
4. Optimize performance and memory usage

## Dependencies

The core package will depend on:
- `@ovendjs/gateway` - For WebSocket connections to Discord
- `@ovendjs/rest` - For HTTP requests to Discord API
- `@ovendjs/utils` - For shared utilities and formatting
- `discord-api-types/v10` - For Discord API type definitions
- `@vladfrangu/async_event_emitter` - For event handling

## Example Usage

```typescript
import { Bot, GatewayIntentBits } from '@ovendjs/core';

const bot = new Bot({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}`);
});

bot.on('messageCreate', (message) => {
  if (message.content === '!ping') {
    message.reply('Pong!');
  }
});

bot.login('YOUR_BOT_TOKEN');
```

This architecture provides a solid foundation for a comprehensive Discord bot library that is easy to use, extensible, and follows best practices for TypeScript development.