import type { ResponseBase, Status } from '../../utils/api.types';

// Enums

export interface StyleAnalysis {
  avg_sentence_length: number;
  avg_word_length: number;
  complexity_score: number;
  readability_score: number;
  sentence_count: number;
  vocabulary_score: number;
  word_count: number;
}

export interface StyleAnalysisSubmitResp extends ResponseBase {
  message?: string;
}

export interface StyleAnalysisSuccessResp {
  status: Status;
  style_guide_id: string;
  scores: {
    avg_sentence_length: number;
    avg_word_length: number;
    complexity_score: number;
    readability_score: number;
    sentence_count: number;
    vocabulary_score: number;
    word_count: number;
    overall_score: number;
  };
  issues: Array<{
    original: string;
    char_index: number;
    category: string;
  }>;
}

export interface StyleAnalysisSuggestionResp extends Omit<StyleAnalysisSuccessResp, 'issues'> {
  issues: Array<{
    original: string;
    char_index: number;
    category: string;
    suggestion: string;
  }>;
}

export interface StyleAnalysisRewriteResp extends StyleAnalysisSuggestionResp {
  rewrite: string;
}

export interface StyleAnalysisErrorResp extends ResponseBase {
  error_message: string;
}

export interface StyleAnalysisReq {
  content: string;
  style_guide: string; // Can be style guide ID or name (e.g. 'ap', 'chicago', 'microsoft')
  dialect: string;
  tone: string;
}

export type StyleGuides = Record<string, string>;
