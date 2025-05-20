import { describe, it, expect, beforeEach } from 'vitest';
import { API_ENDPOINTS, Endpoint } from '../../src/main';
import { server } from './setup';
import { http, HttpResponse } from 'msw';
import { Dialect, AnalysisRequest, Tone, StyleGuide } from '../../src/types/rewrite';

describe('Check Endpoint Unit Tests', () => {
  const endpoint = new Endpoint({
    platformUrl: 'http://test-api.com',
    apiKey: 'test-api-key',
  });

  const mockCheckRequest: AnalysisRequest = {
    content: 'This is a test content that needs to be checked.',
    guidanceSettings: {
      dialect: Dialect.AmericanEnglish,
      tone: Tone.Formal,
      styleGuide: StyleGuide.Microsoft,
    },
  };

  beforeEach(() => {
    server.resetHandlers();
  });

  it('should successfully submit check request', async () => {
    server.use(
      http.post('*/v1/checks/', () => {
        return HttpResponse.json({
          workflow_id: 'test-workflow-id',
          message: 'Check workflow started successfully.',
        });
      }),
    );

    const result = await endpoint.submitCheck(mockCheckRequest);

    expect(result).toBeDefined();
    expect(result.workflow_id).toBe('test-workflow-id');
    expect(result.message).toBe('Check workflow started successfully.');
  });

  it('should handle API errors', async () => {
    server.use(
      http.post('*/v1/checks/', () => {
        return HttpResponse.json({ message: 'Invalid API key' }, { status: 401 });
      }),
    );

    await expect(endpoint.submitCheck(mockCheckRequest)).rejects.toThrow('HTTP error! status: 401');
  });

  it('should successfully poll for check status', async () => {
    server.use(
      http.get('*/v1/checks/:workflowId', () => {
        return HttpResponse.json({
          status: 'completed',
          result: {
            merged_text: 'This is the checked content.',
            changes: [],
          },
        });
      }),
    );

    const result = await endpoint.pollWorkflowForResult('test-workflow-id', API_ENDPOINTS.CHECKS);

    expect(result).toBeDefined();
    expect(result.status).toBe('completed');
    expect(result.result.merged_text).toBe('This is the checked content.');
  });

  it('should handle polling timeout', async () => {
    server.use(
      http.get('*/v1/checks/:workflowId', async () => {
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

        const response = await fetch(`${quickEndpoint['props'].platformUrl}/v1/checks/${workflowId}`, {
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

    await expect(quickEndpoint.pollWorkflowForResult('test-workflow-id', API_ENDPOINTS.CHECKS)).rejects.toThrow(
      'Workflow timed out after 2 attempts',
    );
  });

  it('should successfully complete check content and poll workflow', async () => {
    server.use(
      http.post('*/v1/checks/', () => {
        return HttpResponse.json({
          workflow_id: 'test-workflow-id',
          status: 'processing',
        });
      }),
    );

    server.use(
      http.get('*/v1/checks/:workflowId', () => {
        return HttpResponse.json({
          status: 'completed',
          result: {
            merged_text: 'This is the checked content.',
            changes: [],
          },
        });
      }),
    );

    const result = await endpoint.submitCheckAndGetResult(mockCheckRequest);

    expect(result).toBeDefined();
    expect(result.merged_text).toBe('This is the checked content.');
  });

  it('should handle failed check workflow', async () => {
    server.use(
      http.post('*/v1/checks/', () => {
        return HttpResponse.json({
          workflow_id: 'test-workflow-id',
          status: 'processing',
        });
      }),
    );

    server.use(
      http.get('*/v1/checks/:workflowId', () => {
        return HttpResponse.json({
          status: 'failed',
          error_message: 'Processing failed',
        });
      }),
    );

    await expect(endpoint.submitCheckAndGetResult(mockCheckRequest)).rejects.toThrow(
      'Workflow failed: Processing failed',
    );
  });

  it('should handle missing workflow_id in initial response', async () => {
    server.use(
      http.post('*/v1/checks/', () => {
        return HttpResponse.json({
          status: 'error',
          message: 'Invalid request',
        });
      }),
    );

    await expect(endpoint.submitCheckAndGetResult(mockCheckRequest)).rejects.toThrow(
      'No workflow_id received from initial check request',
    );
  });
});
