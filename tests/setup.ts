import { beforeEach, afterEach, vi } from 'vitest';

// Mock console methods to reduce test noise
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Global test utilities
globalThis.testUtils = {
  // Add any test utilities you need
  createMockResponse: (data: any, status = 200) => ({
    statusCode: status,
    body: {
      json: async () => data,
      text: async () => JSON.stringify(data),
    },
    headers: {},
  }),
};
