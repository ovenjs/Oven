/**
 * Represents an API error from Discord.
 */
export class DiscordAPIError extends Error {
  /**
   * The error code.
   */
  public code: number;

  /**
   * The HTTP status code.
   */
  public status: number;

  /**
   * The method used in the request.
   */
  public method: string;

  /**
   * The endpoint used in the request.
   */
  public endpoint: string;

  /**
   * The headers received in the response.
   */
  public headers: Record<string, string>;

  /**
   * @param data The error data.
   * @param status The HTTP status code.
   * @param method The method used in the request.
   * @param endpoint The endpoint used in the request.
   * @param headers The headers received in the response.
   */
  public constructor(
    data: { message: string; code?: number; errors?: any },
    status: number,
    method: string,
    endpoint: string,
    headers: Record<string, string>
  ) {
    super(data.message);
    this.name = 'DiscordAPIError';
    this.code = data.code ?? 0;
    this.status = status;
    this.method = method;
    this.endpoint = endpoint;
    this.headers = headers;
  }
}