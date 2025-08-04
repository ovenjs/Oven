# REST Package Examples

This directory contains practical examples demonstrating how to use the enhanced `@ovendjs/rest` package.

## Examples

### [basic-usage.ts](./basic-usage.ts)

Demonstrates the fundamental usage of the REST client including:
- Initializing the REST client
- Making basic GET, POST, and DELETE requests
- Handling responses and errors
- Common API operations (getting user info, guilds, channels, etc.)

**Run this example:**
```bash
cd packages/rest
node --loader ts-node/esm examples/basic-usage.ts
```

### [advanced-usage.ts](./advanced-usage.ts)

Shows advanced features of the REST client including:
- Event handling (request, response, rate limit, error events)
- Rate limit status checking
- Automatic retry with `requestWithRetry`
- Custom request options
- Proper cleanup of resources

**Run this example:**
```bash
cd packages/rest
node --loader ts-node/esm examples/advanced-usage.ts
```

### [batch-processing.ts](./batch-processing.ts)

Demonstrates how to efficiently handle multiple requests:
- Sequential request processing
- Parallel request execution with Promise.all
- Rate limit awareness in batch operations
- Error handling in batch operations

**Run this example:**
```bash
cd packages/rest
node --loader ts-node/esm examples/batch-processing.ts
```

### [error-handling.ts](./error-handling.ts)

Shows comprehensive error handling patterns:
- Handling Discord API errors
- Handling rate limit errors
- Handling network and timeout errors
- Using automatic retry mechanisms
- Handling permission errors

**Run this example:**
```bash
cd packages/rest
node --loader ts-node/esm examples/error-handling.ts
```

## Prerequisites

Before running these examples, make sure you have:

1. A valid Discord bot token (replace `YOUR_BOT_TOKEN` in the examples)
2. Valid channel and guild IDs (replace `CHANNEL_ID` and `GUILD_ID` in the examples)
3. Node.js with TypeScript support
4. ts-node installed globally or locally

## Setup

1. Install dependencies:
```bash
cd packages/rest
npm install
```

2. Run the examples:
```bash
# For basic usage
node --loader ts-node/esm examples/basic-usage.ts

# For advanced usage
node --loader ts-node/esm examples/advanced-usage.ts

# For batch processing
node --loader ts-node/esm examples/batch-processing.ts

# For error handling
node --loader ts-node/esm examples/error-handling.ts
```

## Customization

All examples are designed to be easily customized for your specific use case. Replace the placeholder values with your actual bot token and Discord IDs.

## Best Practices

These examples demonstrate the following best practices:

1. **Error Handling**: Always handle errors gracefully and provide meaningful feedback.
2. **Rate Limit Awareness**: Check rate limit status before making requests when possible.
3. **Resource Cleanup**: Always clean up resources when they're no longer needed.
4. **Event Handling**: Use events to monitor and debug your application.
5. **Type Safety**: Leverage TypeScript's type system for safer code.

## Contributing

If you have additional examples that would be helpful for other users, please consider contributing them to this directory.