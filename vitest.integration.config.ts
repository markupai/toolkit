import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/integration/**/*.test.ts'],
    environment: 'node',
    globals: true,
    setupFiles: ['test/integration/setup.ts'],
    testTimeout: 60000, // 60 seconds timeout for all integration tests
  },
});
