import { describe, it, expect } from "vitest";
import { categorizeIssues, type CategorizedIssues } from "../../../src/utils/issues";
import {
  IssueCategory,
  IssueSeverity,
  type Issue,
  type IssueWithSuggestion,
} from "../../../src/api/style/style.api.types";

describe("Issues Utils", () => {
  const mockIssues: Issue[] = [
    {
      original: "grammar error",
      position: {
        start_index: 0,
      },
      subcategory: "spelling",
      category: IssueCategory.Grammar,
      severity: IssueSeverity.High,
    },
    {
      original: "simple word",
      position: {
        start_index: 10,
      },
      subcategory: "basic",
      category: IssueCategory.Clarity,
      severity: IssueSeverity.Medium,
    },
    {
      original: "complex sentence structure",
      position: {
        start_index: 20,
      },
      subcategory: "fragment",
      category: IssueCategory.Consistency,
      severity: IssueSeverity.Low,
    },
    {
      original: "very long sentence",
      position: {
        start_index: 30,
      },
      subcategory: "length",
      category: IssueCategory.Terminology,
      severity: IssueSeverity.Medium,
    },
    {
      original: "informal tone",
      position: {
        start_index: 40,
      },
      subcategory: "casual",
      category: IssueCategory.Tone,
      severity: IssueSeverity.Low,
    },
    {
      original: "style guide violation",
      position: {
        start_index: 50,
      },
      subcategory: "formatting",
      category: IssueCategory.Consistency,
      severity: IssueSeverity.High,
    },
    {
      original: "technical term",
      position: {
        start_index: 60,
      },
      subcategory: "jargon",
      category: IssueCategory.Terminology,
      severity: IssueSeverity.Medium,
    },
    {
      original: "another grammar issue",
      position: {
        start_index: 70,
      },
      subcategory: "punctuation",
      category: IssueCategory.Grammar,
      severity: IssueSeverity.High,
    },
  ];

  describe("categorizeIssues", () => {
    it("should categorize issues by their category", () => {
      const result = categorizeIssues(mockIssues);

      expect(result.grammar).toHaveLength(2);
      expect(result.clarity).toHaveLength(1);
      expect(result.consistency).toHaveLength(2);
      expect(result.tone).toHaveLength(1);
      expect(result.terminology).toHaveLength(2);

      // Check specific issues are in correct categories
      expect(result.grammar[0].original).toBe("grammar error");
      expect(result.grammar[1].original).toBe("another grammar issue");
      expect(result.clarity[0].original).toBe("simple word");
    });

    it("should return empty arrays for categories with no issues", () => {
      const emptyIssues: Issue[] = [];
      const result = categorizeIssues(emptyIssues);

      expect(result.grammar).toEqual([]);
      expect(result.clarity).toEqual([]);
      expect(result.consistency).toEqual([]);
      expect(result.terminology).toEqual([]);
      expect(result.tone).toEqual([]);
      expect(result.consistency).toEqual([]);
      expect(result.terminology).toEqual([]);
    });

    it("should handle issues with suggestions and preserve type safety", () => {
      const issuesWithSuggestions: IssueWithSuggestion[] = [
        {
          original: "grammar error",
          position: {
            start_index: 0,
          },
          subcategory: "spelling",
          category: IssueCategory.Grammar,
          severity: IssueSeverity.High,
          suggestion: "grammar correction",
        },
      ];

      const result = categorizeIssues(issuesWithSuggestions);

      // TypeScript should know that suggestion exists
      expect(result.grammar[0].suggestion).toBe("grammar correction");

      // Verify the return type is correctly typed
      const _test: CategorizedIssues<IssueWithSuggestion> = result;
      expect(_test.grammar[0].suggestion).toBeDefined();
    });
  });
});
