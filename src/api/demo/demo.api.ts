import type { AnalysisRequest, AnalysisSubmissionResponse, AnalysisSuccessResponse } from './demo.api.types';

import { postData, pollWorkflowForResult } from '../../utils/api';
import { Status } from '../../utils/api.types';
import type { Config } from '../../utils/api.types';

const API_ENDPOINTS = {
  REWRITES: '/v1/rewrites/',
} as const;

export async function submitRewrite(
  rewriteRequest: AnalysisRequest,
  config: Config,
): Promise<AnalysisSubmissionResponse> {
  console.log(rewriteRequest);

  const formData = new FormData();
  formData.append('file', new Blob([rewriteRequest.content], { type: 'text/plain' }));
  formData.append('dialect', rewriteRequest.guidanceSettings.dialect.toString());
  formData.append('tone', rewriteRequest.guidanceSettings.tone.toString());
  formData.append('style_guide', rewriteRequest.guidanceSettings.styleGuide);

  const apiConfig = {
    ...config,
    endpoint: API_ENDPOINTS.REWRITES,
  };

  return postData<AnalysisSubmissionResponse>(apiConfig, formData);
}

export async function rewrite(rewriteRequest: AnalysisRequest, config: Config): Promise<AnalysisSuccessResponse> {
  try {
    const apiConfig = {
      ...config,
      endpoint: API_ENDPOINTS.REWRITES,
    };

    const initialResponse = await submitRewrite(rewriteRequest, config);

    if (initialResponse.workflow_id) {
      const polledResponse = await pollWorkflowForResult<AnalysisSuccessResponse>(
        initialResponse.workflow_id,
        apiConfig,
      );
      if (polledResponse.status === Status.Completed && polledResponse.result) {
        return polledResponse;
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
