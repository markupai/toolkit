import { getData, postData } from '../../utils/api';
import type {
  StyleAnalysisReq,
  StyleAnalysisSubmitResp,
  StyleAnalysisSuccessResp,
  StyleAnalysisSuggestionResp,
  StyleAnalysisRewriteResp,
} from './style.api.types';
import type { Config, ApiConfig } from '../../utils/api.types';

import { createStyleFormData } from './style.api.utils';
import { submitAndPollStyleAnalysis } from './style.api.utils';

// Export utility functions for Node.js environments
export { createStyleGuideReqFromUrl, createStyleGuideReqFromPath } from './style.api.utils';

export const API_ENDPOINTS = {
  STYLE_CHECKS: '/v1/style/checks',
  STYLE_SUGGESTIONS: '/v1/style/suggestions',
  STYLE_REWRITES: '/v1/style/rewrites',
} as const;

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
