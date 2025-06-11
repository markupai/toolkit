import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { listStyleGuides } from '../../../src/api/style/style.api';
import { server } from '../setup';
import { apiHandlers } from '../mocks/api.handlers';

// Set up MSW server lifecycle hooks
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Style API Unit Tests', () => {
  const mockApiKey = 'test-api-key';
  const mockStyleGuideId = 'test-style-guide-id';

  describe('listStyleGuides', () => {
    it('should list style guides', async () => {
      server.use(apiHandlers.style.guides.success);

      const result = await listStyleGuides(mockApiKey);
      expect(result).toEqual({
        [mockStyleGuideId]: 'Test Style Guide',
      });
    });

    it('should handle list style guides error', async () => {
      server.use(apiHandlers.style.guides.error);

      await expect(listStyleGuides(mockApiKey)).rejects.toThrow('Failed to list style guides');
    });
  });
});
