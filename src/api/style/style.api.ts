import { getData, postData, putData, deleteData } from '../../utils/api';
import type {
  StyleGuides,
  StyleGuide,
  StyleAnalysisReq,
  StyleAnalysisSubmitResp,
  StyleAnalysisSuccessResp,
  StyleAnalysisSuggestionResp,
  StyleAnalysisRewriteResp,
  CreateStyleGuideReq,
  StyleGuideUpdateReq,
} from './style.api.types';
import { Status } from '../../utils/api.types';
import type { ApiConfig } from '../../utils/api.types';

import { pollWorkflowForResult } from '../../utils/api';

// Export utility functions for Node.js environments
export { createStyleGuideReqFromUrl, createStyleGuideReqFromPath } from './style.api.utils';

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
  formData.append('style_guide', request.style_guide || '');
  formData.append('dialect', (request.dialect || 'american_english').toString());
  formData.append('tone', (request.tone || 'neutral').toString());
  return formData;
}

// Helper function to handle style analysis submission and polling
async function submitAndPollStyleAnalysis<T extends { status: Status }>(
  endpoint: string,
  request: StyleAnalysisReq,
  apiKey: string,
): Promise<T> {
  const config: ApiConfig = {
    endpoint,
    apiKey,
  };

  const formData = createStyleFormData(request);
  const initialResponse = await postData<StyleAnalysisSubmitResp>(config, formData);

  if (!initialResponse.workflow_id) {
    throw new Error(`No workflow_id received from initial ${endpoint} request`);
  }

  const polledResponse = await pollWorkflowForResult<T>(initialResponse.workflow_id, config);

  if (polledResponse.status === Status.Completed) {
    return polledResponse;
  }
  throw new Error(`${endpoint} failed with status: ${polledResponse.status}`);
}

// Style Guide Operations
export async function listStyleGuides(apiKey: string): Promise<StyleGuides> {
  const config: ApiConfig = {
    endpoint: API_ENDPOINTS.STYLE_GUIDES,
    apiKey,
  };
  return getData<StyleGuides>(config);
}

// Fetch a single style guide by ID
export async function getStyleGuide(styleGuideId: string, apiKey: string): Promise<StyleGuide> {
  const config: ApiConfig = {
    endpoint: `${API_ENDPOINTS.STYLE_GUIDES}/${styleGuideId}`,
    apiKey,
  };
  return getData<StyleGuide>(config);
}

// Style Check Operations
export async function submitStyleCheck(
  styleAnalysisRequest: StyleAnalysisReq,
  apiKey: string,
): Promise<StyleAnalysisSubmitResp> {
  const config: ApiConfig = {
    endpoint: API_ENDPOINTS.STYLE_CHECKS,
    apiKey,
  };
  const formData = createStyleFormData(styleAnalysisRequest);
  return postData<StyleAnalysisSubmitResp>(config, formData);
}

export async function submitStyleSuggestion(
  styleAnalysisRequest: StyleAnalysisReq,
  apiKey: string,
): Promise<StyleAnalysisSubmitResp> {
  const config: ApiConfig = {
    endpoint: API_ENDPOINTS.STYLE_SUGGESTIONS,
    apiKey,
  };
  const formData = createStyleFormData(styleAnalysisRequest);
  return postData<StyleAnalysisSubmitResp>(config, formData);
}

export async function submitStyleRewrite(
  styleAnalysisRequest: StyleAnalysisReq,
  apiKey: string,
): Promise<StyleAnalysisSubmitResp> {
  const config: ApiConfig = {
    endpoint: API_ENDPOINTS.STYLE_REWRITES,
    apiKey,
  };
  const formData = createStyleFormData(styleAnalysisRequest);
  return postData<StyleAnalysisSubmitResp>(config, formData);
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

// Create a new style guide from a File object
export async function createStyleGuide(request: CreateStyleGuideReq, apiKey: string): Promise<StyleGuide> {
  const { file, name } = request;

  // Validate file type - only PDF files are supported
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || fileExtension !== 'pdf') {
    throw new Error(`Unsupported file type: ${fileExtension}. Only .pdf files are supported.`);
  }

  const config: ApiConfig = {
    endpoint: API_ENDPOINTS.STYLE_GUIDES,
    apiKey,
  };

  const formData = new FormData();
  formData.append('file_upload', file);
  formData.append('name', name);

  return postData<StyleGuide>(config, formData);
}

// Get style check results by workflow ID
export async function getStyleCheck(workflowId: string, apiKey: string): Promise<StyleAnalysisSuccessResp> {
  const config: ApiConfig = {
    endpoint: `${API_ENDPOINTS.STYLE_CHECKS}/${workflowId}`,
    apiKey,
  };
  return getData<StyleAnalysisSuccessResp>(config);
}

// Update a style guide by ID
export async function updateStyleGuide(
  styleGuideId: string,
  updates: StyleGuideUpdateReq,
  apiKey: string,
): Promise<StyleGuide> {
  const config: ApiConfig = {
    endpoint: `${API_ENDPOINTS.STYLE_GUIDES}/${styleGuideId}`,
    apiKey,
  };
  return putData<StyleGuide>(config, JSON.stringify(updates));
}

// Delete a style guide by ID
export async function deleteStyleGuide(styleGuideId: string, apiKey: string): Promise<void> {
  const config: ApiConfig = {
    endpoint: `${API_ENDPOINTS.STYLE_GUIDES}/${styleGuideId}`,
    apiKey,
  };
  await deleteData<void>(config);
}
