import { describe, it, expect, beforeAll } from 'vitest';
import { getAdminConstants, submitFeedback, validateToken } from '../../../src/api/internal/internal.api';
import { FeedbackRequest } from '../../../src/api/internal/internal.api.types';
import { PlatformType } from '../../../src/utils/api.types';
import type { Config } from '../../../src/utils/api.types';

describe('Internal API Integration Tests', () => {
  let config: Config;
  beforeAll(() => {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      throw new Error('API_KEY environment variable is required for integration tests');
    }
    config = {
      apiKey,
      platform: { type: PlatformType.Url, value: process.env.TEST_PLATFORM_URL! },
    };
  });

  describe('getAdminConstants', () => {
    it('should get admin constants', async () => {
      const response = await getAdminConstants(config);

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

  describe('validateToken', () => {
    it('should return true for valid API key', async () => {
      const result = await validateToken(config);
      expect(result).toBe(true);
    });

    it('should return false for invalid API key', async () => {
      const invalidConfig: Config = {
        apiKey: 'invalid-api-key',
        platform: { type: PlatformType.Url, value: process.env.TEST_PLATFORM_URL! },
      };

      const result = await validateToken(invalidConfig);
      expect(result).toBe(false);
    });

    it('should return false for empty API key', async () => {
      const emptyConfig: Config = {
        apiKey: '',
        platform: { type: PlatformType.Url, value: process.env.TEST_PLATFORM_URL! },
      };

      const result = await validateToken(emptyConfig);
      expect(result).toBe(false);
    });

    it('should return false for invalid platform URL', async () => {
      const invalidUrlConfig: Config = {
        apiKey: process.env.API_KEY || '',
        platform: { type: PlatformType.Url, value: 'https://invalid-url-that-does-not-exist.com' },
      };

      const result = await validateToken(invalidUrlConfig);
      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid API key', async () => {
      const invalidConfig: Config = {
        apiKey: 'invalid-api-key',
        platform: { type: PlatformType.Url, value: process.env.TEST_PLATFORM_URL! },
      };
      await expect(getAdminConstants(invalidConfig)).rejects.toThrow();
    });

    it('should handle missing required fields in feedback', async () => {
      const invalidFeedbackRequest = {
        workflow_id: 'test-workflow-id',
        // Missing run_id
        helpful: true,
      };

      await expect(submitFeedback(invalidFeedbackRequest as FeedbackRequest, config)).rejects.toThrow();
    });

    it('should throw for no api key', async () => {
      // Simulate a network error by temporarily removing the API key
      const originalApiKey = process.env.API_KEY;
      process.env.API_KEY = '';

      try {
        const emptyConfig: Config = {
          apiKey: '',
          platform: { type: PlatformType.Url, value: process.env.TEST_PLATFORM_URL! },
        };
        await expect(getAdminConstants(emptyConfig)).rejects.toThrow();
      } finally {
        // Restore the original API key
        process.env.API_KEY = originalApiKey;
      }
    });
  });
});
