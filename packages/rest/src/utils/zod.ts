import { z } from 'zod';

const ZOD_ERROR = {
  REST_OPTIONS_TYPE: `Expected a RESTOptions Type.`,

  REST_OPTIONS: {
    TOKEN_TYPE: `Expected a String Type.`,

    VERSION_TYPE: `Expected a Number Type.  | See supported Discord API versions at: https://discord.com/developers/docs/reference#api-versioning`,
    VERSION_MIN: `Deprecated Version Usage. | See supported Discord API versions at: https://discord.com/developers/docs/reference#api-versioning`,
    VERSION_MAX: `Unknown Version Usage.    | See supported Discord API versions at: https://discord.com/developers/docs/reference#api-versioning`,

    TIMEOUT_TYPE: `Expected a Number Type.          | Supported 15_000 MS (15s) to 30_000 MS (30s)`,
    TIMEOUT_MIN: `Expected "timeout" to be >=15_000 | Supported 15_000 MS (15s) to 30_000 MS (30s)`,
    TIMEOUT_MAX: `Expected "timeout" to be =<30_000 | Supported 15_000 MS (15s) to 30_000 MS (30s)`,
  },
};

export const DiscordTokenSchema = z
  .string({ error: ZOD_ERROR.REST_OPTIONS.TOKEN_TYPE })
  .refine(
    token => {
      // Remove "Bot " prefix if present
      const cleanToken = token.replace(/^Bot\s+/, '');

      const parts = cleanToken.split('.');
      const base64UrlRegex = /^[A-Za-z0-9_-]+$/;

      return (
        parts.length === 3 &&
        parts.every(part => part.length > 0 && base64UrlRegex.test(part))
      );
    },
    {
      error:
        'Invalid Bot token | Get a fresh token at: https://discord.com/developers/applications/{app-id}/bot',
      path: ['token'],
    }
  );

export const RESTOptionsSchema = z
  .object({
    token: DiscordTokenSchema.optional(),
    version: z
      .number({ error: ZOD_ERROR.REST_OPTIONS.VERSION_TYPE })
      .min(9, { error: ZOD_ERROR.REST_OPTIONS.VERSION_MIN })
      .max(10, { error: ZOD_ERROR.REST_OPTIONS.VERSION_MAX })
      .default(10),
    timeout: z
      .number({ error: ZOD_ERROR.REST_OPTIONS.TIMEOUT_TYPE })
      .min(1000, { error: ZOD_ERROR.REST_OPTIONS.TIMEOUT_MIN })
      .max(30_000, { error: ZOD_ERROR.REST_OPTIONS.TIMEOUT_MAX })
      .default(15_000),
  })
  .default({
    version: 10,
    timeout: 15_000,
  });
