export interface Constants {
  dialects: string[];
  tones: string[];
  style_guides: Record<string, string>;
  colors: Record<string, { value: string; min_score: number }>;
}
