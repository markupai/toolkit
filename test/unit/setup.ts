import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { beforeAll, afterAll, afterEach } from 'vitest';

// Create MSW server instance
export const server = setupServer();

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

// Export commonly used handlers
export const handlers = {
  rewrite: {
    success: http.post('*/v1/rewrites/', () => {
      return HttpResponse.json({
        workflow_id: 'test-workflow-id',
        message: 'Rewrite workflow started successfully.',
      });
    }),
    status: http.get('*/v1/rewrites/:workflowId', () => {
      return HttpResponse.json({
        status: 'completed',
        result: {
          merged_text: 'This is the rewritten content.',
        },
      });
    }),
    error: http.post('*/v1/rewrites/', () => {
      return HttpResponse.json({ message: 'Invalid API key' }, { status: 401 });
    }),
  },
  api: {
    success: {
      get: http.get('*/test-endpoint', () => {
        return HttpResponse.json({ data: 'test data' });
      }),
      post: http.post('*/test-endpoint', () => {
        return HttpResponse.json({ data: 'test data' });
      }),
      put: http.put('*/test-endpoint', () => {
        return HttpResponse.json({ data: 'test data' });
      }),
      delete: http.delete('*/test-endpoint', () => {
        return HttpResponse.json({ data: 'test data' });
      }),
    },
    error: {
      detail: http.get('*/error-detail', () => {
        return HttpResponse.json({ detail: 'API Error' }, { status: 400 });
      }),
      message: http.get('*/error-message', () => {
        return HttpResponse.json({ message: 'API Error' }, { status: 400 });
      }),
      noMessage: http.get('*/error-nomsg', () => {
        return HttpResponse.json({}, { status: 400 });
      }),
      network: http.get('*/network-error', () => {
        return HttpResponse.error();
      }),
    },
    workflow: {
      completed: http.get('*/test-endpoint/:workflowId', () => {
        return HttpResponse.json({
          status: 'completed',
          workflow_id: 'test-workflow-id',
          result: {
            merged_text: 'test result',
            original_text: 'test content',
            errors: [],
            final_scores: { acrolinx_score: null, content_score: null },
            initial_scores: { acrolinx_score: null, content_score: null },
            results: [],
          },
        });
      }),
      failed: http.get('*/test-endpoint/:workflowId', () => {
        return HttpResponse.json({ status: 'failed', workflow_id: 'test-workflow-id' });
      }),
      running: http.get('*/test-endpoint/:workflowId', () => {
        return HttpResponse.json({ status: 'running', workflow_id: 'test-workflow-id' });
      }),
      apiError: http.get('*/test-endpoint/:workflowId', () => {
        return HttpResponse.json({ message: 'API Error' }, { status: 400 });
      }),
    },
  },
};
