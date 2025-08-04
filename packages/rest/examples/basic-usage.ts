import { REST } from '../src/index.js';

// Initialize the REST client
const rest = new REST({
  version: 10, // version should be a number, not a string
  token: 'YOUR_BOT_TOKEN',
});

async function basicUsage() {
  try {
    // Get the bot user information
    const user = await rest.get('/users/@me');
    console.log(`Logged in as ${user.username}#${user.discriminator}`);

    // Get the bot's guilds
    const guilds = await rest.get('/users/@me/guilds');
    console.log(`Bot is in ${guilds.length} guilds`);

    // Get channels in a specific guild
    const channels = await rest.get('/guilds/GUILD_ID/channels');
    console.log(`Found ${channels.length} channels in guild`);

    // Send a message to a channel
    const message = await rest.post('/channels/CHANNEL_ID/messages', {
      data: {
        content: 'Hello from the enhanced REST client!',
      },
    });
    console.log(`Sent message with ID: ${message.id}`);

    // Get messages in a channel
    const messages = await rest.get('/channels/CHANNEL_ID/messages');
    console.log(`Retrieved ${messages.length} messages`);

    // Delete a message
    await rest.delete('/channels/CHANNEL_ID/messages/MESSAGE_ID');
    console.log('Message deleted');
  } catch (error) {
    console.error('Error in basic usage example:', error);
  }
}

// Execute the example
basicUsage();