import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { listStyleGuides } from '../../../src/api/style/style.api';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';
import { PLATFORM_URL } from '../../../src/utils/api';

// Set up MSW server lifecycle hooks
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Define handlers for style API endpoints
const styleHandlers = {
  guides: {
    success: http.get(`${PLATFORM_URL}/v1/style-guides`, () => {
      return HttpResponse.json({
        'test-style-guide-id': 'Test Style Guide',
      });
    }),
    error: http.get(`${PLATFORM_URL}/v1/style-guides`, () => {
      return HttpResponse.json({ message: 'Failed to list style guides' }, { status: 500 });
    }),
  },
};

describe('Style API Unit Tests', () => {
  const mockApiKey = 'test-api-key';
  const mockStyleGuideId = 'test-style-guide-id';

  describe('Style Guide Operations', () => {
    it('should list style guides', async () => {
      server.use(styleHandlers.guides.success);

      const result = await listStyleGuides(mockApiKey);
      expect(result).toEqual({
        [mockStyleGuideId]: 'Test Style Guide',
      });
    });

    it('should handle list style guides error', async () => {
      server.use(styleHandlers.guides.error);

      await expect(listStyleGuides(mockApiKey)).rejects.toThrow('Failed to list style guides');
    });
  });
});
