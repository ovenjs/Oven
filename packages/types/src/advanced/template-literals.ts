/**
 * @fileoverview Template literal types for dynamic string-based type generation
 */

/**
 * Discord API endpoint path generation
 */
export type APIPath<TPath extends string> = `/api/v10${TPath}`;

/**
 * Discord CDN URL generation
 */
export type CDNPath<TResource extends string, TId extends string, THash extends string, TFormat extends string> = 
  `https://cdn.discordapp.com/${TResource}/${TId}/${THash}.${TFormat}`;

/**
 * Permission string generation
 */
export type PermissionString<TPermission extends string> = `PERMISSION_${Uppercase<TPermission>}`;

/**
 * Event name generation with typing
 */
export type EventName<TEntity extends string, TAction extends string> = 
  `${TEntity}_${Uppercase<TAction>}`;

/**
 * Environment variable name generation
 */
export type EnvVar<TName extends string> = `OVENJS_${Uppercase<TName>}`;

/**
 * Database table name generation
 */
export type TableName<TEntity extends string> = `ovenjs_${Lowercase<TEntity>}s`;

/**
 * Cache key generation with namespace
 */
export type CacheKey<TNamespace extends string, TKey extends string> = `${TNamespace}:${TKey}`;

/**
 * Redis key pattern generation
 */
export type RedisKey<TPrefix extends string, TId extends string> = `${TPrefix}:${TId}`;

/**
 * Log level with prefix
 */
export type LogLevel<TLevel extends string> = `[${Uppercase<TLevel>}]`;

/**
 * Metric name generation
 */
export type MetricName<TComponent extends string, TMetric extends string> = 
  `ovenjs.${TComponent}.${TMetric}`;

/**
 * Advanced route pattern matching
 */
export type RoutePattern<TRoute extends string> = TRoute extends `${infer Start}:${infer Param}/${infer Rest}`
  ? `${Start}${string}/${RoutePattern<Rest>}`
  : TRoute extends `${infer Start}:${infer Param}`
  ? `${Start}${string}`
  : TRoute;

/**
 * Extract route parameters
 */
export type ExtractRouteParams<TRoute extends string> = TRoute extends `${infer _}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractRouteParams<Rest>]: string }
  : TRoute extends `${infer _}:${infer Param}`
  ? { [K in Param]: string }
  : {};

/**
 * SQL query builder types
 */
export type SQLSelect<TTable extends string, TColumns extends string> = 
  `SELECT ${TColumns} FROM ${TTable}`;

export type SQLWhere<TColumn extends string, TOperator extends string, TValue extends string> = 
  `WHERE ${TColumn} ${TOperator} ${TValue}`;

export type SQLOrderBy<TColumn extends string, TDirection extends 'ASC' | 'DESC'> = 
  `ORDER BY ${TColumn} ${TDirection}`;

/**
 * JSON path types for nested object access
 */
export type JSONPath<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? `${K}` | `${K}.${JSONPath<T[K]>}`
    : `${K}`
  : never;

/**
 * CSS selector generation
 */
export type CSSSelector<TElement extends string, TClass extends string> = 
  `${TElement}.${TClass}`;

export type CSSPseudoSelector<TSelector extends string, TPseudo extends string> = 
  `${TSelector}:${TPseudo}`;

/**
 * URL pattern matching
 */
export type URLPattern<TScheme extends string, THost extends string, TPath extends string> = 
  `${TScheme}://${THost}${TPath}`;

/**
 * Version string validation
 */
export type VersionString<TMajor extends number, TMinor extends number, TPatch extends number> = 
  `${TMajor}.${TMinor}.${TPatch}`;

/**
 * Discord mention patterns
 */
export type UserMention<TId extends string> = `<@${TId}>`;
export type UserNicknameMention<TId extends string> = `<@!${TId}>`;
export type ChannelMention<TId extends string> = `<#${TId}>`;
export type RoleMention<TId extends string> = `<@&${TId}>`;
export type EmojiMention<TName extends string, TId extends string> = `<:${TName}:${TId}>`;
export type AnimatedEmojiMention<TName extends string, TId extends string> = `<a:${TName}:${TId}>`;

/**
 * Time format patterns
 */
export type TimestampFormat<TStyle extends 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R'> = 
  `<t:${number}:${TStyle}>`;

/**
 * Advanced string manipulation
 */
export type Split<S extends string, D extends string> = S extends `${infer T}${D}${infer U}`
  ? [T, ...Split<U, D>]
  : [S];

export type Join<T extends readonly string[], D extends string> = T extends readonly [
  infer F,
  ...infer R
]
  ? F extends string
    ? R extends readonly string[]
      ? R['length'] extends 0
        ? F
        : `${F}${D}${Join<R, D>}`
      : never
    : never
  : '';

export type Replace<S extends string, From extends string, To extends string> = 
  S extends `${infer L}${From}${infer R}` ? `${L}${To}${Replace<R, From, To>}` : S;

export type ReplaceAll<S extends string, From extends string, To extends string> = 
  Replace<S, From, To> extends S ? S : ReplaceAll<Replace<S, From, To>, From, To>;

/**
 * Camel case conversion
 */
export type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
  ? `${P1}${Uppercase<P2>}${CamelCase<P3>}`
  : S;

/**
 * Snake case conversion
 */
export type SnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${SnakeCase<U>}`
  : S;

/**
 * Kebab case conversion
 */
export type KebabCase<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '-' : ''}${Lowercase<T>}${KebabCase<U>}`
  : S;

/**
 * Title case conversion
 */
export type TitleCase<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${Lowercase<R>}`
  : S;

/**
 * HTTP method with URL template
 */
export type HTTPMethod<TMethod extends string, TURL extends string> = `${Uppercase<TMethod>} ${TURL}`;

/**
 * GraphQL query template
 */
export type GraphQLQuery<TQuery extends string, TVariables extends string = ''> = 
  TVariables extends '' ? `query { ${TQuery} }` : `query(${TVariables}) { ${TQuery} }`;

/**
 * RegExp pattern validation
 */
export type RegExpPattern<TPattern extends string> = `/${TPattern}/`;

/**
 * Command pattern with arguments
 */
export type Command<TName extends string, TArgs extends string = ''> = 
  TArgs extends '' ? TName : `${TName} ${TArgs}`;

/**
 * File extension validation
 */
export type FileExtension<TName extends string, TExt extends string> = `${TName}.${TExt}`;

/**
 * MIME type generation
 */
export type MIMEType<TType extends string, TSubtype extends string> = `${TType}/${TSubtype}`;