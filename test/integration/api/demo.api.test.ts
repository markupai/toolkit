import { describe, it, expect, beforeAll } from 'vitest';
import {
  submitRewrite,
  submitCheck,
  submitRewriteAndGetResult,
  submitCheckAndGetResult,
} from '../../../src/api/demo.api';
import { Dialect, Tone, StyleGuide } from '../../../src/api/style';

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
    dialect: Dialect.AmericanEnglish,
    tone: Tone.Formal,
    styleGuide: StyleGuide.Microsoft,
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
      const response = await submitCheck(
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
      const result = await submitRewriteAndGetResult(
        {
          content: testContent,
          guidanceSettings,
        },
        apiKey,
      );

      expect(result).toBeDefined();
      expect(result.merged_text).toBeDefined();
      expect(typeof result.merged_text).toBe('string');
      expect(result.merged_text.length).toBeGreaterThan(0);
      expect(result.original_text).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.final_scores).toBeDefined();
      expect(result.initial_scores).toBeDefined();
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    }, 30000);

    it('should submit check and get result', async () => {
      const result = await submitCheckAndGetResult(
        {
          content: testContent,
          guidanceSettings,
        },
        apiKey,
      );

      expect(result).toBeDefined();
      expect(result.merged_text).toBeDefined();
      expect(typeof result.merged_text).toBe('string');
      expect(result.merged_text.length).toBeGreaterThan(0);
      expect(result.original_text).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.final_scores).toBeDefined();
      expect(result.initial_scores).toBeDefined();
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    }, 30000);
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
              dialect: 'invalid_dialect' as Dialect,
              tone: 'invalid_tone' as Tone,
              styleGuide: 'invalid_guide' as StyleGuide,
            },
          },
          apiKey,
        ),
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
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
        ).rejects.toThrow('Failed to fetch');
      } finally {
        // Restore the original API key
        process.env.API_KEY = originalApiKey;
      }
    });
  });
});
