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

export enum IssueCategory {
  Grammar = 'grammar',
  SimpleVocab = 'simple_vocab',
  SentenceStructure = 'sentence_structure',
  SentenceLength = 'sentence_length',
  Tone = 'tone',
  StyleGuide = 'style_guide',
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
    subcategory: string;
    category: IssueCategory;
  }>;
  check_options: {
    style_guide: {
      id: string;
      name: string;
    };
    dialect: string;
    tone: string;
  };
}

export interface StyleAnalysisSuggestionResp extends Omit<StyleAnalysisSuccessResp, 'issues'> {
  issues: Array<{
    original: string;
    char_index: number;
    subcategory: string;
    category: IssueCategory;
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
