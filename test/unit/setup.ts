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
};
