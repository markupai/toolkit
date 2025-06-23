import { describe, it, expect, beforeAll } from 'vitest';
import { getAdminConstants, submitFeedback } from '../../../src/api/internal/internal.api';
import { FeedbackRequest } from '../../../src/api/internal/internal.api.types';

// TODO: Skipped until we have a way to test the internal API
describe.skip('Internal API Integration Tests', () => {
  let apiKey: string;
  beforeAll(() => {
    apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      throw new Error('API_KEY environment variable is required for integration tests');
    }
  });

  describe('getAdminConstants', () => {
    it('should get admin constants', async () => {
      const response = await getAdminConstants(apiKey);

      expect(response).toBeDefined();
      expect(response.dialects).toBeDefined();
      expect(Array.isArray(response.dialects)).toBe(true);
      expect(response.tones).toBeDefined();
      expect(Array.isArray(response.tones)).toBe(true);
      expect(response.style_guides).toBeDefined();
      expect(typeof response.style_guides).toBe('object');
      expect(response.colors).toBeDefined();
      expect(typeof response.colors).toBe('object');

      // Check color object structure
      const colorKeys = Object.keys(response.colors);
      expect(colorKeys.length).toBeGreaterThan(0);
      colorKeys.forEach((key) => {
        const color = response.colors[key];
        expect(color.value).toBeDefined();
        expect(typeof color.value).toBe('string');
        expect(color.min_score).toBeDefined();
        expect(typeof color.min_score).toBe('number');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid API key', async () => {
      const invalidApiKey = 'invalid-api-key';
      await expect(getAdminConstants(invalidApiKey)).rejects.toThrow();
    });

    it('should handle missing required fields in feedback', async () => {
      const invalidFeedbackRequest = {
        workflow_id: 'test-workflow-id',
        // Missing run_id
        helpful: true,
      };

      await expect(submitFeedback(invalidFeedbackRequest as FeedbackRequest, apiKey)).rejects.toThrow();
    });

    it('should throw for no api key', async () => {
      // Simulate a network error by temporarily removing the API key
      const originalApiKey = process.env.API_KEY;
      process.env.API_KEY = '';

      try {
        await expect(getAdminConstants('')).rejects.toThrow();
      } finally {
        // Restore the original API key
        process.env.API_KEY = originalApiKey;
      }
    });
  });
});
