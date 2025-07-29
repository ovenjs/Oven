import { ZodError } from 'zod';

import { RESTError } from './RESTError';

export class ValidationError extends RESTError {
  public readonly zodError: ZodError;
  public readonly field?: string;

  constructor(zodError: ZodError, field?: string) {
    const firstError = zodError.issues[0];
    const message = field
      ? `Validation failed for ${field}: ${firstError.message}`
      : `Validation failed: ${firstError.message}`;

    super(message);
    this.name = 'ValidationError';
    this.zodError = zodError;
    this.field = field;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}
