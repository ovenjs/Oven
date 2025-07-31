import { AsyncEventEmitter } from '@vladfrangu/async_event_emitter';

import { WebSocketShard } from './shard/WebSocketShard';
import type { WebSocketManagerOptions, WebSocketManagerEvents } from './types';

export class WebSocketManager extends AsyncEventEmitter<WebSocketManagerEvents> {
  private readonly options: WebSocketManagerOptions;
  private shards: Map<number, WebSocketShard> = new Map();
  private shardCount: number;
  private readyShards: Set<number> = new Set();
  private connecting: boolean = false;

  constructor(options: WebSocketManagerOptions) {
    super();

    this.options = options;
    this.shardCount = options.shardCount ??= 1;
  }

  async connect(): Promise<void> {
    if (this.connecting) return;

    this.connecting = true;
    this.emit('debug', `[GATEWAY]: Connecting ${this.shardCount} shards`);

    try {
      for (let shardId = 0; shardId < this.shardCount; shardId++) {
        await this.createShard(shardId);
      }
    } catch (error) {
      this.connecting = false;
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async createShard(shardId: number): Promise<void> {
    const shard = new WebSocketShard(shardId, {
      ...this.options,
      totalShards: this.shardCount,
    });

    // Forward events from shard to manager
    shard.on('ready', _data => {
      this.readyShards.add(shardId);
      this.emit('debug', `[GATEWAY]: Shard ${shardId} ready`);

      if (this.readyShards.size === this.shardCount) {
        this.emit('ready');
      }
    });

    shard.on('resumed', () => {
      this.readyShards.add(shardId);
      this.emit('debug', `[GATEWAY]: Shard ${shardId} resumed`);
    });

    shard.on('error', error => {
      this.emit('error', error);
    });

    shard.on('close', ({ code, reason }) => {
      this.emit('debug', `[GATEWAY] Shard ${shardId} closed: ${code} ${reason}`);
    });

    shard.on('dispatch', payload => {
      this.emit('dispatch', payload);

      if (payload.t) {
        this.emit(payload.t, payload.d);
      }
    });

    this.shards.set(shardId, shard);
    await shard.connect();
  }

  async disconnect(): Promise<void> {
    this.emit('debug', '[GATEWAY]: Disconnecting all shards');

    for (const shard of this.shards.values()) {
      shard.destroy();
    }

    this.shards.clear();
    this.readyShards.clear();
    this.connecting = false;
    this.emit('disconnect');
  }

  getShard(shardId: number): WebSocketShard | undefined {
    return this.shards.get(shardId);
  }

  getShards(): Map<number, WebSocketShard> {
    return this.shards;
  }

  isReady(): boolean {
    return this.readyShards.size === this.shards.size && this.shards.size > 0;
  }

  getShardCount(): number {
    return this.shardCount;
  }
}
