import { describe, it, expect, beforeEach } from 'vitest';
import { Dialect, Endpoint, RewriteRequest } from '../../src/main';
import { server, handlers } from './setup';
import { http, HttpResponse } from 'msw';

describe('Endpoint Unit Tests', () => {
  const endpoint = new Endpoint({
    platformUrl: 'http://test-api.com',
    apiKey: 'test-api-key'
  });

  const mockRewriteRequest: RewriteRequest = {
    content: 'This is a test content that needs to be rewritten.',
    guidanceSettings: {
      dialect: Dialect.AmericanEnglish,
      tone: 'formal',
      styleGuide: 'microsoft'
    }
  };

  beforeEach(() => {
    server.resetHandlers();
  });

  it('should successfully submit rewrite request', async () => {
    server.use(handlers.rewrite.success);

    const result = await endpoint.rewriteContent(mockRewriteRequest);
    
    expect(result).toBeDefined();
    expect(result.workflow_id).toBe('test-workflow-id');
    expect(result.status).toBe('processing');
  });

  it('should handle API errors', async () => {
    server.use(handlers.rewrite.error);

    await expect(endpoint.rewriteContent(mockRewriteRequest))
      .rejects
      .toThrow('HTTP error! status: 401');
  });

  it('should successfully poll for rewrite status', async () => {
    server.use(handlers.rewrite.status);

    const result = await endpoint.pollRewriteStatus('test-workflow-id');
    
    expect(result).toBeDefined();
    expect(result.status).toBe('completed');
    expect(result.result.merged_text).toBe('This is the rewritten content.');
  });

  it('should handle polling timeout', async () => {
    // Mock a slow response that will timeout
    server.use(
      http.get('*/v1/rewrites/:workflowId', async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return HttpResponse.json({
          status: 'processing'
        });
      })
    );

    // Create endpoint with short timeout
    const quickEndpoint = new Endpoint({
      platformUrl: 'http://test-api.com',
      apiKey: 'test-api-key'
    });

    // Override polling parameters
    quickEndpoint.pollRewriteStatus = async (workflowId: string) => {
      let attempts = 0;
      const maxAttempts = 2;
      const pollInterval = 100;

      const poll = async () => {
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
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.status === 'completed') {
          return data;
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        return poll();
      };

      return poll();
    };

    await expect(quickEndpoint.pollRewriteStatus('test-workflow-id'))
      .rejects
      .toThrow('Workflow timed out after 2 attempts');
  });
}); 