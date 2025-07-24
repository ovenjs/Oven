/**
 * @fileoverview Advanced type guards with sophisticated type narrowing
 */

import type { 
  Snowflake, 
  UserSnowflake, 
  GuildSnowflake, 
  ChannelSnowflake,
  AnySnowflake 
} from '../primitives/brand.js';
import type { APIUser, APIGuild, APIChannel, APIMessage } from '../discord/entities.js';

/**
 * Advanced type guard utility
 */
export interface TypeGuard<T> {
  (value: unknown): value is T;
}

/**
 * Compound type guard builder
 */
export interface CompoundTypeGuard<T> extends TypeGuard<T> {
  and<U>(guard: TypeGuard<U>): CompoundTypeGuard<T & U>;
  or<U>(guard: TypeGuard<U>): TypeGuard<T | U>;
  not(): TypeGuard<Exclude<unknown, T>>;
}

/**
 * Create a compound type guard
 */
export const createTypeGuard = <T>(guard: TypeGuard<T>): CompoundTypeGuard<T> => {
  const compoundGuard = guard as CompoundTypeGuard<T>;
  
  compoundGuard.and = <U>(otherGuard: TypeGuard<U>) => 
    createTypeGuard((value: unknown): value is T & U => 
      guard(value) && otherGuard(value)
    );
  
  compoundGuard.or = <U>(otherGuard: TypeGuard<U>) => 
    ((value: unknown): value is T | U => 
      guard(value) || otherGuard(value)
    );
  
  compoundGuard.not = () => 
    ((value: unknown): value is Exclude<unknown, T> => 
      !guard(value)
    );
  
  return compoundGuard;
};

/**
 * Primitive type guards
 */
export const isString = createTypeGuard((value: unknown): value is string => 
  typeof value === 'string'
);

export const isNumber = createTypeGuard((value: unknown): value is number => 
  typeof value === 'number' && !Number.isNaN(value)
);

export const isBoolean = createTypeGuard((value: unknown): value is boolean => 
  typeof value === 'boolean'
);

export const isBigInt = createTypeGuard((value: unknown): value is bigint => 
  typeof value === 'bigint'
);

export const isSymbol = createTypeGuard((value: unknown): value is symbol => 
  typeof value === 'symbol'
);

export const isFunction = createTypeGuard((value: unknown): value is Function => 
  typeof value === 'function'
);

export const isObject = createTypeGuard((value: unknown): value is object => 
  typeof value === 'object' && value !== null
);

export const isArray = createTypeGuard((value: unknown): value is unknown[] => 
  Array.isArray(value)
);

export const isNull = createTypeGuard((value: unknown): value is null => 
  value === null
);

export const isUndefined = createTypeGuard((value: unknown): value is undefined => 
  value === undefined
);

export const isNullish = createTypeGuard((value: unknown): value is null | undefined => 
  value == null
);

/**
 * Advanced object type guards
 */
export const hasProperty = <K extends string>(
  key: K
) => createTypeGuard((value: unknown): value is Record<K, unknown> => 
  isObject(value) && key in value
);

export const hasProperties = <K extends readonly string[]>(
  ...keys: K
) => createTypeGuard((value: unknown): value is Record<K[number], unknown> => 
  isObject(value) && keys.every(key => key in value)
);

export const hasMethod = <K extends string>(
  method: K
) => createTypeGuard((value: unknown): value is Record<K, Function> => 
  isObject(value) && method in value && isFunction((value as any)[method])
);

/**
 * Discord-specific type guards
 */
export const isSnowflake = createTypeGuard((value: unknown): value is Snowflake => 
  isString(value) && /^\d{17,19}$/.test(value)
);

export const isUserSnowflake = createTypeGuard((value: unknown): value is UserSnowflake => 
  isSnowflake(value)
);

export const isGuildSnowflake = createTypeGuard((value: unknown): value is GuildSnowflake => 
  isSnowflake(value)
);

export const isChannelSnowflake = createTypeGuard((value: unknown): value is ChannelSnowflake => 
  isSnowflake(value)
);

export const isAnySnowflake = createTypeGuard((value: unknown): value is AnySnowflake => 
  isSnowflake(value)
);

/**
 * Discord entity type guards
 */
export const isAPIUser = createTypeGuard((value: unknown): value is APIUser => 
  isObject(value) && 
  hasProperty('id')(value) && 
  isUserSnowflake((value as any).id) &&
  hasProperty('username')(value) && 
  isString((value as any).username) &&
  hasProperty('discriminator')(value) && 
  isString((value as any).discriminator)
);

