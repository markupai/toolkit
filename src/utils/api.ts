import { Status } from './api.types';
import type { ResponseBase, Config, ApiConfig } from './api.types';
import { AcrolinxError } from './errors';

export const DEFAULT_PLATFORM_URL_DEMO = 'https://demo.acrolinx.com';
export const DEFAULT_PLATFORM_URL_STAGE = 'https://app.stg.acrolinx-cloud.net';
export const DEFAULT_PLATFORM_URL_DEV = 'https://app.dev.acrolinx-cloud.net';

function getCommonHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

function getPlatformUrl(config: Config): string {
  return config.platformUrl || DEFAULT_PLATFORM_URL_DEV;
}

// Helper function to get the current platform URL for debugging
export function getCurrentPlatformUrl(config: Config): string {
  return getPlatformUrl(config);
}

// Helper function to verify platform URL is reachable
export async function verifyPlatformUrl(config: Config): Promise<{ success: boolean; url: string; error?: string }> {
  const platformUrl = getPlatformUrl(config);
  try {
    // Fix double slash issue when combining URLs
    const baseUrl = platformUrl.endsWith('/') ? platformUrl.slice(0, -1) : platformUrl;
    const fullUrl = `${baseUrl}/v1/version`;
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

export async function getData<T>(config: ApiConfig): Promise<T> {
  try {
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: getCommonHeaders(config.apiKey),
    };
    const platformUrl = getPlatformUrl(config);
    // Fix double slash issue when combining URLs
    const baseUrl = platformUrl.endsWith('/') ? platformUrl.slice(0, -1) : platformUrl;
    const endpoint = config.endpoint.startsWith('/') ? config.endpoint : `/${config.endpoint}`;
    const fullUrl = `${baseUrl}${endpoint}`;
    
    // Debug: Log the request details (can be removed in production)
    // console.error('=== SDK Request Debug ===');
    // console.error('Platform URL:', platformUrl);
    // console.error('Endpoint:', config.endpoint);
    // console.error('Full URL:', fullUrl);
    // console.error('Headers:', JSON.stringify(fetchOptions.headers, null, 2));
    // console.error('========================');
    
    const response = await fetch(fullUrl, fetchOptions);

    if (!response.ok) {
      // console.error('Request failed with status:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      throw AcrolinxError.fromResponse(response, errorData);
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    if (error instanceof AcrolinxError) {
      throw error;
    }
    console.error('Unknown HTTP error:', error);
    throw new AcrolinxError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

export async function postData<T>(config: ApiConfig, body: BodyInit): Promise<T> {
  try {
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: getCommonHeaders(config.apiKey),
      body: body,
    };
    const platformUrl = getPlatformUrl(config);
    // Fix double slash issue when combining URLs
    const baseUrl = platformUrl.endsWith('/') ? platformUrl.slice(0, -1) : platformUrl;
    const endpoint = config.endpoint.startsWith('/') ? config.endpoint : `/${config.endpoint}`;
    const fullUrl = `${baseUrl}${endpoint}`;
    const response = await fetch(fullUrl, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw AcrolinxError.fromResponse(response, errorData);
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    if (error instanceof AcrolinxError) {
      throw error;
    }
    console.error('Unknown HTTP error:', error);
    throw new AcrolinxError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

export async function putData<T>(config: ApiConfig, body: BodyInit): Promise<T> {
  try {
    const fetchOptions: RequestInit = {
      method: 'PUT',
      headers: getCommonHeaders(config.apiKey),
      body: body,
    };
    const platformUrl = getPlatformUrl(config);
    // Fix double slash issue when combining URLs
    const baseUrl = platformUrl.endsWith('/') ? platformUrl.slice(0, -1) : platformUrl;
    const endpoint = config.endpoint.startsWith('/') ? config.endpoint : `/${config.endpoint}`;
    const fullUrl = `${baseUrl}${endpoint}`;
    const response = await fetch(fullUrl, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw AcrolinxError.fromResponse(response, errorData);
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    if (error instanceof AcrolinxError) {
      throw error;
    }
    console.error('Unknown HTTP error:', error);
    throw new AcrolinxError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

export async function patchData<T>(config: ApiConfig, body: BodyInit): Promise<T> {
  try {
    const fetchOptions: RequestInit = {
      method: 'PATCH',
      headers: {
        ...getCommonHeaders(config.apiKey),
        'Content-Type': 'application/json',
      },
      body: body,
    };
    const platformUrl = getPlatformUrl(config);
    // Fix double slash issue when combining URLs
    const baseUrl = platformUrl.endsWith('/') ? platformUrl.slice(0, -1) : platformUrl;
    const endpoint = config.endpoint.startsWith('/') ? config.endpoint : `/${config.endpoint}`;
    const fullUrl = `${baseUrl}${endpoint}`;
    const response = await fetch(fullUrl, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw AcrolinxError.fromResponse(response, errorData);
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    if (error instanceof AcrolinxError) {
      throw error;
    }
    console.error('Unknown HTTP error:', error);
    throw new AcrolinxError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

export async function deleteData<T>(config: ApiConfig): Promise<T> {
  try {
    const fetchOptions: RequestInit = {
      method: 'DELETE',
      headers: getCommonHeaders(config.apiKey),
    };
    const platformUrl = getPlatformUrl(config);
    // Fix double slash issue when combining URLs
    const baseUrl = platformUrl.endsWith('/') ? platformUrl.slice(0, -1) : platformUrl;
    const endpoint = config.endpoint.startsWith('/') ? config.endpoint : `/${config.endpoint}`;
    const fullUrl = `${baseUrl}${endpoint}`;
    const response = await fetch(fullUrl, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw AcrolinxError.fromResponse(response, errorData);
    }

    // Handle 204 No Content responses (common for DELETE operations)
    if (response.status === 204) {
      console.log('DELETE operation successful (204 No Content)');
      return {} as T;
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    if (error instanceof AcrolinxError) {
      throw error;
    }
    console.error('Unknown HTTP error:', error);
    throw new AcrolinxError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
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
      // Fix double slash issue when combining URLs
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
