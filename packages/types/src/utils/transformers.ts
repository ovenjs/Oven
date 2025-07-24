/**
 * @fileoverview Advanced type transformers for data manipulation
 */

import type { DeepReadonly, DeepMutable, DeepPartial } from '../primitives/utility.js';
import type { Phantom, Brand } from '../primitives/brand.js';

/**
 * Transform interface for type-safe data transformations
 */
export interface Transformer<TInput, TOutput> {
  (input: TInput): TOutput;
}

/**
 * Async transformer interface
 */
export interface AsyncTransformer<TInput, TOutput> {
  (input: TInput): Promise<TOutput>;
}

/**
 * Bidirectional transformer interface
 */
export interface BidirectionalTransformer<TInput, TOutput> {
  readonly forward: Transformer<TInput, TOutput>;
  readonly backward: Transformer<TOutput, TInput>;
}

/**
 * Transform chain builder
 */
export interface TransformChain<TInput> {
  readonly transform: <TOutput>(transformer: Transformer<TInput, TOutput>) => TransformChain<TOutput>;
  readonly transformAsync: <TOutput>(transformer: AsyncTransformer<TInput, TOutput>) => AsyncTransformChain<TOutput>;
  readonly execute: (input: TInput) => TInput;
}

export interface AsyncTransformChain<TInput> {
  readonly transform: <TOutput>(transformer: Transformer<TInput, TOutput>) => AsyncTransformChain<TOutput>;
  readonly transformAsync: <TOutput>(transformer: AsyncTransformer<TInput, TOutput>) => AsyncTransformChain<TOutput>;
  readonly execute: (input: TInput) => Promise<TInput>;
}

/**
 * Create a transform chain
 */
export const createTransformChain = <T>(initial?: T): TransformChain<T> => {
  const transformers: Array<Transformer<any, any> | AsyncTransformer<any, any>> = [];
  
  const chain: TransformChain<T> = {
    transform: <U>(transformer: Transformer<T, U>) => {
      transformers.push(transformer);
      return createTransformChain<U>();
    },
    
    transformAsync: <U>(transformer: AsyncTransformer<T, U>) => {
      transformers.push(transformer);
      return createAsyncTransformChain<U>();
    },
    
    execute: (input: T) => {
      return transformers.reduce((acc, transformer) => transformer(acc), input);
    }
  };
  
  return chain;
};

const createAsyncTransformChain = <T>(): AsyncTransformChain<T> => {
  const transformers: Array<Transformer<any, any> | AsyncTransformer<any, any>> = [];
  
  const chain: AsyncTransformChain<T> = {
    transform: <U>(transformer: Transformer<T, U>) => {
      transformers.push(transformer);
      return createAsyncTransformChain<U>();
    },
    
    transformAsync: <U>(transformer: AsyncTransformer<T, U>) => {
      transformers.push(transformer);
      return createAsyncTransformChain<U>();
    },
    
    execute: async (input: T) => {
      let result = input;
      for (const transformer of transformers) {
        result = await Promise.resolve(transformer(result));
      }
      return result;
    }
  };
  
  return chain;
};

/**
 * Common transformers
 */
