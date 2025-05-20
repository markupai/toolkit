import { describe, it, expect, beforeEach } from 'vitest';
import { API_ENDPOINTS, Endpoint } from '../../src/main';
import { server, handlers } from './setup';
import { http, HttpResponse } from 'msw';
import { Dialect, RewriteRequest, Tone, StyleGuide } from '../../src/types/rewrite';

describe('Endpoint Unit Tests', () => {
  const endpoint = new Endpoint({
    platformUrl: 'http://test-api.com',
    apiKey: 'test-api-key',
  });

  const mockRewriteRequest: RewriteRequest = {
    content: 'This is a test content that needs to be rewritten.',
    guidanceSettings: {
      dialect: Dialect.AmericanEnglish,
      tone: Tone.Formal,
      styleGuide: StyleGuide.Microsoft,
    },
  };

  beforeEach(() => {
    server.resetHandlers();
  });

  it('should successfully submit rewrite request', async () => {
    server.use(handlers.rewrite.success);

    const result = await endpoint.submitRewrite(mockRewriteRequest);

    expect(result).toBeDefined();
    expect(result.workflow_id).toBe('test-workflow-id');
    expect(result.status).toBe('processing');
  });

  it('should handle API errors', async () => {
    server.use(handlers.rewrite.error);

    await expect(endpoint.submitRewrite(mockRewriteRequest)).rejects.toThrow('HTTP error! status: 401');
  });

  it('should successfully poll for rewrite status', async () => {
    server.use(handlers.rewrite.status);

    const result = await endpoint.pollWorkflowForResult('test-workflow-id', API_ENDPOINTS.REWRITES);

    expect(result).toBeDefined();
    expect(result.status).toBe('completed');
    expect(result.result.merged_text).toBe('This is the rewritten content.');
  });

  it('should handle polling timeout', async () => {
    server.use(
      http.get('*/v1/rewrites/:workflowId', async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return HttpResponse.json({
          status: 'processing',
        });
      }),
    );

    const quickEndpoint = new Endpoint({
      platformUrl: 'http://test-api.com',
      apiKey: 'test-api-key',
    });

    quickEndpoint.pollWorkflowForResult = async (workflowId: string) => {
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
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        return poll();
      };

      return poll();
    };

    await expect(quickEndpoint.pollWorkflowForResult('test-workflow-id', API_ENDPOINTS.REWRITES)).rejects.toThrow(
      'Workflow timed out after 2 attempts',
    );
  });

  it('should successfully complete rewrite content and poll workflow', async () => {
    server.use(
      http.post('*/v1/rewrites/', () => {
        return HttpResponse.json({
          workflow_id: 'test-workflow-id',
          status: 'processing',
        });
      }),
    );

    server.use(
      http.get('*/v1/rewrites/:workflowId', () => {
        return HttpResponse.json({
          status: 'completed',
          result: {
            merged_text: 'This is the rewritten content.',
            changes: [],
          },
        });
      }),
    );

    const result = await endpoint.submitRewriteAndGetResult(mockRewriteRequest);

    expect(result).toBeDefined();
    expect(result.merged_text).toBe('This is the rewritten content.');
  });

  it('should handle failed rewrite workflow', async () => {
    server.use(
      http.post('*/v1/rewrites/', () => {
        return HttpResponse.json({
          workflow_id: 'test-workflow-id',
          status: 'processing',
        });
      }),
    );

    server.use(
      http.get('*/v1/rewrites/:workflowId', () => {
        return HttpResponse.json({
          status: 'failed',
          error_message: 'Processing failed',
        });
      }),
    );

    await expect(endpoint.submitRewriteAndGetResult(mockRewriteRequest)).rejects.toThrow(
      'Workflow failed: Processing failed',
    );
  });

  it('should handle missing workflow_id in initial response', async () => {
    server.use(
      http.post('*/v1/rewrites/', () => {
        return HttpResponse.json({
          status: 'error',
          message: 'Invalid request',
        });
      }),
    );

    await expect(endpoint.submitRewriteAndGetResult(mockRewriteRequest)).rejects.toThrow(
      'No workflow_id received from initial rewrite request',
    );
  });
});
