export enum Dialect {
  AmericanEnglish = 'american_english',
  AustralianEnglish = 'australian_english',
  BritishOxford = 'british_oxford',
  CanadianEnglish = 'canadian_english',
  IndianEnglish = 'indian_english',
}

export enum Status {
  Running = 'running',
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
  Error = 'error',
}

export enum Tone {
  Academic = 'academic',
  Business = 'business',
  Casual = 'casual',
  Conversational = 'conversational',
  Formal = 'formal',
  GenZ = 'gen-z',
  Informal = 'informal',
  Technical = 'technical',
}

export interface RewriteRequest {
  content: string;
  guidanceSettings: GuidanceSettings;
}

export interface GuidanceSettings {
  dialect: Dialect;
  tone: Tone;
  styleGuide: string;
}

export interface RewriteResponseBase {
  workflow_id: string;
  status: string;
}

export interface RewriteSubmissionResponse extends RewriteResponseBase {
  status: 'submitted';
  workflow_id: string;
}

export interface RewritePollingResponse extends RewriteResponseBase {
  status: Status;
  workflow_id: string;
  error_message?: string;
}

export interface RewriteSuccessResponse extends RewriteResponseBase {
  status: Status.Completed;
  workflow_id: string;
  result: RewriteResult;
}

export interface RewriteErrorResponse extends RewriteResponseBase {
  status: Status.Failed | Status.Error;
  workflow_id: string;
  error_message: string;
}

export interface RewriteResult {
  errors: ErrorDetail[];
  final_scores: Scores;
  initial_scores: Scores;
  merged_text: string;
  original_text: string;
  results: RewriteResultItem[];
}

export interface ErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Scores {
  acrolinx_score: number | null;
  content_score: ContentScore | null;
}

export interface ContentScore {
  error: string | null;
  duration: number;
  model: string;
  parameters: ScoreParameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  analysis: ContentAnalysis;
  feedback: string;
  score: number;
  suggestions: string[];
  target_score: number | null;
}

export interface ScoreParameters {
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

export interface ContentAnalysis {
  avg_sentence_length: number;
  avg_word_length: number;
  complexity_score: number;
  readability_score: number;
  sentence_count: number;
  vocabulary_score: number;
  word_count: number;
}

export interface RewriteResultItem {
  created_at: string;
  errors: ErrorDetail[];
  initial_scores: Scores;
  final_scores: Scores;
  input_file: string;
  parameters: {
    dialect: string;
    tone: string;
    style_guide: string;
    max_words: number;
  };
  run_id: string;
  workflow_id: string;
  grammar_result: ResultItem;
  merging_result: ResultItem | null;
  parser_result: ResultItem | null;
  sentence_length_result: ResultItem;
  sentence_structure_result: ResultItem;
  simple_vocabulary_result: ResultItem;
  tone_result: ResultItem;
  style_guide_result: ResultItem;
}

export interface ResultItem {
  error: string | null;
  duration: number;
  model: string;
  parameters: ScoreParameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  text?: string;
  changes?: Change[];
}

export interface Change {
  original: string;
  modified: string;
  change_start_char_idx: number;
  category: string;
}
