import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { getData, postData, putData, deleteData, pollWorkflowForResult, PLATFORM_URL } from '../../../src/utils/api';
import { ResponseBase, Status } from '../../../src/utils/api.types';
import { server, handlers } from '../setup';
import { HttpResponse } from 'msw';
import { http } from 'msw';

const mockApiKey = 'test-api-key';
const mockEndpoint = '/test-endpoint';
const mockWorkflowId = 'test-workflow-id';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API Utilities Unit Tests', () => {
  describe('HTTP Method Functions', () => {
    it('should make a successful GET request', async () => {
      server.use(handlers.api.success.get);
      const result = await getData(mockEndpoint, mockApiKey);
      expect(result).toEqual({ data: 'test data' });
    });

    it('should make a successful POST request with FormData', async () => {
      server.use(handlers.api.success.post);
      const formData = new FormData();
      formData.append('test', 'value');
      const result = await postData(mockEndpoint, formData, mockApiKey);
      expect(result).toEqual({ data: 'test data' });
    });

    it('should make a successful PUT request with FormData', async () => {
      server.use(handlers.api.success.put);
      const formData = new FormData();
      formData.append('test', 'value');
      const result = await putData(mockEndpoint, formData, mockApiKey);
      expect(result).toEqual({ data: 'test data' });
    });

    it('should make a successful DELETE request', async () => {
      server.use(handlers.api.success.delete);
      const result = await deleteData(mockEndpoint, mockApiKey);
      expect(result).toEqual({ data: 'test data' });
    });

    it('should handle API errors with detail message', async () => {
      server.use(handlers.api.error.detail);
      await expect(getData('/error-detail', mockApiKey)).rejects.toThrow('API Error');
    });

    it('should handle API errors with message field', async () => {
      server.use(handlers.api.error.message);
      await expect(getData('/error-message', mockApiKey)).rejects.toThrow('API Error');
    });

    it('should handle API errors without error message', async () => {
      server.use(handlers.api.error.noMessage);
      await expect(getData('/error-nomsg', mockApiKey)).rejects.toThrow('HTTP error! status: 400');
    });

    it('should handle network errors', async () => {
      server.use(handlers.api.error.network);
      await expect(getData('/network-error', mockApiKey)).rejects.toThrow('Failed to fetch');
    });
  });

  describe('pollWorkflowForResult', () => {
    it('should return result when workflow completes successfully', async () => {
      server.use(handlers.api.workflow.completed);
      const result = await pollWorkflowForResult(mockWorkflowId, mockEndpoint, mockApiKey);
      expect(result).toEqual({
        status: Status.Completed,
        workflow_id: mockWorkflowId,
        result: {
          merged_text: 'test result',
          original_text: 'test content',
          errors: [],
          final_scores: { acrolinx_score: null, content_score: null },
          initial_scores: { acrolinx_score: null, content_score: null },
          results: [],
        },
      });
    });

    it('should handle workflow failure', async () => {
      server.use(handlers.api.workflow.failed);
      await expect(pollWorkflowForResult(mockWorkflowId, mockEndpoint, mockApiKey)).rejects.toThrow(
        'Workflow failed with status: failed',
      );
    });

    it('should retry when workflow is in progress', async () => {
      let callCount = 0;
      server.use(
        http.get(`${PLATFORM_URL}${mockEndpoint}/${mockWorkflowId}`, () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json({ status: 'running', workflow_id: mockWorkflowId });
          }
          return HttpResponse.json({
            status: 'completed',
            workflow_id: mockWorkflowId,
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
      );
      const result = await pollWorkflowForResult<ResponseBase>(mockWorkflowId, mockEndpoint, mockApiKey);
      expect(result.status).toBe(Status.Completed);
      expect(result.workflow_id).toBe(mockWorkflowId);
    });

    it.skip('should timeout after maximum retries', async () => {
      server.use(handlers.api.workflow.running);
      await expect(pollWorkflowForResult(mockWorkflowId, mockEndpoint, mockApiKey)).rejects.toThrow(
        'Workflow timed out after 30 attempts',
      );
    }, 10000);

    it('should handle API errors during polling', async () => {
      server.use(handlers.api.workflow.apiError);
      await expect(pollWorkflowForResult(mockWorkflowId, mockEndpoint, mockApiKey)).rejects.toThrow('API Error');
    });
  });
});
