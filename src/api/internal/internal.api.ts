import { getData, postData } from '../../utils/api';
import type { Constants, FeedbackRequest } from './internal.api.types';

const API_ENDPOINTS = {
  CONSTANTS: '/internal/v1/constants',
  DEMO_FEEDBACK: '/internal/v1/demo-feedback', // TODO: Not implemented yet
} as const;

export async function getAdminConstants(apiKey: string): Promise<Constants> {
  return getData<Constants>(API_ENDPOINTS.CONSTANTS, apiKey);
}

export async function submitFeedback(feedbackRequest: FeedbackRequest, apiKey: string): Promise<void> {
  return postData(API_ENDPOINTS.DEMO_FEEDBACK, JSON.stringify(feedbackRequest), apiKey);
}
