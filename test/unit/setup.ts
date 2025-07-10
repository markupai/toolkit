import { setupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { apiHandlers } from './mocks/api.handlers';
import { DEFAULT_PLATFORM_URL_DEV } from '../../src/utils/api';

// Create MSW server instance
export const server = setupServer();

// Start server before all tests
beforeAll(() => {
  // Set TEST_PLATFORM_URL for unit tests to use DEFAULT_PLATFORM_URL_DEV
  process.env.TEST_PLATFORM_URL = DEFAULT_PLATFORM_URL_DEV;

  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

// Export handlers from centralized location
export const handlers = apiHandlers;
