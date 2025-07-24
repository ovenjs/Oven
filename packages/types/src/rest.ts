/**
 * REST API Types for OvenJS
 */

// Base REST types
export interface APIRequest {
  method: string;
  path: string;
  options: RequestInit;
  data?: any;
  files?: any[];
}

export interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
}

export interface RESTOptions {
  version?: string;
  timeout?: number;
  retries?: number;
  userAgentAppendix?: string;
}

export interface RateLimitData {
  limit: number;
  remaining: number;
  reset: number;
  resetAfter: number;
  bucket?: string;
  global: boolean;
}

// Message Data types
export interface CreateMessageData {
  content?: string;
  embeds?: any[];
  components?: any[];
  files?: any[];
  tts?: boolean;
  allowed_mentions?: {
    parse?: string[];
    users?: string[];
    roles?: string[];
    replied_user?: boolean;
  };
  message_reference?: {
    message_id?: string;
    channel_id?: string;
    guild_id?: string;
    fail_if_not_exists?: boolean;
  };
  sticker_ids?: string[];
}

export interface EditMessageData {
  content?: string;
  embeds?: any[];
  components?: any[];
  files?: any[];
  allowed_mentions?: {
    parse?: string[];
    users?: string[];
    roles?: string[];
  };
}

// Guild Data types
export interface ModifyGuildData {
  name?: string;
  icon?: string | null;
  splash?: string | null;
  discovery_splash?: string | null;
  banner?: string | null;
  owner_id?: string;
  region?: string | null;
  afk_channel_id?: string | null;
  afk_timeout?: number;
  verification_level?: number;
  default_message_notifications?: number;
  explicit_content_filter?: number;
  system_channel_id?: string | null;
  system_channel_flags?: number;
  rules_channel_id?: string | null;
  public_updates_channel_id?: string | null;
  preferred_locale?: string;
  premium_progress_bar_enabled?: boolean;
}

// Channel Data types
export interface CreateChannelData {
  name: string;
  type?: number;
  topic?: string;
  bitrate?: number;
  user_limit?: number;
  rate_limit_per_user?: number;
  position?: number;
  permission_overwrites?: any[];
  parent_id?: string | null;
  nsfw?: boolean;
  rtc_region?: string | null;
  video_quality_mode?: number;
  default_auto_archive_duration?: number;
}