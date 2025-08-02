export {
  GatewayOpcodes,
  GatewayCloseCodes,
  GatewayDispatchEvents,
  GatewayIntentBits,
} from 'discord-api-types/v10';

export { WebSocketManager } from './WebSocketManager';
export {
  WebSocketManagerOptions,
  WebSocketManagerEvents,
  WebSocketShardEvents,
} from './types';

/**
 * The current version that you are currently using.
 *
 * Note to developers: This needs to explicitly be `string` so it is not typed as a "const string" that gets injected by esbuild
 */
export const version: string = '[VI]{{inject}}[/VI]';
