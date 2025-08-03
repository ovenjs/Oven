# OvenJS - Modern Discord API Wrapper

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" />
</p>

<p align="center">
  <em>A modern, modular Discord API wrapper for Node.js with first-class TypeScript support</em>
</p>

> **Note**: This project is currently under development. Features and APIs may change before the first stable release.

## 📦 Packages

OvenJS follows a monorepo structure with several specialized packages:

| Package | Version | Description |
|---------|---------|-------------|
| [`@ovendjs/gateway`](./packages/gateway) | 0.5.3 | WebSocket gateway management for real-time events |
| [`@ovendjs/rest`](./packages/rest) | 0.10.7 | REST API client with automatic rate limiting |
| [`@ovendjs/utils`](./packages/utils) | 0.22.1 | Shared utilities and formatting functions |

## 🚀 Features

- **Modular Design**: Each package serves a specific purpose and can be used independently
- **TypeScript First**: Complete type safety with excellent IntelliSense support
- **Rate Limit Handling**: Automatic rate limit management for REST API calls
- **Shard Management**: Built-in WebSocket shard handling with automatic reconnects
- **Event-Driven**: Asynchronous event emitter pattern for both gateway and REST
- **Modern Tooling**: Built with the latest tools like pnpm, TypeScript, and ESLint

## 📦 Installation

```bash
# Install individual packages
npm install @ovendjs/rest
npm install @ovendjs/gateway

# Or install all packages
npm install @ovendjs/rest @ovendjs/gateway
```

## 🛠️ Quick Start

### REST API Client

```typescript
import { REST } from '@ovendjs/rest';

const rest = new REST({ version: 10 }).setToken('your-bot-token');

// Get current user information
const user = await rest.get('/users/@me');
console.log(`Logged in as ${user.username}`);

// Create a message
await rest.post('/channels/123456789/messages', {
  data: {
    content: 'Hello, world!',
  },
});
```

### WebSocket Gateway

```typescript
import { WebSocketManager, GatewayIntentBits } from '@ovendjs/gateway';

const manager = new WebSocketManager({
  token: 'your-bot-token',
  intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMessages,
});

manager.on('ready', () => {
  console.log('Connected to Discord Gateway!');
});

manager.on('messageCreate', (message) => {
  console.log(`New message: ${message.content}`);
});

await manager.connect();
```

## 🏗️ Architecture

```mermaid
graph TD
    A[OvenJS Root] --> B[@ovendjs/gateway]
    A --> C[@ovendjs/rest]
    A --> D[@ovendjs/utils]
    
    B --> D
    C --> D
    
    B --> E[WebSocket Manager]
    B --> F[WebSocket Shards]
    
    C --> G[REST Client]
    C --> H[Bucket Manager]
    C --> I[Rate Limit Buckets]
    
    E --> F
    H --> I
```

## 🧪 Testing

Run tests using Vitest:

```bash
# Run all tests
pnpm test:run

# Run tests with coverage
pnpm test:coverage
```

## 📖 Documentation

Each package contains detailed documentation in their respective README files:

- [Gateway Package Documentation](./packages/gateway/README.md)
- [REST Package Documentation](./packages/rest/README.md)
- [Utils Package Documentation](./packages/utils/README.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on how to get started.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgements

- [Discord API](https://discord.com/developers/docs/reference) for providing excellent documentation
- [discord-api-types](https://github.com/discordjs/discord-api-types) for TypeScript definitions
- All the contributors who help maintain and improve this project

---

<p align="center">
  Made with ❤️ by the OvenJS Team
</p>
