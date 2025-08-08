import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { getAdminConstants } from '../../../src/constants/internal/constants';
import { server } from '../setup';
import { apiHandlers } from '../mocks/api.handlers';

// Set up MSW server lifecycle hooks
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Internal API Unit Tests', () => {
  describe('getAdminConstants', () => {
    it('should fetch admin constants successfully', async () => {
      server.use(apiHandlers.internal.constants.success);

      const result = await getAdminConstants();
      expect(result).toEqual({
        dialects: ['american_english', 'british_english'],
        tones: ['formal', 'casual'],
        style_guides: {
          'style-1': 'ap',
          'style-2': 'chicago',
        },
        colors: {
          green: { value: 'rgb(120, 253, 134)', min_score: 80 },
          yellow: { value: 'rgb(246, 240, 104)', min_score: 60 },
          red: { value: 'rgb(235, 94, 94)', min_score: 0 },
        },
      });
    });
  });
});
