import type { ResponseBase } from '../../utils/api.types';

// Enums

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

export interface AnalysisSubmissionResponse extends ResponseBase {
  message?: string;
}

export interface AnalysisSuccessResponse extends ResponseBase {
  result: AnalysisResult;
}

export interface AnalysisErrorResponse extends ResponseBase {
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
  feedback: string | null;
  score: number;
  suggestions: string[] | null;
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

export interface Suggestion {
  original: string;
  change_start_char_idx: number;
  category: string;
  suggestion: string;
}
