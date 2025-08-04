import { REST } from '../src/index.js';
import { DiscordAPIError } from '../src/utils/errors/DiscordAPIError.js';
import { RESTError } from '../src/utils/errors/RESTError.js';

// Initialize the REST client
const rest = new REST({
  version: 10,
  token: 'YOUR_BOT_TOKEN',
});

async function errorHandlingExample() {
  try {
    console.log('Starting error handling example...');

    // Example 1: Handling invalid token
    try {
      const invalidRest = new REST({
        version: 10,
        token: 'INVALID_TOKEN',
      });
      
      await invalidRest.get('/users/@me');
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        console.log('Discord API Error:', {
          message: error.message,
          code: error.code,
          httpStatus: error.httpStatus,
          method: error.method,
          path: error.path,
        });
      } else if (error instanceof RESTError) {
        console.log('REST Error:', error.message);
      } else {
        console.log('Unknown Error:', error instanceof Error ? error.message : String(error));
      }
    }

    // Example 2: Handling rate limits
    try {
      // Make multiple requests quickly to trigger rate limiting
      const channelId = 'CHANNEL_ID';
      const promises = Array(10).fill(0).map(() =>
        rest.post(`/channels/${channelId}/messages`, {
          data: {
            content: 'Rate limit test message',
          },
        })
      );
      
      await Promise.all(promises);
    } catch (error) {
      if (error instanceof DiscordAPIError && error.httpStatus === 429) {
        console.log('Rate limit hit:', {
          message: error.message,
          retryAfter: error.message.includes('Try Again After') ?
            error.message.split('Try Again After: ')[1].replace('s', '') : 'unknown',
        });
      } else {
        console.log('Unexpected error during rate limit test:', error instanceof Error ? error.message : String(error));
      }
    }

    // Example 3: Handling invalid request data
    try {
      await rest.post('/channels/INVALID_CHANNEL_ID/messages', {
        data: {
          content: '', // Empty content should trigger an error
        },
      });
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        console.log('Invalid request data error:', {
          message: error.message,
          code: error.code,
          httpStatus: error.httpStatus,
        });
      } else {
        console.log('Unexpected error with invalid data:', error instanceof Error ? error.message : String(error));
      }
    }

    // Example 4: Handling network errors
    try {
      // This would normally fail if there's no network connection
      // For demonstration, we'll use a timeout
      const timeoutRest = new REST({
        version: 10,
        token: 'YOUR_BOT_TOKEN',
        timeout: 1, // 1ms timeout to trigger a timeout error
      });
      
      await timeoutRest.get('/users/@me');
    } catch (error) {
      if (error instanceof RESTError) {
        console.log('Network/timeout error:', error.message);
      } else {
        console.log('Unexpected network error:', error instanceof Error ? error.message : String(error));
      }
    }

    // Example 5: Using requestWithRetry for automatic retry
    try {
      const user = await rest.requestWithRetry({
        method: 'GET',
        path: '/users/@me',
      }, {
        maxRetries: 3,
        retryDelay: 1000,
      });
      
      console.log('Successfully fetched user with retry:', user.username);
    } catch (error) {
      console.log('Failed even with retries:', error instanceof Error ? error.message : String(error));
    }

    // Example 6: Handling permission errors
    try {
      // Try to access a guild the bot doesn't have permission to access
      await rest.get('/guilds/INVALID_GUILD_ID');
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        console.log('Permission error:', {
          message: error.message,
          code: error.code,
          httpStatus: error.httpStatus,
        });
      } else {
        console.log('Unexpected permission error:', error instanceof Error ? error.message : String(error));
      }
    }

    console.log('Error handling example completed!');
  } catch (error) {
    console.error('Unexpected error in error handling example:', error instanceof Error ? error.message : String(error));
  }
}

// Execute the example
errorHandlingExample();

// Clean up when done
process.on('SIGINT', () => {
  console.log('Cleaning up...');
  rest.destroy();
  process.exit(0);
});