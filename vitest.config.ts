import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{ts,js}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'istanbul',
      reporter: ['html-spa'],
      exclude: [
        'node_modules',
        'test',
        'dist',
        '**/*.d.ts',
        'vitest.config.ts',
        'tsup.config.ts',
      ],
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
