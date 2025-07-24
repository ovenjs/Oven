import type { Client } from '../Client';
import type { Snowflake } from '@ovenjs/types';

export abstract class Base {
  public readonly client: Client;
  public readonly id: Snowflake;

  constructor(client: Client, data: { id: Snowflake }) {
    this.client = client;
    this.id = data.id;
  }

  /**
   * Get the creation timestamp of this structure
   */
  public get createdTimestamp(): number {
    const snowflake = BigInt(this.id);
    return Number((snowflake >> 22n) + 1420070400000n);
  }

  /**
   * Get the creation date of this structure
   */
  public get createdAt(): Date {
    return new Date(this.createdTimestamp);
  }

  /**
   * Convert to a plain object representation
   */
  public abstract toJSON(): any;

  /**
   * Check if this structure equals another
   */
  public equals(other: Base): boolean {
    return this.id === other.id;
  }

  /**
   * String representation
   */
  public toString(): string {
    return this.id;
  }
}