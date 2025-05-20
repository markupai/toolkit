import {
  RewritePollingResponse,
  RewriteRequest,
  RewriteResult,
  RewriteSubmissionResponse,
  RewriteSuccessResponse,
  Status,
  Dialect,
  Tone,
  GuidanceSettings,
  RewriteResponseBase,
  RewriteErrorResponse,
  ErrorDetail,
  Scores,
  ContentScore,
  ScoreParameters,
  TokenUsage,
  ContentAnalysis,
  RewriteResultItem,
  ResultItem,
  Change,
  StyleGuide,
} from './types/rewrite';

// Re-export all types
export { Status, Dialect, Tone };

export type {
  RewritePollingResponse,
  RewriteRequest,
  RewriteResult,
  RewriteSubmissionResponse,
  RewriteSuccessResponse,
  GuidanceSettings,
  RewriteResponseBase,
  RewriteErrorResponse,
  ErrorDetail,
  Scores,
  ContentScore,
  ScoreParameters,
  TokenUsage,
  ContentAnalysis,
  RewriteResultItem,
  ResultItem,
  Change,
  StyleGuide,
};

export interface EndpointProps {
  platformUrl: string;
  apiKey: string;
}

export class Endpoint {
  constructor(private readonly props: EndpointProps) {}

  private async makeRequest<T>(endpoint: string, method: string, formData: FormData): Promise<T> {
    try {
      const response = await fetch(`${this.props.platformUrl}${endpoint}`, {
        method,
        headers: {
          'x-api-key': this.props.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', JSON.stringify(errorData, null, 2));
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('Unknown HTTP error:', error);
      throw error;
    }
  }

  async submitRewrite(rewriteRequest: RewriteRequest): Promise<RewriteSubmissionResponse> {
    console.log(rewriteRequest);

    const formData = new FormData();
    formData.append('file', new Blob([rewriteRequest.content], { type: 'text/plain' }));
    formData.append('dialect', rewriteRequest.guidanceSettings.dialect.toString());
    formData.append('tone', rewriteRequest.guidanceSettings.tone.toString());
    formData.append('style_guide', rewriteRequest.guidanceSettings.styleGuide);

    return this.makeRequest<RewriteSubmissionResponse>('/v1/rewrites/', 'POST', formData);
  }

  async submitCheck(checkRequest: RewriteRequest): Promise<RewriteSubmissionResponse> {
    console.log(checkRequest);

    const formData = new FormData();
    formData.append('file', new Blob([checkRequest.content], { type: 'text/plain' }));
    formData.append('dialect', checkRequest.guidanceSettings.dialect.toString());
    formData.append('tone', checkRequest.guidanceSettings.tone.toString());
    formData.append('style_guide', checkRequest.guidanceSettings.styleGuide);

    return this.makeRequest<RewriteSubmissionResponse>('/v1/checks/', 'POST', formData);
  }

  async pollWorkflowForResult(workflowId: string): Promise<RewriteSuccessResponse> {
    let attempts = 0;
    const maxAttempts = 30;
    const pollInterval = 2000;

    const poll = async (): Promise<RewriteSuccessResponse> => {
      if (attempts >= maxAttempts) {
        throw new Error(`Workflow timed out after ${maxAttempts} attempts`);
      }

      try {
        const response = await fetch(`${this.props.platformUrl}/v1/rewrites/${workflowId}`, {
          method: 'GET',
          headers: {
            'x-api-key': this.props.apiKey,
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
        }

        const data = (await response.json()) as RewritePollingResponse;

        if (data.status === Status.Failed || data.status === Status.Error) {
          throw new Error(`Workflow failed: ${data.error_message}`);
        }

        if (data.status === Status.Completed) {
          return data as RewriteSuccessResponse;
        }

        if (data.status === Status.Running || data.status === Status.Pending) {
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

  async submitRewriteAndGetResult(rewriteRequest: RewriteRequest): Promise<RewriteResult> {
    try {
      const initialResponse = await this.submitRewrite(rewriteRequest);

      if (initialResponse.workflow_id) {
        const polledResponse = await this.pollWorkflowForResult(initialResponse.workflow_id);
        if (polledResponse.status === Status.Completed && polledResponse.result) {
          return polledResponse.result;
        }
        throw new Error(`Rewrite failed with status: ${polledResponse.status}`);
      }

      throw new Error('No workflow_id received from initial rewrite request');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error in rewriteContentAndPoll:', error.message);
      } else {
        console.error('Unknown error in rewriteContentAndPoll:', error);
      }
      throw error;
    }
  }

  async submitCheckAndGetResult(checkRequest: RewriteRequest): Promise<RewriteResult> {
    try {
      const initialResponse = await this.submitCheck(checkRequest);

      if (initialResponse.workflow_id) {
        const polledResponse = await this.pollWorkflowForResult(initialResponse.workflow_id);
        if (polledResponse.status === Status.Completed && polledResponse.result) {
          return polledResponse.result;
        }
        throw new Error(`Check failed with status: ${polledResponse.status}`);
      }

      throw new Error('No workflow_id received from initial check request');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error in checkContentAndPoll:', error.message);
      } else {
        console.error('Unknown error in checkContentAndPoll:', error);
      }
      throw error;
    }
  }
}
