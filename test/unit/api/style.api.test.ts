import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { listStyleGuides, styleCheck } from '../../../src/api/style/style.api';
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

  describe('styleCheck', () => {
    const mockContent = 'This is a test content.';
    const mockStyleGuide = 'ap';
    const mockDialect = 'american_english';
    const mockTone = 'academic';

    it('should return style check result with new fields', async () => {
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
        id: 'test-style-guide-id',
        name: 'ap',
      });
      expect(result.check_options.dialect).toBe('american_english');
      expect(result.check_options.tone).toBe('academic');

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
});
