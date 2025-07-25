/**
 * Configuration manager for OvenJS
 * Handles client configuration and validation
 */

import type { ClientConfig, ConfigValidationResult, OvenClientOptions } from '@ovenjs/types';
import { OvenClientError } from '@ovenjs/types';

export class ConfigManager {
  private config: ClientConfig;
  
  constructor(options: OvenClientOptions) {
    this.config = this.processOptions(options);
    this.validate();
  }

  /**
   * Process raw options into configuration
   */
  private processOptions(options: OvenClientOptions): ClientConfig {
    return {
      token: options.token,
      intents: options.intents,
      shards: typeof options.shards === 'number' ? options.shards : undefined,
      maxCachedGuilds: 1000,
      maxCachedUsers: 1000,
      maxCachedChannels: 1000,
      maxCachedMessages: 100,
      messageSweepInterval: 60000, // 1 minute
      messageCacheLifetime: 300000, // 5 minutes
      presence: options.presence,
      restOptions: options.restOptions,
      wsOptions: options.wsOptions,
    };
  }

  /**
   * Validate the configuration
   */
  private validate(): void {
    const result = this.validateConfig();
    if (!result.valid) {
      throw new OvenClientError(
        `Invalid configuration: ${result.errors.join(', ')}`,
        'INVALID_CONFIG'
      );
    }
  }

  /**
   * Validate configuration and return result
   */
  validateConfig(): ConfigValidationResult {
    const errors: string[] = [];

    // Validate token
    if (!this.config.token) {
      errors.push('Token is required');
    } else if (typeof this.config.token !== 'string') {
      errors.push('Token must be a string');
    } else if (!this.isValidToken(this.config.token)) {
      errors.push('Token format is invalid');
    }

    // Validate intents
    if (typeof this.config.intents !== 'number') {
      errors.push('Intents must be a number');
    } else if (this.config.intents < 0) {
      errors.push('Intents must be non-negative');
    }

    // Validate shards
    if (this.config.shards !== undefined) {
      if (typeof this.config.shards !== 'number') {
        errors.push('Shards must be a number');
      } else if (this.config.shards < 1) {
        errors.push('Shards must be at least 1');
      }
    }

    // Validate cache limits
    if (this.config.maxCachedGuilds && this.config.maxCachedGuilds < 1) {
      errors.push('maxCachedGuilds must be at least 1');
    }
    if (this.config.maxCachedUsers && this.config.maxCachedUsers < 1) {
      errors.push('maxCachedUsers must be at least 1');
    }
    if (this.config.maxCachedChannels && this.config.maxCachedChannels < 1) {
      errors.push('maxCachedChannels must be at least 1');
    }
    if (this.config.maxCachedMessages && this.config.maxCachedMessages < 1) {
      errors.push('maxCachedMessages must be at least 1');
    }

    // Validate sweep interval
    if (this.config.messageSweepInterval && this.config.messageSweepInterval < 1000) {
      errors.push('messageSweepInterval must be at least 1000ms');
    }

    // Validate cache lifetime
    if (this.config.messageCacheLifetime && this.config.messageCacheLifetime < 1000) {
      errors.push('messageCacheLifetime must be at least 1000ms');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if token format is valid
   */
  private isValidToken(token: string): boolean {
    // Basic token format validation
    const botTokenRegex = /^[A-Za-z0-9_-]{23,28}\.[A-Za-z0-9_-]{6,7}\.[A-Za-z0-9_-]{27,}/;
    return botTokenRegex.test(token);
  }

  /**
   * Get the configuration
   */
  get(): ClientConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  update(updates: Partial<ClientConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validate();
  }

  /**
   * Get token
   */
  getToken(): string {
    return this.config.token;
  }

  /**
   * Get intents
   */
  getIntents(): number {
    return this.config.intents;
  }

  /**
   * Get shards
   */
  getShards(): number | undefined {
    return this.config.shards;
  }

  /**
   * Get REST options
   */
  getRestOptions(): any {
    return this.config.restOptions;
  }

  /**
   * Get WebSocket options
   */
  getWebSocketOptions(): any {
    return this.config.wsOptions;
  }

  /**
   * Get presence data
   */
  getPresence(): any {
    return this.config.presence;
  }

  /**
   * Get cache configuration
   */
  getCacheConfig(): {
    maxCachedGuilds?: number;
    maxCachedUsers?: number;
    maxCachedChannels?: number;
    maxCachedMessages?: number;
    messageSweepInterval?: number;
    messageCacheLifetime?: number;
  } {
    return {
      maxCachedGuilds: this.config.maxCachedGuilds,
      maxCachedUsers: this.config.maxCachedUsers,
      maxCachedChannels: this.config.maxCachedChannels,
      maxCachedMessages: this.config.maxCachedMessages,
      messageSweepInterval: this.config.messageSweepInterval,
      messageCacheLifetime: this.config.messageCacheLifetime,
    };
  }
}