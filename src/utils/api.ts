import { Status, AnalysisPollingResponse, AnalysisSuccessResponse } from '../api/style';
import { AcrolinxError } from './errors';

// export const DEFAULT_PLATFORM_URL = 'https://app.acrolinx.com';
export const DEFAULT_PLATFORM_URL_DEMO = 'https://demo.acrolinx.com';
export let PLATFORM_URL = DEFAULT_PLATFORM_URL_DEMO;

export function setPlatformUrl(url: string) {
  PLATFORM_URL = url;
}

function getCommonHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `${apiKey}`,
  };
}

export async function getData<T>(endpoint: string, apiKey: string): Promise<T> {
  try {
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: getCommonHeaders(apiKey),
    };
    const response = await fetch(`${PLATFORM_URL}${endpoint}`, fetchOptions);

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

export async function postData<T>(endpoint: string, body: BodyInit, apiKey: string): Promise<T> {
  try {
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: getCommonHeaders(apiKey),
      body: body,
    };
    const response = await fetch(`${PLATFORM_URL}${endpoint}`, fetchOptions);

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

export async function putData<T>(endpoint: string, body: BodyInit, apiKey: string): Promise<T> {
  try {
    const fetchOptions: RequestInit = {
      method: 'PUT',
      headers: getCommonHeaders(apiKey),
      body: body,
    };
    const response = await fetch(`${PLATFORM_URL}${endpoint}`, fetchOptions);

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

export async function deleteData<T>(endpoint: string, apiKey: string): Promise<T> {
  try {
    const fetchOptions: RequestInit = {
      method: 'DELETE',
      headers: getCommonHeaders(apiKey),
    };
    const response = await fetch(`${PLATFORM_URL}${endpoint}`, fetchOptions);

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

export async function pollWorkflowForResult(
  workflowId: string,
  endpoint: string,
  apiKey: string,
): Promise<AnalysisSuccessResponse> {
  let attempts = 0;
  const maxAttempts = 30;
  const pollInterval = 2000;

  const poll = async (): Promise<AnalysisSuccessResponse> => {
    if (attempts >= maxAttempts) {
      throw new AcrolinxError(`Workflow timed out after ${maxAttempts} attempts`);
    }

    try {
      // Ensure there's exactly one slash between endpoint and workflowId
      const normalizedEndpoint = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
      const response = await fetch(`${PLATFORM_URL}${normalizedEndpoint}${workflowId}`, {
        method: 'GET',
        headers: {
          ...getCommonHeaders(apiKey),
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw AcrolinxError.fromResponse(response, errorData);
      }

      const data = (await response.json()) as AnalysisPollingResponse;

      // Normalize status to match enum values
      const normalizedStatus = data.status.toLowerCase() as Status;

      if (normalizedStatus === Status.Failed) {
        throw new AcrolinxError(`Workflow failed with status: ${Status.Failed}`);
      }

      if (normalizedStatus === Status.Completed && data.result) {
        return {
          status: Status.Completed,
          workflow_id: data.workflow_id,
          result: data.result,
        };
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
