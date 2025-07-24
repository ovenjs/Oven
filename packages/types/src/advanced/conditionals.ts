/**
 * @fileoverview Advanced conditional types for sophisticated type logic
 */

/**
 * Check if type is never
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Check if type is any
 */
export type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Check if type is unknown
 */
export type IsUnknown<T> = IsAny<T> extends true
  ? false
  : unknown extends T
  ? true
  : false;

/**
 * Check if type is function
 */
export type IsFunction<T> = T extends (...args: any[]) => any ? true : false;

/**
 * Check if type is array
 */
export type IsArray<T> = T extends readonly unknown[] ? true : false;

/**
 * Check if type is tuple
 */
export type IsTuple<T> = T extends readonly [any, ...any[]] ? true : false;

/**
 * Check if type is object (not array, function, or primitive)
 */
export type IsObject<T> = T extends object
  ? IsArray<T> extends true
    ? false
    : IsFunction<T> extends true
    ? false
    : true
  : false;

/**
 * Check if two types are equal
 */
export type Equal<X, Y> = (<T>() => T extends X ? true : false) extends <T>() => T extends Y
  ? true
  : false
  ? true
  : false;

/**
 * Check if type extends another type
 */
export type Extends<T, U> = T extends U ? true : false;

/**
 * Conditional type for nullable values
 */
export type Nullable<T> = T | null;
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Advanced conditional for optional properties
 */
export type OptionalPropertyOf<T> = Exclude<
  {
    [K in keyof T]: T extends Record<K, T[K]> ? never : K;
  }[keyof T],
  undefined
>;

/**
 * Required property extraction
 */
export type RequiredPropertyOf<T> = Exclude<
  {
    [K in keyof T]: T extends Record<K, T[K]> ? K : never;
  }[keyof T],
  undefined
>;

/**
 * Conditional type for promise unwrapping
 */
export type Awaited<T> = T extends null | undefined
  ? T
  : T extends object & { then(onfulfilled: infer F): any }
  ? F extends (value: infer V) => any
    ? Awaited<V>
    : never
  : T;

/**
 * Deep conditional types for nested structures
 */
export type DeepConditional<T, TCondition, TThen, TElse = T> = {
  [K in keyof T]: T[K] extends TCondition
    ? TThen
    : T[K] extends object
    ? DeepConditional<T[K], TCondition, TThen, TElse>
    : TElse;
};

/**
 * Conditional type for method extraction
 */
export type Methods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

/**
 * Conditional type for property extraction
 */
export type Properties<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K;
}[keyof T];

/**
 * Advanced pattern matching with conditional types
 */
export type Match<T, TPattern> = T extends infer U
  ? TPattern extends {
      [K in keyof TPattern]: (value: U) => value is infer TResult ? TResult : never;
    }
    ? TPattern[keyof TPattern] extends (value: U) => value is infer TResult
      ? TResult
      : never
    : never
  : never;

/**
 * Conditional type for branded type checking
 */
export type IsBranded<T, TBrand extends string> = T extends { __brand: TBrand } ? true : false;

/**
 * Extract brand from branded type
 */
export type ExtractBrand<T> = T extends { __brand: infer TBrand } ? TBrand : never;

/**
 * Conditional type for discriminated unions
 */
export type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = T extends {
  [P in K]: V;
}
  ? T
  : never;

/**
 * Conditional type for type narrowing
 */
export type Narrow<T, U> = T extends U ? T : never;

/**
 * Conditional type for type widening
 */
export type Widen<T> = T extends string
  ? string
  : T extends number
  ? number
  : T extends boolean
  ? boolean
  : T extends bigint
  ? bigint
  : T extends symbol
  ? symbol
  : T;

/**
 * Advanced conditional for recursive type checking
 */
export type IsRecursive<T, TOriginal = T> = T extends object
  ? T extends TOriginal
    ? true
    : {
        [K in keyof T]: IsRecursive<T[K], TOriginal>;
      }[keyof T] extends true
    ? true
    : false
  : false;

/**
 * Conditional type for circular reference detection
 */
export type HasCircularReference<T> = IsRecursive<T>;

/**
 * Advanced conditional for deep type analysis
 */
export type DeepAnalysis<T> = {
  isArray: IsArray<T>;
  isFunction: IsFunction<T>;
  isObject: IsObject<T>;
  isTuple: IsTuple<T>;
  isNever: IsNever<T>;
  isAny: IsAny<T>;
  isUnknown: IsUnknown<T>;
  hasCircularReference: HasCircularReference<T>;
};