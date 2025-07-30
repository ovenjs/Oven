import { IncomingHttpHeaders } from 'undici/types/header';

export function normalizeHeaders(headers: IncomingHttpHeaders): Record<string, string> {
  const normalized = {};

  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value;
  }

  return normalized;
}
