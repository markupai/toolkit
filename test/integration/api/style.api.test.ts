import { describe, it, expect, beforeAll } from 'vitest';
import {
  listStyleGuides,
  submitStyleCheck,
  submitStyleSuggestion,
  submitStyleRewrite,
  styleCheck,
  styleSuggestions,
  styleRewrite,
} from '../../../src/api/style/style.api';
import { STYLE_DEFAULTS } from '../../../src/api/style/style.api.defaults';

describe('Style API Integration Tests', () => {
  let apiKey: string;
  beforeAll(() => {
    apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      throw new Error('API_KEY environment variable is required for integration tests');
    }
  });

  describe('Style Guide Listing', () => {
    it('should list style guides', async () => {
      const response = await listStyleGuides(apiKey);
      expect(response).toBeDefined();
      expect(typeof response).toBe('object');
      expect(Object.keys(response).length).toBeGreaterThan(0);
    });
  });

  describe('Style Operations', () => {
    const testContent = 'This is a test content for style operations.';
    const styleGuideId = 'microsoft'; // Using a predefined style guide name

    it('should submit a style check', async () => {
      const response = await submitStyleCheck(
        {
          file_upload: new Blob([testContent]),
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
        },
        apiKey,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
    });

    it('should submit a style suggestion', async () => {
      const response = await submitStyleSuggestion(
        {
          file_upload: new Blob([testContent]),
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
        },
        apiKey,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
    });

    it('should submit a style rewrite', async () => {
      const response = await submitStyleRewrite(
        {
          file_upload: new Blob([testContent]),
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
        },
        apiKey,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
    });

    it('should submit a style check and get result', async () => {
      const response = await styleCheck(
        {
          file_upload: new Blob([testContent]),
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
        },
        apiKey,
      );

      expect(response).toBeDefined();
    });

    it('should submit a style suggestion and get result', async () => {
      const response = await styleSuggestions(
        {
          file_upload: new Blob([testContent]),
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
        },
        apiKey,
      );

      expect(response).toBeDefined();
    });

    it('should submit a style rewrite and get result', async () => {
      const response = await styleRewrite(
        {
          file_upload: new Blob([testContent]),
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
        },
        apiKey,
      );

      expect(response).toBeDefined();
    });
  });
});
