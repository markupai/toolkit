import {
  CreateStyleGuideData,
  StyleGuideResponse,
  StyleGuideListResponse,
  StyleCheckRequest,
  StyleSuggestionRequest,
  StyleRewriteRequest,
  AnalysisSubmissionResponse,
  AnalysisResult,
  Status,
} from './style';

import { getData, postData, putData, deleteData, pollWorkflowForResult } from '../utils/api';

const API_ENDPOINTS = {
  STYLE_GUIDES: '/v1/style-guides',
  STYLE_CHECKS: '/v1/style/checks',
  STYLE_SUGGESTIONS: '/v1/style/suggestions',
  STYLE_REWRITES: '/v1/style-rewrites',
} as const;

// Style Guide Operations
export async function listStyleGuides(apiKey: string): Promise<StyleGuideListResponse> {
  return getData<StyleGuideListResponse>(API_ENDPOINTS.STYLE_GUIDES, apiKey);
}

export async function createStyleGuide(styleGuide: CreateStyleGuideData, apiKey: string): Promise<StyleGuideResponse> {
  const formData = new FormData();
  formData.append('name', styleGuide.name);
  if (styleGuide.description) {
    formData.append('description', styleGuide.description);
  }
  if (styleGuide.rules) {
    formData.append('rules', JSON.stringify(styleGuide.rules));
  }
  return postData<StyleGuideResponse>(API_ENDPOINTS.STYLE_GUIDES, formData, apiKey);
}

export async function getStyleGuide(styleGuideId: string, apiKey: string): Promise<StyleGuideResponse> {
  return getData<StyleGuideResponse>(`${API_ENDPOINTS.STYLE_GUIDES}/${styleGuideId}`, apiKey);
}

export async function updateStyleGuide(
  styleGuideId: string,
  styleGuide: CreateStyleGuideData,
  apiKey: string,
): Promise<StyleGuideResponse> {
  const formData = new FormData();
  formData.append('name', styleGuide.name);
  if (styleGuide.description) {
    formData.append('description', styleGuide.description);
  }
  if (styleGuide.rules) {
    formData.append('rules', JSON.stringify(styleGuide.rules));
  }
  return putData<StyleGuideResponse>(`${API_ENDPOINTS.STYLE_GUIDES}/${styleGuideId}`, formData, apiKey);
}

export async function deleteStyleGuide(styleGuideId: string, apiKey: string): Promise<{ message: string }> {
  return deleteData<{ message: string }>(`${API_ENDPOINTS.STYLE_GUIDES}/${styleGuideId}`, apiKey);
}

// Style Check Operations
export async function submitStyleCheck(
  checkRequest: StyleCheckRequest,
  apiKey: string,
): Promise<AnalysisSubmissionResponse> {
  const formData = new FormData();
  formData.append('file_upload', checkRequest.file_upload);
  formData.append('style_guide', checkRequest.style_guide.id);
  formData.append('dialect', checkRequest.dialect.toString());
  formData.append('tone', checkRequest.tone.toString());

  return postData<AnalysisSubmissionResponse>(API_ENDPOINTS.STYLE_CHECKS, formData, apiKey);
}

export async function submitStyleSuggestion(
  suggestionRequest: StyleSuggestionRequest,
  apiKey: string,
): Promise<AnalysisSubmissionResponse> {
  const formData = new FormData();
  formData.append('file_upload', suggestionRequest.file_upload);
  formData.append('style_guide', suggestionRequest.style_guide.id);
  formData.append('dialect', suggestionRequest.dialect.toString());
  formData.append('tone', suggestionRequest.tone.toString());

  return postData<AnalysisSubmissionResponse>(API_ENDPOINTS.STYLE_SUGGESTIONS, formData, apiKey);
}

export async function submitStyleRewrite(
  rewriteRequest: StyleRewriteRequest,
  apiKey: string,
): Promise<AnalysisSubmissionResponse> {
  const formData = new FormData();
  formData.append('file_upload', rewriteRequest.file_upload);
  if (rewriteRequest.style_guide) {
    formData.append('style_guide', rewriteRequest.style_guide.id);
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
export async function styleCheck(
  checkRequest: StyleCheckRequest,
  apiKey: string,
): Promise<AnalysisResult> {
  const initialResponse = await submitStyleCheck(checkRequest, apiKey);
  if (initialResponse.workflow_id) {
    const polledResponse = await pollWorkflowForResult(initialResponse.workflow_id, API_ENDPOINTS.STYLE_CHECKS, apiKey);
    if (polledResponse.status === Status.Completed && polledResponse.result) {
      return polledResponse.result;
    }
    throw new Error(`Style check failed with status: ${polledResponse.status}`);
  }
  throw new Error('No workflow_id received from initial style check request');
}

export async function styleSuggestions(
  suggestionRequest: StyleSuggestionRequest,
  apiKey: string,
): Promise<AnalysisResult> {
  const initialResponse = await submitStyleSuggestion(suggestionRequest, apiKey);
  if (initialResponse.workflow_id) {
    const polledResponse = await pollWorkflowForResult(
      initialResponse.workflow_id,
      API_ENDPOINTS.STYLE_SUGGESTIONS,
      apiKey,
    );
    if (polledResponse.status === Status.Completed && polledResponse.result) {
      return polledResponse.result;
    }
    throw new Error(`Style suggestion failed with status: ${polledResponse.status}`);
  }
  throw new Error('No workflow_id received from initial style suggestion request');
}

export async function styleRewrite(
  rewriteRequest: StyleRewriteRequest,
  apiKey: string,
): Promise<AnalysisResult> {
  const initialResponse = await submitStyleRewrite(rewriteRequest, apiKey);
  if (initialResponse.workflow_id) {
    const polledResponse = await pollWorkflowForResult(
      initialResponse.workflow_id,
      API_ENDPOINTS.STYLE_REWRITES,
      apiKey,
    );
    if (polledResponse.status === Status.Completed && polledResponse.result) {
      return polledResponse.result;
    }
    throw new Error(`Style rewrite failed with status: ${polledResponse.status}`);
  }
  throw new Error('No workflow_id received from initial style rewrite request');
}
