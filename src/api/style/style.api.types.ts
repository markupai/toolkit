import type { ResponseBase } from '../../utils/api.types';

// Enums
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
  Terminology = 'terminology',
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
  };
  clarity: {
    score: number;
    word_count: number;
    sentence_count: number;
    average_sentence_length: number;
    flesch_reading_ease: number;
    vocabulary_complexity: number;
  };
  grammar: {
    score: number;
    issues: number;
  };
  style_guide: {
    score: number;
    issues: number;
  };
  tone: {
    score: number;
    informality: number;
    liveliness: number;
  };
  terminology: {
    score: number;
    issues: number;
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
  content: string | File;
  style_guide: string; // Can be style guide ID or name (e.g. 'ap', 'chicago', 'microsoft')
  dialect: string;
  tone: string;
  documentName?: string; // Optional document name for the file upload
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
