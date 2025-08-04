import { REST } from '../src/index.js';

// Initialize the REST client with advanced configuration
const rest = new REST({
  version: 10,
  token: 'YOUR_BOT_TOKEN',
  timeout: 30000,
});

async function advancedUsage() {
  try {
    // Set up event listeners
    rest.on('request', (event) => {
      console.log(`[${new Date().toISOString()}] Making ${event.method} request to ${event.path}`);
    });

    rest.on('response', (event) => {
      console.log(`[${new Date().toISOString()}] Received response for ${event.method} ${event.path} with status ${event.status}`);
    });

    rest.on('rateLimit', (event) => {
      console.log(`[${new Date().toISOString()}] Rate limited: ${event.global ? 'Global' : 'Local'}, retry after ${event.retryAfter}ms`);
    });

    rest.on('error', (event) => {
      console.error(`[${new Date().toISOString()}] Error in ${event.method} ${event.path}:`, event.error.message);
    });

    // Get rate limit status for a route
    const rateLimitStatus = rest.getRateLimitStatus('/channels/123/messages', 'POST');
    console.log('Rate limit status:', rateLimitStatus);

    // Check global rate limit status
    const globalRateLimitStatus = rest.getGlobalRateLimitStatus();
    console.log('Global rate limit status:', globalRateLimitStatus);

    // Make a request with automatic retry on rate limits
    const user = await rest.requestWithRetry({
      method: 'GET',
      path: '/users/@me',
    }, {
      maxRetries: 3,
      retryDelay: 1000,
    });
    console.log(`Logged in as ${user.username}#${user.discriminator}`);

    // Make a request with custom options
    const channels = await rest.get('/guilds/GUILD_ID/channels', {
      options: {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      },
    });
    console.log(`Found ${channels.length} channels`);

    // Send a message with retry
    const message = await rest.requestWithRetry({
      method: 'POST',
      path: '/channels/CHANNEL_ID/messages',
      data: {
        content: 'Hello with automatic retry!',
        embeds: [
          {
            title: 'Example Embed',
            description: 'This is an example embed',
            color: 0x00ff00,
          },
        ],
      },
    }, {
      maxRetries: 5,
      retryDelay: 2000,
    });
    console.log(`Sent message with ID: ${message.id}`);

    // Get rate limit status after making requests
    const newRateLimitStatus = rest.getRateLimitStatus('/channels/CHANNEL_ID/messages', 'POST');
    console.log('Updated rate limit status:', newRateLimitStatus);

  } catch (error) {
    console.error('Error in advanced usage example:', error);
  }
}

// Execute the example
advancedUsage();

// Clean up when done
process.on('SIGINT', () => {
  console.log('Cleaning up...');
  rest.destroy();
  process.exit(0);
});