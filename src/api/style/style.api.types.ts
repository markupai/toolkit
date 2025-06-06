import { ResponseBase, Status } from '../../utils/api.types';

// Enums

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

export interface AnalysisSuccessResponse {
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

export interface AnalysisSuccessResponseWithSuggestion extends Omit<AnalysisSuccessResponse, 'issues'> {
  issues: Array<{
    original: string;
    char_index: number;
    category: string;
    suggestion: string;
  }>;
}

export interface AnalysisSuccessResponseWithRewrite extends AnalysisSuccessResponseWithSuggestion {
  rewrite: string;
}

export interface AnalysisErrorResponse extends ResponseBase {
  error_message: string;
}

export interface StyleCheckRequest {
  file_upload: Blob;
  style_guide: string; // Can be style guide ID or name (e.g. 'ap', 'chicago', 'microsoft')
  dialect: string;
  tone: string;
}

export type StyleGuideList = Record<string, string>;
