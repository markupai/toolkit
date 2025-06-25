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
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);

      // Validate the structure of the first style guide
      const firstStyleGuide = response[0];
      expect(firstStyleGuide).toHaveProperty('id');
      expect(firstStyleGuide).toHaveProperty('name');
      expect(firstStyleGuide).toHaveProperty('created_at');
      expect(firstStyleGuide).toHaveProperty('created_by');
      expect(firstStyleGuide).toHaveProperty('status');
      expect(firstStyleGuide).toHaveProperty('updated_at');
      expect(firstStyleGuide).toHaveProperty('updated_by');
    });
  });

  describe('Style Operations', () => {
    const testContent = 'This is a test content for style operations.';
    const styleGuideId = STYLE_DEFAULTS.styleGuides.microsoft
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
      expect(response.check_options.style_guide.style_guide_type).toBeDefined();
      expect(response.check_options.style_guide.style_guide_id).toBeDefined();
      expect(typeof response.check_options.style_guide.style_guide_type).toBe('string');
      expect(typeof response.check_options.style_guide.style_guide_id).toBe('string');
      expect(response.check_options.style_guide.style_guide_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(response.check_options.dialect).toBe(STYLE_DEFAULTS.dialects.americanEnglish);
      expect(response.check_options.tone).toBe(STYLE_DEFAULTS.tones.formal);

      // Test new scores structure
      expect(response.scores).toBeDefined();
      expect(response.scores.overall).toBeDefined();
      expect(typeof response.scores.overall.score).toBe('number');

      expect(response.scores.clarity).toBeDefined();
      expect(typeof response.scores.clarity.score).toBe('number');
      expect(typeof response.scores.clarity.word_count).toBe('number');
      expect(typeof response.scores.clarity.sentence_count).toBe('number');
      expect(typeof response.scores.clarity.average_sentence_length).toBe('number');
      expect(typeof response.scores.clarity.flesch_reading_ease).toBe('number');
      expect(typeof response.scores.clarity.vocabulary_complexity).toBe('number');

      expect(response.scores.grammar).toBeDefined();
      expect(typeof response.scores.grammar.score).toBe('number');
      expect(typeof response.scores.grammar.issues).toBe('number');

      expect(response.scores.style_guide).toBeDefined();
      expect(typeof response.scores.style_guide.score).toBe('number');
      expect(typeof response.scores.style_guide.issues).toBe('number');

      expect(response.scores.tone).toBeDefined();
      expect(typeof response.scores.tone.score).toBe('number');
      expect(typeof response.scores.tone.informality).toBe('number');
      expect(typeof response.scores.tone.liveliness).toBe('number');

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
      expect(response.scores).toBeDefined();
      expect(response.scores.overall).toBeDefined();
      expect(response.scores.clarity).toBeDefined();
      expect(response.scores.grammar).toBeDefined();
      expect(response.scores.style_guide).toBeDefined();
      expect(response.scores.tone).toBeDefined();

      if (response.issues && response.issues.length > 0) {
        const issue = response.issues[0];
        expect(issue.suggestion).toBeDefined();
        expect(typeof issue.suggestion).toBe('string');
      }
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
      expect(response.scores).toBeDefined();
      expect(response.scores.overall).toBeDefined();
      expect(response.scores.clarity).toBeDefined();
      expect(response.scores.grammar).toBeDefined();
      expect(response.scores.style_guide).toBeDefined();
      expect(response.scores.tone).toBeDefined();

      // Test rewrite and rewrite_scores
      expect(response.rewrite).toBeDefined();
      expect(typeof response.rewrite).toBe('string');

      expect(response.rewrite_scores).toBeDefined();
      expect(response.rewrite_scores.overall).toBeDefined();
      expect(response.rewrite_scores.clarity).toBeDefined();
      expect(response.rewrite_scores.grammar).toBeDefined();
      expect(response.rewrite_scores.style_guide).toBeDefined();
      expect(response.rewrite_scores.tone).toBeDefined();

      if (response.issues && response.issues.length > 0) {
        const issue = response.issues[0];
        expect(issue.suggestion).toBeDefined();
        expect(typeof issue.suggestion).toBe('string');
      }
    });
  });
});
