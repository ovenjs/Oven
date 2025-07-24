// REST API related types
export interface RESTOptions {
  version?: string;
  api?: string;
  cdn?: string;
  invite?: string;
  template?: string;
  scheduledEvent?: string;
  userAgentAppendix?: string;
  timeout?: number;
  retries?: number;
  offset?: number;
  rejectOnRateLimit?: boolean | string[];
  globalRequestsPerSecond?: number;
  invalidRequestWarningInterval?: number;
  hashSweepInterval?: number;
  hashLifetime?: number;
  handlerSweepInterval?: number;
}

export interface RateLimitData {
  timeout: number;
  limit: number;
  method: string;
  path: string;
  route: string;
  majorParameter: string;
  hash: string;
}

export interface APIRequest {
  method: string;
  path: string;
  options: RequestInit;
  data?: any;
  files?: File[];
}

export interface APIResponse {
  ok: boolean;
  status: number;
  statusText: string;
  data?: any;
  headers: Record<string, string>;
}

export interface File {
  name: string;
  data: Buffer | Uint8Array | string;
  contentType?: string;
}

export interface RequestData {
  query?: Record<string, any>;
  body?: any;
  files?: File[];
  auth?: boolean;
  reason?: string;
  headers?: Record<string, string>;
}

// Common REST endpoint response types
export interface CreateMessageData {
  content?: string;
  tts?: boolean;
  embeds?: import('./discord').Embed[];
  allowed_mentions?: AllowedMentions;
  message_reference?: import('./discord').MessageReference;
  components?: import('./discord').MessageComponent[];
  sticker_ids?: string[];
  files?: File[];
  attachments?: import('./discord').Attachment[];
  flags?: number;
}

export interface AllowedMentions {
  parse?: ('roles' | 'users' | 'everyone')[];
  roles?: string[];
  users?: string[];
  replied_user?: boolean;
}

export interface EditMessageData {
  content?: string | null;
  embeds?: import('./discord').Embed[] | null;
  flags?: number | null;
  allowed_mentions?: AllowedMentions | null;
  components?: import('./discord').MessageComponent[] | null;
  files?: File[];
  attachments?: import('./discord').Attachment[] | null;
}

export interface ModifyGuildData {
  name?: string;
  region?: string | null;
  verification_level?: number | null;
  default_message_notifications?: number | null;
  explicit_content_filter?: number | null;
  afk_channel_id?: string | null;
  afk_timeout?: number;
  icon?: string | null;
  owner_id?: string;
  splash?: string | null;
  discovery_splash?: string | null;
  banner?: string | null;
  system_channel_id?: string | null;
  system_channel_flags?: number;
  rules_channel_id?: string | null;
  public_updates_channel_id?: string | null;
  preferred_locale?: string | null;
  features?: string[];
  description?: string | null;
  premium_progress_bar_enabled?: boolean;
}

export interface CreateChannelData {
  name: string;
  type?: number;
  topic?: string;
  bitrate?: number;
  user_limit?: number;
  rate_limit_per_user?: number;
  position?: number;
  permission_overwrites?: import('./discord').Overwrite[];
  parent_id?: string | null;
  nsfw?: boolean;
  rtc_region?: string | null;
  video_quality_mode?: number;
  default_auto_archive_duration?: number;
  default_reaction_emoji?: DefaultReaction | null;
  available_tags?: ForumTag[];
  default_sort_order?: number | null;
}

export interface DefaultReaction {
  emoji_id?: string | null;
  emoji_name?: string | null;
}

export interface ForumTag {
  id?: string;
  name: string;
  moderated: boolean;
  emoji_id?: string | null;
  emoji_name?: string | null;
}