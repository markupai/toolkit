export const defaults = {
  dialects: {
    americanEnglish: 'american_english',
    australianEnglish: 'australian_english',
    britishOxford: 'british_oxford',
    canadianEnglish: 'canadian_english',
    indianEnglish: 'indian_english',
  },
  tones: {
    academic: 'academic',
    business: 'business',
    casual: 'casual',
    conversational: 'conversational',
    formal: 'formal',
    genZ: 'gen-z',
    informal: 'informal',
    technical: 'technical',
  },
  styleGuides: {
    ap: 'ap',
    chicago: 'chicago',
    microsoft: 'microsoft',
  },
} as const;

// Enums

export enum Status {
  Queued = 'queued',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

// Base Interfaces
interface BaseChange {
  original: string;
  modified: string;
  change_start_char_idx: number;
}

export interface Analysis {
  avg_sentence_length: number;
  avg_word_length: number;
  complexity_score: number;
  readability_score: number;
  sentence_count: number;
  vocabulary_score: number;
  word_count: number;
}

interface BaseResponse {
  status: Status;
  style_guide_id: string | null;
  scores: Analysis | null;
}

// Base Interfaces
export interface AnalysisRequest {
  content: string;
  guidanceSettings: GuidanceSettings;
}

export interface GuidanceSettings {
  dialect: string;
  tone: string;
  styleGuide: string;
}

export interface AnalysisResponseBase {
  workflow_id: string;
  status: Status;
}

export interface AnalysisSubmissionResponse extends AnalysisResponseBase {
  message?: string;
}

export interface AnalysisSuccessResponse extends AnalysisResponseBase {
  result: AnalysisResult;
}

export interface AnalysisErrorResponse extends AnalysisResponseBase {
  error_message: string;
}

export interface AnalysisResult {
  errors: WorkflowError[];
  final_scores: FinalScores;
  initial_scores: InitialScores;
  merged_text: string;
  original_text: string;
  results: HeliosOneWorkflowOutput[];
  error_message?: string | null;
}

export interface WorkflowError {
  error: string;
}

export interface FinalScores {
  acrolinx_score: AcrolinxScorerActivityOutput | null;
  content_score: ContentScorerActivityOutput | null;
}

export interface InitialScores {
  acrolinx_score: AcrolinxScorerActivityOutput | null;
  content_score: ContentScorerActivityOutput | null;
}

export interface Parameters {
  dialect: string | null;
  tone: string | null;
  style_guide: string | null;
  max_words: number | null;
}

export interface TokenUsage {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
}

// Activity Outputs
export interface AcrolinxScorerActivityOutput {
  issues: Issue[];
  score: number;
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  repair_log?: RepairLog[];
}

export interface Issue {
  description: string;
  originalText: string;
  position: number;
  suggestedReplacements: string[];
  type: string;
}

export interface ContentScorerActivityOutput {
  analysis: ContentAnalysis | null;
  feedback: ContentQualityFeedback | null;
  score: number;
  suggestions: ContentSuggestions[] | null;
  target_score: TargetScore | null;
  repair_log: RepairLog[];
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
}

export interface RepairLog {
  text: string;
  context: string;
}

export interface ContentAnalysis {
  avg_sentence_length: number;
  avg_word_length: number;
  complexity_score: number;
  readability_score: number;
  sentence_count: number;
  vocabulary_score: number;
  word_count: number;
}

export type ContentQualityFeedback =
  | 'Excellent content quality! Your text is clear, readable, and well-structured.'
  | 'Good content quality. Your text is readable but has room for improvement.'
  | 'Moderate content quality. Consider revising for better readability.'
  | 'Low content quality. The text needs significant revision for better readability.';

export type ContentSuggestions =
  | 'Use shorter sentences and simpler words to improve readability.'
  | 'Your text may be too complex. Consider simplifying vocabulary and sentence structure.'
  | 'Your sentences are quite long. Consider breaking them into shorter ones.'
  | 'Your sentences are very short. Consider combining some for better flow.'
  | 'Your vocabulary diversity is low. Try using a wider range of words.'
  | 'Your text is well-balanced. Consider proofreading for minor improvements.';

export interface TargetScore {
  target_score: number | null;
  target_range: number | null;
  within_target: boolean | null;
}

export interface HeliosOneWorkflowOutput {
  created_at: string;
  errors: WorkflowError[];
  initial_scores: InitialScores;
  final_scores: FinalScores;
  input_file: string;
  parameters: Parameters;
  run_id: string;
  workflow_id: string;
  grammar_result: GrammarActivityOutput | null;
  merging_result: MergingActivityOutput | null;
  parser_result: ParserResponse | null;
  sentence_length_result: SentenceLengthActivityOutput | null;
  sentence_structure_result: SentenceStructureOutput | null;
  simple_vocabulary_result: SimpleVocabOutput | null;
  tone_result: ToneCheckOutput | null;
  style_guide_result: StyleGuideOutput | null;
  repair_log?: RepairLog[];
}

export interface GrammarActivityOutput {
  changes: GrammarChange[];
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  repair_log?: RepairLog[];
}

export interface GrammarChange extends BaseChange {
  category: string;
}

export interface MergingActivityOutput {
  merged_text: string;
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  repair_log?: RepairLog[];
}

export interface ParserResponse {
  extracted_text: string;
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  repair_log?: RepairLog[];
}

export interface SentenceLengthActivityOutput {
  text: string;
  changes: SentenceLengthChange[];
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  repair_log?: RepairLog[];
}

export interface SentenceLengthChange extends BaseChange {
  category: string;
}

export interface SentenceStructureOutput {
  text: string;
  changes: SentenceStructureChange[];
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  repair_log?: RepairLog[];
}

export interface SentenceStructureChange extends BaseChange {
  category: string;
}

export interface SimpleVocabOutput {
  text: string;
  changes: SimpleVocabChange[];
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  repair_log?: RepairLog[];
}

export interface SimpleVocabChange extends BaseChange {
  category: string;
}

export interface ToneCheckOutput {
  text: string;
  changes: ToneChange[];
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  repair_log?: RepairLog[];
}

export interface ToneChange extends BaseChange {
  category: string;
}

export interface StyleGuideOutput {
  changes: StyleGuideChange[];
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  repair_log?: RepairLog[];
}

export interface StyleGuideChange extends BaseChange {
  category: string;
}

// Style Guide Specific Interfaces
export interface CreateStyleGuideData {
  name: string;
  description?: string;
  rules?: Record<string, unknown>;
}

// The list endpoint now returns an object mapping id to name
export type StyleGuideListResponse = Record<string, string>;

// The create/get/update/delete endpoints now return an empty object
export type StyleGuideResponse = Record<string, never>;

export interface StyleCheckRequest {
  file_upload: Blob;
  style_guide: string; // Can be style guide ID or name (e.g. 'ap', 'chicago', 'microsoft')
  dialect: string;
  tone: string;
}

export interface StyleSuggestionRequest {
  file_upload: Blob;
  style_guide: string; // Can be style guide ID or name (e.g. 'ap', 'chicago', 'microsoft')
  dialect: string;
  tone: string;
}

export interface StyleRewriteRequest {
  file_upload: Blob;
  style_guide?: string; // Can be style guide ID or name (e.g. 'ap', 'chicago', 'microsoft')
  dialect?: string;
  tone?: string;
}

// Response Interfaces
export interface StyleCheckResponse extends BaseResponse {
  issues: Issue[];
}

export interface SuggestionResponse extends BaseResponse {
  issues: Suggestion[];
}

export interface RewriteResponse extends BaseResponse {
  issues: Suggestion[];
  rewrite: string | null;
}

export interface Suggestion {
  original: string;
  change_start_char_idx: number;
  category: string;
  suggestion: string;
}
