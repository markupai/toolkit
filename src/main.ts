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
} from './types/rewrite';

// Re-export all types
export type {
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
};

export interface EndpointProps {
  platformUrl: string;
  apiKey: string;
}

export class Endpoint {
  constructor(private readonly props: EndpointProps) {}

  async rewriteContent(rewriteRequest: RewriteRequest): Promise<RewriteSubmissionResponse> {
    console.log(rewriteRequest);

    const formData = new FormData();

    formData.append('file', new Blob([rewriteRequest.content], { type: 'text/plain' }));
    formData.append('dialect', rewriteRequest.guidanceSettings.dialect.toString());
    formData.append('tone', rewriteRequest.guidanceSettings.tone.toString());
    formData.append('style_guide', rewriteRequest.guidanceSettings.styleGuide);

    try {
      const response = await fetch(`${this.props.platformUrl}/v1/rewrites/`, {
        method: 'POST',
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

  async pollRewriteStatus(workflowId: string): Promise<RewriteSuccessResponse> {
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

        // If status is 'in_progress' or 'pending', continue polling
        if (data.status === Status.Running || data.status === Status.Pending) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          return poll();
        }

        // If we get here, we have an unexpected status
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

  async rewriteContentAndPoll(rewriteRequest: RewriteRequest): Promise<RewriteResult> {
    try {
      // First send the rewrite request
      const initialResponse = await this.rewriteContent(rewriteRequest);

      // If the response contains a workflow_id, poll for the result
      if (initialResponse.workflow_id) {
        const polledResponse = await this.pollRewriteStatus(initialResponse.workflow_id);
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
}
