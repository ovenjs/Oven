export interface RateLimitHeaders {
  'x-ratelimit-limit':       string | undefined;
  'x-ratelimit-remaining':   string | undefined;
  'x-ratelimit-reset':       string | undefined;
  'x-ratelimit-reset-after': string | undefined;
  'x-ratelimit-bucket':      string | undefined;
  'x-ratelimit-global':      string | undefined;
  'x-ratelimit-scope':       string | undefined;
  'retry-after':             string | undefined;
}

export interface RateLimitData {
  limit: number;
  remaining: number;
  reset: number;
  resetAfter: number;
  bucket: string;
  global: boolean;
  scope: 'user' | 'global' | 'shared';
}