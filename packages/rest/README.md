# @ovendjs/rest

A high-performance, type-safe Discord REST API client with advanced features including intelligent rate limiting, request caching, batching, and comprehensive event handling.

## Features

- **Advanced Type System**: Comprehensive TypeScript support with 100% API coverage
- **Intelligent Rate Limiting**: Predictive rate limiting with hierarchical bucket management
- **Request Caching**: Multi-layer caching with configurable TTL policies
- **Request Batching**: Automatic batching of compatible requests for improved performance
- **Connection Pooling**: Efficient HTTP connection management with undici
- **Middleware Pipeline**: Extensible request/response interceptors
- **Event System**: High-performance event handling with prioritization
- **Error Handling**: Comprehensive error classification and retry mechanisms
- **Performance Monitoring**: Built-in metrics collection and analytics
- **Memory Optimization**: Object pooling and efficient resource management

## Installation

```bash
npm install @ovendjs/rest
# or
pnpm add @ovendjs/rest
# or
yarn add @ovendjs/rest
```

## Quick Start

```typescript
import { REST } from '@ovendjs/rest';

const rest = new REST({
  version: '10',
  api: 'https://discord.com/api',
  token: 'YOUR_BOT_TOKEN',
});

// Make a simple request
const user = await rest.get('/users/@me');
console.log(`Logged in as ${user.username}`);

// Make a request with options
const channels = await rest.get('/guilds/{guild.id}/channels', {
  params: { 'guild.id': 'GUILD_ID' },
});
```

## Advanced Usage

### Configuration Options

```typescript
const rest = new REST({
  version: '10',
  api: 'https://discord.com/api',
  token: 'YOUR_BOT_TOKEN',
  
  // Rate limiting options
  rateLimit: {
    maxRetries: 3,
    retryInterval: 5000,
    rejectOnRateLimit: true,
  },
  
  // Caching options
  cache: {
    enabled: true,
    ttl: 60 * 1000, // 1 minute
    maxSize: 1000,
  },
  
  // Performance options
  performance: {
    enableMetrics: true,
    enableProfiling: true,
  },
  
  // Connection options
  connection: {
    poolSize: 10,
    keepAlive: true,
    timeout: 30000,
  },
});
```

### Middleware Pipeline

```typescript
import { REST, Middleware } from '@ovendjs/rest';

const rest = new REST({ token: 'YOUR_BOT_TOKEN' });

// Add request interceptor
rest.use(Middleware.request({
  before: (request) => {
    console.log(`Making ${request.method} request to ${request.url}`);
    return request;
  },
}));

// Add response interceptor
rest.use(Middleware.response({
  after: (response) => {
    console.log(`Received response with status ${response.status}`);
    return response;
  },
}));

// Add error interceptor
rest.use(Middleware.error({
  onError: (error) => {
    console.error('Request failed:', error);
    // Return false to continue error propagation
    // Return true to stop error propagation
    return false;
  },
}));
```

### Event Handling

```typescript
import { REST, Events } from '@ovendjs/rest';

const rest = new REST({ token: 'YOUR_BOT_TOKEN' });

// Listen to request events
rest.on(Events.Request, (request) => {
  console.log(`Request: ${request.method} ${request.url}`);
});

// Listen to response events
rest.on(Events.Response, (response) => {
  console.log(`Response: ${response.status} ${response.url}`);
});

// Listen to rate limit events
rest.on(Events.RateLimit, (rateLimitData) => {
  console.log(`Rate limited on ${rateLimitData.route}, resets in ${rateLimitData.resetAfter}ms`);
});

// Listen to error events
rest.on(Events.Error, (error) => {
  console.error('REST Error:', error);
});
```

### Performance Monitoring

```typescript
import { REST } from '@ovendjs/rest';

const rest = new REST({ 
  token: 'YOUR_BOT_TOKEN',
  performance: {
    enableMetrics: true,
    enableProfiling: true,
  },
});

// Get performance metrics
const metrics = rest.getMetrics();
console.log('Request metrics:', metrics.requests);
console.log('Cache metrics:', metrics.cache);
console.log('Rate limit metrics:', metrics.rateLimits);

// Get performance profile
const profile = rest.getProfile();
console.log('Performance profile:', profile);
```

