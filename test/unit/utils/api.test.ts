import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import {
  getData,
  postData,
  putData,
  deleteData,
  pollWorkflowForResult,
  verifyPlatformUrl,
  getCurrentPlatformUrl,
  DEFAULT_PLATFORM_URL_DEV,
} from '../../../src/utils/api';
import { ResponseBase, Status } from '../../../src/utils/api.types';
import type { ApiConfig, Config } from '../../../src/utils/api.types';
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

const mockBaseConfig: Config = {
  apiKey: mockApiKey,
};

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => server.close());

describe('API Utilities Unit Tests', () => {
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
        http.get(`${DEFAULT_PLATFORM_URL_DEV}${mockEndpoint}`, () => {
          return HttpResponse.json({ detail: 'API Error' }, { status: 400 });
        }),
      );
      await expect(getData(mockConfig)).rejects.toThrow('API Error');
    });

    it('should handle API errors with message', async () => {
      server.use(
        http.get(`${DEFAULT_PLATFORM_URL_DEV}${mockEndpoint}`, () => {
          return HttpResponse.json({ message: 'API Error' }, { status: 400 });
        }),
      );
      await expect(getData(mockConfig)).rejects.toThrow('API Error');
    });

    it('should handle API errors without message', async () => {
      server.use(
        http.get(`${DEFAULT_PLATFORM_URL_DEV}${mockEndpoint}`, () => {
          return HttpResponse.json({}, { status: 400 });
        }),
      );
      await expect(getData(mockConfig)).rejects.toThrow('HTTP error! status: 400');
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${DEFAULT_PLATFORM_URL_DEV}${mockEndpoint}`, () => {
          return HttpResponse.error();
        }),
      );
      await expect(getData(mockConfig)).rejects.toThrow('Failed to fetch');
    });

    it('should use custom platform URL when provided', async () => {
      const customPlatformUrl = 'https://custom.example.com';
      const customConfig: ApiConfig = {
        ...mockConfig,
        platformUrl: customPlatformUrl,
      };

      server.use(
        http.get(`${customPlatformUrl}${mockEndpoint}`, () => {
          return HttpResponse.json({ data: 'custom data' });
        }),
      );

      const result = await getData(customConfig);
      expect(result).toEqual({ data: 'custom data' });
    });
  });

  describe('Platform URL Utilities', () => {
    describe('getCurrentPlatformUrl', () => {
      it('should return default platform URL when no custom URL is provided', () => {
        const result = getCurrentPlatformUrl(mockBaseConfig);
        expect(result).toBe(DEFAULT_PLATFORM_URL_DEV);
      });

      it('should return custom platform URL when provided', () => {
        const customConfig: Config = {
          ...mockBaseConfig,
          platformUrl: 'https://custom.example.com',
        };
        const result = getCurrentPlatformUrl(customConfig);
        expect(result).toBe('https://custom.example.com');
      });
    });

    describe('verifyPlatformUrl', () => {
      it('should return success when platform URL is reachable', async () => {
        server.use(
          http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides`, () => {
            return HttpResponse.json({ version: '1.0.0' }, { status: 200 });
          }),
        );

        const result = await verifyPlatformUrl(mockBaseConfig);
        expect(result).toEqual({
          success: true,
          url: DEFAULT_PLATFORM_URL_DEV,
          error: undefined,
        });
      });

      it('should return success when custom platform URL is reachable', async () => {
        const customUrl = 'https://custom.example.com';
        const customConfig: Config = {
          ...mockBaseConfig,
          platformUrl: customUrl,
        };

        server.use(
          http.get(`${customUrl}/v1/style-guides`, () => {
            return HttpResponse.json({ version: '1.0.0' }, { status: 200 });
          }),
        );

        const result = await verifyPlatformUrl(customConfig);
        expect(result).toEqual({
          success: true,
          url: customUrl,
          error: undefined,
        });
      });

      it('should handle platform URL with trailing slash', async () => {
        const urlWithSlash = 'https://example.com/';
        const customConfig: Config = {
          ...mockBaseConfig,
          platformUrl: urlWithSlash,
        };

        server.use(
          http.get('https://example.com/v1/style-guides', () => {
            return HttpResponse.json({ version: '1.0.0' }, { status: 200 });
          }),
        );

        const result = await verifyPlatformUrl(customConfig);
        expect(result).toEqual({
          success: true,
          url: urlWithSlash,
          error: undefined,
        });
      });

      it('should return error when platform URL returns non-200 status', async () => {
        server.use(
          http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides`, () => {
            return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }),
        );

        const result = await verifyPlatformUrl(mockBaseConfig);
        expect(result).toEqual({
          success: false,
          url: DEFAULT_PLATFORM_URL_DEV,
          error: 'HTTP 401: Unauthorized',
        });
      });

      it('should return error when platform URL returns 404', async () => {
        server.use(
          http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides`, () => {
            return HttpResponse.json({ error: 'Not Found' }, { status: 404 });
          }),
        );

        const result = await verifyPlatformUrl(mockBaseConfig);
        expect(result).toEqual({
          success: false,
          url: DEFAULT_PLATFORM_URL_DEV,
          error: 'HTTP 404: Not Found',
        });
      });

      it('should return error when platform URL returns 500', async () => {
        server.use(
          http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides`, () => {
            return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
          }),
        );

        const result = await verifyPlatformUrl(mockBaseConfig);
        expect(result).toEqual({
          success: false,
          url: DEFAULT_PLATFORM_URL_DEV,
          error: 'HTTP 500: Internal Server Error',
        });
      });

      it('should handle network errors gracefully', async () => {
        server.use(
          http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides`, () => {
            return HttpResponse.error();
          }),
        );

        const result = await verifyPlatformUrl(mockBaseConfig);
        expect(result).toEqual({
          success: false,
          url: DEFAULT_PLATFORM_URL_DEV,
          error: 'Failed to fetch',
        });
      });

      it('should handle timeout errors', async () => {
        server.use(
          http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides`, () => {
            return HttpResponse.error();
          }),
        );

        const result = await verifyPlatformUrl(mockBaseConfig);
        expect(result.success).toBe(false);
        expect(result.url).toBe(DEFAULT_PLATFORM_URL_DEV);
        expect(result.error).toBeDefined();
      });

      it('should handle DNS resolution errors', async () => {
        const invalidUrl = 'https://invalid-domain-that-does-not-exist-12345.com';
        const invalidConfig: Config = {
          ...mockBaseConfig,
          platformUrl: invalidUrl,
        };

        const result = await verifyPlatformUrl(invalidConfig);
        expect(result.success).toBe(false);
        expect(result.url).toBe(invalidUrl);
        expect(result.error).toBeDefined();
        // The exact error message may vary depending on the environment
        expect(['Failed to fetch', 'fetch failed']).toContain(result.error);
      });

      it('should handle malformed URLs gracefully', async () => {
        const malformedUrl = 'not-a-valid-url';
        const malformedConfig: Config = {
          ...mockBaseConfig,
          platformUrl: malformedUrl,
        };

        const result = await verifyPlatformUrl(malformedConfig);
        expect(result.success).toBe(false);
        expect(result.url).toBe(malformedUrl);
        expect(result.error).toBeDefined();
        // The exact error message may vary depending on the environment
        expect(['Failed to fetch', 'Failed to parse URL from not-a-valid-url/v1/style-guides']).toContain(result.error);
      });

      it('should handle empty response body gracefully', async () => {
        server.use(
          http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides`, () => {
            return new HttpResponse(null, { status: 200 });
          }),
        );

        const result = await verifyPlatformUrl(mockBaseConfig);
        expect(result).toEqual({
          success: true,
          url: DEFAULT_PLATFORM_URL_DEV,
          error: undefined,
        });
      });

      it('should handle JSON parsing errors gracefully', async () => {
        server.use(
          http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides`, () => {
            return new HttpResponse('Invalid JSON', { status: 200 });
          }),
        );

        const result = await verifyPlatformUrl(mockBaseConfig);
        expect(result).toEqual({
          success: true,
          url: DEFAULT_PLATFORM_URL_DEV,
          error: undefined,
        });
      });
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
        http.get(`${DEFAULT_PLATFORM_URL_DEV}${mockEndpoint}/${mockWorkflowId}`, () => {
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
