import { IssueCategory, type Issue } from "../api/style/style.api.types";

/**
 * Base interface for categorized issues
 */
export interface CategorizedIssues<T extends Issue = Issue> {
  grammar: T[];
  clarity: T[];
  tone: T[];
  consistency: T[];
  terminology: T[];
}

/**
 * Categorizes issues by their category using generics for type safety
 *
 * @param issues - Array of issues to categorize
 * @returns Object with issues grouped by category
 *
 * @example
 * ```typescript
 * const issues: Issue[] = [
 *   { original: "text", char_index: 0, subcategory: "spelling", category: IssueCategory.Grammar },
 *   { original: "word", char_index: 5, subcategory: "complex", category: IssueCategory.SimpleVocab }
 * ];
 *
 * const categorized = categorizeIssues(issues);
 * console.log(categorized.grammar); // Issue[]
 * ```
 *
 * @example
 * ```typescript
 * const issuesWithSuggestions: IssueWithSuggestion[] = [
 *   { original: "text", char_index: 0, subcategory: "spelling", category: IssueCategory.Grammar, suggestion: "correction" }
 * ];
 *
 * const categorized = categorizeIssues(issuesWithSuggestions);
 * console.log(categorized.grammar[0].suggestion); // TypeScript knows this exists
 * ```
 */
export function categorizeIssues<T extends Issue>(issues: T[]): CategorizedIssues<T> {
  // Initialize empty arrays for each category
  const categorized: CategorizedIssues<T> = {
    grammar: [],
    clarity: [],
    tone: [],
    consistency: [],
    terminology: [],
  };

  // Group issues by category using a single pass through the array
  for (const issue of issues) {
    switch (issue.category) {
      case IssueCategory.Grammar:
        categorized.grammar.push(issue);
        break;
      case IssueCategory.Clarity:
        categorized.clarity.push(issue);
        break;
      case IssueCategory.Consistency:
        categorized.consistency.push(issue);
        break;
      case IssueCategory.Terminology:
        categorized.terminology.push(issue);
        break;
      case IssueCategory.Tone:
        categorized.tone.push(issue);
        break;
      default:
        // Handle any future categories that might be added
        console.warn(`Unknown issue category: ${issue.category}`);
        break;
    }
  }

  return categorized;
}
