import { describe, it, expect } from 'vitest';
import {
  categorizeIssues,
  getIssueCounts,
  getIssuesByCategory,
  hasSuggestion,
  getIssuesWithSuggestions,
  getIssuesWithoutSuggestions,
  type CategorizedIssues,
} from '../../../src/utils/issues';
import { IssueCategory, type Issue, type IssueWithSuggestion } from '../../../src/api/style/style.api.types';

describe('Issues Utils', () => {
  const mockIssues: Issue[] = [
    {
      original: 'grammar error',
      char_index: 0,
      subcategory: 'spelling',
      category: IssueCategory.Grammar,
    },
    {
      original: 'simple word',
      char_index: 10,
      subcategory: 'basic',
      category: IssueCategory.SimpleVocab,
    },
    {
      original: 'complex sentence structure',
      char_index: 20,
      subcategory: 'fragment',
      category: IssueCategory.SentenceStructure,
    },
    {
      original: 'very long sentence',
      char_index: 30,
      subcategory: 'length',
      category: IssueCategory.SentenceLength,
    },
    {
      original: 'informal tone',
      char_index: 40,
      subcategory: 'casual',
      category: IssueCategory.Tone,
    },
    {
      original: 'style guide violation',
      char_index: 50,
      subcategory: 'formatting',
      category: IssueCategory.StyleGuide,
    },
    {
      original: 'technical term',
      char_index: 60,
      subcategory: 'jargon',
      category: IssueCategory.Terminology,
    },
    {
      original: 'another grammar issue',
      char_index: 70,
      subcategory: 'punctuation',
      category: IssueCategory.Grammar,
    },
  ];

  describe('categorizeIssues', () => {
    it('should categorize issues by their category', () => {
      const result = categorizeIssues(mockIssues);

      expect(result.grammar).toHaveLength(2);
      expect(result.simple_vocab).toHaveLength(1);
      expect(result.sentence_structure).toHaveLength(1);
      expect(result.sentence_length).toHaveLength(1);
      expect(result.tone).toHaveLength(1);
      expect(result.style_guide).toHaveLength(1);
      expect(result.terminology).toHaveLength(1);

      // Check specific issues are in correct categories
      expect(result.grammar[0].original).toBe('grammar error');
      expect(result.grammar[1].original).toBe('another grammar issue');
      expect(result.simple_vocab[0].original).toBe('simple word');
    });

    it('should return empty arrays for categories with no issues', () => {
      const emptyIssues: Issue[] = [];
      const result = categorizeIssues(emptyIssues);

      expect(result.grammar).toEqual([]);
      expect(result.simple_vocab).toEqual([]);
      expect(result.sentence_structure).toEqual([]);
      expect(result.sentence_length).toEqual([]);
      expect(result.tone).toEqual([]);
      expect(result.style_guide).toEqual([]);
      expect(result.terminology).toEqual([]);
    });

    it('should handle issues with suggestions and preserve type safety', () => {
      const issuesWithSuggestions: IssueWithSuggestion[] = [
        {
          original: 'grammar error',
          char_index: 0,
          subcategory: 'spelling',
          category: IssueCategory.Grammar,
          suggestion: 'grammar correction',
        },
      ];

      const result = categorizeIssues(issuesWithSuggestions);

      // TypeScript should know that suggestion exists
      expect(result.grammar[0].suggestion).toBe('grammar correction');

      // Verify the return type is correctly typed
      const _test: CategorizedIssues<IssueWithSuggestion> = result;
      expect(_test.grammar[0].suggestion).toBeDefined();
    });
  });

  describe('getIssueCounts', () => {
    it('should return correct counts for each category', () => {
      const result = getIssueCounts(mockIssues);

      expect(result[IssueCategory.Grammar]).toBe(2);
      expect(result[IssueCategory.SimpleVocab]).toBe(1);
      expect(result[IssueCategory.SentenceStructure]).toBe(1);
      expect(result[IssueCategory.SentenceLength]).toBe(1);
      expect(result[IssueCategory.Tone]).toBe(1);
      expect(result[IssueCategory.StyleGuide]).toBe(1);
      expect(result[IssueCategory.Terminology]).toBe(1);
    });

    it('should return zero counts for empty issues array', () => {
      const result = getIssueCounts([]);

      expect(result[IssueCategory.Grammar]).toBe(0);
      expect(result[IssueCategory.SimpleVocab]).toBe(0);
      expect(result[IssueCategory.SentenceStructure]).toBe(0);
      expect(result[IssueCategory.SentenceLength]).toBe(0);
      expect(result[IssueCategory.Tone]).toBe(0);
      expect(result[IssueCategory.StyleGuide]).toBe(0);
      expect(result[IssueCategory.Terminology]).toBe(0);
    });
  });

  describe('getIssuesByCategory', () => {
    it('should return issues for a specific category', () => {
      const grammarIssues = getIssuesByCategory(mockIssues, IssueCategory.Grammar);
      const toneIssues = getIssuesByCategory(mockIssues, IssueCategory.Tone);

      expect(grammarIssues).toHaveLength(2);
      expect(toneIssues).toHaveLength(1);
      expect(grammarIssues[0].original).toBe('grammar error');
      expect(grammarIssues[1].original).toBe('another grammar issue');
      expect(toneIssues[0].original).toBe('informal tone');
    });

    it('should return empty array for category with no issues', () => {
      const issues = getIssuesByCategory(mockIssues, IssueCategory.Grammar);
      const filteredIssues = issues.filter(() => false); // Remove all issues
      const result = getIssuesByCategory(filteredIssues, IssueCategory.Grammar);

      expect(result).toEqual([]);
    });

    it('should return empty array for empty issues array', () => {
      const result = getIssuesByCategory([], IssueCategory.Grammar);
      expect(result).toEqual([]);
    });

    it('should preserve type safety for issues with suggestions', () => {
      const issuesWithSuggestions: IssueWithSuggestion[] = [
        {
          original: 'grammar error',
          char_index: 0,
          subcategory: 'spelling',
          category: IssueCategory.Grammar,
          suggestion: 'correction',
        },
      ];

      const grammarIssues = getIssuesByCategory(issuesWithSuggestions, IssueCategory.Grammar);

      // TypeScript should know that suggestion exists
      expect(grammarIssues[0].suggestion).toBe('correction');
    });
  });

  describe('Type guard and filtering functions', () => {
    it('should correctly identify issues with suggestions', () => {
      const issueWithSuggestion: IssueWithSuggestion = {
        original: 'test',
        char_index: 0,
        subcategory: 'test',
        category: IssueCategory.Grammar,
        suggestion: 'suggestion',
      };

      const issueWithoutSuggestion: Issue = {
        original: 'test',
        char_index: 0,
        subcategory: 'test',
        category: IssueCategory.Grammar,
      };

      expect(hasSuggestion(issueWithSuggestion)).toBe(true);
      expect(hasSuggestion(issueWithoutSuggestion)).toBe(false);
    });

    it('should filter issues with suggestions', () => {
      const mixedIssues: Issue[] = [
        {
          original: 'issue1',
          char_index: 0,
          subcategory: 'test',
          category: IssueCategory.Grammar,
        },
        {
          original: 'issue2',
          char_index: 1,
          subcategory: 'test',
          category: IssueCategory.Tone,
          suggestion: 'suggestion',
        } as IssueWithSuggestion,
        {
          original: 'issue3',
          char_index: 2,
          subcategory: 'test',
          category: IssueCategory.StyleGuide,
        },
      ];

      const withSuggestions = getIssuesWithSuggestions(mixedIssues);
      const withoutSuggestions = getIssuesWithoutSuggestions(mixedIssues);

      expect(withSuggestions).toHaveLength(1);
      expect(withoutSuggestions).toHaveLength(2);
      expect(withSuggestions[0].suggestion).toBe('suggestion');
    });
  });

  describe('Integration tests', () => {
    it('should work together with all utility functions', () => {
      const categorized = categorizeIssues(mockIssues);
      const counts = getIssueCounts(mockIssues);
      const grammarIssues = getIssuesByCategory(mockIssues, IssueCategory.Grammar);

      // Verify consistency between functions
      expect(categorized.grammar).toHaveLength(counts[IssueCategory.Grammar]);
      expect(categorized.grammar).toEqual(grammarIssues);
      expect(categorized.grammar).toHaveLength(2);
    });

    it('should demonstrate generic type safety', () => {
      const issuesWithSuggestions: IssueWithSuggestion[] = [
        {
          original: 'test',
          char_index: 0,
          subcategory: 'test',
          category: IssueCategory.Grammar,
          suggestion: 'test suggestion',
        },
      ];

      const categorized = categorizeIssues(issuesWithSuggestions);
      const grammarIssues = getIssuesByCategory(issuesWithSuggestions, IssueCategory.Grammar);

      // TypeScript should know that suggestion exists in both cases
      expect(categorized.grammar[0].suggestion).toBe('test suggestion');
      expect(grammarIssues[0].suggestion).toBe('test suggestion');
    });
  });
});
