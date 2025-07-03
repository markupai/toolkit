import { describe, it, expect, beforeAll } from 'vitest';
import {
  listStyleGuides,
  submitStyleCheck,
  submitStyleSuggestion,
  submitStyleRewrite,
  styleCheck,
  styleSuggestions,
  styleRewrite,
  createStyleGuide,
  createStyleGuideReqFromPath,
  deleteStyleGuide,
  getStyleGuide,
} from '../../../src/api/style/style.api';
import { STYLE_DEFAULTS } from '../../../src/api/style/style.api.defaults';
import { IssueCategory } from '../../../src/api/style/style.api.types';
import type { Config } from '../../../src/utils/api.types';
import { DEFAULT_PLATFORM_URL_DEV } from '../../../src/utils/api';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Style API Integration Tests', () => {
  let config: Config;
  beforeAll(() => {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      throw new Error('API_KEY environment variable is required for integration tests');
    }
    config = {
      apiKey,
      platformUrl: DEFAULT_PLATFORM_URL_DEV,
    };
  });

  describe('Style Guide Listing', () => {
    it('should list style guides', async () => {
      const response = await listStyleGuides(config);
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

  describe('Style Guide Creation', () => {
    it('should create a new style guide from PDF file', async () => {
      // Read the sample PDF file
      const pdfPath = join(__dirname, '../test-data/sample-style-guide.pdf');
      const pdfBuffer = readFileSync(pdfPath);

      // Create a File object from the buffer
      const pdfFile = new File([pdfBuffer], 'sample-style-guide.pdf', {
        type: 'application/pdf',
      });

      // Generate a unique name with random number
      const randomNumber = Math.floor(Math.random() * 10000);
      const styleGuideName = `Integration Test Style Guide ${randomNumber}`;

      const response = await createStyleGuide({ file: pdfFile, name: styleGuideName }, config);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(styleGuideName);
      expect(response.created_at).toBeDefined();
      expect(response.created_by).toBeDefined();
      expect(response.status).toBeDefined();
      expect(response.updated_at).toBeDefined();
      expect(response.updated_by).toBeDefined();

      // Validate the response structure matches StyleGuideCreateResp
      expect(typeof response.id).toBe('string');
      expect(typeof response.name).toBe('string');
      expect(typeof response.created_at).toBe('string');
      expect(typeof response.created_by).toBe('string');
      expect(typeof response.status).toBe('string');
      // updated_at and updated_by can be null when first created
      expect(typeof response.updated_at === 'string' || response.updated_at === null).toBe(true);
      expect(typeof response.updated_by === 'string' || response.updated_by === null).toBe(true);

      // Validate that the ID is a UUID format
      expect(response.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should create multiple style guides with unique names', async () => {
      // Read the sample PDF file
      const pdfPath = join(__dirname, '../test-data/sample-style-guide.pdf');
      const pdfBuffer = readFileSync(pdfPath);

      // Create a File object from the buffer
      const pdfFile = new File([pdfBuffer], 'sample-style-guide.pdf', {
        type: 'application/pdf',
      });

      // Create two style guides with different names
      const randomNumber1 = Math.floor(Math.random() * 10000);
      const randomNumber2 = Math.floor(Math.random() * 10000);
      const styleGuideName1 = `Integration Test Style Guide A ${randomNumber1}`;
      const styleGuideName2 = `Integration Test Style Guide B ${randomNumber2}`;

      const response1 = await createStyleGuide({ file: pdfFile, name: styleGuideName1 }, config);

      const response2 = await createStyleGuide({ file: pdfFile, name: styleGuideName2 }, config);

      // Verify both were created successfully
      expect(response1.name).toBe(styleGuideName1);
      expect(response2.name).toBe(styleGuideName2);
      expect(response1.id).not.toBe(response2.id); // IDs should be different
    });

    it('should create style guide using utility function from file path', async () => {
      // Use the utility function to create request from file path
      const pdfPath = join(__dirname, '../test-data/sample-style-guide.pdf');

      // Generate a unique name with random number
      const randomNumber = Math.floor(Math.random() * 10000);
      const styleGuideName = `Utility Test Style Guide ${randomNumber}`;

      const request = await createStyleGuideReqFromPath(pdfPath, styleGuideName);

      // Verify the request was created correctly
      expect(request).toBeDefined();
      expect(request.file).toBeInstanceOf(File);
      expect(request.file.name).toBe('sample-style-guide.pdf');
      expect(request.file.type).toBe('application/pdf');
      expect(request.name).toBe(styleGuideName);

      // Create the style guide using the request
      const response = await createStyleGuide(request, config);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(styleGuideName);
      expect(response.created_at).toBeDefined();
      expect(response.created_by).toBeDefined();
      expect(response.status).toBeDefined();

      // Validate that the ID is a UUID format
      expect(response.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should create style guide using utility function without custom name', async () => {
      // Use the utility function to create request from file path without custom name
      const pdfPath = join(__dirname, '../test-data/sample-style-guide.pdf');

      const request = await createStyleGuideReqFromPath(pdfPath);

      // Verify the request was created correctly
      expect(request).toBeDefined();
      expect(request.file).toBeInstanceOf(File);
      expect(request.file.name).toBe('sample-style-guide.pdf');
      expect(request.file.type).toBe('application/pdf');
      expect(request.name).toBe('sample-style-guide'); // Should use filename without extension

      // Create the style guide using the request
      const response = await createStyleGuide(request, config);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe('sample-style-guide');
      expect(response.created_at).toBeDefined();
      expect(response.created_by).toBeDefined();
      expect(response.status).toBeDefined();

      // Validate that the ID is a UUID format
      expect(response.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('Style Operations', () => {
    const testContent = 'This is a test content for style operations.';
    const styleGuideId = STYLE_DEFAULTS.styleGuides.microsoft;
    it('should submit a style check', async () => {
      const response = await submitStyleCheck(
        {
          content: testContent,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
        },
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
    });

    it('should submit a style check with custom document name', async () => {
      const response = await submitStyleCheck(
        {
          content: testContent,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'integration-test-document.txt',
        },
        config,
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
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
    });

    it('should submit a style suggestion with custom document name', async () => {
      const response = await submitStyleSuggestion(
        {
          content: testContent,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'suggestions-test-document.txt',
        },
        config,
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
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
    });

    it('should submit a style rewrite with custom document name', async () => {
      const response = await submitStyleRewrite(
        {
          content: testContent,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'rewrite-test-document.txt',
        },
        config,
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
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
      expect(typeof response.workflow_id).toBe('string');
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
      expect(response.scores.quality).toBeDefined();
      expect(typeof response.scores.quality.score).toBe('number');

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

      expect(response.scores.terminology).toBeDefined();
      expect(typeof response.scores.terminology.score).toBe('number');
      expect(typeof response.scores.terminology.issues).toBe('number');

      if (response.issues && response.issues.length > 0) {
        const issue = response.issues[0];
        expect(issue.subcategory).toBeDefined();
        expect(typeof issue.subcategory).toBe('string');
        expect(issue.category).toBeDefined();
        expect(Object.values(IssueCategory)).toContain(issue.category);
      }
    });

    it('should submit a style check with custom document name and get result', async () => {
      const response = await styleCheck(
        {
          content: testContent,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'custom-check-document.txt',
        },
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
      expect(typeof response.workflow_id).toBe('string');
      expect(response.check_options).toBeDefined();
      expect(response.scores).toBeDefined();
      expect(response.scores.quality).toBeDefined();
      expect(response.scores.clarity).toBeDefined();
      expect(response.scores.grammar).toBeDefined();
      expect(response.scores.style_guide).toBeDefined();
      expect(response.scores.tone).toBeDefined();
      expect(response.scores.terminology).toBeDefined();
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
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
      expect(typeof response.workflow_id).toBe('string');
      expect(response.scores).toBeDefined();
      expect(response.scores.quality).toBeDefined();
      expect(response.scores.clarity).toBeDefined();
      expect(response.scores.grammar).toBeDefined();
      expect(response.scores.style_guide).toBeDefined();
      expect(response.scores.tone).toBeDefined();
      expect(response.scores.terminology).toBeDefined();

      if (response.issues && response.issues.length > 0) {
        const issue = response.issues[0];
        expect(issue.suggestion).toBeDefined();
        expect(typeof issue.suggestion).toBe('string');
      }
    });

    it('should submit a style suggestion with custom document name and get result', async () => {
      const response = await styleSuggestions(
        {
          content: testContent,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'custom-suggestions-document.txt',
        },
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
      expect(typeof response.workflow_id).toBe('string');
      expect(response.scores).toBeDefined();
      expect(response.scores.quality).toBeDefined();
      expect(response.scores.clarity).toBeDefined();
      expect(response.scores.grammar).toBeDefined();
      expect(response.scores.style_guide).toBeDefined();
      expect(response.scores.tone).toBeDefined();
      expect(response.scores.terminology).toBeDefined();

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
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
      expect(typeof response.workflow_id).toBe('string');
      expect(response.scores).toBeDefined();
      expect(response.scores.quality).toBeDefined();
      expect(response.scores.clarity).toBeDefined();
      expect(response.scores.grammar).toBeDefined();
      expect(response.scores.style_guide).toBeDefined();
      expect(response.scores.tone).toBeDefined();
      expect(response.scores.terminology).toBeDefined();

      // Test rewrite and rewrite_scores
      expect(response.rewrite).toBeDefined();
      expect(typeof response.rewrite).toBe('string');

      expect(response.rewrite_scores).toBeDefined();
      expect(response.rewrite_scores.quality).toBeDefined();
      expect(response.rewrite_scores.clarity).toBeDefined();
      expect(response.rewrite_scores.grammar).toBeDefined();
      expect(response.rewrite_scores.style_guide).toBeDefined();
      expect(response.rewrite_scores.tone).toBeDefined();
      expect(response.rewrite_scores.terminology).toBeDefined();

      if (response.issues && response.issues.length > 0) {
        const issue = response.issues[0];
        expect(issue.suggestion).toBeDefined();
        expect(typeof issue.suggestion).toBe('string');
      }
    });

    it('should submit a style rewrite with custom document name and get result', async () => {
      const response = await styleRewrite(
        {
          content: testContent,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'custom-rewrite-document.txt',
        },
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
      expect(typeof response.workflow_id).toBe('string');
      expect(response.scores).toBeDefined();
      expect(response.scores.quality).toBeDefined();
      expect(response.scores.clarity).toBeDefined();
      expect(response.scores.grammar).toBeDefined();
      expect(response.scores.style_guide).toBeDefined();
      expect(response.scores.tone).toBeDefined();
      expect(response.scores.terminology).toBeDefined();

      // Test rewrite and rewrite_scores
      expect(response.rewrite).toBeDefined();
      expect(typeof response.rewrite).toBe('string');

      expect(response.rewrite_scores).toBeDefined();
      expect(response.rewrite_scores.quality).toBeDefined();
      expect(response.rewrite_scores.clarity).toBeDefined();
      expect(response.rewrite_scores.grammar).toBeDefined();
      expect(response.rewrite_scores.style_guide).toBeDefined();
      expect(response.rewrite_scores.tone).toBeDefined();
      expect(response.rewrite_scores.terminology).toBeDefined();

      if (response.issues && response.issues.length > 0) {
        const issue = response.issues[0];
        expect(issue.suggestion).toBeDefined();
        expect(typeof issue.suggestion).toBe('string');
      }
    });
  });

  describe('Style Guide Cleanup', () => {
    it('should delete all integration test style guides', async () => {
      // List all style guides
      const styleGuides = await listStyleGuides(config);

      // Filter style guides that start with "Integration Test Style Guide"
      const integrationTestGuides = styleGuides.filter((guide) =>
        guide.name.startsWith('Integration Test Style Guide'),
      );

      console.log(`Found ${integrationTestGuides.length} integration test style guides to process`);

      let deletedCount = 0;
      let skippedCount = 0;

      // Delete each integration test style guide, skipping those with "running" status
      for (const guide of integrationTestGuides) {
        try {
          // Check the status of the style guide before attempting to delete
          const styleGuideDetails = await getStyleGuide(guide.id, config);

          if (styleGuideDetails.status === 'running') {
            console.log(
              `Skipping style guide: ${guide.name} (${guide.id}) - Status: ${styleGuideDetails.status} (still running)`,
            );
            skippedCount++;
          } else {
            await deleteStyleGuide(guide.id, config);
            console.log(
              `Successfully deleted style guide: ${guide.name} (${guide.id}) - Status: ${styleGuideDetails.status}`,
            );
            deletedCount++;
          }
        } catch (error) {
          console.error(`Failed to process style guide: ${guide.name} (${guide.id})`, error);
          // Continue with other deletions even if one fails
        }
      }

      console.log(`Cleanup summary: ${deletedCount} deleted, ${skippedCount} skipped`);
    });
  });
});
