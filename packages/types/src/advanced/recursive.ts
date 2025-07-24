/**
 * @fileoverview Recursive types for complex nested structures
 */

/**
 * Recursive tree structure with type safety
 */
export interface TreeNode<T> {
  readonly value: T;
  readonly children: readonly TreeNode<T>[];
  readonly parent?: TreeNode<T>;
}

/**
 * Recursive validation for nested objects
 */
export type DeepValidation<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends object ? DeepValidation<T[K]> : ValidationResult<T[K]>;
    }
  : ValidationResult<T>;

export interface ValidationResult<T> {
  readonly value: T;
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

/**
 * Recursive path building for nested objects
 */
export type DeepKeyPath<T, TPrefix extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? TPrefix extends ''
            ? K | DeepKeyPath<T[K], K>
            : `${TPrefix}.${K}` | DeepKeyPath<T[K], `${TPrefix}.${K}`>
          : TPrefix extends ''
          ? K
          : `${TPrefix}.${K}`
        : never;
    }[keyof T]
  : never;

/**
 * Recursive type for nested cache structures
 */
export interface NestedCache<T> {
  readonly [key: string]: T | NestedCache<T>;
}

/**
 * Recursive configuration type with inheritance
 */
export interface RecursiveConfig<T = unknown> {
  readonly value?: T;
  readonly children?: Record<string, RecursiveConfig<T>>;
  readonly inherit?: boolean;
}

/**
 * Recursive menu structure for Discord components
 */
export interface MenuStructure {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
  readonly children?: readonly MenuStructure[];
}

/**
 * Recursive permission tree
 */
export interface PermissionNode {
  readonly permission: string;
  readonly granted: boolean;
  readonly children?: Record<string, PermissionNode>;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Recursive JSON schema type
 */
export interface JSONSchema {
  readonly type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  readonly properties?: Record<string, JSONSchema>;
  readonly items?: JSONSchema;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean | JSONSchema;
}

/**
 * Deep type flattening
 */
export type DeepFlatten<T> = T extends readonly (infer U)[]
  ? DeepFlatten<U>
  : T extends object
  ? {
      [K in keyof T]: DeepFlatten<T[K]>;
    }
  : T;

/**
 * Recursive type for building SQL-like queries
 */
export interface QueryNode<T = unknown> {
  readonly operator: 'AND' | 'OR' | 'NOT';
  readonly field?: keyof T;
  readonly value?: unknown;
  readonly children?: readonly QueryNode<T>[];
}

/**
 * Recursive dependency graph
 */
export interface DependencyNode<T = string> {
  readonly id: T;
  readonly dependencies: readonly T[];
  readonly dependents: readonly T[];
  readonly resolved?: boolean;
  readonly circular?: boolean;
}

/**
 * Recursive AST node for expressions
 */
export type ExpressionNode<T = unknown> =
  | { readonly type: 'literal'; readonly value: T }
  | { readonly type: 'identifier'; readonly name: string }
  | { readonly type: 'binary'; readonly operator: string; readonly left: ExpressionNode<T>; readonly right: ExpressionNode<T> }
  | { readonly type: 'unary'; readonly operator: string; readonly operand: ExpressionNode<T> }
  | { readonly type: 'call'; readonly callee: ExpressionNode<T>; readonly arguments: readonly ExpressionNode<T>[] };

/**
 * Recursive state machine definition
 */
export interface StateMachine<TState extends string, TEvent extends string> {
  readonly initialState: TState;
  readonly states: Record<TState, StateDefinition<TState, TEvent>>;
}

export interface StateDefinition<TState extends string, TEvent extends string> {
  readonly onEntry?: readonly Action<TState, TEvent>[];
  readonly onExit?: readonly Action<TState, TEvent>[];
  readonly transitions: Record<TEvent, Transition<TState, TEvent>>;
}

export interface Transition<TState extends string, TEvent extends string> {
  readonly target: TState;
  readonly guard?: (context: unknown, event: TEvent) => boolean;
  readonly actions?: readonly Action<TState, TEvent>[];
}

export interface Action<TState extends string, TEvent extends string> {
  readonly type: string;
  readonly payload?: unknown;
}

/**
 * Recursive middleware chain
 */
export interface Middleware<TContext = unknown, TNext = unknown> {
  readonly name: string;
  readonly handler: (context: TContext, next: () => TNext) => TNext | Promise<TNext>;
  readonly dependencies?: readonly string[];
}

/**
 * Recursive type for plugin hierarchies
 */
export interface PluginHierarchy<TConfig = unknown> {
  readonly name: string;
  readonly version: string;
  readonly config?: TConfig;
  readonly dependencies?: Record<string, PluginHierarchy<TConfig>>;
  readonly children?: Record<string, PluginHierarchy<TConfig>>;
}

/**
 * Deep transformation with recursive mapping
 */
export type DeepTransform<T, TTransform> = T extends object
  ? T extends readonly (infer U)[]
    ? readonly DeepTransform<U, TTransform>[]
    : {
        [K in keyof T]: DeepTransform<T[K], TTransform>;
      }
  : TTransform extends (value: T) => infer R
  ? R
  : T;

/**
 * Recursive type for component trees
 */
export interface ComponentTree<TProps = unknown> {
  readonly type: string;
  readonly props: TProps;
  readonly children?: readonly ComponentTree<TProps>[];
  readonly key?: string | number;
}

/**
 * Recursive event bubbler
 */
export interface EventBubbler<T = unknown> {
  readonly emit: (event: string, data: T) => void;
  readonly on: (event: string, handler: (data: T) => void) => void;
  readonly parent?: EventBubbler<T>;
  readonly children: readonly EventBubbler<T>[];
}

/**
 * Recursive validation chain
 */
export interface ValidationChain<T> {
  readonly validate: (value: T) => ValidationResult<T>;
  readonly next?: ValidationChain<T>;
  readonly parallel?: readonly ValidationChain<T>[];
}

/**
 * Deep intersection of recursive types
 */
export type DeepIntersection<T, U> = T extends object
  ? U extends object
    ? {
        [K in keyof T | keyof U]: K extends keyof T
          ? K extends keyof U
            ? T[K] extends object
              ? U[K] extends object
                ? DeepIntersection<T[K], U[K]>
                : T[K] & U[K]
              : T[K] & U[K]
            : T[K]
          : K extends keyof U
          ? U[K]
          : never;
      }
    : T & U
  : T & U;

/**
 * Recursive type builder with depth limit
 */
export type RecursiveBuilder<T, TDepth extends readonly unknown[] = []> = TDepth['length'] extends 10
  ? never
  : T extends object
  ? {
      [K in keyof T]: RecursiveBuilder<T[K], [...TDepth, unknown]>;
    }
  : T;

/**
 * Tail-recursive type optimization
 */
export type TailRecursive<T, TAcc = never> = T extends readonly [infer Head, ...infer Tail]
  ? TailRecursive<Tail, TAcc | Head>
  : TAcc;