export const transformers = {
  /**
   * Deep clone transformer
   */
  deepClone: <T>(input: T): T => {
    if (input === null || typeof input !== 'object') {
      return input;
    }
    
    if (input instanceof Date) {
      return new Date(input.getTime()) as T;
    }
    
    if (input instanceof Array) {
      return input.map(item => transformers.deepClone(item)) as T;
    }
    
    if (input instanceof Set) {
      return new Set([...input].map(item => transformers.deepClone(item))) as T;
    }
    
    if (input instanceof Map) {
      return new Map([...input].map(([key, value]) => [
        transformers.deepClone(key),
        transformers.deepClone(value)
      ])) as T;
    }
    
    const cloned = {} as T;
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        (cloned as any)[key] = transformers.deepClone((input as any)[key]);
      }
    }
    
    return cloned;
  },

  /**
   * Make readonly transformer
   */
  makeReadonly: <T>(input: T): T => {
    return Object.freeze(transformers.deepClone(input)) as T;
  },

  /**
   * Make mutable transformer  
   */
  makeMutable: <T>(input: T): T => {
    if (input && typeof input === 'object') {
      return transformers.deepClone(input as T) as T;
    }
    return input;
  },

  /**
   * Partial transformer
   */
  makePartial: <T extends Record<string, any>>(input: T): any => {
    return input as any;
  },

  /**
   * Pick properties transformer
   */
  pick: <T, K extends keyof T>(keys: readonly K[]) => 
    (input: T): Pick<T, K> => {
      const result = {} as Pick<T, K>;
      for (const key of keys) {
        if (key in input) {
          result[key] = input[key];
        }
      }
      return result;
    },

  /**
   * Omit properties transformer
   */
  omit: <T, K extends keyof T>(keys: readonly K[]) => 
    (input: T): Omit<T, K> => {
      const result = { ...input };
      for (const key of keys) {
        delete result[key];
      }
      return result as Omit<T, K>;
    },

  /**
   * Map object values transformer
   */
  mapValues: <T, U>(mapper: (value: T[keyof T], key: keyof T) => U) => 
    (input: T): { [K in keyof T]: U } => {
      const result = {} as { [K in keyof T]: U };
      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          result[key] = mapper(input[key], key);
        }
      }
      return result;
    },

  /**
   * Map object keys transformer
   */
  mapKeys: <T, K extends string>(mapper: (key: keyof T, value: T[keyof T]) => K) => 
    (input: T): Record<K, T[keyof T]> => {
      const result = {} as Record<K, T[keyof T]>;
      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          const newKey = mapper(key, input[key]);
          result[newKey] = input[key];
        }
      }
      return result;
    },

  /**
   * Filter object properties transformer
   */
  filter: <T>(predicate: (value: T[keyof T], key: keyof T) => boolean) => 
    (input: T): Partial<T> => {
      const result = {} as Partial<T>;
      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          if (predicate(input[key], key)) {
            result[key] = input[key];
          }
        }
      }
      return result;
    },

  /**
   * Merge objects transformer
   */
  merge: <T, U>(other: U) => 
    (input: T): T & U => {
      return { ...input, ...other };
    },

  /**
   * Deep merge objects transformer
   */
  deepMerge: <T, U>(other: U) => 
    (input: T): any => {
      const result = transformers.deepClone(input) as any;
      
      const mergeRecursive = (target: any, source: any): any => {
        for (const key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (
              source[key] && 
              typeof source[key] === 'object' && 
              !Array.isArray(source[key]) &&
              target[key] && 
              typeof target[key] === 'object' && 
              !Array.isArray(target[key])
            ) {
              target[key] = mergeRecursive(target[key], source[key]);
            } else {
              target[key] = source[key];
            }
          }
        }
        return target;
      };
      
      return mergeRecursive(result, other);
    },

  /**
   * Array transformers
   */
  array: {
    map: <T, U>(mapper: (item: T, index: number) => U) => 
      (input: readonly T[]): U[] => {
        return input.map(mapper);
      },

    filter: <T>(predicate: (item: T, index: number) => boolean) => 
      (input: readonly T[]): T[] => {
        return input.filter(predicate);
      },

    reduce: <T, U>(reducer: (acc: U, item: T, index: number) => U, initialValue: U) => 
      (input: readonly T[]): U => {
        return input.reduce(reducer, initialValue);
      },

    sort: <T>(compareFn?: (a: T, b: T) => number) => 
      (input: readonly T[]): T[] => {
        return [...input].sort(compareFn);
      },

    reverse: <T>(input: readonly T[]): T[] => {
      return [...input].reverse();
    },

    unique: <T>(input: readonly T[]): T[] => {
      return [...new Set(input)];
    },

    uniqueBy: <T, K>(keySelector: (item: T) => K) => 
      (input: readonly T[]): T[] => {
        const seen = new Set<K>();
        return input.filter(item => {
          const key = keySelector(item);
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
      },

    groupBy: <T, K extends string | number | symbol>(keySelector: (item: T) => K) => 
      (input: readonly T[]): Record<K, T[]> => {
        const result = {} as Record<K, T[]>;
        for (const item of input) {
          const key = keySelector(item);
          if (!result[key]) {
            result[key] = [];
          }
          result[key].push(item);
        }
        return result;
      },

    chunk: <T>(size: number) => 
      (input: readonly T[]): T[][] => {
        if (size <= 0) {
          throw new Error('Chunk size must be positive');
        }
        
        const result: T[][] = [];
        for (let i = 0; i < input.length; i += size) {
          result.push(input.slice(i, i + size));
        }
        return result;
      },

    flatten: <T>(input: readonly (readonly T[])[]): T[] => {
      return input.flat();
    },

    flattenDeep: (input: readonly any[]): any[] => {
      const result: any[] = [];
      
      const flattenRecursive = (arr: readonly any[]): void => {
        for (const item of arr) {
          if (Array.isArray(item)) {
            flattenRecursive(item);
          } else {
            result.push(item);
          }
        }
      };
      
      flattenRecursive(input);
      return result;
    }
  },

  /**
   * String transformers
   */
  string: {
    toLowerCase: (input: string): string => input.toLowerCase(),
    toUpperCase: (input: string): string => input.toUpperCase(),
    trim: (input: string): string => input.trim(),
    
    camelCase: (input: string): string => {
      return input
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
          index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, '');
    },

    snakeCase: (input: string): string => {
      return input
        .replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('_');
    },

    kebabCase: (input: string): string => {
      return input
        .replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('-');
    },

    pascalCase: (input: string): string => {
      return input
        .replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
        .replace(/\s+/g, '');
    },

    capitalize: (input: string): string => {
      if (input.length === 0) return input;
      return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
    },

    truncate: (maxLength: number, suffix = '...') => 
      (input: string): string => {
        if (input.length <= maxLength) return input;
        return input.slice(0, maxLength - suffix.length) + suffix;
      }
  },

  /**
   * Date transformers
   */
  date: {
    toISOString: (input: Date): string => input.toISOString(),
    toTimestamp: (input: Date): number => input.getTime(),
    
    format: (formatString: string) => 
      (input: Date): string => {
        // Simple date formatting (could be enhanced with a proper date library)
        return formatString
          .replace('YYYY', input.getFullYear().toString())
          .replace('MM', (input.getMonth() + 1).toString().padStart(2, '0'))
          .replace('DD', input.getDate().toString().padStart(2, '0'))
          .replace('HH', input.getHours().toString().padStart(2, '0'))
          .replace('mm', input.getMinutes().toString().padStart(2, '0'))
          .replace('ss', input.getSeconds().toString().padStart(2, '0'));
      },

    addDays: (days: number) => 
      (input: Date): Date => {
        const result = new Date(input);
        result.setDate(result.getDate() + days);
        return result;
      },

    addHours: (hours: number) => 
      (input: Date): Date => {
        const result = new Date(input);
        result.setHours(result.getHours() + hours);
        return result;
      },

    startOfDay: (input: Date): Date => {
      const result = new Date(input);
      result.setHours(0, 0, 0, 0);
      return result;
    },

    endOfDay: (input: Date): Date => {
      const result = new Date(input);
      result.setHours(23, 59, 59, 999);
      return result;
    }
  },

  /**
   * Brand type transformers
   */
  brand: {
    apply: <T, TBrand extends string>(brand: TBrand) => 
      (input: T): Brand<T, TBrand> => input as Brand<T, TBrand>,

    remove: <T>(input: Brand<T, any>): T => input as T,

    convert: <T, TFromBrand extends string, TToBrand extends string>(toBrand: TToBrand) => 
      (input: Brand<T, TFromBrand>): Brand<T, TToBrand> => input as Brand<T, TToBrand>
  },

  /**
   * Phantom type transformers
   */
  phantom: {
    apply: <T, TPhantom extends string>(phantom: TPhantom) => 
      (input: T): Phantom<T, TPhantom> => input as Phantom<T, TPhantom>,

    remove: <T>(input: Phantom<T, any>): T => input as T,

    convert: <T, TFromPhantom extends string, TToPhantom extends string>(toPhantom: TToPhantom) => 
      (input: Phantom<T, TFromPhantom>): Phantom<T, TToPhantom> => input as Phantom<T, TToPhantom>
  }
};

/**
 * Compose transformers
 */
export const compose = <T, U, V>(
  first: Transformer<T, U>,
  second: Transformer<U, V>
): Transformer<T, V> => {
  return (input: T) => second(first(input));
};

/**
 * Pipe transformers (alternative to compose with different order)
 */
export const pipe = <T>(...transformers: Array<Transformer<any, any>>) => 
  (input: T) => {
    return transformers.reduce((acc, transformer) => transformer(acc), input);
  };

/**
 * Conditional transformer
 */
export const when = <T>(
  condition: (input: T) => boolean,
  thenTransformer: Transformer<T, T>,
  elseTransformer?: Transformer<T, T>
): Transformer<T, T> => {
  return (input: T) => {
    if (condition(input)) {
      return thenTransformer(input);
    }
    return elseTransformer ? elseTransformer(input) : input;
  };
};

/**
 * Try transformer with fallback
 */
export const tryTransform = <T, U>(
  transformer: Transformer<T, U>,
  fallback: U | Transformer<T, U>
): Transformer<T, U> => {
  return (input: T) => {
    try {
      return transformer(input);
    } catch {
      return typeof fallback === 'function' 
        ? (fallback as Transformer<T, U>)(input)
        : fallback;
    }
  };
};