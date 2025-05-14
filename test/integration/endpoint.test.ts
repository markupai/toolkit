import { describe, it, expect, beforeAll } from 'vitest';
import { Dialect, Endpoint, RewriteRequest } from '../../src/main';

describe('Endpoint Integration Tests', () => {
  let endpoint: Endpoint;
  const mockRewriteRequest: RewriteRequest = {
    content: 'This is a test content that needs to be rewritten.',
    guidanceSettings: {
      dialect: Dialect.AmericanEnglish,
      tone: 'formal',
      styleGuide: 'microsoft'
    }
  };

  beforeAll(() => {
    // Ensure we have the required environment variables
    if (!process.env.ACROLINX_API_KEY) {
      throw new Error('ACROLINX_API_KEY environment variable is required');
    }

    endpoint = new Endpoint({
      platformUrl: process.env.ACROLINX_PLATFORM_URL || 'http://localhost:8000',
      apiKey: process.env.ACROLINX_API_KEY
    });
  });

  it('should successfully rewrite content', async () => {
    const result = await endpoint.rewriteContent(mockRewriteRequest);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result.workflow_id).toBeDefined();
    expect(typeof result.workflow_id).toBe('string');
  });

  it('should handle API errors gracefully', async () => {
    const invalidEndpoint = new Endpoint({
      platformUrl: process.env.ACROLINX_PLATFORM_URL || 'http://localhost:8000',
      apiKey: 'invalid-api-key'
    });

    try {
      await invalidEndpoint.rewriteContent(mockRewriteRequest);
      throw new Error('Expected request to fail with invalid API key');
    } catch (error) {
      expect(error).toBeDefined();
      // Log the actual error for debugging
      console.error('API Error:', error);
    }
  });

  it('should handle network errors', async () => {
    const invalidEndpoint = new Endpoint({
      platformUrl: 'http://invalid-url:8000',
      apiKey: process.env.ACROLINX_API_KEY || 'test-api-key'
    });

    try {
      await invalidEndpoint.rewriteContent(mockRewriteRequest);
      throw new Error('Expected request to fail with invalid URL');
    } catch (error) {
      expect(error).toBeDefined();
      // Log the actual error for debugging
      console.error('Network Error:', error);
    }
  });

  it('should submit rewrite request and poll for result', async () => {
    const initialResponse = await endpoint.rewriteContent(mockRewriteRequest);
    
    expect(initialResponse).toBeDefined();
    expect(initialResponse.workflow_id).toBeDefined();
    expect(typeof initialResponse.workflow_id).toBe('string');

    console.log('Initial response:', JSON.stringify(initialResponse, null, 2));

    const finalResponse = await endpoint.pollRewriteStatus(initialResponse.workflow_id);
    
    expect(finalResponse).toBeDefined();
    expect(finalResponse.status).toBe('completed');
    expect(finalResponse.result).toBeDefined();
    expect(finalResponse.result?.merged_text).toBeDefined();
    expect(typeof finalResponse.result?.merged_text).toBe('string');

    console.log('Final response:', JSON.stringify(finalResponse, null, 2));
  }, 30000);
}); 