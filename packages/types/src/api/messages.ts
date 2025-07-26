import { ChannelId, GuildId, MessageId, RoleId, Snowflake, UserId } from "../primitives/brand";
import { FileData } from "./rest";

/**
 * @link https://discord.com/developers/docs/resources/message#create-message-jsonform-params
 */
export interface APIPostMessageCreate {
    content?:          string;
    nonce?:            string | number;
    tts?:              boolean;
    embeds?:           any //Embed[];
    components?:       any //MessageComponent[];
    sticker_ids?:      Snowflake[];
    files?:            FileData[];
    flags?:            number;
    allowed_mentions:  APIObjectAllowedMentions;
    message_reference: APIObjectMessageReference;
}

/**
 * @link https://discord.com/developers/docs/resources/message#edit-message-jsonform-params
 */
export interface APIPatchMessageEdit {
    content?:          string;
    embeds?:           any; //Embed[];
    flags?:            number;
    components?:       any; //MessageComponent[];
    files?:            FileData[];
    attachments?:      any; //Attachment[];
    allowed_mentions?: APIObjectAllowedMentions;
}



/**
 * @link https://discord.com/developers/docs/resources/message#allowed-mentions-object
 */
export interface APIObjectAllowedMentions {
  parse?: ('roles' | 'users' | 'everyone')[];
  roles?: RoleId[];
  users?: UserId[];
  replied_user?: boolean;
}

export interface APIObjectMessageReference {
  message_id?: MessageId;
  channel_id?: ChannelId;
  guild_id?: GuildId;
  fail_if_not_exists?: boolean;
}