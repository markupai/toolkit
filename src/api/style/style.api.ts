import { getData, postData, PLATFORM_URL, AcrolinxError, putData } from '../../utils/api';
import type {
  StyleGuides,
  StyleGuide,
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

// Fetch a single style guide by ID
export async function getStyleGuide(styleGuideId: string, apiKey: string): Promise<StyleGuide> {
  return getData<StyleGuide>(`${API_ENDPOINTS.STYLE_GUIDES}/${styleGuideId}`, apiKey);
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

// Create a new style guide from a TXT or Markdown file
export async function createStyleGuide(filePath: string, apiKey: string, name?: string): Promise<any> {
  // Read file from filesystem
  const fs = require('fs');
  const path = require('path');
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const fileContent = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const fileExtension = path.extname(filePath).toLowerCase();
  
  // Determine MIME type based on file extension
  let mimeType = 'text/plain';
  if (fileExtension === '.md' || fileExtension === '.markdown') {
    mimeType = 'text/markdown';
  } else if (fileExtension === '.txt') {
    mimeType = 'text/plain';
  } else {
    throw new Error(`Unsupported file type: ${fileExtension}. Only .txt and .md files are supported.`);
  }
  
  const formData = new FormData();
  formData.append('file_upload', new Blob([fileContent], { type: mimeType }), fileName);
  if (name) {
    formData.append('name', name);
  }
  
  // Use fetch directly because postData expects BodyInit, but we want to control headers for multipart
  const response = await fetch(`${PLATFORM_URL}${API_ENDPOINTS.STYLE_GUIDES}`, {
    method: 'POST',
    headers: {
      Authorization: apiKey
      // Note: Do NOT set Content-Type; browser/Node will set it with boundary for multipart
    },
    body: formData
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw AcrolinxError.fromResponse(response, errorData);
  }
  
  return response.json();
}

// Update a style guide by ID
export async function updateStyleGuide(styleGuideId: string, updates: { name?: string }, apiKey: string): Promise<any> {
  return putData<any>(`${API_ENDPOINTS.STYLE_GUIDES}/${styleGuideId}`, JSON.stringify(updates), apiKey);
}
