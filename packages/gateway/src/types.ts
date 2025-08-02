import { FmtPackage } from '@ovendjs/utils';
import type {
  GatewayDispatchPayload,
  GatewayPresenceUpdateData,
  GatewayReadyDispatchData,
  GatewayIntentBits,
  GatewayIdentifyProperties,
} from 'discord-api-types/v10';

export const GATEWAY_VERSION = 10;
export const GATEWAY_ENCODING = 'json';
export const PACKAGE_META: FmtPackage = {
  name: 'gateway',
  version: '[VI]{{inject}}[/VI]',
};

export interface WebSocketManagerOptions {
  token: string;
  intents: GatewayIntentBits;
  shardCount?: number;
  presence?: GatewayPresenceUpdateData;
  properties?: GatewayIdentifyProperties;

  /**
   * Total number of shards to use
   * @default 1
   */
  totalShards?: number;

  /**
   * Comma-delimited list of guild IDs to limit the gateway connection to
   */
  guildSubscriptions?: string[];

  /**
   * Whether to compress data using zlib-stream
   * @default false
   */
  compress?: boolean;
}

export interface WebSocketManagerEvents {
  ready: [];
  resumed: [];
  error: [Error];
  disconnect: [];
  reconnecting: [];
  debug: [string];

  // Dispatch events
  dispatch: [any];
  [event: string]: any[];
}

export interface WebSocketShardEvents {
  open: [];
  close: [{ code: number; reason: string }];
  error: [Error];
  ready: [GatewayReadyDispatchData];
  resumed: [];
  dispatch: [GatewayDispatchPayload];

  // All dispatch events will also be emitted individually
  [event: string]: any[];
}
