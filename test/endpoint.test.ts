import { describe, it, expect } from 'vitest';
import { Dialect, Endpoint, RewriteRequest } from '../src/main';
import dotenv from 'dotenv';
import { RewriteResponse } from '../src/types/rewrite';

// Load environment variables from .env file
dotenv.config();

describe('Endpoint', () => {
  const endpoint = new Endpoint({
    platformUrl: 'http://localhost:8000',
    apiKey: process.env.ACROLINX_API_KEY || 'test-api-key'
  });

  const mockRewriteRequest: RewriteRequest = {
    content: 'This is a test content that needs to be rewritten.',
    guidanceSettings: {
      dialect: Dialect.AmericanEnglish,
      tone: 'formal',
      styleGuide: 'microsoft'
    }
  };

  it('should successfully rewrite content', async () => {
    // Note: This test requires the local server to be running
    const result = await endpoint.rewriteContent(mockRewriteRequest);
    
    // Basic assertions to verify the response structure
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('should handle API errors gracefully', async () => {
    // Test with invalid API key
    const invalidEndpoint = new Endpoint({
      platformUrl: 'http://localhost:8000',
      apiKey: 'invalid-api-key'
    });

    await expect(invalidEndpoint.rewriteContent(mockRewriteRequest))
      .rejects
      .toThrow();
  });

  it('should handle network errors', async () => {
    // Test with invalid URL
    const invalidEndpoint = new Endpoint({
      platformUrl: 'http://invalid-url:8000',
      apiKey: process.env.ACROLINX_API_KEY || 'test-api-key'
    });

    await expect(invalidEndpoint.rewriteContent(mockRewriteRequest))
      .rejects
      .toThrow();
  });

  it('should submit rewrite request and poll for result', async () => {
    // Submit the rewrite request
    const initialResponse = await endpoint.rewriteContent(mockRewriteRequest);
    
    // Verify initial response
    expect(initialResponse).toBeDefined();
    expect(initialResponse.workflow_id).toBeDefined();
    expect(typeof initialResponse.workflow_id).toBe('string');

    console.log('\nInitial Response:', JSON.stringify(initialResponse, null, 2));

    // Poll for the result
    const finalResponse = await endpoint.pollRewriteStatus(initialResponse.workflow_id);
    
    // Verify final response
    expect(finalResponse).toBeDefined();
    expect(finalResponse.status).toBe('completed');
    expect(finalResponse.result).toBeDefined();
    expect(finalResponse.result?.merged_text).toBeDefined();
    expect(typeof finalResponse.result?.merged_text).toBe('string');

    console.log('\nFinal Response:', JSON.stringify(finalResponse, null, 2));
    console.log('\nRewritten Text:', finalResponse.result?.merged_text);
  }, 30000); // 30 second timeout

  it('should handle polling timeout', async () => {
    // Submit the rewrite request
    const initialResponse = await endpoint.rewriteContent(mockRewriteRequest);
    
    // Create a new endpoint with a very short polling interval and max attempts
    const quickEndpoint = new Endpoint({
      platformUrl: 'http://localhost:8000',
      apiKey: process.env.ACROLINX_API_KEY || 'test-api-key'
    });

    // Override the polling parameters for testing
    quickEndpoint.pollRewriteStatus = async (workflowId: string) => {
      let attempts = 0;
      const maxAttempts = 2; // Very few attempts
      const pollInterval = 100; // Very short interval

      const poll = async (): Promise<RewriteResponse> => {
        if (attempts >= maxAttempts) {
          throw new Error(`Workflow timed out after ${maxAttempts} attempts`);
        }

        const response = await fetch(`${quickEndpoint['props'].platformUrl}/v1/rewrites/${workflowId}`, {
          method: 'GET',
          headers: {
            'x-api-key': quickEndpoint['props'].apiKey,
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

        if (data.status === 'completed' && data.result?.merged_text) {
          return data;
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        return poll();
      };

      return poll();
    };

    // Expect the polling to timeout
    await expect(quickEndpoint.pollRewriteStatus(initialResponse.workflow_id))
      .rejects
      .toThrow('Workflow timed out after 2 attempts');
  }, 30000); // 30 second timeout
}); 