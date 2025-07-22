import { getData, postData } from '../../utils/api';
import type {
  StyleAnalysisReq,
  StyleAnalysisSubmitResp,
  StyleAnalysisSuccessResp,
  StyleAnalysisSuggestionResp,
  StyleAnalysisRewriteResp,
  BatchOptions,
  BatchResponse,
  StyleAnalysisResponseType,
} from './style.api.types';
import type { Config, ApiConfig, StyleAnalysisPollResp } from '../../utils/api.types';

import { createStyleFormData } from './style.api.utils';
import { submitAndPollStyleAnalysis, styleBatchCheck } from './style.api.utils';

// Export utility functions for Node.js environments
export { createStyleGuideReqFromUrl, createStyleGuideReqFromPath } from './style.api.utils';

export const STYLE_API_ENDPOINTS = {
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
    endpoint: STYLE_API_ENDPOINTS.STYLE_CHECKS,
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
    endpoint: STYLE_API_ENDPOINTS.STYLE_SUGGESTIONS,
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
    endpoint: STYLE_API_ENDPOINTS.STYLE_REWRITES,
  };
  const formData = await createStyleFormData(styleAnalysisRequest);
  return postData<StyleAnalysisSubmitResp>(apiConfig, formData);
}

// Convenience methods for style operations with polling
export async function styleCheck(
  styleAnalysisRequest: StyleAnalysisReq,
  config: Config,
): Promise<StyleAnalysisSuccessResp> {
  return submitAndPollStyleAnalysis<StyleAnalysisSuccessResp>(
    STYLE_API_ENDPOINTS.STYLE_CHECKS,
    styleAnalysisRequest,
    config,
  );
}

export async function styleSuggestions(
  styleAnalysisRequest: StyleAnalysisReq,
  config: Config,
): Promise<StyleAnalysisSuggestionResp> {
  return submitAndPollStyleAnalysis<StyleAnalysisSuggestionResp>(
    STYLE_API_ENDPOINTS.STYLE_SUGGESTIONS,
    styleAnalysisRequest,
    config,
  );
}

export async function styleRewrite(
  styleAnalysisRequest: StyleAnalysisReq,
  config: Config,
): Promise<StyleAnalysisRewriteResp> {
  return submitAndPollStyleAnalysis<StyleAnalysisRewriteResp>(
    STYLE_API_ENDPOINTS.STYLE_REWRITES,
    styleAnalysisRequest,
    config,
  );
}

// Get style check results by workflow ID
export async function getStyleCheck(
  workflowId: string,
  config: Config,
): Promise<StyleAnalysisSuccessResp | StyleAnalysisPollResp> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: `${STYLE_API_ENDPOINTS.STYLE_CHECKS}/${workflowId}`,
  };
  return getData<StyleAnalysisSuccessResp | StyleAnalysisPollResp>(apiConfig);
}

// Get style suggestion results by workflow ID
/**
 * Retrieve style suggestion results for a submitted workflow.
 * @param workflowId - The workflow ID returned from submitStyleSuggestion
 * @param config - API configuration (platformUrl, apiKey)
 * @returns StyleAnalysisSuggestionResp containing suggestions and scores
 */
export async function getStyleSuggestion(
  workflowId: string,
  config: Config,
): Promise<StyleAnalysisSuggestionResp | StyleAnalysisPollResp> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: `${STYLE_API_ENDPOINTS.STYLE_SUGGESTIONS}/${workflowId}`,
  };
  return getData<StyleAnalysisSuggestionResp | StyleAnalysisPollResp>(apiConfig);
}

/**
 * Retrieve style rewrite results for a submitted workflow.
 * @param workflowId - The workflow ID returned from submitStyleRewrite
 * @param config - API configuration (platformUrl, apiKey)
 * @returns StyleAnalysisRewriteResp containing rewritten content, suggestions, and scores
 */
export async function getStyleRewrite(
  workflowId: string,
  config: Config,
): Promise<StyleAnalysisRewriteResp | StyleAnalysisPollResp> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: `${STYLE_API_ENDPOINTS.STYLE_REWRITES}/${workflowId}`,
  };
  return getData<StyleAnalysisRewriteResp | StyleAnalysisPollResp>(apiConfig);
}

// Batch processing functions
/**
 * Batch style check operation for multiple requests.
 * Processes requests in parallel with configurable concurrency limits.
 *
 * @param requests - Array of style analysis requests
 * @param config - API configuration
 * @param options - Batch processing options (maxConcurrent, retryAttempts, etc.)
 * @returns BatchResponse with progress tracking and promise
 */
export function styleBatchCheckRequests(
  requests: StyleAnalysisReq[],
  config: Config,
  options: BatchOptions = {},
): BatchResponse<StyleAnalysisSuccessResp> {
  return styleBatchCheck<StyleAnalysisSuccessResp>(requests, config, options, styleCheck);
}

/**
 * Batch style suggestions operation for multiple requests.
 * Processes requests in parallel with configurable concurrency limits.
 *
 * @param requests - Array of style analysis requests
 * @param config - API configuration
 * @param options - Batch processing options (maxConcurrent, retryAttempts, etc.)
 * @returns BatchResponse with progress tracking and promise
 */
export function styleBatchSuggestions(
  requests: StyleAnalysisReq[],
  config: Config,
  options: BatchOptions = {},
): BatchResponse<StyleAnalysisSuggestionResp> {
  return styleBatchCheck<StyleAnalysisSuggestionResp>(requests, config, options, styleSuggestions);
}

/**
 * Batch style rewrite operation for multiple requests.
 * Processes requests in parallel with configurable concurrency limits.
 *
 * @param requests - Array of style analysis requests
 * @param config - API configuration
 * @param options - Batch processing options (maxConcurrent, retryAttempts, etc.)
 * @returns BatchResponse with progress tracking and promise
 */
export function styleBatchRewrites(
  requests: StyleAnalysisReq[],
  config: Config,
  options: BatchOptions = {},
): BatchResponse<StyleAnalysisRewriteResp> {
  return styleBatchCheck<StyleAnalysisRewriteResp>(requests, config, options, styleRewrite);
}

/**
 * Generic batch style operation that automatically determines the response type.
 * Use this when you want to let TypeScript infer the return type.
 *
 * @param requests - Array of style analysis requests
 * @param config - API configuration
 * @param options - Batch processing options
 * @param operationType - Type of operation ('check', 'suggestions', 'rewrite')
 * @returns BatchResponse with appropriate response type
 */
export function styleBatchOperation<T extends StyleAnalysisResponseType>(
  requests: StyleAnalysisReq[],
  config: Config,
  options: BatchOptions = {},
  operationType: 'check' | 'suggestions' | 'rewrite',
): BatchResponse<T> {
  switch (operationType) {
    case 'check':
      return styleBatchCheckRequests(requests, config, options) as BatchResponse<T>;
    case 'suggestions':
      return styleBatchSuggestions(requests, config, options) as BatchResponse<T>;
    case 'rewrite':
      return styleBatchRewrites(requests, config, options) as BatchResponse<T>;
    default:
      throw new Error(`Invalid operation type: ${operationType}`);
  }
}
