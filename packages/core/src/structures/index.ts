/**
 * @packageDocumentation
 * @module @ovendjs/core/structures
 * @summary
 * Discord data structures and transformers for the OvenJS Core package.
 *
 * This module exports all the structure classes that represent Discord API objects,
 * such as users, guilds, channels, and messages. These classes provide methods
 * for interacting with the data and transforming it into usable objects.
 */

/**
 * The base structure class that all other structures inherit from.
 *
 * @see {@link BaseStructure}
 */
export { BaseStructure } from './Base';

/**
 * Represents a Discord user.
 *
 * @see {@link User}
 */
export { User } from './User';

/**
 * Represents a Discord guild (server).
 *
 * @see {@link Guild}
 */
export { Guild } from './Guild';

/**
 * Represents a Discord channel.
 *
 * @see {@link Channel}
 */
export { Channel } from './Channel';

/**
 * Represents a Discord message.
 *
 * @see {@link Message}
 */
export { Message } from './Message';

/**
 * Represents a Discord role.
 *
 * @see {@link Role}
 */
export { Role } from './Role';

/**
 * Represents a Discord guild member.
 *
 * @see {@link Member}
 */
export { Member } from './Member';

/**
 * Represents a Discord emoji.
 *
 * @see {@link Emoji}
 */
export { Emoji } from './Emoji';

/**
 * Represents a Discord attachment.
 *
 * @see {@link Attachment}
 */
export { Attachment } from './Attachment';

/**
 * Represents a Discord embed.
 *
 * @see {@link Embed}
 */
export { Embed } from './Embed';