/**
 * OvenJS Builders - Type-safe builders for Discord objects
 * Provides fluent API for creating embeds, components, modals, and commands
 */

// Embed builders
export { EmbedBuilder } from './embeds/index.js';

// Component builders
export { ActionRowBuilder, ButtonBuilder, SelectMenuBuilder, TextInputBuilder } from './components/index.js';

// Modal builders
export { ModalBuilder } from './modals/index.js';

// Command builders
export { SlashCommandBuilder } from './commands/index.js';

// Utilities
export { Colors, resolveColor, numberToHex, numberToRGB, randomColor } from './utils/index.js';

// Version info
export const VERSION = '0.1.0' as const;