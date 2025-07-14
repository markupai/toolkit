import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { getAdminConstants, submitFeedback, validateToken } from '../../../src/api/internal/internal.api';
import type { FeedbackRequest } from '../../../src/api/internal/internal.api.types';
import type { Config } from '../../../src/utils/api.types';
import { PlatformType, Environment } from '../../../src/utils/api.types';
import { server } from '../setup';
import { apiHandlers } from '../mocks/api.handlers';

// Set up MSW server lifecycle hooks
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Internal API Unit Tests', () => {
  const mockConfig: Config = {
    apiKey: 'test-api-key',
    platform: { type: PlatformType.Environment, value: Environment.Dev },
  };

  describe('getAdminConstants', () => {
    it('should fetch admin constants successfully', async () => {
      server.use(apiHandlers.internal.constants.success);

      const result = await getAdminConstants(mockConfig);
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

    it('should handle API errors', async () => {
      server.use(apiHandlers.internal.constants.error);

      await expect(getAdminConstants(mockConfig)).rejects.toThrow('Failed to get admin constants');
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      server.use(apiHandlers.internal.feedback.success);

      const feedbackRequest: FeedbackRequest = {
        workflow_id: '123',
        run_id: '456',
        helpful: true,
        feedback: 'Great service!',
        original: 'Original text',
        suggestion: 'Suggested text',
        category: 'general',
      };

      const result = await submitFeedback(feedbackRequest, mockConfig);
      expect(result).toEqual({ success: true });
    });

    it('should handle feedback submission errors', async () => {
      server.use(apiHandlers.internal.feedback.error);

      const feedbackRequest: FeedbackRequest = {
        workflow_id: '123',
        run_id: '456',
        helpful: true,
        feedback: 'Great service!',
        original: 'Original text',
        suggestion: 'Suggested text',
        category: 'general',
      };

      await expect(submitFeedback(feedbackRequest, mockConfig)).rejects.toThrow('Failed to submit feedback');
    });
  });

  describe('validateToken', () => {
    it('should return true when token is valid', async () => {
      server.use(apiHandlers.internal.constants.success);

      const result = await validateToken(mockConfig);
      expect(result).toBe(true);
    });

    it('should return false when token is invalid (401 error)', async () => {
      server.use(apiHandlers.style.guides.error);

      const result = await validateToken(mockConfig);
      expect(result).toBe(false);
    });

    it('should return false when network error occurs', async () => {
      server.use(apiHandlers.api.error.network);

      const result = await validateToken(mockConfig);
      expect(result).toBe(false);
    });

    it('should return false when API returns 403 Forbidden', async () => {
      server.use(
        http.get('*/v1/style-guides', () => {
          return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
        }),
      );

      const result = await validateToken(mockConfig);
      expect(result).toBe(false);
    });

    it('should return false when API returns 500 Internal Server Error', async () => {
      server.use(
        http.get('*/v1/style-guides', () => {
          return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
        }),
      );

      const result = await validateToken(mockConfig);
      expect(result).toBe(false);
    });
  });
});
