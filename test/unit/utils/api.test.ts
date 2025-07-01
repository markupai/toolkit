import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import {
  getData,
  postData,
  putData,
  deleteData,
  pollWorkflowForResult,
  PLATFORM_URL,
  setPlatformUrl,
} from '../../../src/utils/api';
import { ResponseBase, Status } from '../../../src/utils/api.types';
import type { ApiConfig } from '../../../src/utils/api.types';
import { server, handlers } from '../setup';
import { http } from 'msw';
import { HttpResponse } from 'msw';

const mockApiKey = 'test-api-key';
const mockEndpoint = '/test-endpoint';
const mockWorkflowId = 'test-workflow-id';
const mockConfig: ApiConfig = {
  endpoint: mockEndpoint,
  apiKey: mockApiKey,
};

// Store original platform URL to restore after tests
const originalPlatformUrl = PLATFORM_URL;

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  // Reset platform URL after each test
  setPlatformUrl(originalPlatformUrl);
});
afterAll(() => server.close());

describe('API Utilities Unit Tests', () => {
  describe('Platform URL Management', () => {
    it('should set platform URL correctly', () => {
      const testUrl = 'https://test.example.com/';
      setPlatformUrl(testUrl);
      expect(PLATFORM_URL).toBe('https://test.example.com');
    });

    it('should remove trailing slashes from platform URL', () => {
      const testUrl = 'https://test.example.com///';
      setPlatformUrl(testUrl);
      expect(PLATFORM_URL).toBe('https://test.example.com');
    });
  });

  describe('HTTP Method Functions', () => {
    it('should make successful GET request', async () => {
      server.use(handlers.api.success.get);
      const result = await getData(mockConfig);
      expect(result).toEqual({ data: 'test data' });
    });

    it('should make successful POST request', async () => {
      server.use(handlers.api.success.post);
      const formData = new FormData();
      formData.append('test', 'value');
      const result = await postData(mockConfig, formData);
      expect(result).toEqual({ data: 'test data' });
    });

    it('should make successful PUT request', async () => {
      server.use(handlers.api.success.put);
      const formData = new FormData();
      formData.append('test', 'value');
      const result = await putData(mockConfig, formData);
      expect(result).toEqual({ data: 'test data' });
    });

    it('should make successful DELETE request', async () => {
      server.use(handlers.api.success.delete);
      const result = await deleteData(mockConfig);
      expect(result).toEqual({ data: 'test data' });
    });

    it('should handle API errors with detail', async () => {
      server.use(
        http.get(`${PLATFORM_URL}${mockEndpoint}`, () => {
          return HttpResponse.json({ detail: 'API Error' }, { status: 400 });
        }),
      );
      await expect(getData(mockConfig)).rejects.toThrow('API Error');
    });

    it('should handle API errors with message', async () => {
      server.use(
        http.get(`${PLATFORM_URL}${mockEndpoint}`, () => {
          return HttpResponse.json({ message: 'API Error' }, { status: 400 });
        }),
      );
      await expect(getData(mockConfig)).rejects.toThrow('API Error');
    });

    it('should handle API errors without message', async () => {
      server.use(
        http.get(`${PLATFORM_URL}${mockEndpoint}`, () => {
          return HttpResponse.json({}, { status: 400 });
        }),
      );
      await expect(getData(mockConfig)).rejects.toThrow('HTTP error! status: 400');
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${PLATFORM_URL}${mockEndpoint}`, () => {
          return HttpResponse.error();
        }),
      );
      await expect(getData(mockConfig)).rejects.toThrow('Failed to fetch');
    });
  });

  describe('pollWorkflowForResult', () => {
    it('should return result when workflow completes successfully', async () => {
      server.use(handlers.api.workflow.completed);
      const result = await pollWorkflowForResult(mockWorkflowId, mockConfig);
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
      await expect(pollWorkflowForResult(mockWorkflowId, mockConfig)).rejects.toThrow(
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
      const result = await pollWorkflowForResult<ResponseBase>(mockWorkflowId, mockConfig);
      expect(result.status).toBe(Status.Completed);
      expect(result.workflow_id).toBe(mockWorkflowId);
    });

    it.skip('should timeout after maximum retries', async () => {
      server.use(handlers.api.workflow.running);
      await expect(pollWorkflowForResult(mockWorkflowId, mockConfig)).rejects.toThrow(
        'Workflow timed out after 30 attempts',
      );
    }, 10000);

    it('should handle API errors during polling', async () => {
      server.use(handlers.api.workflow.apiError);
      await expect(pollWorkflowForResult(mockWorkflowId, mockConfig)).rejects.toThrow('API Error');
    });
  });
});
