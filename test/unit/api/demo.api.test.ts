import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { submitRewrite, rewrite } from '../../../src/api/demo/demo.api';
import { AnalysisRequest } from '../../../src/api/demo/demo.api.types';
import { DEMO_DEFAULTS } from '../../../src/api/demo/demo.api.defaults';
import { Status } from '../../../src/utils/api.types';
import { server } from '../setup';
import { apiHandlers } from '../mocks/api.handlers';

// Set up MSW server lifecycle hooks
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Demo API Unit Tests', () => {
  const mockApiKey = 'test-api-key';
  const mockWorkflowId = 'test-workflow-id';
  const mockRequest: AnalysisRequest = {
    content: 'test content',
    guidanceSettings: {
      dialect: DEMO_DEFAULTS.dialects.americanEnglish,
      tone: DEMO_DEFAULTS.tones.formal,
      styleGuide: DEMO_DEFAULTS.styleGuides.microsoft,
    },
  };

  describe('Basic Operations', () => {
    it('should submit a rewrite', async () => {
      server.use(apiHandlers.demo.rewrite.submit);

      const result = await submitRewrite(mockRequest, mockApiKey);
      expect(result).toEqual({
        status: Status.Running,
        workflow_id: mockWorkflowId,
        message: 'Rewrite workflow started successfully.',
      });
    });
  });

  describe('Operations with Polling', () => {
    it('should submit rewrite and get result', async () => {
      server.use(apiHandlers.demo.rewrite.submit, apiHandlers.demo.rewrite.poll);

      const response = await rewrite(mockRequest, mockApiKey);
      expect(response.status).toBe(Status.Completed);
      expect(response.workflow_id).toBe(mockWorkflowId);
      expect(response.result).toBeDefined();
    });

    it('should handle rewrite polling failure', async () => {
      server.use(apiHandlers.demo.rewrite.submit, apiHandlers.demo.rewrite.failed);

      await expect(rewrite(mockRequest, mockApiKey)).rejects.toThrow('Workflow failed with status: failed');
    });

    it('should handle missing workflow ID for rewrite', async () => {
      server.use(apiHandlers.demo.rewrite.emptyWorkflowId);

      await expect(rewrite(mockRequest, mockApiKey)).rejects.toThrow(
        'No workflow_id received from initial rewrite request',
      );
    });
  });
});
