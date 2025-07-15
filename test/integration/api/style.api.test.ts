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
import { PlatformType } from '../../../src/utils/api.types';
import type { Config } from '../../../src/utils/api.types';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AcrolinxError } from '../../../src/utils/errors';
import { BufferDescriptor } from '../../../src/api/style/style.api.types';

// Helper function to create a BufferDescriptor from the batteries.pdf
async function createTestPdfBuffer(): Promise<BufferDescriptor> {
  const pdfPath = join(__dirname, '../test-data/batteries.pdf');
  const buffer = readFileSync(pdfPath);
  return { buffer, mimeType: 'application/pdf' };
}

describe('Style API Integration Tests', () => {
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
      const pdfPath = join(__dirname, '../test-data/batteries.pdf');
      // Generate a unique name with random number
      const randomNumber = Math.floor(Math.random() * 10000);
      const styleGuideName = `Utility Test Style Guide ${randomNumber}`;
      const request = await createStyleGuideReqFromPath(pdfPath, styleGuideName);

      // Verify the request was created correctly
      expect(request).toBeDefined();
      expect(request.file).toBeInstanceOf(File);
      expect(request.file.name).toBe('batteries.pdf');
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
      const pdfPath2 = join(__dirname, '../test-data/batteries.pdf');
      const request2 = await createStyleGuideReqFromPath(pdfPath2);

      // Verify the request was created correctly
      expect(request2).toBeDefined();
      expect(request2.file).toBeInstanceOf(File);
      expect(request2.file.name).toBe('batteries.pdf');
      expect(request2.file.type).toBe('application/pdf');
      expect(request2.name).toBe('batteries'); // Should use filename without extension

      // Create the style guide using the request
      const response = await createStyleGuide(request2, config);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe('batteries');
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

    it('should submit a style check with incorrect options', async () => {
      expect(
        async () =>
          await submitStyleCheck(
            {
              content: 'This is a test content for style operations.',
              style_guide: 'invalid-style-guide-id',
              dialect: 'invalid-dialect',
              tone: 'invalid-tone',
            },
            config,
          ),
      ).rejects.toThrow(AcrolinxError);
    });

    it('should submit a style check with invalid api key', async () => {
      expect(
        async () =>
          await submitStyleCheck(
            {
              content: testContent,
              style_guide: styleGuideId,
              dialect: STYLE_DEFAULTS.dialects.americanEnglish,
              tone: STYLE_DEFAULTS.tones.formal,
              documentName: 'integration-test-document.txt',
            },
            {
              apiKey: 'invalid-api-key',
            },
          ),
      ).rejects.toThrow(AcrolinxError);
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
      expect(typeof response.scores.clarity.flesch_kincaid_grade).toBe('number');
      expect(typeof response.scores.clarity.lexical_diversity).toBe('number');
      expect(typeof response.scores.clarity.sentence_complexity).toBe('number');

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

  describe('Style Operations with File Content', () => {
    const styleGuideId = STYLE_DEFAULTS.styleGuides.microsoft;

    // Helper function to create a File object from the batteries.pdf
    async function createTestFile(): Promise<File> {
      const pdfPath = join(__dirname, '../test-data/batteries.pdf');
      const pdfBuffer = readFileSync(pdfPath);
      return new File([pdfBuffer], 'batteries.pdf', { type: 'application/pdf' });
    }

    it('should submit a style check with File content', async () => {
      const testFile = await createTestFile();
      const fileDescriptor = { file: testFile, mimeType: 'application/pdf' };

      const response = await submitStyleCheck(
        {
          content: fileDescriptor,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'batteries-integration-test.pdf',
        },
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
    });

    it('should submit a style suggestion with File content', async () => {
      const testFile = await createTestFile();
      const fileDescriptor = { file: testFile, mimeType: 'application/pdf' };

      const response = await submitStyleSuggestion(
        {
          content: fileDescriptor,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'batteries-suggestions-test.pdf',
        },
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
    });

    it('should submit a style rewrite with File content', async () => {
      const testFile = await createTestFile();
      const fileDescriptor = { file: testFile, mimeType: 'application/pdf' };

      const response = await submitStyleRewrite(
        {
          content: fileDescriptor,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'batteries-rewrite-test.pdf',
        },
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
    });

    it('should submit a style check with File content and get result', async () => {
      const testFile = await createTestFile();
      const fileDescriptor = { file: testFile, mimeType: 'application/pdf' };

      const response = await styleCheck(
        {
          content: fileDescriptor,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'batteries-check-result-test.pdf',
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

      // Test scores structure
      expect(response.scores).toBeDefined();
      expect(response.scores.quality).toBeDefined();
      expect(typeof response.scores.quality.score).toBe('number');
      expect(response.scores.clarity).toBeDefined();
      expect(response.scores.grammar).toBeDefined();
      expect(response.scores.style_guide).toBeDefined();
      expect(response.scores.tone).toBeDefined();
      expect(response.scores.terminology).toBeDefined();
    });

    it('should submit a style suggestion with File content and get result', async () => {
      const testFile = await createTestFile();
      const fileDescriptor = { file: testFile, mimeType: 'application/pdf' };

      const response = await styleSuggestions(
        {
          content: fileDescriptor,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'batteries-suggestions-result-test.pdf',
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

    it('should submit a style rewrite with File content and get result', async () => {
      const testFile = await createTestFile();
      const fileDescriptor = { file: testFile, mimeType: 'application/pdf' };

      const response = await styleRewrite(
        {
          content: fileDescriptor,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'batteries-rewrite-result-test.pdf',
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

    it('should handle File content without custom document name', async () => {
      const testFile = await createTestFile();
      const fileDescriptor = { file: testFile, mimeType: 'application/pdf' };

      const response = await styleCheck(
        {
          content: fileDescriptor,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          // No documentName - should use default
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
    });
  });

  describe('Style Operations with Buffer Content', () => {
    const styleGuideId = STYLE_DEFAULTS.styleGuides.microsoft;

    // Helper function to create a Buffer object from text content
    function createTestBuffer(content: string): Buffer {
      return Buffer.from(content, 'utf8');
    }

    it('should submit a style check with Buffer content', async () => {
      const testBuffer = createTestBuffer('This is a test content for Buffer style operations.');
      const bufferDescriptor = { buffer: testBuffer, mimeType: 'text/plain' };

      const response = await submitStyleCheck(
        {
          content: bufferDescriptor,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'buffer-integration-test.txt',
        },
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
    });

    it('should submit a style suggestion with Buffer content', async () => {
      const testBuffer = createTestBuffer('This is a test content for Buffer style suggestions.');
      const bufferDescriptor = { buffer: testBuffer, mimeType: 'text/plain' };

      const response = await submitStyleSuggestion(
        {
          content: bufferDescriptor,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'buffer-suggestions-test.txt',
        },
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
    });

    it('should submit a style rewrite with Buffer content', async () => {
      const testBuffer = createTestBuffer('This is a test content for Buffer style rewrites.');
      const bufferDescriptor = { buffer: testBuffer, mimeType: 'text/plain' };

      const response = await submitStyleRewrite(
        {
          content: bufferDescriptor,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'buffer-rewrite-test.txt',
        },
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
    });

    it('should submit a style check with Buffer content and get result', async () => {
      const testBuffer = createTestBuffer('This is a test content for Buffer style check with results.');
      const bufferDescriptor = { buffer: testBuffer, mimeType: 'text/plain' };

      const response = await styleCheck(
        {
          content: bufferDescriptor,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'buffer-check-result-test.txt',
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

      // Test scores structure
      expect(response.scores).toBeDefined();
      expect(response.scores.quality).toBeDefined();
      expect(typeof response.scores.quality.score).toBe('number');
      expect(response.scores.clarity).toBeDefined();
      expect(response.scores.grammar).toBeDefined();
      expect(response.scores.style_guide).toBeDefined();
      expect(response.scores.tone).toBeDefined();
      expect(response.scores.terminology).toBeDefined();
    });

    it('should submit a style suggestion with Buffer content and get result', async () => {
      const testBuffer = createTestBuffer('This is a test content for Buffer style suggestions with results.');
      const bufferDescriptor = { buffer: testBuffer, mimeType: 'text/plain' };

      const response = await styleSuggestions(
        {
          content: bufferDescriptor,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'buffer-suggestions-result-test.txt',
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

    it('should submit a style rewrite with Buffer content and get result', async () => {
      const testBuffer = createTestBuffer('This is a test content for Buffer style rewrites with results.');
      const bufferDescriptor = { buffer: testBuffer, mimeType: 'text/plain' };

      const response = await styleRewrite(
        {
          content: bufferDescriptor,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'buffer-rewrite-result-test.txt',
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

    it('should handle Buffer content without custom document name', async () => {
      const testBuffer = createTestBuffer('This is a test content for Buffer without custom document name.');
      const bufferDescriptor = { buffer: testBuffer, mimeType: 'text/plain' };

      const response = await styleCheck(
        {
          content: bufferDescriptor,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          // No documentName - should use default
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
    });

    it('should handle PDF Buffer content', async () => {
      const testPdfBuffer = await createTestPdfBuffer();

      const response = await submitStyleCheck(
        {
          content: testPdfBuffer,
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'buffer-pdf-test.pdf',
        },
        config,
      );

      expect(response).toBeDefined();
      expect(response.workflow_id).toBeDefined();
    });

    it.skip('should download text file from URL and perform style check with Buffer', async () => {
      // URL for the text file
      const textFileUrl =
        'https://zapier-dev-files.s3.amazonaws.com/cli-platform/20280/2P4LX4UFUwS9SwPN3kdCsLI0HZIS6fjgkF-dej4QtK5RQ_o8brwHHGhdNR_EB7dBSUke2Z30XLu42BJmS4MVAq2tN8d6R3xx_4dBhfNDhfWf8paGIJguziMkWu-cBsf-_PWgFvjS95FXgxtlqAO67cROPp8oTIV46TOfgJbWlfo';

      // Download the file
      const response = await fetch(textFileUrl);
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      // Get the file as an ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();
      expect(arrayBuffer).toBeDefined();
      expect(arrayBuffer.byteLength).toBeGreaterThan(0);

      // Create a Buffer from the downloaded file content
      const fileBuffer = Buffer.from(arrayBuffer);
      expect(fileBuffer).toBeInstanceOf(Buffer);
      expect(fileBuffer.length).toBeGreaterThan(0);

      // Perform style check with the downloaded content
      const styleCheckResponse = await styleRewrite(
        {
          content: { buffer: fileBuffer, mimeType: 'text/plain' },
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
          documentName: 'downloaded-file.txt',
        },
        config,
      );

      // Validate the style check response
      expect(styleCheckResponse).toBeDefined();
      expect(styleCheckResponse.workflow_id).toBeDefined();
      expect(typeof styleCheckResponse.workflow_id).toBe('string');
      expect(styleCheckResponse.check_options).toBeDefined();
      expect(styleCheckResponse.check_options.style_guide).toBeDefined();
      expect(styleCheckResponse.check_options.style_guide.style_guide_type).toBeDefined();
      expect(styleCheckResponse.check_options.style_guide.style_guide_id).toBeDefined();
      expect(typeof styleCheckResponse.check_options.style_guide.style_guide_type).toBe('string');
      expect(typeof styleCheckResponse.check_options.style_guide.style_guide_id).toBe('string');
      expect(styleCheckResponse.check_options.style_guide.style_guide_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(styleCheckResponse.check_options.dialect).toBe(STYLE_DEFAULTS.dialects.americanEnglish);
      expect(styleCheckResponse.check_options.tone).toBe(STYLE_DEFAULTS.tones.formal);

      // Test scores structure
      expect(styleCheckResponse.scores).toBeDefined();
      expect(styleCheckResponse.scores.quality).toBeDefined();
      expect(typeof styleCheckResponse.scores.quality.score).toBe('number');
      expect(styleCheckResponse.scores.clarity).toBeDefined();
      expect(styleCheckResponse.scores.grammar).toBeDefined();
      expect(styleCheckResponse.scores.style_guide).toBeDefined();
      expect(styleCheckResponse.scores.tone).toBeDefined();
      expect(styleCheckResponse.scores.terminology).toBeDefined();

      // Log some information about the downloaded content for debugging
      console.log(`Downloaded file size: ${arrayBuffer.byteLength} bytes`);
      console.log(`Buffer size: ${fileBuffer.length} bytes`);
      console.log(`Style check workflow ID: ${styleCheckResponse.workflow_id}`);
      console.log(`Quality score: ${styleCheckResponse.scores.quality.score}`);
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
