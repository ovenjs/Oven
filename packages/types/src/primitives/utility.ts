/**
 * Utility types for advanced TypeScript patterns
 */

// Make all properties optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Make all properties required recursively
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Make specific keys optional
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific keys required
export type Required<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

// Get the type of array elements
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

// Get the type of promise resolution
export type Awaited<T> = T extends Promise<infer U> ? U : T;

// Get the type of function parameters
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

// Get the type of function return value
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

// Create a union of all possible dot notation paths for an object
export type DotNotation<T, P extends string = ""> = {
  [K in keyof T]: K extends string
    ? T[K] extends object
      ? DotNotation<T[K], `${P}${K}.`> | `${P}${K}`
      : `${P}${K}`
    : never;
}[keyof T];

// Extract nested value by dot notation path
export type GetByPath<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? GetByPath<T[K], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never;

// Merge two types deeply
export type DeepMerge<T, U> = {
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
};

// Create a readonly version recursively
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Non-nullable version of a type
export type NonNullable<T> = T extends null | undefined ? never : T;

// Pick properties by their value type
export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

// Omit properties by their value type
export type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};