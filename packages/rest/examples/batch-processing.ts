import { REST } from '../src/index.js';

// Initialize the REST client
const rest = new REST({
  version: 10,
  token: 'YOUR_BOT_TOKEN',
});

async function batchProcessingExample() {
  try {
    console.log('Starting batch processing example...');

    // Example of making multiple requests in sequence
    const guildId = 'GUILD_ID';
    const channelId = 'CHANNEL_ID';

    // Get guild information
    const guild = await rest.get(`/guilds/${guildId}`);
    console.log(`Guild name: ${guild.name}`);

    // Get guild channels
    const channels = await rest.get(`/guilds/${guildId}/channels`);
    console.log(`Found ${channels.length} channels`);

    // Get guild members
    const members = await rest.get(`/guilds/${guildId}/members?limit=100`);
    console.log(`Found ${members.length} members`);

    // Send messages to multiple channels
    const messagePromises = channels.slice(0, 3).map(async (channel) => {
      if (channel.type === 0) { // Text channel
        try {
          const message = await rest.post(`/channels/${channel.id}/messages`, {
            data: {
              content: `Hello from batch processing in ${channel.name}!`,
            },
          });
          return { channelId: channel.id, messageId: message.id, success: true };
        } catch (error) {
          return { channelId: channel.id, error: error instanceof Error ? error.message : String(error), success: false };
        }
      }
      return { channelId: channel.id, success: false, reason: 'Not a text channel' };
    });

    // Wait for all messages to be sent
    const messageResults = await Promise.all(messagePromises);
    console.log('Message sending results:', messageResults);

    // Get messages from multiple channels
    const textChannels = channels.filter(channel => channel.type === 0).slice(0, 3);
    const messagesPromises = textChannels.map(async (channel) => {
      try {
        const messages = await rest.get(`/channels/${channel.id}/messages?limit=10`);
        return { channelId: channel.id, messages: messages.length, success: true };
      } catch (error) {
        return { channelId: channel.id, error: error instanceof Error ? error.message : String(error), success: false };
      }
    });

    // Wait for all message requests to complete
    const messagesResults = await Promise.all(messagesPromises);
    console.log('Message retrieval results:', messagesResults);

    // Example of sequential processing with rate limit awareness
    console.log('Sequential processing with rate limit awareness...');
    for (const channel of textChannels.slice(0, 2)) {
      // Check rate limit status before making request
      const rateLimitStatus = rest.getRateLimitStatus(`/channels/${channel.id}/messages`, 'POST');
      
      if (rateLimitStatus.isRateLimited) {
        console.log(`Rate limited for channel ${channel.name}, waiting ${rateLimitStatus.resetAfter}ms...`);
        await new Promise(resolve => setTimeout(resolve, rateLimitStatus.resetAfter));
      }

      // Send a message
      const message = await rest.post(`/channels/${channel.id}/messages`, {
        data: {
          content: `Sequential message in ${channel.name}`,
        },
      });
      console.log(`Sent message to ${channel.name} with ID: ${message.id}`);
    }

    console.log('Batch processing example completed successfully!');
  } catch (error) {
    console.error('Error in batch processing example:', error);
  }
}

// Execute the example
batchProcessingExample();

// Clean up when done
process.on('SIGINT', () => {
  console.log('Cleaning up...');
  rest.destroy();
  process.exit(0);
});