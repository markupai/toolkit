import { acrolinxError } from 'acrolinx-nextgen-api';
import {
  StyleOperationType,
  type StyleAnalysisRewriteResp,
  type StyleAnalysisSuccessResp,
  type StyleAnalysisSuggestionResp,
} from '../api/style/style.api.types';
import { initEndpoint } from '../api/style/style.api.utils';
import { Status, Environment, PlatformType } from './api.types';
import type { Config } from './api.types';
import { AcrolinxError, ErrorType } from './errors';

export const DEFAULT_PLATFORM_URL_PROD = 'https://app.acrolinx.cloud';
export const DEFAULT_PLATFORM_URL_STAGE = 'https://app.stg.acrolinx-cloud.net';
export const DEFAULT_PLATFORM_URL_DEV = 'https://app.dev.acrolinx-cloud.net';

function getCommonHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

export function getPlatformUrl(config: Config): string {
  if (config.platform) {
    if (config.platform.type === PlatformType.Environment) {
      // Handle environment enum
      switch (config.platform.value) {
        case Environment.Stage:
          return DEFAULT_PLATFORM_URL_STAGE;
        case Environment.Dev:
          return DEFAULT_PLATFORM_URL_DEV;
        case Environment.Prod:
          return DEFAULT_PLATFORM_URL_PROD;
        default:
          return DEFAULT_PLATFORM_URL_PROD; // Default to prod
      }
    } else {
      // Handle custom URL
      return config.platform.value;
    }
  }

  return DEFAULT_PLATFORM_URL_PROD;
}

// Helper function to get the current platform URL for debugging
export function getCurrentPlatformUrl(config: Config): string {
  return getPlatformUrl(config);
}

// Helper function to build the full URL with proper slash handling
function buildFullUrl(platformUrl: string, endpoint: string): string {
  const baseUrl = platformUrl.endsWith('/') ? platformUrl.slice(0, -1) : platformUrl;
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
}

// Helper function to verify platform URL is reachable
export async function verifyPlatformUrl(config: Config): Promise<{ success: boolean; url: string; error?: string }> {
  const platformUrl = getPlatformUrl(config);
  try {
    // TODO: This is a temporary fix to verify the platform URL is reachable.
    // We should use a health check endpoint instead.
    const fullUrl = buildFullUrl(platformUrl, '/v1/style-guides');
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: getCommonHeaders(config.apiKey),
    });
    return {
      success: response.ok,
      url: platformUrl,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    return {
      success: false,
      url: platformUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function pollWorkflowForResult<T>(
  workflowId: string,
  config: Config,
  styleOperation: StyleOperationType,
): Promise<T> {
  let attempts = 0;
  const maxAttempts = 30;
  const pollInterval = 2000;

  const poll = async (): Promise<T> => {
    if (attempts >= maxAttempts) {
      throw new AcrolinxError(`Workflow timed out after ${maxAttempts} attempts`, ErrorType.TIMEOUT_ERROR);
    }

    try {
      const client = initEndpoint(config);
      let response: StyleAnalysisSuccessResp | StyleAnalysisSuggestionResp | StyleAnalysisRewriteResp;

      switch (styleOperation) {
        case StyleOperationType.Check:
          response = (await client.styleChecks.getStyleCheck(workflowId)) as StyleAnalysisSuccessResp;
          break;
        case StyleOperationType.Suggestions:
          response = (await client.styleSuggestions.getStyleSuggestion(workflowId)) as StyleAnalysisSuggestionResp;
          break;
        case StyleOperationType.Rewrite:
          response = (await client.styleRewrites.getStyleRewrite(workflowId)) as StyleAnalysisRewriteResp;
          break;
      }

      // Add workflow_id to the response for consistency
      const dataWithWorkflowId = {
        ...response,
        workflow_id: workflowId,
      };

      // Normalize status to match enum values
      const normalizedStatus = dataWithWorkflowId.status.toLowerCase() as Status;

      if (normalizedStatus === Status.Failed) {
        throw new AcrolinxError(`Workflow failed with status: ${Status.Failed}`, ErrorType.WORKFLOW_FAILED);
      }

      if (normalizedStatus === Status.Completed) {
        return dataWithWorkflowId as T;
      }

      if (normalizedStatus === Status.Running || normalizedStatus === Status.Queued) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        return poll();
      }

      throw new AcrolinxError(`Unexpected workflow status: ${dataWithWorkflowId.status}`, ErrorType.UNEXPECTED_STATUS);
    } catch (error) {
      if (error instanceof acrolinxError) {
        throw AcrolinxError.fromResponse(error.statusCode || 0, error.body as Record<string, unknown>);
      }
      console.error(`Unknown polling error (attempt ${attempts + 1}/${maxAttempts}):`, error);
      throw AcrolinxError.fromError(
        error instanceof Error ? error : new Error('Unknown error occurred'),
        ErrorType.POLLING_ERROR,
      );
    }
  };

  return poll();
}
