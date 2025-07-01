import { getData, postData } from '../../utils/api';
import type { Constants, FeedbackRequest } from './internal.api.types';
import type { Config, ApiConfig } from '../../utils/api.types';

const API_ENDPOINTS = {
  CONSTANTS: '/internal/v1/constants',
  DEMO_FEEDBACK: '/internal/v1/demo-feedback', // TODO: Not implemented yet
} as const;

export async function getAdminConstants(config: Config): Promise<Constants> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: API_ENDPOINTS.CONSTANTS,
  };
  return getData<Constants>(apiConfig);
}

export async function submitFeedback(feedbackRequest: FeedbackRequest, config: Config): Promise<void> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: API_ENDPOINTS.DEMO_FEEDBACK,
  };
  return postData(apiConfig, JSON.stringify(feedbackRequest));
}
