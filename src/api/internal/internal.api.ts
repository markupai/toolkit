import { getData, postData } from '../../utils/api';
import type { Constants, FeedbackRequest } from './internal.api.types';
import type { Config, ApiConfig } from '../../utils/api.types';
import { listStyleGuides } from '../style/style.api';

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

/**
 * Validates an API token by attempting to call the listStyleGuides endpoint.
 * Returns true if the token is valid (response is ok), false otherwise.
 * @param config - The configuration object containing the API key and platform settings
 * @returns Promise<boolean> - True if token is valid, false otherwise
 */
export async function validateToken(config: Config): Promise<boolean> {
  try {
    await listStyleGuides(config);
    return true;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}
