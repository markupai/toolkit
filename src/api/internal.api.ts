import { getData, postData } from '../utils/api';

const API_ENDPOINTS = {
  CONSTANTS: '/internal/v1/constants',
  DEMO_FEEDBACK: '/internal/v1/demo-feedback',
} as const;

export interface ConstantsResponse {
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

export async function getAdminConstants(apiKey: string): Promise<ConstantsResponse> {
  return getData<ConstantsResponse>(API_ENDPOINTS.CONSTANTS, apiKey);
}

export async function submitFeedback(feedbackRequest: FeedbackRequest, apiKey: string): Promise<void> {
  return postData(API_ENDPOINTS.DEMO_FEEDBACK, JSON.stringify(feedbackRequest), apiKey);
}
