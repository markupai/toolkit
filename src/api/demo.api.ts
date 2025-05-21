import { AnalysisRequest, AnalysisSubmissionResponse, AnalysisResult, Status } from './style';

import { makeRequest, pollWorkflowForResult } from '../utils/api';

const API_ENDPOINTS = {
  REWRITES: '/v1/rewrites/',
  CHECKS: '/v1/checks/',
} as const;

export async function submitRewrite(
  rewriteRequest: AnalysisRequest,
  apiKey: string,
): Promise<AnalysisSubmissionResponse> {
  console.log(rewriteRequest);

  const formData = new FormData();
  formData.append('file', new Blob([rewriteRequest.content], { type: 'text/plain' }));
  formData.append('dialect', rewriteRequest.guidanceSettings.dialect.toString());
  formData.append('tone', rewriteRequest.guidanceSettings.tone.toString());
  formData.append('style_guide', rewriteRequest.guidanceSettings.styleGuide);

  return makeRequest<AnalysisSubmissionResponse>(API_ENDPOINTS.REWRITES, 'POST', formData, apiKey);
}

export async function submitCheck(checkRequest: AnalysisRequest, apiKey: string): Promise<AnalysisSubmissionResponse> {
  console.log(checkRequest);

  const formData = new FormData();
  formData.append('file', new Blob([checkRequest.content], { type: 'text/plain' }));
  formData.append('dialect', checkRequest.guidanceSettings.dialect.toString());
  formData.append('tone', checkRequest.guidanceSettings.tone.toString());
  formData.append('style_guide', checkRequest.guidanceSettings.styleGuide);

  return makeRequest<AnalysisSubmissionResponse>(API_ENDPOINTS.CHECKS, 'POST', formData, apiKey);
}

export async function submitRewriteAndGetResult(
  rewriteRequest: AnalysisRequest,
  apiKey: string,
): Promise<AnalysisResult> {
  try {
    const initialResponse = await submitRewrite(rewriteRequest, apiKey);

    if (initialResponse.workflow_id) {
      const polledResponse = await pollWorkflowForResult(initialResponse.workflow_id, API_ENDPOINTS.REWRITES, apiKey);
      if (polledResponse.status === Status.Completed && polledResponse.result) {
        return polledResponse.result;
      }
      throw new Error(`Rewrite failed with status: ${polledResponse.status}`);
    }

    throw new Error('No workflow_id received from initial rewrite request');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in rewriteContentAndPoll:', error.message);
    } else {
      console.error('Unknown error in rewriteContentAndPoll:', error);
    }
    throw error;
  }
}

export async function submitCheckAndGetResult(checkRequest: AnalysisRequest, apiKey: string): Promise<AnalysisResult> {
  try {
    const initialResponse = await submitCheck(checkRequest, apiKey);

    if (initialResponse.workflow_id) {
      const polledResponse = await pollWorkflowForResult(initialResponse.workflow_id, API_ENDPOINTS.CHECKS, apiKey);
      if (polledResponse.status === Status.Completed && polledResponse.result) {
        return polledResponse.result;
      }
      throw new Error(`Check failed with status: ${polledResponse.status}`);
    }

    throw new Error('No workflow_id received from initial check request');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in checkContentAndPoll:', error.message);
    } else {
      console.error('Unknown error in checkContentAndPoll:', error);
    }
    throw error;
  }
}
