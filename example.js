import { OvenClient } from '@ovenjs/core';
import { EmbedBuilder, ButtonBuilder, Colors } from '@ovenjs/builders';

// Example usage of OvenJS Discord API wrapper
console.log('🔥 OvenJS Discord API Wrapper Example');

// Create a client instance
const client = new OvenClient({
  token: 'YOUR_BOT_TOKEN_HERE', // This would be provided by the user
  intents: 513 // GUILDS + GUILD_MESSAGES + MESSAGE_CONTENT
});

// Event: Client is ready
client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user?.username}!`);
  console.log(`📊 Bot is in ${client.guilds.size} guilds`);
  console.log(`🏓 Current ping: ${client.ping}ms`);
});

// Event: New message created
client.on('messageCreate', async (message) => {
  console.log(`💬 Message received: "${message.content}" from ${message.author.username}`);

  // Ignore messages from bots
  if (message.author.bot) return;

  // Ping command
  if (message.content.toLowerCase() === '!ping') {
    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setDescription(`Current latency: ${client.ping}ms`)
      .setColor(0x00ff00)
      .setTimestamp()
      .setFooter({ text: 'Powered by OvenJS' });

    try {
      await client.sendMessage(message.channel_id, {
        embeds: [embed.toJSON()]
      });
      console.log('✅ Ping response sent');
    } catch (error) {
      console.error('❌ Failed to send ping response:', error);
    }
  }

  // Info command
  if (message.content.toLowerCase() === '!info') {
    const embed = new EmbedBuilder()
      .setTitle('📋 Bot Information')
      .setDescription('A Discord bot built with OvenJS!')
      .addField('📦 Library', 'OvenJS v0.1.0', true)
      .addField('🏓 Ping', `${client.ping}ms`, true)
      .addField('⏱️ Uptime', client.uptime ? `${Math.floor(client.uptime / 1000)}s` : 'Unknown', true)
      .setColor(0x5865f2)
      .setTimestamp();

    try {
      await client.sendMessage(message.channel_id, {
        embeds: [embed.toJSON()]
      });
      console.log('✅ Info response sent');
    } catch (error) {
      console.error('❌ Failed to send info response:', error);
    }
  }

  // Help command
  if (message.content.toLowerCase() === '!help') {
    const embed = new EmbedBuilder()
      .setTitle('🆘 Help Commands')
      .setDescription('Here are the available commands:')
      .addField('!ping', 'Check bot latency', false)
      .addField('!info', 'Show bot information', false)
      .addField('!help', 'Show this help message', false)
      .setColor(0xff9500)
      .setTimestamp();

    try {
      await client.sendMessage(message.channel_id, {
        embeds: [embed.toJSON()]
      });
      console.log('✅ Help response sent');
    } catch (error) {
      console.error('❌ Failed to send help response:', error);
    }
  }
});

// Event: Guild joined
client.on('guildCreate', (guild) => {
  console.log(`🎉 Joined guild: ${guild.name} (${guild.id})`);
});

// Event: Guild left
client.on('guildDelete', (guild) => {
  console.log(`👋 Left guild: ${guild.name} (${guild.id})`);
});

// Event: Error occurred
client.on('error', (error) => {
  console.error('❌ Client error:', error);
});

// Event: Warning
client.on('warn', (warning) => {
  console.warn('⚠️ Client warning:', warning);
});

// Event: Debug info
client.on('debug', (info) => {
  console.log('🔍 Debug:', info);
});

// Example of how to login (token would be provided by user)
export async function startBot(token) {
  try {
    console.log('🚀 Starting bot...');
    await client.login(token);
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Export client for external use
export { client };

// Instructions for usage
console.log(`
📝 Usage Instructions:
1. Create a Discord application at https://discord.com/developers/applications
2. Create a bot and copy the token
3. Import this example and call startBot(token)
4. Invite the bot to your server with proper permissions

Example:
import { startBot } from './example.js';
startBot('YOUR_BOT_TOKEN_HERE');

Available Commands:
- !ping - Check bot latency
- !info - Show bot information  
- !help - Show help message
`);