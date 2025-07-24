#!/usr/bin/env node

/**
 * OvenJS Development Helper Script
 * Provides utilities for development and testing
 */

const fs = require('fs');
const path = require('path');

console.log('🔥 OvenJS Development Helper\n');

const commands = {
  structure: () => {
    console.log('📁 Project Structure:');
    console.log(`
ovenjs/
├── packages/
│   ├── types/        # TypeScript definitions
│   ├── rest/         # REST API client  
│   ├── ws/           # WebSocket client
│   ├── builders/     # Object builders
│   └── core/         # Main client
├── README.md         # Documentation
├── STRUCTURE.md      # Architecture guide
├── test.js          # Demo script
└── example.js       # Usage example
    `);
  },

  packages: () => {
    console.log('📦 Available Packages:');
    console.log('');
    console.log('🎯 @ovenjs/core - Main Discord client');
    console.log('   - Event-driven architecture');
    console.log('   - Resource managers');
    console.log('   - High-level API');
    console.log('');
    console.log('🌐 @ovenjs/rest - REST API client');
    console.log('   - Rate limit handling');
    console.log('   - Request queuing');
    console.log('   - File upload support');
    console.log('');
    console.log('🔌 @ovenjs/ws - WebSocket client');
    console.log('   - Gateway connection');
    console.log('   - Auto-reconnection');
    console.log('   - Shard management');
    console.log('');
    console.log('📝 @ovenjs/types - TypeScript definitions');
    console.log('   - Complete API coverage');
    console.log('   - Type safety');
    console.log('   - IntelliSense support');
    console.log('');
    console.log('🔨 @ovenjs/builders - Object builders');
    console.log('   - Embed builder');
    console.log('   - Message builder');
    console.log('   - Component builders');
  },

  features: () => {
    console.log('✨ Key Features:');
    console.log('');
    console.log('🚀 Modern TypeScript');
    console.log('   - Full type safety');
    console.log('   - IntelliSense support');
    console.log('   - Latest ES features');
    console.log('');
    console.log('📦 Modular Architecture');
    console.log('   - Use only what you need');
    console.log('   - Clean separation of concerns');
    console.log('   - Easy to extend');
    console.log('');
    console.log('⚡ Performance Focused');
    console.log('   - Automatic rate limiting');
    console.log('   - Efficient memory usage');
    console.log('   - Optimized networking');
    console.log('');
    console.log('🛡️ Production Ready');
    console.log('   - Error resilience');
    console.log('   - Auto-reconnection');
    console.log('   - Comprehensive logging');
  },

  examples: () => {
    console.log('📝 Usage Examples:');
    console.log('');
    console.log('1. Basic Bot:');
    console.log(`
import { Client, Intents } from '@ovenjs/core';

const client = new Client({
  intents: [Intents.GUILDS, Intents.GUILD_MESSAGES]
});

client.on('ready', () => {
  console.log('Bot is ready!');
});

client.login('YOUR_TOKEN');
    `);

    console.log('2. Message Handler:');
    console.log(`
client.on('messageCreate', async (message) => {
  if (message.content === '!ping') {
    await message.reply('Pong!');
  }
});
    `);

    console.log('3. Rich Embeds:');
    console.log(`
import { EmbedBuilder } from '@ovenjs/builders';

const embed = new EmbedBuilder()
  .setTitle('Hello World')
  .setDescription('This is an embed')
  .setColor(0x00ff00)
  .setTimestamp();

await channel.send({ embeds: [embed] });
    `);
  },

  test: () => {
    console.log('🧪 Running tests...');
    require('./test.js');
  },

  help: () => {
    console.log('Available commands:');
    console.log('  structure  - Show project structure');
    console.log('  packages   - List available packages');
    console.log('  features   - Show key features');
    console.log('  examples   - Show usage examples');
    console.log('  test       - Run test script');
    console.log('  help       - Show this help');
  }
};

const command = process.argv[2] || 'help';

if (commands[command]) {
  commands[command]();
} else {
  console.log(`❌ Unknown command: ${command}`);
  console.log('Run "node dev.js help" for available commands');
}