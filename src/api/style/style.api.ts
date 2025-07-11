import { getData, postData, patchData, deleteData } from '../../utils/api';
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
import type { Config, ApiConfig } from '../../utils/api.types';

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
  const filename = request.documentName || 'unknown.txt';

  // Handle string, File, and Blob types for content
  if (typeof request.content === 'string') {
    formData.append('file_upload', new Blob([request.content], { type: 'text/plain' }), filename);
  } else if (request.content instanceof File) {
    // If content is a File, use it directly
    formData.append('file_upload', request.content, filename);
  } else if (request.content instanceof Blob) {
    // If content is a Blob, use it directly
    formData.append('file_upload', request.content, filename);
  } else {
    throw new Error('Invalid content type. Expected string, File, or Blob.');
  }

  formData.append('style_guide', request.style_guide || '');
  formData.append('dialect', (request.dialect || 'american_english').toString());
  formData.append('tone', (request.tone || 'formal').toString());
  return formData;
}

// Helper function to handle style analysis submission and polling
async function submitAndPollStyleAnalysis<T extends { status: Status }>(
  endpoint: string,
  request: StyleAnalysisReq,
  config: Config,
): Promise<T> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint,
  };

  const formData = createStyleFormData(request);
  const initialResponse = await postData<StyleAnalysisSubmitResp>(apiConfig, formData);

  if (!initialResponse.workflow_id) {
    throw new Error(`No workflow_id received from initial ${endpoint} request`);
  }

  const polledResponse = await pollWorkflowForResult<T>(initialResponse.workflow_id, apiConfig);

  if (polledResponse.status === Status.Completed) {
    return polledResponse;
  }
  throw new Error(`${endpoint} failed with status: ${polledResponse.status}`);
}

// Style Guide Operations
export async function listStyleGuides(config: Config): Promise<StyleGuides> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: API_ENDPOINTS.STYLE_GUIDES,
  };
  return getData<StyleGuides>(apiConfig);
}

// Fetch a single style guide by ID
export async function getStyleGuide(styleGuideId: string, config: Config): Promise<StyleGuide> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: `${API_ENDPOINTS.STYLE_GUIDES}/${styleGuideId}`,
  };
  return getData<StyleGuide>(apiConfig);
}

// Style Check Operations
export async function submitStyleCheck(
  styleAnalysisRequest: StyleAnalysisReq,
  config: Config,
): Promise<StyleAnalysisSubmitResp> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: API_ENDPOINTS.STYLE_CHECKS,
  };
  const formData = createStyleFormData(styleAnalysisRequest);
  return postData<StyleAnalysisSubmitResp>(apiConfig, formData);
}

export async function submitStyleSuggestion(
  styleAnalysisRequest: StyleAnalysisReq,
  config: Config,
): Promise<StyleAnalysisSubmitResp> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: API_ENDPOINTS.STYLE_SUGGESTIONS,
  };
  const formData = createStyleFormData(styleAnalysisRequest);
  return postData<StyleAnalysisSubmitResp>(apiConfig, formData);
}

export async function submitStyleRewrite(
  styleAnalysisRequest: StyleAnalysisReq,
  config: Config,
): Promise<StyleAnalysisSubmitResp> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: API_ENDPOINTS.STYLE_REWRITES,
  };
  const formData = createStyleFormData(styleAnalysisRequest);
  return postData<StyleAnalysisSubmitResp>(apiConfig, formData);
}

// Convenience methods for style operations with polling
export async function styleCheck(
  styleAnalysisRequest: StyleAnalysisReq,
  config: Config,
): Promise<StyleAnalysisSuccessResp> {
  return submitAndPollStyleAnalysis<StyleAnalysisSuccessResp>(API_ENDPOINTS.STYLE_CHECKS, styleAnalysisRequest, config);
}

export async function styleSuggestions(
  styleAnalysisRequest: StyleAnalysisReq,
  config: Config,
): Promise<StyleAnalysisSuggestionResp> {
  return submitAndPollStyleAnalysis<StyleAnalysisSuggestionResp>(
    API_ENDPOINTS.STYLE_SUGGESTIONS,
    styleAnalysisRequest,
    config,
  );
}

export async function styleRewrite(
  styleAnalysisRequest: StyleAnalysisReq,
  config: Config,
): Promise<StyleAnalysisRewriteResp> {
  return submitAndPollStyleAnalysis<StyleAnalysisRewriteResp>(
    API_ENDPOINTS.STYLE_REWRITES,
    styleAnalysisRequest,
    config,
  );
}

// Create a new style guide from a File object
export async function createStyleGuide(request: CreateStyleGuideReq, config: Config): Promise<StyleGuide> {
  const { file, name } = request;

  // Validate file type - only PDF files are supported
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || fileExtension !== 'pdf') {
    throw new Error(`Unsupported file type: ${fileExtension}. Only .pdf files are supported.`);
  }

  const apiConfig: ApiConfig = {
    ...config,
    endpoint: API_ENDPOINTS.STYLE_GUIDES,
  };

  const formData = new FormData();
  formData.append('file_upload', file);
  formData.append('name', name);

  return postData<StyleGuide>(apiConfig, formData);
}

// Get style check results by workflow ID
export async function getStyleCheck(workflowId: string, config: Config): Promise<StyleAnalysisSuccessResp> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: `${API_ENDPOINTS.STYLE_CHECKS}/${workflowId}`,
  };
  return getData<StyleAnalysisSuccessResp>(apiConfig);
}

// Update a style guide by ID
export async function updateStyleGuide(
  styleGuideId: string,
  updates: StyleGuideUpdateReq,
  config: Config,
): Promise<StyleGuide> {
  const apiConfig = {
    ...config,
    endpoint: `${API_ENDPOINTS.STYLE_GUIDES}/${styleGuideId}`,
  };
  return patchData<StyleGuide>(apiConfig, JSON.stringify(updates));
}

// Delete a style guide by ID
export async function deleteStyleGuide(styleGuideId: string, config: Config): Promise<void> {
  const apiConfig = {
    ...config,
    endpoint: `${API_ENDPOINTS.STYLE_GUIDES}/${styleGuideId}`,
  };
  await deleteData<void>(apiConfig);
}
