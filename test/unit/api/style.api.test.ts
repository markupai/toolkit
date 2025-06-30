import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import {
  listStyleGuides,
  getStyleGuide,
  createStyleGuide,
  updateStyleGuide,
  deleteStyleGuide,
  styleCheck,
  styleSuggestions,
  styleRewrite,
} from '../../../src/api/style/style.api';
import { server } from '../setup';
import { apiHandlers } from '../mocks/api.handlers';
import { IssueCategory } from '../../../src/api/style/style.api.types';

// Set up MSW server lifecycle hooks
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Style API Unit Tests', () => {
  const mockApiKey = 'test-api-key';
  const mockStyleGuideId = 'test-style-guide-id';

  describe('listStyleGuides', () => {
    it('should list style guides', async () => {
      server.use(apiHandlers.style.guides.success);

      const result = await listStyleGuides(mockApiKey);
      expect(result).toEqual([
        {
          id: mockStyleGuideId,
          name: 'Test Style Guide',
          created_at: '2025-06-20T11:46:30.537Z',
          created_by: 'test-user',
          status: 'running',
          updated_at: '2025-06-20T11:46:30.537Z',
          updated_by: 'test-user',
        },
      ]);
    });

    it('should handle list style guides error', async () => {
      server.use(apiHandlers.style.guides.error);

      await expect(listStyleGuides(mockApiKey)).rejects.toThrow('Failed to list style guides');
    });
  });

  describe('getStyleGuide', () => {
    it('should get a style guide', async () => {
      server.use(apiHandlers.style.guides.getSuccess);

      const result = await getStyleGuide(mockStyleGuideId, mockApiKey);
      expect(result).toEqual({
        id: mockStyleGuideId,
        name: 'Test Style Guide',
        created_at: '2025-06-20T11:46:30.537Z',
        created_by: 'test-user',
        status: 'running',
        updated_at: '2025-06-20T11:46:30.537Z',
        updated_by: 'test-user',
      });
    });

    it('should handle get style guide error', async () => {
      server.use(apiHandlers.style.guides.getError);

      await expect(getStyleGuide(mockStyleGuideId, mockApiKey)).rejects.toThrow('Style guide not found');
    });
  });

  describe('createStyleGuide', () => {
    it('should create a new style guide', async () => {
      server.use(apiHandlers.style.guides.createSuccess);

      // Create a mock PDF File object
      const mockFile = new File(['Test PDF content for style guide'], 'test-style-guide.pdf', {
        type: 'application/pdf',
      });

      const result = await createStyleGuide({ file: mockFile, name: 'New Style Guide' }, mockApiKey);

      expect(result).toEqual({
        id: 'new-style-guide-id',
        name: 'New Style Guide',
        created_at: '2025-06-20T11:46:30.537Z',
        created_by: 'test-user',
        status: 'running',
        updated_at: '2025-06-20T11:46:30.537Z',
        updated_by: 'test-user',
      });
    });

    it('should handle create style guide error', async () => {
      server.use(apiHandlers.style.guides.createError);

      const mockFile = new File(['Test PDF content for style guide'], 'test-style-guide.pdf', {
        type: 'application/pdf',
      });

      await expect(createStyleGuide({ file: mockFile, name: 'New Style Guide' }, mockApiKey)).rejects.toThrow(
        'Failed to create style guide',
      );
    });

    it('should handle unsupported file type error', async () => {
      const mockFile = new File(['Test content'], 'test-style-guide.txt', {
        type: 'text/plain',
      });

      await expect(createStyleGuide({ file: mockFile, name: 'New Style Guide' }, mockApiKey)).rejects.toThrow(
        'Unsupported file type: txt. Only .pdf files are supported.',
      );
    });

    it('should handle markdown file type error', async () => {
      const mockFile = new File(['# Test Style Guide\n\nThis is a markdown style guide.'], 'test-style-guide.md', {
        type: 'text/markdown',
      });

      await expect(createStyleGuide({ file: mockFile, name: 'Markdown Style Guide' }, mockApiKey)).rejects.toThrow(
        'Unsupported file type: md. Only .pdf files are supported.',
      );
    });

    it('should handle .markdown extension file type error', async () => {
      const mockFile = new File(
        ['# Test Style Guide\n\nThis is a markdown style guide.'],
        'test-style-guide.markdown',
        {
          type: 'text/markdown',
        },
      );

      await expect(createStyleGuide({ file: mockFile, name: 'Markdown Style Guide' }, mockApiKey)).rejects.toThrow(
        'Unsupported file type: markdown. Only .pdf files are supported.',
      );
    });
  });

  describe('updateStyleGuide', () => {
    it('should update a style guide', async () => {
      server.use(apiHandlers.style.guides.updateSuccess);

      const result = await updateStyleGuide(mockStyleGuideId, { name: 'Updated Style Guide' }, mockApiKey);

      expect(result).toEqual({
        id: mockStyleGuideId,
        name: 'Updated Style Guide',
        created_at: '2025-06-20T11:46:30.537Z',
        created_by: 'test-user',
        status: 'running',
        updated_at: '2025-06-20T12:00:00.000Z',
        updated_by: 'test-user',
      });
    });

    it('should handle update style guide error', async () => {
      server.use(apiHandlers.style.guides.updateError);

      await expect(updateStyleGuide(mockStyleGuideId, { name: 'Updated Style Guide' }, mockApiKey)).rejects.toThrow(
        'Failed to update style guide',
      );
    });
  });

  describe('styleCheck', () => {
    const mockContent = 'This is a test content.';
    const mockStyleGuide = 'ap';
    const mockDialect = 'american_english';
    const mockTone = 'academic';

    it('should return style check result with new scores structure', async () => {
      server.use(apiHandlers.style.checks.success, apiHandlers.style.checks.poll);

      const result = await styleCheck(
        {
          content: mockContent,
          style_guide: mockStyleGuide,
          dialect: mockDialect,
          tone: mockTone,
        },
        mockApiKey,
      );

      expect(result.check_options).toBeDefined();
      expect(result.check_options.style_guide).toEqual({
        style_guide_type: 'ap',
        style_guide_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
      expect(typeof result.check_options.style_guide.style_guide_type).toBe('string');
      expect(typeof result.check_options.style_guide.style_guide_id).toBe('string');
      expect(result.check_options.style_guide.style_guide_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(result.check_options.dialect).toBe('american_english');
      expect(result.check_options.tone).toBe('academic');

      // Test new scores structure
      expect(result.scores).toBeDefined();
      expect(result.scores.quality.score).toBe(80);
      expect(result.scores.clarity.score).toBe(75);
      expect(result.scores.clarity.word_count).toBe(75);
      expect(result.scores.clarity.sentence_count).toBe(5);
      expect(result.scores.clarity.average_sentence_length).toBe(15);
      expect(result.scores.clarity.flesch_reading_ease).toBe(80);
      expect(result.scores.clarity.vocabulary_complexity).toBe(85);
      expect(result.scores.grammar.score).toBe(90);
      expect(result.scores.grammar.issues).toBe(1);
      expect(result.scores.style_guide.score).toBe(85);
      expect(result.scores.style_guide.issues).toBe(0);
      expect(result.scores.tone.score).toBe(70);
      expect(result.scores.tone.informality).toBe(30);
      expect(result.scores.tone.liveliness).toBe(60);

      expect(result.issues).toHaveLength(1);
      const issue = result.issues[0];
      expect(issue.subcategory).toBe('passive_voice');
      expect(issue.category).toBe(IssueCategory.Grammar);
    });

    it('should handle style check error', async () => {
      server.use(apiHandlers.style.checks.error);

      await expect(
        styleCheck(
          {
            content: mockContent,
            style_guide: mockStyleGuide,
            dialect: mockDialect,
            tone: mockTone,
          },
          mockApiKey,
        ),
      ).rejects.toThrow('Could not validate credentials');
    });
  });

  describe('styleSuggestions', () => {
    const mockContent = 'This is a test content.';
    const mockStyleGuide = 'ap';
    const mockDialect = 'american_english';
    const mockTone = 'academic';

    it('should return style suggestions result with suggestions', async () => {
      server.use(apiHandlers.style.suggestions.success, apiHandlers.style.suggestions.poll);

      const result = await styleSuggestions(
        {
          content: mockContent,
          style_guide: mockStyleGuide,
          dialect: mockDialect,
          tone: mockTone,
        },
        mockApiKey,
      );

      expect(result.check_options).toBeDefined();
      expect(result.check_options.style_guide).toEqual({
        style_guide_type: 'ap',
        style_guide_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
      expect(typeof result.check_options.style_guide.style_guide_type).toBe('string');
      expect(typeof result.check_options.style_guide.style_guide_id).toBe('string');
      expect(result.check_options.style_guide.style_guide_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(result.scores).toBeDefined();
      expect(result.scores.quality.score).toBe(80);
      expect(result.scores.clarity.score).toBe(75);
      expect(result.scores.grammar.score).toBe(90);
      expect(result.scores.style_guide.score).toBe(85);
      expect(result.scores.tone.score).toBe(70);

      expect(result.issues).toHaveLength(1);
      const issue = result.issues[0];
      expect(issue.subcategory).toBe('passive_voice');
      expect(issue.category).toBe(IssueCategory.Grammar);
      expect(issue.suggestion).toBe('This sentence should be rewritten.');
    });

    it('should handle style suggestions error', async () => {
      server.use(apiHandlers.style.suggestions.error);

      await expect(
        styleSuggestions(
          {
            content: mockContent,
            style_guide: mockStyleGuide,
            dialect: mockDialect,
            tone: mockTone,
          },
          mockApiKey,
        ),
      ).rejects.toThrow('Could not validate credentials');
    });
  });

  describe('styleRewrite', () => {
    const mockContent = 'This is a test content.';
    const mockStyleGuide = 'ap';
    const mockDialect = 'american_english';
    const mockTone = 'academic';

    it('should return style rewrite result with rewrite and rewrite_scores', async () => {
      server.use(apiHandlers.style.rewrites.success, apiHandlers.style.rewrites.poll);

      const result = await styleRewrite(
        {
          content: mockContent,
          style_guide: mockStyleGuide,
          dialect: mockDialect,
          tone: mockTone,
        },
        mockApiKey,
      );

      expect(result.check_options).toBeDefined();
      expect(result.check_options.style_guide).toEqual({
        style_guide_type: 'ap',
        style_guide_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });
      expect(typeof result.check_options.style_guide.style_guide_type).toBe('string');
      expect(typeof result.check_options.style_guide.style_guide_id).toBe('string');
      expect(result.check_options.style_guide.style_guide_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(result.scores).toBeDefined();
      expect(result.scores.quality.score).toBe(80);
      expect(result.scores.clarity.score).toBe(75);
      expect(result.scores.grammar.score).toBe(90);
      expect(result.scores.style_guide.score).toBe(85);
      expect(result.scores.tone.score).toBe(70);

      expect(result.issues).toHaveLength(1);
      const issue = result.issues[0];
      expect(issue.subcategory).toBe('passive_voice');
      expect(issue.category).toBe(IssueCategory.Grammar);
      expect(issue.suggestion).toBe('This sentence should be rewritten.');

      // Test rewrite and rewrite_scores
      expect(result.rewrite).toBe('This is an improved test sentence.');
      expect(result.rewrite_scores).toBeDefined();
      expect(result.rewrite_scores.quality.score).toBe(85);
      expect(result.rewrite_scores.clarity.score).toBe(80);
      expect(result.rewrite_scores.clarity.flesch_reading_ease).toBe(85);
      expect(result.rewrite_scores.clarity.vocabulary_complexity).toBe(90);
      expect(result.rewrite_scores.grammar.score).toBe(95);
      expect(result.rewrite_scores.grammar.issues).toBe(0);
      expect(result.rewrite_scores.style_guide.score).toBe(90);
      expect(result.rewrite_scores.style_guide.issues).toBe(0);
      expect(result.rewrite_scores.tone.score).toBe(75);
      expect(result.rewrite_scores.tone.informality).toBe(25);
      expect(result.rewrite_scores.tone.liveliness).toBe(65);
    });

    it('should handle style rewrite error', async () => {
      server.use(apiHandlers.style.rewrites.error);

      await expect(
        styleRewrite(
          {
            content: mockContent,
            style_guide: mockStyleGuide,
            dialect: mockDialect,
            tone: mockTone,
          },
          mockApiKey,
        ),
      ).rejects.toThrow('Could not validate credentials');
    });
  });

  describe('deleteStyleGuide', () => {
    it('should delete a style guide', async () => {
      server.use(apiHandlers.style.guides.deleteSuccess);

      await expect(deleteStyleGuide(mockStyleGuideId, mockApiKey)).resolves.not.toThrow();
    });

    it('should handle delete style guide error', async () => {
      server.use(apiHandlers.style.guides.deleteError);

      await expect(deleteStyleGuide(mockStyleGuideId, mockApiKey)).rejects.toThrow('Failed to delete style guide');
    });
  });
});
