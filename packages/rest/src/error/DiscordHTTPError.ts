/**
 * Represents an HTTP error from Discord.
 */
export class DiscordHTTPError extends Error {
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
   * @param message The error message.
   * @param status The HTTP status code.
   * @param method The method used in the request.
   * @param endpoint The endpoint used in the request.
   * @param headers The headers received in the response.
   */
  public constructor(
    message: string,
    status: number,
    method: string,
    endpoint: string,
    headers: Record<string, string>
  ) {
    super(message);
    this.name = 'DiscordHTTPError';
    this.status = status;
    this.method = method;
    this.endpoint = endpoint;
    this.headers = headers;
  }
}