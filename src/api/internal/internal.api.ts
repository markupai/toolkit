import { getData, postData } from '../../utils/api';
import type { Constants, FeedbackRequest } from './internal.api.types';
import type { ApiConfig } from '../../utils/api.types';

const API_ENDPOINTS = {
  CONSTANTS: '/internal/v1/constants',
  DEMO_FEEDBACK: '/internal/v1/demo-feedback', // TODO: Not implemented yet
} as const;

export async function getAdminConstants(apiKey: string): Promise<Constants> {
  const config: ApiConfig = {
    endpoint: API_ENDPOINTS.CONSTANTS,
    apiKey,
  };
  return getData<Constants>(config);
}

export async function submitFeedback(feedbackRequest: FeedbackRequest, apiKey: string): Promise<void> {
  const config: ApiConfig = {
    endpoint: API_ENDPOINTS.DEMO_FEEDBACK,
    apiKey,
  };
  return postData(config, JSON.stringify(feedbackRequest));
}
