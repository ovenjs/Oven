/**
 * @fileoverview Advanced utility types for sophisticated type manipulation
 */

/**
 * Deep readonly - makes all properties readonly recursively
 */
export type DeepReadonly<T> = T extends (infer U)[]
  ? DeepReadonlyArray<U>
  : T extends ReadonlyArray<infer U>
  ? DeepReadonlyArray<U>
  : DeepReadonlyObject<T>;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

/**
 * Deep partial - makes all properties optional recursively
 */
export type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartialArray<U>
  : T extends ReadonlyArray<infer U>
  ? DeepPartialArray<U>
  : DeepPartialObject<T>;

interface DeepPartialArray<T> extends Array<DeepPartial<T>> {}

type DeepPartialObject<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

/**
 * Strict Omit - better than built-in Omit, ensures keys exist
 */
export type StrictOmit<T, K extends keyof T> = Omit<T, K>;

/**
 * Strict Pick - better than built-in Pick, ensures keys exist
 */
export type StrictPick<T, K extends keyof T> = Pick<T, K>;

/**
 * Required keys - extract all required keys from a type
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * Optional keys - extract all optional keys from a type
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * Make specific keys required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific keys optional
 */
export type OptionalizeKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Non-empty array type
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Tuple to union type conversion
 */
export type TupleToUnion<T extends readonly unknown[]> = T[number];

/**
 * Union to intersection type conversion
 */
export type UnionToIntersection<U> = (
  U extends unknown ? (arg: U) => void : never
) extends (arg: infer I) => void
  ? I
  : never;

/**
 * Get function return type from promise
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Extract type from array
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : T extends ReadonlyArray<infer U> ? U : never;

/**
 * Conditional type for method overloading
 */
export type MethodOverload<T, K extends keyof T> = T[K] extends (...args: any[]) => any
  ? T[K]
  : never;

/**
 * Extract constructor parameters
 */
export type ConstructorParams<T> = T extends new (...args: infer P) => any ? P : never;

/**
 * Pretty print utility - improves IntelliSense display
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Nominal typing helper
 */
export type Nominal<T, K extends string> = T & { readonly __nominal: K };

/**
 * Exact type matching - prevents excess properties
 */
export type Exact<T, U extends T> = T & Record<Exclude<keyof U, keyof T>, never>;

/**
 * Safe key access type
 */
export type SafeKey<T, K extends keyof T> = K;

/**
 * Value of object type
 */
export type ValueOf<T> = T[keyof T];

/**
 * Mutable version of readonly types
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Deep mutable version of readonly types
 */
export type DeepMutable<T> = T extends (infer U)[]
  ? DeepMutableArray<U>
  : T extends ReadonlyArray<infer U>
  ? DeepMutableArray<U>
  : DeepMutableObject<T>;

interface DeepMutableArray<T> extends Array<DeepMutable<T>> {}

type DeepMutableObject<T> = {
  -readonly [P in keyof T]: DeepMutable<T[P]>;
};

/**
 * Function type utilities
 */
export type Fn<TArgs extends readonly unknown[] = readonly unknown[], TReturn = unknown> = (
  ...args: TArgs
) => TReturn;

export type AsyncFn<TArgs extends readonly unknown[] = readonly unknown[], TReturn = unknown> = (
  ...args: TArgs
) => Promise<TReturn>;

/**
 * JSON serializable types
 */
export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export interface JSONArray extends Array<JSONValue> {}

/**
 * Type-safe object keys
 */
export type ObjectKeys<T> = T extends object
  ? (keyof T)[]
  : never;

/**
 * Conditional type that resolves to never if condition is false
 */
export type If<C extends boolean, T, F = never> = C extends true ? T : F;