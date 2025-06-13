import { getData, postData } from '../../utils/api';
import type {
  StyleGuides,
  StyleAnalysisReq,
  StyleAnalysisSubmitResp,
  StyleAnalysisSuccessResp,
  StyleAnalysisSuggestionResp,
  StyleAnalysisRewriteResp,
} from './style.api.types';
import { Status } from '../../utils/api.types';

import { pollWorkflowForResult } from '../../utils/api';

export const API_ENDPOINTS = {
  STYLE_GUIDES: '/v1/style-guides',
  STYLE_CHECKS: '/v1/style/checks',
  STYLE_SUGGESTIONS: '/v1/style/suggestions',
  STYLE_REWRITES: '/v1/style/rewrites',
} as const;

// Helper function to create form data from style analysis request
function createStyleFormData(request: StyleAnalysisReq): FormData {
  const formData = new FormData();
  formData.append('file_upload', new Blob([request.content], { type: 'text/plain' }));
  formData.append('style_guide', request.style_guide);
  formData.append('dialect', request.dialect.toString());
  formData.append('tone', request.tone.toString());
  return formData;
}

// Helper function to handle style analysis submission and polling
async function submitAndPollStyleAnalysis<T extends { status: Status }>(
  endpoint: string,
  request: StyleAnalysisReq,
  apiKey: string,
): Promise<T> {
  const formData = createStyleFormData(request);
  const initialResponse = await postData<StyleAnalysisSubmitResp>(endpoint, formData, apiKey);

  if (!initialResponse.workflow_id) {
    throw new Error(`No workflow_id received from initial ${endpoint} request`);
  }

  const polledResponse = await pollWorkflowForResult<T>(initialResponse.workflow_id, endpoint, apiKey);

  if (polledResponse.status === Status.Completed) {
    return polledResponse;
  }
  throw new Error(`${endpoint} failed with status: ${polledResponse.status}`);
}

// Style Guide Operations
export async function listStyleGuides(apiKey: string): Promise<StyleGuides> {
  return getData<StyleGuides>(API_ENDPOINTS.STYLE_GUIDES, apiKey);
}

// Style Check Operations
export async function submitStyleCheck(
  styleAnalysisRequest: StyleAnalysisReq,
  apiKey: string,
): Promise<StyleAnalysisSubmitResp> {
  const formData = createStyleFormData(styleAnalysisRequest);
  return postData<StyleAnalysisSubmitResp>(API_ENDPOINTS.STYLE_CHECKS, formData, apiKey);
}

export async function submitStyleSuggestion(
  styleAnalysisRequest: StyleAnalysisReq,
  apiKey: string,
): Promise<StyleAnalysisSubmitResp> {
  const formData = createStyleFormData(styleAnalysisRequest);
  return postData<StyleAnalysisSubmitResp>(API_ENDPOINTS.STYLE_SUGGESTIONS, formData, apiKey);
}

export async function submitStyleRewrite(
  styleAnalysisRequest: StyleAnalysisReq,
  apiKey: string,
): Promise<StyleAnalysisSubmitResp> {
  const formData = createStyleFormData(styleAnalysisRequest);
  return postData<StyleAnalysisSubmitResp>(API_ENDPOINTS.STYLE_REWRITES, formData, apiKey);
}

// Convenience methods for style operations with polling
export async function styleCheck(
  styleAnalysisRequest: StyleAnalysisReq,
  apiKey: string,
): Promise<StyleAnalysisSuccessResp> {
  return submitAndPollStyleAnalysis<StyleAnalysisSuccessResp>(API_ENDPOINTS.STYLE_CHECKS, styleAnalysisRequest, apiKey);
}

export async function styleSuggestions(
  styleAnalysisRequest: StyleAnalysisReq,
  apiKey: string,
): Promise<StyleAnalysisSuggestionResp> {
  return submitAndPollStyleAnalysis<StyleAnalysisSuggestionResp>(
    API_ENDPOINTS.STYLE_SUGGESTIONS,
    styleAnalysisRequest,
    apiKey,
  );
}

export async function styleRewrite(
  styleAnalysisRequest: StyleAnalysisReq,
  apiKey: string,
): Promise<StyleAnalysisRewriteResp> {
  return submitAndPollStyleAnalysis<StyleAnalysisRewriteResp>(
    API_ENDPOINTS.STYLE_REWRITES,
    styleAnalysisRequest,
    apiKey,
  );
}
