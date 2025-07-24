// Main exports
export * from './Client';
export * from './managers';
export * from './structures';

// Re-export from other packages
export * from '@ovenjs/types';
export * from '@ovenjs/builders';
export * from '@ovenjs/rest';
export * from '@ovenjs/ws';

// Intents helper
export { GatewayIntents as Intents } from '@ovenjs/types';

// Version info
export const version = '0.1.0';