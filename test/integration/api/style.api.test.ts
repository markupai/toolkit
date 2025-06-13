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
import { IssueCategory } from '../../../src/api/style/style.api.types';

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
          content: testContent,
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
          content: testContent,
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
          content: testContent,
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
          content: testContent,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
        },
        apiKey,
      );

      expect(response).toBeDefined();
      expect(response.check_options).toBeDefined();
      expect(response.check_options.style_guide).toBeDefined();
      expect(response.check_options.style_guide.id).toBeDefined();
      expect(response.check_options.style_guide.name).toBeDefined();
      expect(response.check_options.dialect).toBe(STYLE_DEFAULTS.dialects.americanEnglish);
      expect(response.check_options.tone).toBe(STYLE_DEFAULTS.tones.formal);

      if (response.issues && response.issues.length > 0) {
        const issue = response.issues[0];
        expect(issue.subcategory).toBeDefined();
        expect(typeof issue.subcategory).toBe('string');
        expect(issue.category).toBeDefined();
        expect(Object.values(IssueCategory)).toContain(issue.category);
      }
    });

    // The style suggestions endpoint is currently throwing errors
    it('should submit a style suggestion and get result', async () => {
      const response = await styleSuggestions(
        {
          content: testContent,
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
          content: testContent,
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
