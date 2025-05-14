export enum Dialect {
  AmericanEnglish = 'american_english',
  AustralianEnglish = 'australian_english',
  BritishOxford = 'british_oxford',
  CanadianEnglish = 'canadian_english',
  IndianEnglish = 'indian_english',
}

import { RewriteResponse } from './types/rewrite';

export interface RewriteRequest {
  content: string;
  guidanceSettings: GuidanceSettings;
}

export interface GuidanceSettings {
  dialect: Dialect;
  tone: string;
  styleGuide: string;
}

export interface EndpointProps {
  platformUrl: string;
  apiKey: string;
}

export class Endpoint {
  constructor(private readonly props: EndpointProps) {}

  async rewriteContent(rewriteRequest: RewriteRequest): Promise<RewriteResponse> {
    console.log(rewriteRequest);

    const formData = new FormData();

    formData.append('file', new Blob([rewriteRequest.content], { type: 'text/plain' }));
    formData.append('dialect', rewriteRequest.guidanceSettings.dialect.toString());
    formData.append('tone', rewriteRequest.guidanceSettings.tone);
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

  async pollRewriteStatus(workflowId: string): Promise<RewriteResponse> {
    let attempts = 0;
    const maxAttempts = 30;
    const pollInterval = 2000;

    const poll = async (): Promise<RewriteResponse> => {
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

        const data = (await response.json()) as RewriteResponse;
        
        if (data.status === 'failed') {
          throw new Error(`Workflow failed: ${data.error_message}`);
        }

        if (data.status === 'completed' && data.result.merged_text) {
          return data;
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        return poll();
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
}
