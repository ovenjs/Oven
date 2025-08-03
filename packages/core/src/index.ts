/**
 * @packageDocumentation
 * @module @ovendjs/core
 * @summary
 * The main entry point for the OvenJS Core package.
 *
 * This file exports the core classes and interfaces needed to create and manage Discord bots
 * using a clean, event-driven, and type-safe API.
 *
 * @example
 * ```ts
 * import { Bot, GatewayIntentBits } from '@ovendjs/core';
 *
 * const bot = new Bot({
 *   intents: [
 *     GatewayIntentBits.Guilds,
 *     GatewayIntentBits.GuildMessages,
 *     GatewayIntentBits.MessageContent,
 *   ],
 * });
 *
 * bot.on('ready', () => {
 *   console.log(`Logged in as ${bot.user.tag}`);
 * });
 *
 * bot.on('messageCreate', (message) => {
 *   if (message.content === '!ping') {
 *     message.reply('Pong!');
 *   }
 * });
 *
 * bot.login('YOUR_BOT_TOKEN');
 * ```
 */

/**
 * The main Bot class for creating and managing Discord bots.
 *
 * @remarks
 * This is the primary entry point for the OvenJS Core package. It provides a unified interface
 * for interacting with the Discord API, managing resources, and handling events.
 *
 * @see {@link Bot}
 */
export { Bot } from './Bot';

/**
 * Configuration options for the Bot client.
 *
 * @remarks
 * Includes intents, shard settings, and other behavioral configurations.
 *
 * @see {@link BotOptions}
 */
export type { BotOptions } from './types';

/**
 * Discord data structures and transformers.
 *
 * @remarks
 * These classes represent Discord API objects and provide methods for interacting with them.
 */
export * from './structures';

/**
 * Re-exported GatewayIntentBits from discord-api-types for convenience.
 *
 * @remarks
 * These are used to specify which events your bot should receive from Discord.
 */
export { GatewayIntentBits } from 'discord-api-types/v10';

/**
 * The current version that you are currently using.
 *
 * Note to developers: This needs to explicitly be `string` so it is not typed as a "const string" that gets injected by esbuild
 */
export const version: string = '[VI]{{inject}}[/VI]';