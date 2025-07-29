/**
 * @packageDocumentation
 * @module @ovenjs/rest
 * @summary
 * The main entry point for the REST client module.
 *
 * This file exports the core classes and interfaces needed to interact with the Discord API
 * using a clean, event-driven, and type-safe HTTP client.
 *
 * @example
 * ```ts
 * import { REST, RESTOptions } from '@ovenjs/rest';
 *
 * const rest = new REST({ token: 'Bot abc123', version: 10 });
 * ```
 */

/**
 * The main REST client class for making requests to the Discord API.
 *
 * @remarks
 * Encapsulates authentication, request retry logic (planned), and emits debug events.
 * Built on top of `undici` and supports promises and async/await.
 *
 * @see {@link https://discord.com/developers/docs/reference | Discord API Reference}
 */
export { REST } from './REST';

/**
 * Configuration options for the REST client.
 *
 * @remarks
 * Includes token, API version, timeout, and other behavioral settings.
 *
 * @see {@link RESTOptions}
 */
export { RESTOptions } from './types';

/**
 * Enum representing the event names emitted by the {@link REST} client.
 *
 * @remarks
 * Used for consistent event listening. Events include debug and response logging.
 *
 * @example
 * ```ts
 * rest.on(RestEvents.debug, (info) => console.log(info));
 * ```
 *
 * @see {@link RestEvents}
 */
export { RestEvents } from './types';

/**
 * Interface representing rate limit metadata returned by Discord.
 *
 * @remarks
 * Contains details such as `limit`, `remaining`, `resetAfter`, and whether the limit is global.
 * Useful for debugging and advanced rate limit handling.
 *
 * @see {@link RateLimitInfo}
 */
export { RateLimitInfo } from './types';