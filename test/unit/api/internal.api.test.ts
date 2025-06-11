import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { getAdminConstants, submitFeedback } from '../../../src/api/internal/internal.api';
import { FeedbackRequest } from '../../../src/api/internal/internal.api.types';
import { server } from '../setup';
import { apiHandlers } from '../mocks/api.handlers';

// Set up MSW server lifecycle hooks
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Internal API Unit Tests', () => {
  const mockApiKey = 'test-api-key';

  describe('getAdminConstants', () => {
    it('should get admin constants', async () => {
      server.use(apiHandlers.internal.constants.success);

      const result = await getAdminConstants(mockApiKey);
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

    it('should handle get admin constants error', async () => {
      server.use(apiHandlers.internal.constants.error);

      await expect(getAdminConstants(mockApiKey)).rejects.toThrow('Failed to get admin constants');
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback', async () => {
      server.use(apiHandlers.internal.feedback.success);

      const mockFeedbackRequest: FeedbackRequest = {
        workflow_id: 'test-workflow-id',
        run_id: 'test-run-id',
        helpful: true,
        feedback: 'Great suggestions!',
        original: 'Original text',
        suggestion: 'Suggested text',
        category: 'grammar',
      };

      await submitFeedback(mockFeedbackRequest, mockApiKey);
    });

    it('should handle submit feedback error', async () => {
      server.use(apiHandlers.internal.feedback.error);

      const mockFeedbackRequest: FeedbackRequest = {
        workflow_id: 'test-workflow-id',
        run_id: 'test-run-id',
        helpful: true,
      };

      await expect(submitFeedback(mockFeedbackRequest, mockApiKey)).rejects.toThrow('Failed to submit feedback');
    });
  });
});
