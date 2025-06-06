import {
  StyleGuideList,
  StyleCheckRequest as StyleAnalysisRequest,
  AnalysisSubmissionResponse,
  AnalysisSuccessResponse,
  AnalysisSuccessResponseWithSuggestion,
  AnalysisSuccessResponseWithRewrite,
} from './style.api.types';
import { Status } from '../../utils/api.types';

import { getData, postData, pollWorkflowForResult } from '../../utils/api';

const API_ENDPOINTS = {
  STYLE_GUIDES: '/v1/style-guides',
  STYLE_CHECKS: '/v1/style/checks',
  STYLE_SUGGESTIONS: '/v1/style/suggestions',
  STYLE_REWRITES: '/v1/style/rewrites',
} as const;

// Style Guide Operations
export async function listStyleGuides(apiKey: string): Promise<StyleGuideList> {
  return getData<StyleGuideList>(API_ENDPOINTS.STYLE_GUIDES, apiKey);
}

// Style Check Operations
export async function submitStyleCheck(
  checkRequest: StyleAnalysisRequest,
  apiKey: string,
): Promise<AnalysisSubmissionResponse> {
  const formData = new FormData();
  formData.append('file_upload', checkRequest.file_upload);
  formData.append('style_guide', checkRequest.style_guide);
  formData.append('dialect', checkRequest.dialect.toString());
  formData.append('tone', checkRequest.tone.toString());

  return postData<AnalysisSubmissionResponse>(API_ENDPOINTS.STYLE_CHECKS, formData, apiKey);
}

export async function submitStyleSuggestion(
  suggestionRequest: StyleAnalysisRequest,
  apiKey: string,
): Promise<AnalysisSubmissionResponse> {
  const formData = new FormData();
  formData.append('file_upload', suggestionRequest.file_upload);
  formData.append('style_guide', suggestionRequest.style_guide);
  formData.append('dialect', suggestionRequest.dialect.toString());
  formData.append('tone', suggestionRequest.tone.toString());

  return postData<AnalysisSubmissionResponse>(API_ENDPOINTS.STYLE_SUGGESTIONS, formData, apiKey);
}

export async function submitStyleRewrite(
  rewriteRequest: StyleAnalysisRequest,
  apiKey: string,
): Promise<AnalysisSubmissionResponse> {
  const formData = new FormData();
  formData.append('file_upload', rewriteRequest.file_upload);
  if (rewriteRequest.style_guide) {
    formData.append('style_guide', rewriteRequest.style_guide);
  }
  if (rewriteRequest.dialect) {
    formData.append('dialect', rewriteRequest.dialect.toString());
  }
  if (rewriteRequest.tone) {
    formData.append('tone', rewriteRequest.tone.toString());
  }

  return postData<AnalysisSubmissionResponse>(API_ENDPOINTS.STYLE_REWRITES, formData, apiKey);
}

// Convenience methods for style operations with polling
export async function styleCheck(checkRequest: StyleAnalysisRequest, apiKey: string): Promise<AnalysisSuccessResponse> {
  const initialResponse = await submitStyleCheck(checkRequest, apiKey);
  if (initialResponse.workflow_id) {
    const polledResponse = await pollWorkflowForResult<AnalysisSuccessResponse>(
      initialResponse.workflow_id,
      API_ENDPOINTS.STYLE_CHECKS,
      apiKey,
    );
    if (polledResponse.status === Status.Completed) {
      return polledResponse;
    }
    throw new Error(`Style check failed with status: ${polledResponse.status}`);
  }
  throw new Error('No workflow_id received from initial style check request');
}

export async function styleSuggestions(
  suggestionRequest: StyleAnalysisRequest,
  apiKey: string,
): Promise<AnalysisSuccessResponseWithSuggestion> {
  const initialResponse = await submitStyleSuggestion(suggestionRequest, apiKey);
  if (initialResponse.workflow_id) {
    const polledResponse = await pollWorkflowForResult<AnalysisSuccessResponseWithSuggestion>(
      initialResponse.workflow_id,
      API_ENDPOINTS.STYLE_SUGGESTIONS,
      apiKey,
    );
    if (polledResponse.status === Status.Completed) {
      return polledResponse;
    }
    throw new Error(`Style suggestion failed with status: ${polledResponse.status}`);
  }
  throw new Error('No workflow_id received from initial style suggestion request');
}

export async function styleRewrite(
  rewriteRequest: StyleAnalysisRequest,
  apiKey: string,
): Promise<AnalysisSuccessResponseWithRewrite> {
  const initialResponse = await submitStyleRewrite(rewriteRequest, apiKey);
  if (initialResponse.workflow_id) {
    const polledResponse = await pollWorkflowForResult<AnalysisSuccessResponseWithRewrite>(
      initialResponse.workflow_id,
      API_ENDPOINTS.STYLE_REWRITES,
      apiKey,
    );
    if (polledResponse.status === Status.Completed) {
      return polledResponse;
    }
    throw new Error(`Style rewrite failed with status: ${polledResponse.status}`);
  }
  throw new Error('No workflow_id received from initial style rewrite request');
}