### Request Batching

```typescript
import { REST, BatchProcessor } from '@ovendjs/rest';

const rest = new REST({ token: 'YOUR_BOT_TOKEN' });

// Create a batch processor
const batchProcessor = new BatchProcessor(rest);

// Add requests to batch
batchProcessor.add({
  id: 'user-request',
  method: 'GET',
  url: '/users/@me',
});

batchProcessor.add({
  id: 'guilds-request',
  method: 'GET',
  url: '/users/@me/guilds',
});

// Execute all requests in batch
const results = await batchProcessor.execute();
console.log('Batch results:', results);
```

### Custom Cache Implementation

```typescript
import { REST, CacheAdapter } from '@ovendjs/rest';

class CustomCache extends CacheAdapter {
  private cache = new Map<string, { data: any; expires: number }>();

  async get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  async set(key: string, value: any, ttl: number) {
    this.cache.set(key, {
      data: value,
      expires: Date.now() + ttl,
    });
  }

  async delete(key: string) {
    return this.cache.delete(key);
  }

  async clear() {
    this.cache.clear();
  }
}

const rest = new REST({ 
  token: 'YOUR_BOT_TOKEN',
  cache: {
    adapter: new CustomCache(),
    ttl: 60 * 1000,
  },
});
```

## API Reference

### REST Class

The main client class for interacting with the Discord REST API.

#### Constructor

```typescript
new REST(options: RESTOptions)
```

#### Options

- `version` (string): Discord API version (default: '10')
- `api` (string): Discord API base URL (default: 'https://discord.com/api')
- `token` (string): Bot token for authentication
- `rateLimit` (RateLimitOptions): Rate limiting configuration
- `cache` (CacheOptions): Caching configuration
- `performance` (PerformanceOptions): Performance monitoring configuration
- `connection` (ConnectionOptions): Connection pooling configuration

#### Methods

- `get(url: string, options?: RequestOptions)`: Make a GET request
- `post(url: string, body?: any, options?: RequestOptions)`: Make a POST request
- `put(url: string, body?: any, options?: RequestOptions)`: Make a PUT request
- `patch(url: string, body?: any, options?: RequestOptions)`: Make a PATCH request
- `delete(url: string, options?: RequestOptions)`: Make a DELETE request
- `use(middleware: Middleware)`: Add middleware to the pipeline
- `on(event: string, listener: Function)`: Add event listener
- `off(event: string, listener: Function)`: Remove event listener
- `getMetrics()`: Get performance metrics
- `getProfile()`: Get performance profile
- `destroy()`: Clean up resources

### Events

The REST client emits the following events:

- `request`: Emitted when a request is made
- `response`: Emitted when a response is received
- `rateLimit`: Emitted when rate limited
- `error`: Emitted when an error occurs
- `cacheHit`: Emitted when a request is served from cache
- `cacheMiss`: Emitted when a request is not in cache

### Middleware

The middleware system allows you to intercept and modify requests and responses:

- `RequestMiddleware`: Intercept requests before they are sent
- `ResponseMiddleware`: Intercept responses before they are processed
- `ErrorMiddleware`: Handle errors that occur during requests

## Performance Considerations

### Rate Limiting

The REST client includes intelligent rate limiting that:

- Automatically respects Discord's rate limits
- Predicts rate limit resets to avoid hitting limits
- Implements hierarchical bucket management
- Supports global and per-endpoint rate limiting

### Caching

The caching system provides:

- In-memory caching with configurable TTL
- Automatic cache invalidation
- Cache analytics and metrics
- Support for custom cache implementations

### Connection Pooling

The connection pool:

- Reuses HTTP connections for better performance
- Implements keep-alive strategies
- Supports connection limits and timeouts
- Provides connection metrics

## Error Handling

The REST client provides comprehensive error handling:

- Automatic retry with exponential backoff
- Circuit breaker pattern to prevent cascade failures
- Detailed error classification and metadata
- Configurable retry conditions

## Examples

See the [examples](./examples) directory for more detailed usage examples.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.