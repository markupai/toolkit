import { Status, AnalysisPollingResponse, AnalysisSuccessResponse } from '../api/style';

export const PLATFORM_URL = 'https://app.acrolinx.com';

export async function makeRequest<T>(endpoint: string, method: string, formData: FormData, apiKey: string): Promise<T> {
  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'x-api-key': apiKey,
      },
    };
    if (method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = formData;
    }
    const response = await fetch(`${PLATFORM_URL}${endpoint}`, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Unknown HTTP error:', error);
    throw error;
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
      throw new Error(`Workflow timed out after ${maxAttempts} attempts`);
    }

    try {
      const response = await fetch(`${PLATFORM_URL}${endpoint}/${workflowId}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = (await response.json()) as AnalysisPollingResponse;

      // Normalize status to match enum values
      const normalizedStatus = data.status.toLowerCase() as Status;

      if (normalizedStatus === Status.Failed) {
        throw new Error(`Workflow failed with status: ${Status.Failed}`);
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

      throw new Error(`Unexpected workflow status: ${data.status}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Polling error (attempt ${attempts + 1}/${maxAttempts}):`, error.message);
      } else {
        console.error(`Unknown polling error (attempt ${attempts + 1}/${maxAttempts}):`, error);
      }
      throw error;
    }
  };

  return poll();
}
