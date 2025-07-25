/**
 * Base structure class for OvenJS
 * Foundation for all Discord structures
 */

import type { StructureOptions } from '@ovenjs/types';
import type { Snowflake } from '@ovenjs/types';

export abstract class Base {
  protected client: any; // Will be OvenClient
  public readonly id: Snowflake;
  public readonly createdAt: Date;

  constructor(options: StructureOptions, data: { id: Snowflake }) {
    this.client = options.client;
    this.id = data.id;
    this.createdAt = this.getCreatedAt();
  }

  /**
   * Get the creation timestamp from the snowflake
   */
  private getCreatedAt(): Date {
    const timestamp = (BigInt(this.id) >> 22n) + 1420070400000n;
    return new Date(Number(timestamp));
  }

  /**
   * Get the creation timestamp in milliseconds
   */
  get createdTimestamp(): number {
    return this.createdAt.getTime();
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /**
   * String representation
   */
  toString(): string {
    return this.id;
  }

  /**
   * Check if this structure is equal to another
   */
  equals(other: unknown): boolean {
    if (!(other instanceof Base)) {
      return false;
    }
    return this.id === other.id;
  }

  /**
   * Get the hash code for this structure
   */
  hashCode(): string {
    return this.id;
  }
}