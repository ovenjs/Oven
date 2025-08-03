import type { Bot } from '../Bot';

/**
 * Base class for all Discord data structures.
 *
 * @remarks
 * This class provides common functionality for all Discord data structures,
 * such as ID handling, timestamp parsing, and JSON serialization.
 */
export abstract class BaseStructure {
  /**
   * The bot instance this structure belongs to.
   */
  protected readonly bot: Bot;

  /**
   * The unique identifier for this structure.
   */
  public readonly id: string;

  /**
   * The timestamp when this structure was created.
   */
  public readonly createdAt: Date;

  /**
   * Creates a new BaseStructure instance.
   *
   * @param bot - The bot instance this structure belongs to.
   * @param id - The unique identifier for this structure.
   */
  constructor(bot: Bot, id: string) {
    this.bot = bot;
    this.id = id;
    this.createdAt = this.constructor.name === 'BaseStructure' 
      ? new Date() 
      : BaseStructure.extractTimestamp(id);
  }

  /**
   * Extracts a timestamp from a Discord snowflake ID.
   *
   * @param id - The Discord snowflake ID.
   * @returns The timestamp extracted from the snowflake.
   */
  public static extractTimestamp(id: string): Date {
    // Discord snowflakes are 64-bit integers with the timestamp in the first 42 bits
    const snowflake = BigInt(id);
    const timestamp = Number((snowflake >> 22n) + 1420070400000n);
    return new Date(timestamp);
  }

  /**
   * Patches this structure with raw data from the Discord API.
   *
   * @param data - The raw data from the Discord API.
   * @returns This structure instance for chaining.
   */
  public abstract _patch(data: any): this;

  /**
   * Converts this structure to a JSON-serializable object.
   *
   * @returns A JSON-serializable representation of this structure.
   */
  public toJSON(): any {
    const obj: any = {};
    
    // Get all properties of this instance
    const props = Object.getOwnPropertyNames(this);
    
    // Filter out private properties and methods
    for (const prop of props) {
      if (!prop.startsWith('_') && typeof this[prop as keyof this] !== 'function') {
        obj[prop] = (this as any)[prop];
      }
    }
    
    return obj;
  }

  /**
   * Returns a string representation of this structure.
   *
   * @returns A string representation of this structure.
   */
  public toString(): string {
    return `${this.constructor.name}(${this.id})`;
  }

  /**
   * Returns the URL to this resource in the Discord API.
   *
   * @returns The URL to this resource in the Discord API.
   */
  public abstract get url(): string;
}