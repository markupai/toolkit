import { Status, Environment, PlatformType } from './api.types';
import type { ResponseBase, Config, ApiConfig } from './api.types';
import { AcrolinxError } from './errors';

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

  // Default behavior: use development URL for tests, production URL for runtime
  const isTestEnvironment =
    typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development');
  const defaultUrl = isTestEnvironment ? DEFAULT_PLATFORM_URL_DEV : DEFAULT_PLATFORM_URL_PROD;
  return defaultUrl;
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

// Helper function to handle response processing and error handling
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw AcrolinxError.fromResponse(response, errorData);
  }

  // Handle 204 No Content responses (common for DELETE operations)
  if (response.status === 204) {
    console.log('Operation successful (204 No Content)');
    return {} as T;
  }

  const data = await response.json();
  console.log('Response data:', JSON.stringify(data, null, 2));
  return data;
}

// Helper function to create fetch options with common headers
function createFetchOptions(
  method: string,
  apiKey: string,
  body?: BodyInit,
  additionalHeaders?: HeadersInit,
): RequestInit {
  const headers: HeadersInit = {
    ...getCommonHeaders(apiKey),
    ...additionalHeaders,
  };

  return {
    method,
    headers,
    ...(body && { body }),
  };
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

// Generic HTTP request function to eliminate code duplication
async function makeRequest<T>(
  config: ApiConfig,
  method: string,
  body?: BodyInit,
  additionalHeaders?: HeadersInit,
): Promise<T> {
  try {
    const platformUrl = getPlatformUrl(config);
    const fullUrl = buildFullUrl(platformUrl, config.endpoint);
    const fetchOptions = createFetchOptions(method, config.apiKey, body, additionalHeaders);

    // Debug: Log the request details (can be removed in production)
    // console.error('=== SDK Request Debug ===');
    // console.error('Platform URL:', platformUrl);
    // console.error('Endpoint:', config.endpoint);
    // console.error('Full URL:', fullUrl);
    // console.error('Headers:', JSON.stringify(fetchOptions.headers, null, 2));
    // console.error('========================');

    const response = await fetch(fullUrl, fetchOptions);
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof AcrolinxError) {
      throw error;
    }
    console.error('Unknown HTTP error:', error);
    throw new AcrolinxError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

export async function getData<T>(config: ApiConfig): Promise<T> {
  return makeRequest<T>(config, 'GET');
}

export async function postData<T>(config: ApiConfig, body: BodyInit): Promise<T> {
  return makeRequest<T>(config, 'POST', body);
}

export async function putData<T>(config: ApiConfig, body: BodyInit): Promise<T> {
  return makeRequest<T>(config, 'PUT', body);
}

export async function patchData<T>(config: ApiConfig, body: BodyInit): Promise<T> {
  return makeRequest<T>(config, 'PATCH', body, { 'Content-Type': 'application/json' });
}

export async function deleteData<T>(config: ApiConfig): Promise<T> {
  return makeRequest<T>(config, 'DELETE');
}

export async function pollWorkflowForResult<T>(workflowId: string, config: ApiConfig): Promise<T> {
  let attempts = 0;
  const maxAttempts = 30;
  const pollInterval = 2000;

  const poll = async (): Promise<T> => {
    if (attempts >= maxAttempts) {
      throw new AcrolinxError(`Workflow timed out after ${maxAttempts} attempts`);
    }

    try {
      const platformUrl = getPlatformUrl(config);
      const baseUrl = platformUrl.endsWith('/') ? platformUrl.slice(0, -1) : platformUrl;
      const endpoint = config.endpoint.startsWith('/') ? config.endpoint : `/${config.endpoint}`;
      // Ensure there's exactly one slash between endpoint and workflowId
      const normalizedEndpoint = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
      const fullUrl = `${baseUrl}${normalizedEndpoint}${workflowId}`;

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          ...getCommonHeaders(config.apiKey),
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw AcrolinxError.fromResponse(response, errorData);
      }

      const data = (await response.json()) as ResponseBase;

      // Add workflow_id to the response for consistency
      const dataWithWorkflowId = {
        ...data,
        workflow_id: workflowId,
      };

      // Normalize status to match enum values
      const normalizedStatus = dataWithWorkflowId.status.toLowerCase() as Status;

      if (normalizedStatus === Status.Failed) {
        throw new AcrolinxError(`Workflow failed with status: ${Status.Failed}`);
      }

      if (normalizedStatus === Status.Completed) {
        return dataWithWorkflowId as T;
      }

      if (normalizedStatus === Status.Running || normalizedStatus === Status.Queued) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        return poll();
      }

      throw new AcrolinxError(`Unexpected workflow status: ${dataWithWorkflowId.status}`);
    } catch (error) {
      if (error instanceof AcrolinxError) {
        console.error(`Polling error (attempt ${attempts + 1}/${maxAttempts}):`, error.message);
        throw error;
      }
      console.error(`Unknown polling error (attempt ${attempts + 1}/${maxAttempts}):`, error);
      throw new AcrolinxError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  return poll();
}

export { AcrolinxError };
