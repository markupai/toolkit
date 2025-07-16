import { getData, postData } from '../../utils/api';
import type {
  StyleAnalysisReq,
  StyleAnalysisSubmitResp,
  StyleAnalysisSuccessResp,
  StyleAnalysisSuggestionResp,
  StyleAnalysisRewriteResp,
  FileDescriptor,
  BufferDescriptor,
} from './style.api.types';
import { Status } from '../../utils/api.types';
import type { Config, ApiConfig } from '../../utils/api.types';

import { pollWorkflowForResult } from '../../utils/api';

// Export utility functions for Node.js environments
export { createStyleGuideReqFromUrl, createStyleGuideReqFromPath } from './style.api.utils';

export const API_ENDPOINTS = {
  STYLE_CHECKS: '/v1/style/checks',
  STYLE_SUGGESTIONS: '/v1/style/suggestions',
  STYLE_REWRITES: '/v1/style/rewrites',
} as const;

// Helper function to get MIME type from filename
function getMimeTypeFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'txt':
      return 'text/plain';
    case 'md':
      return 'text/markdown';
    case 'html':
      return 'text/html';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc':
      return 'application/msword';
    default:
      return 'application/octet-stream';
  }
}

// Helper function to check if an object is a Buffer
function isBuffer(obj: unknown): obj is Buffer {
  // Check if Buffer is available (Node.js environment)
  if (typeof Buffer !== 'undefined') {
    return Buffer.isBuffer(obj);
  }
  return false;
}

// Helper function to create form data from style analysis request
async function createStyleFormData(request: StyleAnalysisReq): Promise<FormData> {
  const formData = new FormData();
  const filename = request.documentName || 'unknown.txt';

  // Handle string, FileDescriptor, and BufferDescriptor types for content
  if (typeof request.content === 'string') {
    formData.append('file_upload', new Blob([request.content], { type: 'text/plain' }), filename);
  } else if (typeof File !== 'undefined' && 'file' in request.content && request.content.file instanceof File) {
    // If content is a FileDescriptor, use the file with the specified mime type
    const fileDescriptor = request.content as FileDescriptor;
    formData.append('file_upload', fileDescriptor.file, filename);
  } else if ('buffer' in request.content && isBuffer(request.content.buffer)) {
    // If content is a BufferDescriptor, convert it to a Blob with the specified mime type
    const bufferDescriptor = request.content as BufferDescriptor;
    const mimeType = bufferDescriptor.mimeType || getMimeTypeFromFilename(filename);
    const blob = new Blob([bufferDescriptor.buffer], { type: mimeType });
    formData.append('file_upload', blob, filename);
  } else {
    throw new Error('Invalid content type. Expected string, FileDescriptor, or BufferDescriptor.');
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

  const formData = await createStyleFormData(request);
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

// Style Check Operations
export async function submitStyleCheck(
  styleAnalysisRequest: StyleAnalysisReq,
  config: Config,
): Promise<StyleAnalysisSubmitResp> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: API_ENDPOINTS.STYLE_CHECKS,
  };
  const formData = await createStyleFormData(styleAnalysisRequest);
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
  const formData = await createStyleFormData(styleAnalysisRequest);
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
  const formData = await createStyleFormData(styleAnalysisRequest);
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

// Get style check results by workflow ID
export async function getStyleCheck(workflowId: string, config: Config): Promise<StyleAnalysisSuccessResp> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: `${API_ENDPOINTS.STYLE_CHECKS}/${workflowId}`,
  };
  return getData<StyleAnalysisSuccessResp>(apiConfig);
}

// Get style suggestion results by workflow ID
/**
 * Retrieve style suggestion results for a submitted workflow.
 * @param workflowId - The workflow ID returned from submitStyleSuggestion
 * @param config - API configuration (platformUrl, apiKey)
 * @returns StyleAnalysisSuggestionResp containing suggestions and scores
 */
export async function getStyleSuggestion(workflowId: string, config: Config): Promise<StyleAnalysisSuggestionResp> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: `${API_ENDPOINTS.STYLE_SUGGESTIONS}/${workflowId}`,
  };
  return getData<StyleAnalysisSuggestionResp>(apiConfig);
}

/**
 * Retrieve style rewrite results for a submitted workflow.
 * @param workflowId - The workflow ID returned from submitStyleRewrite
 * @param config - API configuration (platformUrl, apiKey)
 * @returns StyleAnalysisRewriteResp containing rewritten content, suggestions, and scores
 */
export async function getStyleRewrite(workflowId: string, config: Config): Promise<StyleAnalysisRewriteResp> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: `${API_ENDPOINTS.STYLE_REWRITES}/${workflowId}`,
  };
  return getData<StyleAnalysisRewriteResp>(apiConfig);
}
