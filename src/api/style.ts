// Enums
export enum Dialect {
  AmericanEnglish = 'american_english',
  AustralianEnglish = 'australian_english',
  BritishOxford = 'british_oxford',
  CanadianEnglish = 'canadian_english',
  IndianEnglish = 'indian_english',
}

export enum Status {
  Queued = 'queued',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
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

export enum StyleGuide {
  AP = 'ap',
  Chicago = 'chicago',
  Microsoft = 'microsoft',
}

export enum ChangeCategory {
  Punctuation = 'punctuation',
  Capitalization = 'capitalization',
  GrammarAndUsage = 'grammar_and_usage',
  NumbersAndDates = 'numbers_and_dates',
  FormattingAndStructure = 'formatting_and_structure',
  Other = 'other',
}

export enum GrammarCategory {
  SvaPronoun = 'sva_pronoun',
  PunctCap = 'punct_cap',
  Spelling = 'spelling',
  Syntax = 'syntax',
  Verbs = 'verbs',
  WordUsage = 'word_usage',
  Other = 'other',
}

export enum SentenceLengthCategory {
  Capitalization = 'capitalization',
  Remove = 'remove',
  Extract = 'extract',
  Shorten = 'shorten',
  Deletion = 'deletion',
  Replace = 'replace',
  Other = 'other',
}

export enum SentenceStructureCategory {
  ComplexVerbs = 'complex_verbs',
  HiddenVerbs = 'hidden_verbs',
  Insertion = 'insertion',
  ModalVerbs = 'modal_verbs',
  Passive = 'passive',
  PhrasalVerbs = 'phrasal_verbs',
  Subjunctive = 'subjunctive',
  Other = 'other',
}

export enum SimpleVocabChangeCategory {
  Vocabulary = 'vocabulary',
  Other = 'other',
}

export enum ToneCategories {
  WordChoice = 'word_choice',
  Syntax = 'syntax',
  Punctuation = 'punctuation',
  DiscourseFeatures = 'discourse_features',
  ImplicitStyle = 'implicit_style',
  Other = 'other',
}

// Base Interfaces
export interface AnalysisRequest {
  content: string;
  guidanceSettings: GuidanceSettings;
}

export interface GuidanceSettings {
  dialect: Dialect;
  tone: Tone;
  styleGuide: StyleGuide;
}

export interface AnalysisResponseBase {
  workflow_id: string;
}

export interface AnalysisSubmissionResponse extends AnalysisResponseBase {
  message: string;
}

export interface AnalysisPollingResponse extends AnalysisResponseBase {
  status: Status;
  workflow_id: string;
  error_message?: string;
  result?: AnalysisResult;
}

export interface AnalysisSuccessResponse extends AnalysisResponseBase {
  status: Status.Completed;
  workflow_id: string;
  result: AnalysisResult;
}

export interface AnalysisErrorResponse extends AnalysisResponseBase {
  status: Status.Failed;
  workflow_id: string;
  error_message: string;
}

export interface AnalysisResult {
  errors: WorkflowError[];
  final_scores: FinalScores;
  initial_scores: InitialScores;
  merged_text: string;
  original_text: string;
  results: HeliosOneWorkflowOutput[];
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
  dialect: Dialect | null;
  tone: Tone | null;
  style_guide: StyleGuide | null;
  max_words: number | null;
}

export interface TokenUsage {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
}

// Activity Outputs
export interface AcrolinxScorerActivityOutput {
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  issues: Issue[];
  score: number;
}

export interface Issue {
  description: string;
  originalText: string;
  position: number;
  suggestedReplacements: string[];
  type: string;
}

export interface ContentScorerActivityOutput {
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  analysis: ContentAnalysis | null;
  feedback: ContentQualityFeedback | null;
  score: number;
  suggestions: ContentSuggestions[] | null;
  target_score: TargetScore | null;
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
}

export interface GrammarActivityOutput {
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  changes: GrammarChange[];
}

export interface GrammarChange {
  original: string;
  modified: string;
  change_start_char_idx: number;
  category: GrammarCategory;
}

export interface MergingActivityOutput {
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  merged_text: string;
}

export interface ParserResponse {
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  extracted_text: string;
}

export interface SentenceLengthActivityOutput {
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  text: string;
  changes: SentenceLengthChange[];
}

export interface SentenceLengthChange {
  original: string;
  modified: string;
  change_start_char_idx: number;
  category: SentenceLengthCategory;
}

export interface SentenceStructureOutput {
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  text: string;
  changes: SentenceStructureChange[];
}

export interface SentenceStructureChange {
  original: string;
  modified: string;
  change_start_char_idx: number;
  category: SentenceStructureCategory;
}

export interface SimpleVocabOutput {
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  text: string;
  changes: SimpleVocabChange[];
}

export interface SimpleVocabChange {
  original: string;
  modified: string;
  change_start_char_idx: number;
  category: SimpleVocabChangeCategory;
}

export interface ToneCheckOutput {
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  text: string;
  changes: ToneChange[];
}

export interface ToneChange {
  original: string;
  modified: string;
  change_start_char_idx: number;
  category: ToneCategories;
}

export interface StyleGuideOutput {
  error: string | null;
  duration: number;
  model: string;
  parameters: Parameters;
  provider: string;
  run_id: string;
  token_usage: TokenUsage;
  workflow_id: string;
  changes: StyleGuideChange[];
}

export interface StyleGuideChange {
  original: string;
  modified: string;
  change_start_char_idx: number;
  category: ChangeCategory;
}

// Style Guide Specific Interfaces
export interface CreateStyleGuideData {
  name: string;
  description?: string;
  rules?: Record<string, unknown>;
}

export interface StyleGuideData extends CreateStyleGuideData {
  id: string;
}

export interface StyleGuideResponse {
  style_guide: StyleGuideData;
}

export interface StyleGuideListResponse {
  style_guides: StyleGuideData[];
}

export interface StyleCheckRequest {
  file_upload: Blob;
  style_guide: StyleGuideData;
  dialect: Dialect;
  tone: Tone;
}

export interface StyleSuggestionRequest {
  file_upload: Blob;
  style_guide: StyleGuideData;
  dialect: Dialect;
  tone: Tone;
}

export interface StyleRewriteRequest {
  file_upload: Blob;
  style_guide?: StyleGuideData;
  dialect?: Dialect;
  tone?: Tone;
}
