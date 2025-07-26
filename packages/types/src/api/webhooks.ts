import { ChannelId } from "../primitives/brand";
import { APIObjectAllowedMentions } from "./messages";
import { FileData } from "./rest";

export interface WebhookCreateOptions {
  name:    string;
  avatar?: string | null;
}

export interface WebhookEditOptions {
  name?:       string;
  avatar?:     string | null;
  channel_id?: ChannelId;
}

export interface WebhookExecuteOptions {
  content?:          string;
  username?:         string;
  avatar_url?:       string;
  tts?:              boolean;
  embeds?:           any; // Embed[];
  allowed_mentions?: APIObjectAllowedMentions;
  components?:       any; // MessageComponent[];
  files?:            FileData[];
  flags?:            number;
  thread_id?:        ChannelId;
}