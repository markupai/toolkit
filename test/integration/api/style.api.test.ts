import { describe, it, expect, beforeAll } from 'vitest';
import {
  submitStyleCheck,
  submitStyleSuggestion,
  submitStyleRewrite,
  styleCheck,
  styleSuggestions,
  styleRewrite,
  getStyleSuggestion,
  getStyleRewrite,
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
      expect(typeof response.scores.tone.target_informality).toBe('number');
      expect(typeof response.scores.tone.target_liveliness).toBe('number');
      expect(typeof response.scores.tone.informality_tolerance).toBe('number');
      expect(typeof response.scores.tone.liveliness_tolerance).toBe('number');

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

  describe('Style Operations Get Results', () => {
    const styleGuideId = STYLE_DEFAULTS.styleGuides.microsoft;

    it('should get style suggestion results by workflow ID', async () => {
      // Submit a style suggestion to get a workflow ID
      const suggestionResp = await submitStyleSuggestion(
        {
          content: 'Integration test for getStyleSuggestion',
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
        },
        config,
      );
      expect(suggestionResp.workflow_id).toBeDefined();
      const workflowId = suggestionResp.workflow_id;

      // Fetch the suggestion results
      const result = await getStyleSuggestion(workflowId, config);
      expect(result).toBeDefined();
    });

    it('should get style rewrite results by workflow ID', async () => {
      // Submit a style rewrite to get a workflow ID
      const rewriteResp = await submitStyleRewrite(
        {
          content: 'Integration test for getStyleRewrite',
          style_guide: styleGuideId,
          dialect: STYLE_DEFAULTS.dialects.americanEnglish,
          tone: STYLE_DEFAULTS.tones.formal,
        },
        config,
      );
      expect(rewriteResp.workflow_id).toBeDefined();
      const workflowId = rewriteResp.workflow_id;

      // Fetch the rewrite results
      const result = await getStyleRewrite(workflowId, config);
      expect(result).toBeDefined();
    });
  });
});
