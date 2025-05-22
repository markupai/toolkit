import { describe, it, expect, beforeAll } from 'vitest';
import {
  listStyleGuides,
  createStyleGuide,
  getStyleGuide,
  updateStyleGuide,
  deleteStyleGuide,
  submitStyleCheck,
  submitStyleSuggestion,
  submitStyleRewrite,
  styleCheck,
  styleSuggestions,
  styleRewrite,
} from '../../../src/api/style.api';
import { Dialect, Tone, CreateStyleGuideData } from '../../../src/api/style';

describe('Style API Integration Tests', () => {
  let apiKey: string;
  beforeAll(() => {
    apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      throw new Error('API_KEY environment variable is required for integration tests');
    }
  });

  let createdStyleGuideId: string;

  beforeAll(async () => {
    // Create a test style guide for the tests
    const styleGuideData: CreateStyleGuideData = {
      name: 'Test Style Guide',
      description: 'A style guide for testing',
      rules: {
        someRule: 'someValue',
      },
    };
    const response = await createStyleGuide(styleGuideData, apiKey);
    createdStyleGuideId = response.style_guide.id;
  });

  describe('Style Guide Operations', () => {
    it('should list style guides', async () => {
      const response = await listStyleGuides(apiKey);
      expect(response).toBeDefined();
      expect(response.style_guides).toBeDefined();
      expect(Array.isArray(response.style_guides)).toBe(true);
      expect(response.style_guides.length).toBeGreaterThan(0);
    });

    it('should get a style guide by ID', async () => {
      const response = await getStyleGuide(createdStyleGuideId, apiKey);
      expect(response).toBeDefined();
      expect(response.style_guide).toBeDefined();
      expect(response.style_guide.id).toBe(createdStyleGuideId);
      expect(response.style_guide.name).toBe('Test Style Guide');
    });

    it('should update a style guide', async () => {
      const updatedName = 'Updated Test Style Guide';
      const updatedStyleGuideData: CreateStyleGuideData = {
        name: updatedName,
        description: 'An updated style guide for testing',
        rules: {
          someRule: 'updatedValue',
        },
      };
      const response = await updateStyleGuide(createdStyleGuideId, updatedStyleGuideData, apiKey);

      expect(response).toBeDefined();
      expect(response.style_guide).toBeDefined();
      expect(response.style_guide.id).toBe(createdStyleGuideId);
      expect(response.style_guide.name).toBe(updatedName);
    });

    it('should delete a style guide', async () => {
      const response = await deleteStyleGuide(createdStyleGuideId, apiKey);
      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
      expect(typeof response.message).toBe('string');
    });
  });

  describe('Style Operations', () => {
    const testContent = 'This is a test content for style operations.';
    const styleGuide = {
      id: createdStyleGuideId,
      name: 'Test Style Guide',
      description: 'A style guide for testing',
      rules: {
        someRule: 'someValue',
      },
    };

    it('should submit a style check', async () => {
      const response = await submitStyleCheck(
        {
          file_upload: new Blob([testContent]),
          style_guide: styleGuide,
          dialect: Dialect.AmericanEnglish,
          tone: Tone.Formal,
        },
        apiKey,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
      expect(response.message).toBeDefined();
    });

    it('should submit a style suggestion', async () => {
      const response = await submitStyleSuggestion(
        {
          file_upload: new Blob([testContent]),
          style_guide: styleGuide,
          dialect: Dialect.AmericanEnglish,
          tone: Tone.Formal,
        },
        apiKey,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
      expect(response.message).toBeDefined();
    });

    it('should submit a style rewrite', async () => {
      const response = await submitStyleRewrite(
        {
          file_upload: new Blob([testContent]),
          style_guide: styleGuide,
          dialect: Dialect.AmericanEnglish,
          tone: Tone.Formal,
        },
        apiKey,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
      expect(response.message).toBeDefined();
    });

    it('should submit a style check and get result', async () => {
      const result = await styleCheck(
        {
          file_upload: new Blob([testContent]),
          style_guide: styleGuide,
          dialect: Dialect.AmericanEnglish,
          tone: Tone.Formal,
        },
        apiKey,
      );

      expect(result).toBeDefined();
      expect(result.merged_text).toBeDefined();
      expect(result.original_text).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.final_scores).toBeDefined();
      expect(result.initial_scores).toBeDefined();
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it('should submit a style suggestion and get result', async () => {
      const result = await styleSuggestions(
        {
          file_upload: new Blob([testContent]),
          style_guide: styleGuide,
          dialect: Dialect.AmericanEnglish,
          tone: Tone.Formal,
        },
        apiKey,
      );

      expect(result).toBeDefined();
      expect(result.merged_text).toBeDefined();
      expect(result.original_text).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.final_scores).toBeDefined();
      expect(result.initial_scores).toBeDefined();
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it('should submit a style rewrite and get result', async () => {
      const result = await styleRewrite(
        {
          file_upload: new Blob([testContent]),
          style_guide: styleGuide,
          dialect: Dialect.AmericanEnglish,
          tone: Tone.Formal,
        },
        apiKey,
      );

      expect(result).toBeDefined();
      expect(result.merged_text).toBeDefined();
      expect(result.original_text).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.final_scores).toBeDefined();
      expect(result.initial_scores).toBeDefined();
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });
  });
});
