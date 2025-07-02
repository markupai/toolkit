import { IssueCategory, type Issue, type IssueWithSuggestion } from '../api/style/style.api.types';

/**
 * Base interface for categorized issues
 */
export interface CategorizedIssues<T extends Issue = Issue> {
  grammar: T[];
  simple_vocab: T[];
  sentence_structure: T[];
  sentence_length: T[];
  tone: T[];
  style_guide: T[];
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
    simple_vocab: [],
    sentence_structure: [],
    sentence_length: [],
    tone: [],
    style_guide: [],
    terminology: [],
  };

  // Group issues by category using a single pass through the array
  for (const issue of issues) {
    switch (issue.category) {
      case IssueCategory.Grammar:
        categorized.grammar.push(issue);
        break;
      case IssueCategory.SimpleVocab:
        categorized.simple_vocab.push(issue);
        break;
      case IssueCategory.SentenceStructure:
        categorized.sentence_structure.push(issue);
        break;
      case IssueCategory.SentenceLength:
        categorized.sentence_length.push(issue);
        break;
      case IssueCategory.Tone:
        categorized.tone.push(issue);
        break;
      case IssueCategory.StyleGuide:
        categorized.style_guide.push(issue);
        break;
      case IssueCategory.Terminology:
        categorized.terminology.push(issue);
        break;
      default:
        // Handle any future categories that might be added
        console.warn(`Unknown issue category: ${issue.category}`);
        break;
    }
  }

  return categorized;
}

/**
 * Gets the count of issues for each category
 * 
 * @param issues - Array of issues to count
 * @returns Object with issue counts by category
 */
export function getIssueCounts<T extends Issue>(issues: T[]): Record<IssueCategory, number> {
  const counts = {
    [IssueCategory.Grammar]: 0,
    [IssueCategory.SimpleVocab]: 0,
    [IssueCategory.SentenceStructure]: 0,
    [IssueCategory.SentenceLength]: 0,
    [IssueCategory.Tone]: 0,
    [IssueCategory.StyleGuide]: 0,
    [IssueCategory.Terminology]: 0,
  };

  for (const issue of issues) {
    counts[issue.category]++;
  }

  return counts;
}

/**
 * Gets issues for a specific category with full type safety
 * 
 * @param issues - Array of issues to filter
 * @param category - Category to filter by
 * @returns Array of issues for the specified category
 */
export function getIssuesByCategory<T extends Issue>(issues: T[], category: IssueCategory): T[] {
  return issues.filter(issue => issue.category === category);
}

/**
 * Type guard to check if an issue has a suggestion
 * 
 * @param issue - Issue to check
 * @returns True if the issue has a suggestion
 */
export function hasSuggestion(issue: Issue): issue is IssueWithSuggestion {
  return 'suggestion' in issue;
}

/**
 * Gets only issues that have suggestions
 * 
 * @param issues - Array of issues to filter
 * @returns Array of issues with suggestions
 */
export function getIssuesWithSuggestions(issues: Issue[]): IssueWithSuggestion[] {
  return issues.filter(hasSuggestion);
}

/**
 * Gets only issues without suggestions
 * 
 * @param issues - Array of issues to filter
 * @returns Array of issues without suggestions
 */
export function getIssuesWithoutSuggestions(issues: Issue[]): Issue[] {
  return issues.filter(issue => !hasSuggestion(issue));
} 