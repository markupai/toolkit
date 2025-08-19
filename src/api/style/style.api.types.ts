import type { ResponseBase } from '../../utils/api.types';

// Enums
export interface StyleAnalysisSubmitResp extends ResponseBase {
  message?: string;
}

export enum StyleOperationType {
  Check = 'check',
  Suggestions = 'suggestions',
  Rewrite = 'rewrite',
}

export enum IssueCategory {
  Grammar = 'grammar',
  SimpleVocab = 'simple_vocab',
  SentenceStructure = 'sentence_structure',
  SentenceLength = 'sentence_length',
  Tone = 'tone',
  StyleGuide = 'style_guide',
  Terminology = 'terminology',
}

/**
 * File descriptor interface for style analysis
 */
export interface FileDescriptor {
  file: File;
  mimeType?: string;
}

/**
 * Buffer descriptor interface for style analysis
 */
export interface BufferDescriptor {
  buffer: Buffer;
  mimeType?: string;
}

/**
 * Base issue type for style analysis
 */
export interface Issue {
  original: string;
  char_index: number;
  subcategory: string;
  category: IssueCategory;
}

/**
 * Issue with suggestion for style analysis
 */
export interface IssueWithSuggestion extends Issue {
  suggestion: string;
}

export interface StyleScores {
  quality: {
    score: number;
    grammar: {
      score: number;
      issues: number;
    };
    style_guide: {
      score: number;
      issues: number;
    };

    terminology: {
      score: number;
      issues: number;
    };
  };
  analysis: {
    clarity: {
      score: number;
      word_count: number;
      sentence_count: number;
      average_sentence_length: number;
      flesch_reading_ease: number;
      vocabulary_complexity: number;
      flesch_kincaid_grade: number;
      lexical_diversity: number;
      sentence_complexity: number;
    };
    tone: {
      score: number;
      informality: number;
      liveliness: number;
      informality_alignment: number;
      liveliness_alignment: number;
    };
  };
}
export interface StyleAnalysisSuccessResp extends ResponseBase {
  style_guide_id: string;
  scores: StyleScores;
  issues: Issue[];
  check_options: {
    style_guide: {
      style_guide_type: string;
      style_guide_id: string;
    };
    dialect: string;
    tone: string;
  };
  webhook_response?: {
    url: string;
    status_code: number;
  };
}

export interface StyleAnalysisSuggestionResp extends Omit<StyleAnalysisSuccessResp, 'issues'> {
  issues: IssueWithSuggestion[];
}

export interface StyleAnalysisRewriteResp extends StyleAnalysisSuggestionResp {
  rewrite: string;
  rewrite_scores: StyleScores;
}

export interface StyleAnalysisErrorResp extends ResponseBase {
  error_message: string;
}

export interface StyleAnalysisReq {
  content: string | FileDescriptor | BufferDescriptor;
  style_guide: string; // Can be style guide ID or name (e.g. 'ap', 'chicago', 'microsoft')
  dialect: string;
  tone: string;
  documentName?: string; // Optional document name for the file upload
  webhook_url?: string; // Optional webhook URL for async processing
}

export interface StyleGuide {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  status: string;
  updated_at: string;
  updated_by: string;
}

export type StyleGuides = StyleGuide[];

export interface CreateStyleGuideReq {
  file: File;
  name: string;
}

export interface StyleGuideUpdateReq {
  name: string;
}

// Batch processing types
export interface BatchOptions {
  maxConcurrent?: number;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface BatchResult<T = StyleAnalysisResponseType> {
  index: number;
  request: StyleAnalysisReq;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: T;
  error?: Error;
  workflowId?: string;
  startTime?: number;
  endTime?: number;
}

export interface BatchProgress<T = StyleAnalysisResponseType> {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  pending: number;
  results: Array<BatchResult<T>>;
  startTime: number;
  estimatedCompletionTime?: number;
}

export interface BatchResponse<T> {
  progress: BatchProgress<T>;
  promise: Promise<BatchProgress<T>>;
  cancel: () => void;
}

// Type guards for response types
export type StyleAnalysisResponseType =
  | StyleAnalysisSuccessResp
  | StyleAnalysisSuggestionResp
  | StyleAnalysisRewriteResp;

export type BatchResponseType<T> = T extends StyleAnalysisSuccessResp
  ? StyleAnalysisSuccessResp
  : T extends StyleAnalysisSuggestionResp
    ? StyleAnalysisSuggestionResp
    : T extends StyleAnalysisRewriteResp
      ? StyleAnalysisRewriteResp
      : StyleAnalysisResponseType;
