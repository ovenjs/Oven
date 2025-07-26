import { ChannelId, UserId } from "../primitives/brand";

export interface APIPostGuildCreate {
    name:                           string;
    region?:                        string;
    icon?:                          string;
    roles?:                         any  // Role[];
    channels?:                      any; // Partial<Channel>[];
    afk_channel_id?:                ChannelId;
    afk_timeout?:                   number;
    system_channel_id?:             ChannelId;
    system_channel_flags?:          number;
    verification_level?:            number;
    explicit_content_filter?:       number;
    default_message_notifications?: number;
}

export interface APIPostGuildEdit {
  name?:                          string;
  description?:                   string;
  icon?:                          string;
  banner?:                        string;
  region?:                        string;
  features?:                      string[];
  verification_level?:            number;
  explicit_content_filter?:       number;
  afk_channel_id?:                ChannelId;
  afk_timeout?:                   number;
  owner_id?:                      UserId;
  splash?:                        string;
  discovery_splash?:              string;                          
  system_channel_id?:             ChannelId;
  system_channel_flags?:          number;
  rules_channel_id?:              ChannelId;
  preferred_locale?:              string;
  public_updates_channel_id?:     ChannelId
  premium_progress_bar_enabled?:  boolean;
  default_message_notifications?: number;
}