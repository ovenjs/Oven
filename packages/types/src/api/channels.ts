import { ChannelId, Snowflake } from "../primitives/brand";

export interface APIPostChannelCreate {
  name:                           string;
  type?:                          number;
  topic?:                         string;
  bitrate?:                       number;
  user_limit?:                    number;
  rate_limit_per_user?:           number;
  position?:                      number;
  permission_overwrites?:         APIObjectPermissionOverwrite[];
  parent_id?:                     ChannelId;
  nsfw?:                          boolean;
  rtc_region?:                    string;
  video_quality_mode?:            number;
  default_auto_archive_duration?: number;
}

export interface APIPatchChannelEdit {
  name?:                          string;
  type?:                          number;
  position?:                      number;
  topic?:                         string;
  nsfw?:                          boolean;
  rate_limit_per_user?:           number;
  bitrate?:                       number;
  user_limit?:                    number;
  permission_overwrites?:         APIObjectPermissionOverwrite[];
  parent_id?:                     ChannelId;
  rtc_region?:                    string;
  video_quality_mode?:            number;
  default_auto_archive_duration?: number;
  flags?:                         number;
}

export interface APIObjectPermissionOverwrite {
  id:    Snowflake;
  type:  number;
  allow: string;
  deny:  string;
}
