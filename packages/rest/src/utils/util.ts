/**
 * Normalize HTTP headers from various formats to a consistent object
 */
export function normalizeHeaders(
  headers: Headers | Record<string, string | string[]> | any
): Record<string, string> {
  const result: Record<string, string> = {};

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result[key.toLowerCase()] = value;
    });
  } else {
    Object.entries(headers).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        result[key.toLowerCase()] = Array.isArray(value)
          ? value.join(', ')
          : String(value);
      }
    });
  }

  return result;
}
