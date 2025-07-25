import { EmbedBuilder, ButtonBuilder, SlashCommandBuilder, Colors } from '@ovenjs/builders';
import { OvenClient } from '@ovenjs/core';

console.log('=== Testing OvenJS Packages ===');

// Test EmbedBuilder
try {
  const embed = new EmbedBuilder()
    .setTitle('Test Embed')
    .setDescription('This is a test embed')
    .setColor(Colors.Blue)
    .addField('Test Field', 'Test Value', true)
    .setTimestamp()
    .build();
  
  console.log('✅ EmbedBuilder works correctly');
  console.log('Embed:', JSON.stringify(embed, null, 2));
} catch (error) {
  console.error('❌ EmbedBuilder failed:', error);
}

// Test ButtonBuilder
try {
  const button = new ButtonBuilder()
    .setLabel('Test Button')
    .setStyle(1) // Primary
    .setCustomId('test-button')
    .build();
  
  console.log('✅ ButtonBuilder works correctly');
  console.log('Button:', JSON.stringify(button, null, 2));
} catch (error) {
  console.error('❌ ButtonBuilder failed:', error);
}

// Test SlashCommandBuilder
try {
  const command = new SlashCommandBuilder()
    .setName('test')
    .setDescription('A test command')
    .addStringOption(option => 
      option
        .setName('message')
        .setDescription('Message to send')
        .setRequired(true)
    )
    .build();
  
  console.log('✅ SlashCommandBuilder works correctly');
  console.log('Command:', JSON.stringify(command, null, 2));
} catch (error) {
  console.error('❌ SlashCommandBuilder failed:', error);
}

// Test OvenClient (without token)
try {
  const client = new OvenClient({
    token: 'test-token',
    intents: 513
  });
  
  console.log('✅ OvenClient instantiated correctly');
  console.log('Client stats:', JSON.stringify(client.getStats(), null, 2));
} catch (error) {
  console.error('❌ OvenClient failed:', error);
}

console.log('=== Testing Complete ===');