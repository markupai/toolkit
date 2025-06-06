import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAdminConstants, submitFeedback } from '../../../src/api/internal/internal.api';
import { getData, postData } from '../../../src/utils/api';
import { Constants, FeedbackRequest } from '../../../src/api/internal/internal';

// Mock the utility functions
vi.mock('../../../src/utils/api', () => ({
  getData: vi.fn(),
  postData: vi.fn(),
}));

describe('Internal API Unit Tests', () => {
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAdminConstants', () => {
    it('should get admin constants', async () => {
      const mockResponse: Constants = {
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
      };

      vi.mocked(getData).mockResolvedValueOnce(mockResponse);

      const result = await getAdminConstants(mockApiKey);
      expect(result).toEqual(mockResponse);
      expect(getData).toHaveBeenCalledWith(expect.stringContaining('/internal/v1/constants'), mockApiKey);
    });

    it('should handle get admin constants error', async () => {
      vi.mocked(getData).mockRejectedValueOnce(new Error('Failed to get admin constants'));

      await expect(getAdminConstants(mockApiKey)).rejects.toThrow('Failed to get admin constants');
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback', async () => {
      const mockFeedbackRequest: FeedbackRequest = {
        workflow_id: 'test-workflow-id',
        run_id: 'test-run-id',
        helpful: true,
        feedback: 'Great suggestions!',
        original: 'Original text',
        suggestion: 'Suggested text',
        category: 'grammar',
      };

      vi.mocked(postData).mockResolvedValueOnce(undefined);

      await submitFeedback(mockFeedbackRequest, mockApiKey);
      expect(postData).toHaveBeenCalledWith(
        expect.stringContaining('/internal/v1/demo-feedback'),
        JSON.stringify(mockFeedbackRequest),
        mockApiKey,
      );
    });

    it('should handle submit feedback error', async () => {
      const mockFeedbackRequest: FeedbackRequest = {
        workflow_id: 'test-workflow-id',
        run_id: 'test-run-id',
        helpful: true,
      };

      vi.mocked(postData).mockRejectedValueOnce(new Error('Failed to submit feedback'));

      await expect(submitFeedback(mockFeedbackRequest, mockApiKey)).rejects.toThrow('Failed to submit feedback');
    });
  });
});
