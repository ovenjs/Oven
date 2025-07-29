export class RESTError extends Error {
  constructor(message: string) {
    super(message);
    this.name = '@ovenjs/rest -> ERROR';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RESTError);
    }
  }
}
