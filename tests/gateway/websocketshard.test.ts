process.loadEnvFile('.env');
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebSocketShard } from '../../packages/gateway/src/shard/WebSocketShard';
import { WebSocketManagerOptions } from '../../packages/gateway/src/types';
import { GatewayIntentBits } from 'discord-api-types/v10';

describe('WebSocketShard', () => {
  let shard: WebSocketShard;
  const mockOptions: WebSocketManagerOptions = {
    token: process.env.TOKEN as string,
    intents:
      GatewayIntentBits.Guilds |
      GatewayIntentBits.GuildMessages |
      GatewayIntentBits.MessageContent,
  };

  beforeEach(() => {
    shard = new WebSocketShard(0, mockOptions);
  });

  afterEach(() => {
    shard.destroy();
  });

  it('should initialize with correct shard ID', () => {
    expect(shard.getShardId()).toBe(0);
  });

  it('should track connection state', () => {
    expect(shard.isConnecting()).toBe(false);
    expect(shard.isConnected()).toBe(false);
  });
});
