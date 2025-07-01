import { Status } from './api.types';
import type { ResponseBase, Config, ApiConfig } from './api.types';
import { AcrolinxError } from './errors';

export const DEFAULT_PLATFORM_URL_DEMO = 'https://demo.acrolinx.com';
export const DEFAULT_PLATFORM_URL_STAGE = 'https://app.stg.acrolinx-cloud.net';
export const DEFAULT_PLATFORM_URL_DEV = 'https://app.dev.acrolinx-cloud.net';

function getCommonHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `${apiKey}`,
  };
}

function getPlatformUrl(config: Config): string {
  return config.platformUrl || DEFAULT_PLATFORM_URL_DEV;
}

export async function getData<T>(config: ApiConfig): Promise<T> {
  try {
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: getCommonHeaders(config.apiKey),
    };
    const platformUrl = getPlatformUrl(config);
    const response = await fetch(`${platformUrl}${config.endpoint}`, fetchOptions);

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

export async function postData<T>(config: ApiConfig, body: BodyInit): Promise<T> {
  try {
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: getCommonHeaders(config.apiKey),
      body: body,
    };
    const platformUrl = getPlatformUrl(config);
    const response = await fetch(`${platformUrl}${config.endpoint}`, fetchOptions);

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
    const response = await fetch(`${platformUrl}${config.endpoint}`, fetchOptions);

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
    const response = await fetch(`${platformUrl}${config.endpoint}`, fetchOptions);

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
      // Ensure there's exactly one slash between endpoint and workflowId
      const normalizedEndpoint = config.endpoint.endsWith('/') ? config.endpoint : `${config.endpoint}/`;
      const response = await fetch(`${platformUrl}${normalizedEndpoint}${workflowId}`, {
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

      // Normalize status to match enum values
      const normalizedStatus = data.status.toLowerCase() as Status;

      if (normalizedStatus === Status.Failed) {
        throw new AcrolinxError(`Workflow failed with status: ${Status.Failed}`);
      }

      if (normalizedStatus === Status.Completed) {
        return data as T;
      }

      if (normalizedStatus === Status.Running || normalizedStatus === Status.Queued) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        return poll();
      }

      throw new AcrolinxError(`Unexpected workflow status: ${data.status}`);
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
