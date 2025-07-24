/**
 * @fileoverview Advanced type assertions with comprehensive error handling
 */

import type { TypeGuard } from './guards.js';

/**
 * Assertion error with detailed type information
 */
export class TypeAssertionError extends Error {
  public readonly expectedType: string;
  public readonly actualType: string;
  public readonly actualValue: unknown;
  public readonly path?: string;

  constructor(
    expectedType: string,
    actualValue: unknown,
    path?: string,
    message?: string
  ) {
    const actualType = typeof actualValue;
    const pathInfo = path ? ` at path "${path}"` : '';
    const defaultMessage = `Type assertion failed${pathInfo}. Expected ${expectedType}, but received ${actualType}`;
    
    super(message || defaultMessage);
    this.name = 'TypeAssertionError';
    this.expectedType = expectedType;
    this.actualType = actualType;
    this.actualValue = actualValue;
    this.path = path;
  }
}

/**
 * Advanced assertion utilities
 */
export interface AssertionContext {
  readonly path: string;
  readonly parent?: AssertionContext;
}

export const createContext = (path: string, parent?: AssertionContext): AssertionContext => ({
  path,
  parent
});

export const getFullPath = (context?: AssertionContext): string => {
  if (!context) return '';
  const parentPath = context.parent ? getFullPath(context.parent) : '';
  return parentPath ? `${parentPath}.${context.path}` : context.path;
};

/**
 * Basic assertion functions
 */
export const assert = (
  condition: boolean,
  message: string,
  context?: AssertionContext
): asserts condition => {
  if (!condition) {
    const fullPath = getFullPath(context);
    const pathInfo = fullPath ? ` at ${fullPath}` : '';
    throw new Error(`Assertion failed${pathInfo}: ${message}`);
  }
};

export const assertType = <T>(
  guard: TypeGuard<T>,
  value: unknown,
  typeName: string,
  context?: AssertionContext
): asserts value is T => {
  if (!guard(value)) {
    throw new TypeAssertionError(
      typeName,
      value,
      getFullPath(context)
    );
  }
};

export const assertDefined = <T>(
  value: T | undefined,
  context?: AssertionContext
): asserts value is T => {
  if (value === undefined) {
    throw new TypeAssertionError(
      'defined value',
      value,
      getFullPath(context)
    );
  }
};

export const assertNotNull = <T>(
  value: T | null,
  context?: AssertionContext
): asserts value is T => {
  if (value === null) {
    throw new TypeAssertionError(
      'non-null value',
      value,
      getFullPath(context)
    );
  }
};

export const assertNonNullish = <T>(
  value: T | null | undefined,
  context?: AssertionContext
): asserts value is T => {
  if (value == null) {
    throw new TypeAssertionError(
      'non-nullish value',
      value,
      getFullPath(context)
    );
  }
};

/**
 * Array assertions
 */
export const assertArray = <T>(
  value: unknown,
  itemGuard?: TypeGuard<T>,
  context?: AssertionContext
): asserts value is T[] => {
  if (!Array.isArray(value)) {
    throw new TypeAssertionError(
      'array',
      value,
      getFullPath(context)
    );
  }

  if (itemGuard) {
    value.forEach((item, index) => {
      const itemContext = createContext(`[${index}]`, context);
      assertType(itemGuard, item, 'array item', itemContext);
    });
  }
};

export const assertNonEmptyArray = <T>(
  value: unknown,
  itemGuard?: TypeGuard<T>,
  context?: AssertionContext
): asserts value is [T, ...T[]] => {
  assertArray(value, itemGuard, context);
  
  if (value.length === 0) {
    throw new TypeAssertionError(
      'non-empty array',
      value,
      getFullPath(context)
    );
  }
};

/**
 * Object assertions
 */
export const assertObject = (
  value: unknown,
  context?: AssertionContext
): asserts value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeAssertionError(
      'object',
      value,
      getFullPath(context)
    );
  }
};

export const assertProperty = <K extends string>(
  obj: unknown,
  key: K,
  context?: AssertionContext
): asserts obj is Record<K, unknown> => {
  assertObject(obj, context);
  
  if (!(key in obj)) {
    throw new TypeAssertionError(
      `object with property "${key}"`,
      obj,
      getFullPath(context)
    );
  }
};

export const assertProperties = <K extends readonly string[]>(
  obj: unknown,
  keys: K,
  context?: AssertionContext
): asserts obj is Record<K[number], unknown> => {
  assertObject(obj, context);
  
  for (const key of keys) {
    if (!(key in obj)) {
      throw new TypeAssertionError(
        `object with property "${key}"`,
        obj,
        getFullPath(context)
      );
    }
  }
};

export const assertMethod = <K extends string>(
  obj: unknown,
  methodName: K,
  context?: AssertionContext
): asserts obj is Record<K, Function> => {
  assertProperty(obj, methodName, context);
  
  if (typeof (obj as any)[methodName] !== 'function') {
    throw new TypeAssertionError(
      `object with method "${methodName}"`,
      obj,
      getFullPath(context)
    );
  }
};

