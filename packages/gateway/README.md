# @ovendjs/gateway

A modern, type-safe Discord Gateway implementation for Node.js with full event autocompletion support.

## Features

- **Event Autocompletion**: Full TypeScript IntelliSense support for all Discord Gateway events
- **Type Safety**: Strongly typed events and payloads with proper error handling
- **Sharding Support**: Built-in support for Discord's sharding system
- **Modern Architecture**: Built with TypeScript and modern async patterns
- **Comprehensive Documentation**: Detailed JSDoc documentation for all events and methods

## Installation

```bash
npm install @ovendjs/gateway
```

## Quick Start

```typescript
import { WebSocketManager, GatewayIntentBits } from '@ovendjs/gateway';

const manager = new WebSocketManager({
  token: 'YOUR_BOT_TOKEN',
  intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMessages,
});

// Listen for when the manager is ready
manager.on('ready', () => {
  console.log('All shards are ready!');
});

// Listen for message events with full autocompletion
manager.on('MESSAGE_CREATE', message => {
  console.log(`Message from ${message.author.username}: ${message.content}`);
});

// Listen for guild events
manager.on('GUILD_CREATE', guild => {
  console.log(`Joined guild: ${guild.name}`);
});

// Connect to Discord
await manager.connect();
```

## Events

The package provides autocompletion for all Discord Gateway events:

### Base Events

- `ready` - Emitted when all shards are ready
- `error` - Emitted when an error occurs
- `debug` - Emitted for debug information
- `disconnect` - Emitted when the manager disconnects

### Discord Gateway Events

All Discord Gateway events are supported with proper typing:

- `GUILD_CREATE` - When a guild becomes available
- `GUILD_UPDATE` - When a guild is updated
- `GUILD_DELETE` - When a guild is unavailable
- `CHANNEL_CREATE` - When a channel is created
- `CHANNEL_UPDATE` - When a channel is updated
- `CHANNEL_DELETE` - When a channel is deleted
- `MESSAGE_CREATE` - When a message is created
- `MESSAGE_UPDATE` - When a message is updated
- `MESSAGE_DELETE` - When a message is deleted
- `MESSAGE_REACTION_ADD` - When a reaction is added
- `MESSAGE_REACTION_REMOVE` - When a reaction is removed
- `PRESENCE_UPDATE` - When a user's presence is updated
- `VOICE_STATE_UPDATE` - When a voice state is updated
- `INTERACTION_CREATE` - When an interaction is created
- `READY` - When the client becomes ready
- And many more...

## API Reference

### WebSocketManager

The main class for managing WebSocket connections to Discord.

#### Constructor

```typescript
new WebSocketManager(options: WebSocketManagerOptions)
```

**Options:**

- `token` (string): Your bot token
- `intents` (GatewayIntentBits): The intents to use
- `shardCount?` (number): Number of shards to use (default: 1)
- `presence?` (GatewayPresenceUpdateData): Presence to set
- `properties?` (GatewayIdentifyProperties): Identification properties
- `totalShards?` (number): Total number of shards
- `guildSubscriptions?` (string[]): Guild IDs to limit connection to
- `compress?` (boolean): Whether to compress data (default: false)

#### Methods

##### `connect(): Promise<void>`

Connects all shards to the Discord Gateway.

```typescript
await manager.connect();
```

##### `disconnect(): Promise<void>`

Disconnects all shards from the Discord Gateway.

```typescript
await manager.disconnect();
```

##### `on(event, listener): this`

Listens for an event.

```typescript
manager.on('MESSAGE_CREATE', message => {
  console.log(message.content);
});
```

##### `once(event, listener): this`

Listens for an event once.

```typescript
manager.once('ready', () => {
  console.log('Ready!');
});
```

##### `off(event, listener): this`

Removes a listener.

```typescript
const listener = message => console.log(message.content);
manager.on('MESSAGE_CREATE', listener);
manager.off('MESSAGE_CREATE', listener);
```

##### `getShard(shardId: number): WebSocketShard | undefined`

Gets a specific shard by ID.

```typescript
const shard = manager.getShard(0);
```

##### `getShards(): Map<number, WebSocketShard>`

Gets all shards.

```typescript
const shards = manager.getShards();
```

##### `isReady(): boolean`

Checks if all shards are ready.

```typescript
if (manager.isReady()) {
  console.log('All shards are ready');
}
```

##### `getShardCount(): number`

Gets the total number of shards.

```typescript
const count = manager.getShardCount();
```

### Utility Types

The package provides several utility types for better type safety:

#### `WebSocketManagerEventHandler<TEvent>`

Type-safe event handler type.

```typescript
const messageHandler: WebSocketManagerEventHandler<'MESSAGE_CREATE'> = message => {
  console.log(message.content);
};
```

#### `EventPayload<TEvents, TEvent>`

Gets the payload type for a specific event.

```typescript
type MessagePayload = EventPayload<WebSocketManagerEvents, 'MESSAGE_CREATE'>;
```

#### `isGatewayEventFn(event)`

Runtime function to check if an event is a Discord Gateway event.

```typescript
if (isGatewayEventFn('MESSAGE_CREATE')) {
  // This is a gateway event
}
```

## Examples

### Basic Bot

```typescript
import { WebSocketManager, GatewayIntentBits } from '@ovendjs/gateway';

const manager = new WebSocketManager({
  token: 'YOUR_BOT_TOKEN',
  intents:
    GatewayIntentBits.Guilds |
    GatewayIntentBits.GuildMessages |
    GatewayIntentBits.MessageContent,
});

manager.on('ready', () => {
  console.log('Bot is ready!');
});

manager.on('MESSAGE_CREATE', message => {
  if (message.content === '!ping') {
    // You would typically use the REST package to send messages
    console.log(`Ping received from ${message.author.username}`);
  }
});

await manager.connect();
```

### Handling Multiple Events

```typescript
manager.on('GUILD_CREATE', guild => {
  console.log(`Joined guild: ${guild.name} with ${guild.member_count} members`);
});

manager.on('GUILD_MEMBER_ADD', member => {
  console.log(`${member.user.username} joined ${member.guild.name}`);
});

manager.on('CHANNEL_CREATE', channel => {
  console.log(`Channel created: ${channel.name || 'DM Channel'}`);
});

manager.on('MESSAGE_REACTION_ADD', reaction => {
  console.log(`${reaction.user_id} reacted with ${reaction.emoji.name}`);
});
```

### Type-Safe Event Handlers

```typescript
import { WebSocketManagerEventHandler } from '@ovendjs/gateway';

const messageHandler: WebSocketManagerEventHandler<'MESSAGE_CREATE'> = message => {
  // TypeScript knows the exact type of message
  const messageId: string = message.id;
  const content: string = message.content;
  const channelId: string = message.channel_id;
  const authorName: string = message.author.username;

  console.log(`Message ${messageId} from ${authorName}: ${content}`);
};

manager.on('MESSAGE_CREATE', messageHandler);
```

## Error Handling

```typescript
manager.on('error', error => {
  console.error('Gateway error:', error);
});

manager.on('disconnect', () => {
  console.log('Disconnected from Discord');
});
```

## Debug Mode

```typescript
manager.on('debug', info => {
  console.debug('[Gateway Debug]', info);
});
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.
