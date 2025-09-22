import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/unit/**/*.test.ts'],
    environment: 'node',
    globals: true,
    setupFiles: ['test/unit/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/**', 'test/**', '**/*.d.ts', '**/*.test.ts', '**/*.config.ts', '**/types.ts'],
    },
  },
});