/**
 * Numeric assertions
 */
export const assertNumber = (
  value: unknown,
  context?: AssertionContext
): asserts value is number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new TypeAssertionError(
      'number',
      value,
      getFullPath(context)
    );
  }
};

export const assertInteger = (
  value: unknown,
  context?: AssertionContext
): asserts value is number => {
  assertNumber(value, context);
  
  if (!Number.isInteger(value)) {
    throw new TypeAssertionError(
      'integer',
      value,
      getFullPath(context)
    );
  }
};

export const assertPositive = (
  value: unknown,
  context?: AssertionContext
): asserts value is number => {
  assertNumber(value, context);
  
  if (value <= 0) {
    throw new TypeAssertionError(
      'positive number',
      value,
      getFullPath(context)
    );
  }
};

export const assertInRange = (
  value: unknown,
  min: number,
  max: number,
  context?: AssertionContext
): asserts value is number => {
  assertNumber(value, context);
  
  if (value < min || value > max) {
    throw new TypeAssertionError(
      `number between ${min} and ${max}`,
      value,
      getFullPath(context)
    );
  }
};

/**
 * String assertions
 */
export const assertString = (
  value: unknown,
  context?: AssertionContext
): asserts value is string => {
  if (typeof value !== 'string') {
    throw new TypeAssertionError(
      'string',
      value,
      getFullPath(context)
    );
  }
};

export const assertNonEmptyString = (
  value: unknown,
  context?: AssertionContext
): asserts value is string => {
  assertString(value, context);
  
  if (value.length === 0) {
    throw new TypeAssertionError(
      'non-empty string',
      value,
      getFullPath(context)
    );
  }
};

export const assertStringMatches = (
  value: unknown,
  pattern: RegExp,
  context?: AssertionContext
): asserts value is string => {
  assertString(value, context);
  
  if (!pattern.test(value)) {
    throw new TypeAssertionError(
      `string matching ${pattern}`,
      value,
      getFullPath(context)
    );
  }
};

/**
 * Function assertions
 */
export const assertFunction = (
  value: unknown,
  context?: AssertionContext
): asserts value is Function => {
  if (typeof value !== 'function') {
    throw new TypeAssertionError(
      'function',
      value,
      getFullPath(context)
    );
  }
};

export const assertAsyncFunction = (
  value: unknown,
  context?: AssertionContext
): asserts value is (...args: any[]) => Promise<any> => {
  assertFunction(value, context);
  
  // Note: This is a heuristic check, as there's no perfect way to detect async functions
  const isAsync = value.constructor.name === 'AsyncFunction';
  if (!isAsync) {
    throw new TypeAssertionError(
      'async function',
      value,
      getFullPath(context)
    );
  }
};

/**
 * Instance assertions
 */
export const assertInstanceOf = <T>(
  value: unknown,
  constructor: new (...args: any[]) => T,
  context?: AssertionContext
): asserts value is T => {
  if (!(value instanceof constructor)) {
    throw new TypeAssertionError(
      constructor.name,
      value,
      getFullPath(context)
    );
  }
};

/**
 * Union type assertions
 */
export const assertOneOf = <T extends readonly unknown[]>(
  value: unknown,
  allowedValues: T,
  context?: AssertionContext
): asserts value is T[number] => {
  if (!allowedValues.includes(value)) {
    throw new TypeAssertionError(
      `one of [${allowedValues.map(v => JSON.stringify(v)).join(', ')}]`,
      value,
      getFullPath(context)
    );
  }
};

/**
 * Complex assertion builders
 */
export const assertShape = <T>(
  value: unknown,
  shapeValidator: (v: unknown, ctx?: AssertionContext) => asserts v is T,
  context?: AssertionContext
): asserts value is T => {
  try {
    shapeValidator(value, context);
  } catch (error) {
    if (error instanceof TypeAssertionError) {
      throw error;
    }
    throw new TypeAssertionError(
      'valid shape',
      value,
      getFullPath(context),
      error instanceof Error ? error.message : String(error)
    );
  }
};

/**
 * Exhaustive checking
 */
export const assertNever = (value: never, context?: AssertionContext): never => {
  throw new TypeAssertionError(
    'never',
    value,
    getFullPath(context),
    `Unexpected value in exhaustive check: ${JSON.stringify(value)}`
  );
};

/**
 * Soft assertions (returns boolean instead of throwing)
 */
export const softAssert = (
  condition: boolean,
  onFailure?: (message: string) => void
): boolean => {
  if (!condition && onFailure) {
    onFailure('Soft assertion failed');
  }
  return condition;
};

export const softAssertType = <T>(
  guard: TypeGuard<T>,
  value: unknown,
  onFailure?: (error: TypeAssertionError) => void
): value is T => {
  if (!guard(value)) {
    if (onFailure) {
      onFailure(new TypeAssertionError(typeof guard, value));
    }
    return false;
  }
  return true;
};