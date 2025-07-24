/**
 * @fileoverview Advanced mapped types for dynamic type generation
 */

/**
 * Advanced readonly mapping with selective keys
 */
export type SelectiveReadonly<T, K extends keyof T = keyof T> = Omit<T, K> &
  Readonly<Pick<T, K>>;

/**
 * Advanced optional mapping with selective keys
 */
export type SelectiveOptional<T, K extends keyof T = keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * Advanced required mapping with selective keys
 */
export type SelectiveRequired<T, K extends keyof T = keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

/**
 * Nullable mapping for all properties
 */
export type NullableProps<T> = {
  [K in keyof T]: T[K] | null;
};

/**
 * Non-nullable mapping for all properties
 */
export type NonNullableProps<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};

/**
 * Promise mapping for all properties
 */
export type PromiseProps<T> = {
  [K in keyof T]: Promise<T[K]>;
};

/**
 * Function mapping for all properties
 */
export type FunctionProps<T> = {
  [K in keyof T]: () => T[K];
};

/**
 * Async function mapping for all properties
 */
export type AsyncFunctionProps<T> = {
  [K in keyof T]: () => Promise<T[K]>;
};

/**
 * Advanced key remapping with prefix
 */
export type PrefixKeys<T, TPrefix extends string> = {
  [K in keyof T as `${TPrefix}${string & K}`]: T[K];
};

/**
 * Advanced key remapping with suffix
 */
export type SuffixKeys<T, TSuffix extends string> = {
  [K in keyof T as `${string & K}${TSuffix}`]: T[K];
};

/**
 * Key transformation with custom mapping
 */
export type TransformKeys<T, TMap extends Record<keyof T, string>> = {
  [K in keyof T as TMap[K]]: T[K];
};

/**
 * Capitalize all keys
 */
export type CapitalizeKeys<T> = {
  [K in keyof T as Capitalize<string & K>]: T[K];
};

/**
 * Lowercase all keys
 */
export type LowercaseKeys<T> = {
  [K in keyof T as Lowercase<string & K>]: T[K];
};

/**
 * Snake case to camel case key transformation
 */
export type SnakeToCamelKeys<T> = {
  [K in keyof T as K extends `${infer P}_${infer S}`
    ? `${P}${Capitalize<SnakeToCamel<S>>}`
    : K]: T[K];
};

type SnakeToCamel<S extends string> = S extends `${infer P}_${infer Q}`
  ? `${P}${Capitalize<SnakeToCamel<Q>>}`
  : S;

/**
 * Camel case to snake case key transformation
 */
export type CamelToSnakeKeys<T> = {
  [K in keyof T as CamelToSnake<string & K>]: T[K];
};

type CamelToSnake<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnake<U>}`
  : S;

/**
 * Filter keys by value type
 */
export type FilterKeys<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Pick by value type
 */
export type PickByType<T, U> = Pick<T, FilterKeys<T, U>>;

/**
 * Omit by value type
 */
export type OmitByType<T, U> = Omit<T, FilterKeys<T, U>>;

/**
 * Advanced conditional mapping based on key patterns
 */
export type ConditionalMapping<T, TCondition extends string, TThen, TElse = T[keyof T]> = {
  [K in keyof T]: K extends `${infer _}${TCondition}${infer _}` ? TThen : TElse;
};

/**
 * Deep key mapping with nested object support
 */
export type DeepKeyMapping<T, TMapping extends Record<string, string>> = {
  [K in keyof T]: K extends keyof TMapping
    ? T[K] extends object
      ? DeepKeyMapping<T[K], TMapping>
      : T[K]
    : T[K] extends object
    ? DeepKeyMapping<T[K], TMapping>
    : T[K];
};

/**
 * Recursive property access type
 */
export type DeepGet<T, K extends string> = K extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends string
      ? DeepGet<T[Key], Rest>
      : never
    : never
  : K extends keyof T
  ? T[K]
  : never;

/**
 * Recursive property path generation
 */
export type DeepPaths<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${DeepPaths<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

/**
 * Advanced merge types with conflict resolution
 */
export type DeepMerge<T, U> = T extends object
  ? U extends object
    ? {
        [K in keyof T | keyof U]: K extends keyof U
          ? K extends keyof T
            ? T[K] extends object
              ? U[K] extends object
                ? DeepMerge<T[K], U[K]>
                : U[K]
              : U[K]
            : U[K]
          : K extends keyof T
          ? T[K]
          : never;
      }
    : T
  : U;

/**
 * Intersection of object types
 */
export type Intersection<T, U> = Pick<T, Extract<keyof T, keyof U>>;

/**
 * Difference of object types
 */
export type Difference<T, U> = Pick<T, Exclude<keyof T, keyof U>>;

/**
 * Symmetric difference of object types
 */
export type SymmetricDifference<T, U> = Difference<T, U> & Difference<U, T>;

/**
 * Advanced proxy type for method interception
 */
export type ProxyType<T> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => infer Return
    ? (...args: Args) => Return | Promise<Return>
    : T[K];
};

/**
 * Builder pattern mapping
 */
export type BuilderMapping<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => BuilderMapping<T>;
} & {
  build(): T;
};

/**
 * Event handler mapping
 */
export type EventHandlerMapping<T> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: T[K] extends (...args: infer Args) => any
    ? (...args: Args) => void
    : (handler: T[K]) => void;
};

/**
 * Validation mapping
 */
export type ValidationMapping<T> = {
  [K in keyof T]: {
    readonly value: T[K];
    readonly isValid: boolean;
    readonly errors: readonly string[];
  };
};