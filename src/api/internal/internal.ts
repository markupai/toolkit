export interface Constants {
  dialects: string[];
  tones: string[];
  style_guides: Record<string, string>;
  colors: Record<string, { value: string; min_score: number }>;
}

export interface FeedbackRequest {
  workflow_id: string;
  run_id: string;
  helpful: boolean;
  feedback?: string;
  original?: string;
  suggestion?: string;
  category?: string;
}
