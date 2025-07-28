import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.{test,spec}.{ts,js}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'test',
        'dist',
        '**/*.d.ts',
        'vitest.config.ts',
        'tsup.config.ts',
      ],
    },
    setupFiles: ['./test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
