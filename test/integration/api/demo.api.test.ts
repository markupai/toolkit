import { describe, it, expect, beforeAll } from 'vitest';
import { submitRewrite, rewrite } from '../../../src/api/demo/demo.api';
import { DEMO_DEFAULTS } from '../../../src/api/demo/demo.api.defaults';
import { DEFAULT_PLATFORM_URL_DEV } from '../../../src/utils/api';
import type { Config } from '../../../src/utils/api.types';

describe('Demo API Integration Tests', () => {
  let config: Config;
  beforeAll(() => {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      throw new Error('API_KEY environment variable is required for integration tests');
    }
    config = {
      apiKey,
      platform: { type: 'url', value: DEFAULT_PLATFORM_URL_DEV },
    };
  });

  const testContent = 'This is a test content for demo operations.';
  const guidanceSettings = {
    dialect: DEMO_DEFAULTS.dialects.americanEnglish,
    tone: DEMO_DEFAULTS.tones.formal,
    styleGuide: DEMO_DEFAULTS.styleGuides.microsoft,
  };

  describe('Basic Operations', () => {
    it('should submit a rewrite', async () => {
      const response = await submitRewrite(
        {
          content: testContent,
          guidanceSettings,
        },
        config,
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
        config,
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
      const invalidConfig: Config = {
        apiKey: 'invalid-api-key',
        platform: { type: 'url', value: DEFAULT_PLATFORM_URL_DEV },
      };
      await expect(
        submitRewrite(
          {
            content: testContent,
            guidanceSettings,
          },
          invalidConfig,
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
          config,
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
          config,
        ),
      ).rejects.toThrow();
    });

    it('should throw for no api key', async () => {
      // Simulate a network error by temporarily removing the API key
      const originalApiKey = process.env.API_KEY;
      process.env.API_KEY = '';

      try {
        const emptyConfig: Config = {
          apiKey: '',
          platform: { type: 'url', value: DEFAULT_PLATFORM_URL_DEV },
        };
        await expect(
          submitRewrite(
            {
              content: testContent,
              guidanceSettings,
            },
            emptyConfig,
          ),
        ).rejects.toThrow();
      } finally {
        // Restore the original API key
        process.env.API_KEY = originalApiKey;
      }
    });
  });
});
