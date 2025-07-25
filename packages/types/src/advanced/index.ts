/**
 * Advanced TypeScript patterns and utilities
 */

// Conditional types
export type If<C extends boolean, T, F> = C extends true ? T : F;
export type Not<T extends boolean> = T extends true ? false : true;
export type And<A extends boolean, B extends boolean> = A extends true ? B : false;
export type Or<A extends boolean, B extends boolean> = A extends true ? true : B;

// Template literal types
export type Uppercase<S extends string> = S extends `${infer First}${infer Rest}`
  ? `${Capitalize<First>}${Uppercase<Rest>}`
  : S;

export type Lowercase<S extends string> = S extends `${infer First}${infer Rest}`
  ? `${Uncapitalize<First>}${Lowercase<Rest>}`
  : S;

export type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : Lowercase<S>;

export type KebabCase<S extends string> = S extends `${infer C}${infer T}`
  ? C extends Uppercase<C>
    ? `-${Lowercase<C>}${KebabCase<T>}`
    : `${C}${KebabCase<T>}`
  : S;

// Function types
export type Fn<Args extends readonly unknown[] = any[], Return = any> = (...args: Args) => Return;
export type AsyncFn<Args extends readonly unknown[] = any[], Return = any> = (...args: Args) => Promise<Return>;

// Object manipulation types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Merge<T, U> = Prettify<T & U>;

export type Override<T, U> = Prettify<Omit<T, keyof U> & U>;

export type StrictPartial<T, K extends keyof T> = Prettify<Omit<T, K> & Partial<Pick<T, K>>>;

export type StrictRequired<T, K extends keyof T> = Prettify<T & Required<Pick<T, K>>>;

// Array utilities
export type Head<T extends readonly unknown[]> = T extends readonly [infer H, ...unknown[]] ? H : never;
export type Tail<T extends readonly unknown[]> = T extends readonly [unknown, ...infer Rest] ? Rest : [];
export type Last<T extends readonly unknown[]> = T extends readonly [...unknown[], infer L] ? L : never;
export type Length<T extends readonly unknown[]> = T['length'];

// Tuple utilities
export type Reverse<T extends readonly unknown[]> = T extends readonly [...infer Rest, infer Last]
  ? [Last, ...Reverse<Rest>]
  : [];

export type Zip<T extends readonly unknown[], U extends readonly unknown[]> = T extends readonly [
  infer THead,
  ...infer TTail,
]
  ? U extends readonly [infer UHead, ...infer UTail]
    ? [[THead, UHead], ...Zip<TTail, UTail>]
    : []
  : [];

// String utilities
export type Split<S extends string, D extends string> = S extends `${infer T}${D}${infer U}`
  ? [T, ...Split<U, D>]
  : [S];

export type Join<T extends readonly string[], D extends string> = T extends readonly [
  infer F,
  ...infer R,
]
  ? F extends string
    ? R extends readonly string[]
      ? R['length'] extends 0
        ? F
        : `${F}${D}${Join<R, D>}`
      : never
    : never
  : '';

// Type guards
export type IsAny<T> = 0 extends 1 & T ? true : false;
export type IsNever<T> = [T] extends [never] ? true : false;
export type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false;
export type IsFunction<T> = T extends (...args: any[]) => any ? true : false;
export type IsArray<T> = T extends readonly any[] ? true : false;
export type IsObject<T> = T extends object ? (IsArray<T> extends true ? false : true) : false;

// Union utilities
export type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

export type UnionToTuple<T> = UnionToIntersection<T extends any ? () => T : never> extends () => infer ReturnType
  ? [...UnionToTuple<Exclude<T, ReturnType>>, ReturnType]
  : [];

// Promise utilities
export type PromiseValue<T> = T extends Promise<infer U> ? U : T;
export type PromiseTuple<T extends readonly unknown[]> = {
  [K in keyof T]: Promise<T[K]>;
};

// Event emitter types
export type EventMap = Record<string | symbol, any[]>;
export type EventKey<T extends EventMap> = string & keyof T;
export type EventReceiver<T extends EventMap, K extends EventKey<T>> = (...args: T[K]) => void;

// Builder pattern types
export type Builder<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => Builder<T>;
} & {
  build(): T;
};

// Validation types
export type Validate<T, Schema> = T extends Schema ? T : never;
export type ValidateShape<T, Schema extends Record<keyof T, any>> = {
  [K in keyof T]: T[K] extends Schema[K] ? T[K] : never;
};

// Path types for nested objects
export type Paths<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${Paths<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

export type PathValue<T, P extends Paths<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Paths<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;