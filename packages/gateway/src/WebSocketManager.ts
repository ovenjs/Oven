import { fmt } from '@ovendjs/utils';
import { AsyncEventEmitter } from '@vladfrangu/async_event_emitter';

import { WebSocketShard } from './shard/WebSocketShard';
import {
  type WebSocketManagerOptions,
  type WebSocketManagerEvents,
  PACKAGE_META,
  GatewayDispatchEvents,
} from './types';

/**
 * Manages multiple WebSocket shards for Discord Gateway connections
 *
 * @example
 * ```ts
 * const manager = new WebSocketManager({
 *   token: 'your-bot-token',
 *   intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMessages,
 * });
 *
 * manager.on('ready', () => {
 *   console.log('All shards are ready!');
 * });
 *
 * manager.on('MESSAGE_CREATE', (message) => {
 *   console.log(`Message received: ${message.content}`);
 * });
 *
 * await manager.connect();
 * ```
 */
export class WebSocketManager extends AsyncEventEmitter<WebSocketManagerEvents> {
  private readonly options: WebSocketManagerOptions;
  private shards: Map<number, WebSocketShard> = new Map();
  private shardCount: number;
  private readyShards: Set<number> = new Set();
  private connecting: boolean = false;
  private _fmt = fmt(PACKAGE_META);

  constructor(options: WebSocketManagerOptions) {
    super();

    this.options = options;
    this.shardCount = options.shardCount ??= 1;
  }

  /**
   * Connects all shards to the Discord Gateway
   */
  async connect(): Promise<void> {
    if (this.connecting) return;

    this.connecting = true;

    this.emit('debug', this._fmt.debug(`Connecting ${this.shardCount} shards`));

    try {
      for (let shardId = 0; shardId < this.shardCount; shardId++) {
        await this.createShard(shardId);
      }
    } catch (error) {
      this.connecting = false;
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Creates and initializes a new shard
   * @param shardId - The ID of the shard to create
   */
  private async createShard(shardId: number): Promise<void> {
    const shard = new WebSocketShard(shardId, {
      ...this.options,
      totalShards: this.shardCount,
    });

    // Forward events from shard to manager
    shard.on('ready', _data => {
      this.readyShards.add(shardId);
      this.emit('debug', this._fmt.debug(`Shard ${shardId} ready`));

      if (this.readyShards.size === this.shardCount) {
        this.emit('ready');
      }
    });

    shard.on('resumed', () => {
      this.readyShards.add(shardId);
      this.emit('debug', this._fmt.debug(`Shard ${shardId} resumed`));
    });

    shard.on('error', error => {
      this.emit('error', error);
    });

    shard.on('close', ({ code, reason }) => {
      this.emit('debug', this._fmt.debug(`Shard ${shardId} closed: ${code} ${reason}`));
    });

    shard.on('dispatch', payload => {
      this.emit('dispatch', payload);

      // Forward specific gateway events with proper typing
      if (
        payload.t &&
        Object.values(GatewayDispatchEvents).includes(payload.t as GatewayDispatchEvents)
      ) {
        this.emit(payload.t as GatewayDispatchEvents, payload.d as never);
      }
    });

    this.shards.set(shardId, shard);
    await shard.connect();
  }

  /**
   * Disconnects all shards from the Discord Gateway
   */
  async disconnect(): Promise<void> {
    this.emit('debug', this._fmt.debug('Disconnecting all shards'));

    for (const shard of this.shards.values()) {
      shard.destroy();
    }

    this.shards.clear();
    this.readyShards.clear();
    this.connecting = false;
    this.emit('disconnect');
  }

  /**
   * Gets a specific shard by ID
   * @param shardId - The ID of the shard to get
   * @returns The shard if found, otherwise undefined
   */
  getShard(shardId: number): WebSocketShard | undefined {
    return this.shards.get(shardId);
  }

  /**
   * Gets all shards managed by this manager
   * @returns A Map of shard IDs to shard instances
   */
  getShards(): Map<number, WebSocketShard> {
    return this.shards;
  }

  /**
   * Checks if all shards are ready
   * @returns True if all shards are ready, otherwise false
   */
  isReady(): boolean {
    return this.readyShards.size === this.shards.size && this.shards.size > 0;
  }

  /**
   * Gets the total number of shards
   * @returns The number of shards
   */
  getShardCount(): number {
    return this.shardCount;
  }
}
