import { describe, it, expect, beforeAll } from 'vitest';
import { submitRewrite, check, rewrite } from '../../../src/api/demo/demo.api';
import { defaults } from '../../../src/api/demo/demo';

describe('Demo API Integration Tests', () => {
  let apiKey: string;
  beforeAll(() => {
    apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      throw new Error('API_KEY environment variable is required for integration tests');
    }
  });

  const testContent = 'This is a test content for demo operations.';
  const guidanceSettings = {
    dialect: defaults.dialects.americanEnglish,
    tone: defaults.tones.formal,
    styleGuide: defaults.styleGuides.microsoft,
  };

  describe('Basic Operations', () => {
    it('should submit a rewrite', async () => {
      const response = await submitRewrite(
        {
          content: testContent,
          guidanceSettings,
        },
        apiKey,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
      expect(response.message).toBeDefined();
    });

    it('should submit a check', async () => {
      const response = await check(
        {
          content: testContent,
          guidanceSettings,
        },
        apiKey,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
      expect(response.message).toBeDefined();
    });
  });

  describe('Operations with Polling', () => {
    it('should submit rewrite and get result', async () => {
      const response = await rewrite(
        {
          content: testContent,
          guidanceSettings,
        },
        apiKey,
      );

      expect(response.result).toBeDefined();
      expect(response.result.merged_text).toBeDefined();
      expect(typeof response.result.merged_text).toBe('string');
      expect(response.result.merged_text.length).toBeGreaterThan(0);
      expect(response.result.original_text).toBeDefined();
      expect(response.result.errors).toBeDefined();
      expect(Array.isArray(response.result.errors)).toBe(true);
      expect(response.result.final_scores).toBeDefined();
      expect(response.result.initial_scores).toBeDefined();
      expect(response.result.results).toBeDefined();
      expect(Array.isArray(response.result.results)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid API key', async () => {
      const invalidApiKey = 'invalid-api-key';
      await expect(
        submitRewrite(
          {
            content: testContent,
            guidanceSettings,
          },
          invalidApiKey,
        ),
      ).rejects.toThrow();
    });

    it('should handle invalid content', async () => {
      await expect(
        submitRewrite(
          {
            content: '',
            guidanceSettings,
          },
          apiKey,
        ),
      ).rejects.toThrow();
    });

    it('should handle invalid guidance settings', async () => {
      await expect(
        submitRewrite(
          {
            content: testContent,
            guidanceSettings: {
              dialect: 'invalid_dialect',
              tone: 'invalid_tone',
              styleGuide: 'invalid_guide',
            },
          },
          apiKey,
        ),
      ).rejects.toThrow();
    });

    it('should throw for no api key', async () => {
      // Simulate a network error by temporarily removing the API key
      const originalApiKey = process.env.API_KEY;
      process.env.API_KEY = '';

      try {
        await expect(
          submitRewrite(
            {
              content: testContent,
              guidanceSettings,
            },
            '',
          ),
        ).rejects.toThrow();
      } finally {
        // Restore the original API key
        process.env.API_KEY = originalApiKey;
      }
    });
  });
});
