const ERR_DETAILS = {
  401: `Unauthorized. Invalid token or no token provided to the REST client. | Set a token: REST.setToken(token) or new REST({ token: string })`,
};

export class DiscordAPIError extends Error {
  public readonly code: number | string;
  public readonly httpStatus: number;
  public readonly method: string;
  public readonly path: string;
  public readonly details?: any;

  constructor(
    message: string,
    code: number | string,
    httpStatus: number,
    method: string,
    path: string,
    details?: any
  ) {
    super(message);
    this.name = 'DiscordAPIError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.method = method;
    this.path = path;
    this.details = details;

    if (!this.details) {
      this.details = ERR_DETAILS[this.httpStatus];

      // If no details were found from httpStatus index using code
      if (!this.details) this.details = ERR_DETAILS[this.code];
    }

    // Maintains proper stack trace for where our error was thrown.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DiscordAPIError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      httpStatus: this.httpStatus,
      method: this.method,
      path: this.path,
      details: this.details,
    };
  }
}
