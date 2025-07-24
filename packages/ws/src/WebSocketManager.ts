import { EventEmitter } from 'events';
import type { WebSocketShardOptions, ShardEvents } from './WebSocketShard';
import { WebSocketShard } from './WebSocketShard';

export interface WebSocketManagerOptions {
  token: string;
  intents: number;
  shardCount?: number | 'auto';
  presence?: any;
  gatewayURL?: string;
}

export interface ManagerEvents {
  shardReady: [shardId: number, data: any];
  shardReconnect: [shardId: number];
  shardResume: [shardId: number];
  shardError: [shardId: number, error: Error];
  shardClose: [shardId: number, code: number, reason: string];
  message: [shardId: number, message: any];
}

export declare interface WebSocketManager extends EventEmitter {
  on<K extends keyof ManagerEvents>(event: K, listener: (...args: ManagerEvents[K]) => void): this;
  once<K extends keyof ManagerEvents>(event: K, listener: (...args: ManagerEvents[K]) => void): this;
  emit<K extends keyof ManagerEvents>(event: K, ...args: ManagerEvents[K]): boolean;
}

export class WebSocketManager extends EventEmitter {
  private shards = new Map<number, WebSocketShard>();
  private options: WebSocketManagerOptions;
  private totalShards: number = 1;

  constructor(options: WebSocketManagerOptions) {
    super();
    this.options = options;
  }

  public async connect(): Promise<void> {
    // Determine shard count
    if (this.options.shardCount === 'auto') {
      // In a real implementation, you'd fetch this from Discord's API
      this.totalShards = 1; // Default for now
    } else {
      this.totalShards = this.options.shardCount ?? 1;
    }

    // Create and connect shards
    for (let i = 0; i < this.totalShards; i++) {
      await this.createShard(i);
      
      // Add delay between shard connections to avoid rate limits
      if (i < this.totalShards - 1) {
        await this.sleep(5000);
      }
    }
  }

  public disconnect(): void {
    for (const shard of this.shards.values()) {
      shard.disconnect();
    }
    this.shards.clear();
  }

  public updatePresence(presence: any): void {
    for (const shard of this.shards.values()) {
      shard.updatePresence(presence);
    }
  }

  public getShard(guildId?: string): WebSocketShard | undefined {
    if (!guildId) {
      return this.shards.get(0);
    }

    // Calculate shard ID for guild
    const shardId = this.getShardId(guildId);
    return this.shards.get(shardId);
  }

  public get ping(): number {
    const shards = Array.from(this.shards.values());
    if (shards.length === 0) return -1;

    const latencies = shards.map(shard => shard.latency).filter(latency => latency >= 0);
    if (latencies.length === 0) return -1;

    return Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  }

  public get isConnected(): boolean {
    return Array.from(this.shards.values()).every(shard => shard.isConnected);
  }

  private async createShard(shardId: number): Promise<void> {
    const shardOptions: WebSocketShardOptions = {
      token: this.options.token,
      intents: this.options.intents,
      shardId,
      totalShards: this.totalShards,
      presence: this.options.presence,
      gatewayURL: this.options.gatewayURL,
    };

    const shard = new WebSocketShard(shardOptions);

    // Set up event listeners
    shard.on('ready', (data) => {
      this.emit('shardReady', shardId, data);
    });

    shard.on('message', (message) => {
      this.emit('message', shardId, message);
    });

    shard.on('error', (error) => {
      this.emit('shardError', shardId, error);
    });

    shard.on('close', (code, reason) => {
      this.emit('shardClose', shardId, code, reason);
    });

    shard.on('reconnect', () => {
      this.emit('shardReconnect', shardId);
    });

    shard.on('resumed', () => {
      this.emit('shardResume', shardId);
    });

    this.shards.set(shardId, shard);
    shard.connect();
  }

  private getShardId(guildId: string): number {
    // Discord's shard calculation: (guild_id >> 22) % shard_count
    const guildIdBigInt = BigInt(guildId);
    return Number((guildIdBigInt >> 22n) % BigInt(this.totalShards));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}