export const isAPIGuild = createTypeGuard((value: unknown): value is APIGuild => 
  isObject(value) && 
  hasProperty('id')(value) && 
  isGuildSnowflake((value as any).id) &&
  hasProperty('name')(value) && 
  isString((value as any).name) &&
  hasProperty('owner_id')(value) && 
  isUserSnowflake((value as any).owner_id)
);

export const isAPIChannel = createTypeGuard((value: unknown): value is APIChannel => 
  isObject(value) && 
  hasProperty('id')(value) && 
  isChannelSnowflake((value as any).id) &&
  hasProperty('type')(value) && 
  isNumber((value as any).type)
);

export const isAPIMessage = createTypeGuard((value: unknown): value is APIMessage => 
  isObject(value) && 
  hasProperty('id')(value) && 
  isSnowflake((value as any).id) &&
  hasProperty('channel_id')(value) && 
  isChannelSnowflake((value as any).channel_id) &&
  hasProperty('author')(value) && 
  isAPIUser((value as any).author) &&
  hasProperty('content')(value) && 
  isString((value as any).content)
);

/**
 * Collection type guards
 */
export const isArrayOf = <T>(
  itemGuard: TypeGuard<T>
) => createTypeGuard((value: unknown): value is T[] => 
  isArray(value) && value.every(itemGuard)
);

export const isNonEmptyArray = createTypeGuard((value: unknown): value is [unknown, ...unknown[]] => 
  isArray(value) && value.length > 0
);

export const isNonEmptyArrayOf = <T>(
  itemGuard: TypeGuard<T>
) => createTypeGuard((value: unknown): value is [T, ...T[]] => 
  isNonEmptyArray(value) && value.every(itemGuard)
);

/**
 * Promise type guards
 */
export const isPromise = createTypeGuard((value: unknown): value is Promise<unknown> => 
  isObject(value) && hasMethod('then')(value)
);

export const isPromiseLike = createTypeGuard((value: unknown): value is PromiseLike<unknown> => 
  isObject(value) && hasMethod('then')(value)
);

/**
 * Error type guards
 */
export const isError = createTypeGuard((value: unknown): value is Error => 
  isObject(value) && 
  hasProperty('name')(value) && 
  isString((value as any).name) &&
  hasProperty('message')(value) && 
  isString((value as any).message)
);

export const isErrorWithCode = createTypeGuard((value: unknown): value is Error & { code: string } => 
  isError(value) && 
  hasProperty('code')(value) && 
  isString((value as any).code)
);

/**
 * Date and time type guards
 */
export const isDate = createTypeGuard((value: unknown): value is Date => 
  value instanceof Date && !Number.isNaN(value.getTime())
);

export const isValidDate = createTypeGuard((value: unknown): value is Date => 
  isDate(value) && value.getTime() === value.getTime()
);

/**
 * Generic utility type guards
 */
export const isInstanceOf = <T>(
  constructor: new (...args: any[]) => T
) => createTypeGuard((value: unknown): value is T => 
  value instanceof constructor
);

export const isTruthy = createTypeGuard(<T>(value: T): value is NonNullable<T> => 
  Boolean(value)
);

export const isFalsy = createTypeGuard((value: unknown): value is false | null | undefined | 0 | '' => 
  !Boolean(value)
);

/**
 * Conditional type guards
 */
export const when = <T, U extends T>(
  condition: TypeGuard<U>
) => ({
  then: <V>(thenGuard: TypeGuard<V>) => createTypeGuard((value: unknown): value is U & V => 
    condition(value) && thenGuard(value)
  ),
  else: <V>(elseGuard: TypeGuard<V>) => createTypeGuard((value: unknown): value is (T & V) | U => 
    condition(value) || elseGuard(value)
  )
});

/**
 * Exhaustive type checking
 */
export const exhaustive = (value: never): never => {
  throw new Error(`Exhaustive check failed. Received: ${JSON.stringify(value)}`);
};

/**
 * Assert discriminated union
 */
export const assertUnion = <T extends Record<string, any>, K extends keyof T>(
  value: T,
  discriminator: K,
  expectedValue: T[K]
): value is T & Record<K, T[K]> => {
  return value[discriminator] === expectedValue;
};

/**
 * Runtime type assertion with detailed error messages
 */
export const assertType = <T>(
  guard: TypeGuard<T>,
  value: unknown,
  message?: string
): asserts value is T => {
  if (!guard(value)) {
    throw new TypeError(
      message || `Type assertion failed. Expected type, but received: ${typeof value}`
    );
  }
};