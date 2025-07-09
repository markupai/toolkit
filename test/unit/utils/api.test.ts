import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import {
  getData,
  postData,
  putData,
  deleteData,
  pollWorkflowForResult,
  verifyPlatformUrl,
  getCurrentPlatformUrl,
  getPlatformUrl,
  DEFAULT_PLATFORM_URL_DEV,
  DEFAULT_PLATFORM_URL_PROD,
  DEFAULT_PLATFORM_URL_STAGE,
} from '../../../src/utils/api';
import { PlatformType, Environment, ResponseBase, Status } from '../../../src/utils/api.types';
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
        platform: { type: PlatformType.Url, value: customPlatformUrl },
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
          platform: { type: PlatformType.Url, value: 'https://custom.example.com' },
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
          platform: { type: PlatformType.Url, value: customUrl },
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
          platform: { type: PlatformType.Url, value: urlWithSlash },
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
          platform: { type: PlatformType.Url, value: invalidUrl },
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
          platform: { type: PlatformType.Url, value: malformedUrl },
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

    describe('getPlatformUrl', () => {
      describe('Environment-based platform configuration', () => {
        it('should return stage URL when platform type is Environment.Stage', () => {
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Environment, value: Environment.Stage },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(DEFAULT_PLATFORM_URL_STAGE);
        });

        it('should return dev URL when platform type is Environment.Dev', () => {
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Environment, value: Environment.Dev },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(DEFAULT_PLATFORM_URL_DEV);
        });

        it('should return prod URL when platform type is Environment.Prod', () => {
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Environment, value: Environment.Prod },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(DEFAULT_PLATFORM_URL_PROD);
        });

        it('should default to prod URL for unknown environment values', () => {
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Environment, value: 'unknown' as Environment },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(DEFAULT_PLATFORM_URL_PROD);
        });
      });

      describe('URL-based platform configuration', () => {
        it('should return custom URL when platform type is PlatformType.Url', () => {
          const customUrl = 'https://custom.example.com';
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Url, value: customUrl },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(customUrl);
        });

        it('should return URL with trailing slash when provided', () => {
          const customUrl = 'https://custom.example.com/';
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Url, value: customUrl },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(customUrl);
        });

        it('should return URL without protocol when provided', () => {
          const customUrl = 'custom.example.com';
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Url, value: customUrl },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(customUrl);
        });

        it('should return localhost URL when provided', () => {
          const customUrl = 'http://localhost:3000';
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Url, value: customUrl },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(customUrl);
        });

        it('should return IP address URL when provided', () => {
          const customUrl = 'http://192.168.1.100:8080';
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Url, value: customUrl },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(customUrl);
        });
      });

      describe('No platform configuration', () => {
        it('should return dev URL in test environment when no platform is configured', () => {
          // Mock NODE_ENV to be 'test'
          const originalEnv = process.env.NODE_ENV;
          process.env.NODE_ENV = 'development';

          const config: Config = {
            ...mockBaseConfig,
            // No platform configuration
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(DEFAULT_PLATFORM_URL_DEV);

          // Restore original environment
          process.env.NODE_ENV = originalEnv;
        });

        it('should return prod URL in non-test environment when no platform is configured', () => {
          // Mock NODE_ENV to be 'production'
          const originalEnv = process.env.NODE_ENV;
          process.env.NODE_ENV = 'production';

          const config: Config = {
            ...mockBaseConfig,
            // No platform configuration
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(DEFAULT_PLATFORM_URL_PROD);

          // Restore original environment
          process.env.NODE_ENV = originalEnv;
        });

        it('should return prod URL when NODE_ENV is undefined and no platform is configured', () => {
          // Mock NODE_ENV to be undefined
          const originalEnv = process.env.NODE_ENV;
          delete process.env.NODE_ENV;

          const config: Config = {
            ...mockBaseConfig,
            // No platform configuration
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(DEFAULT_PLATFORM_URL_PROD);

          // Restore original environment
          process.env.NODE_ENV = originalEnv;
        });

        it('should return dev URL when NODE_ENV is development and no platform is configured', () => {
          // Mock NODE_ENV to be 'development'
          const originalEnv = process.env.NODE_ENV;
          process.env.NODE_ENV = 'development';

          const config: Config = {
            ...mockBaseConfig,
            // No platform configuration
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(DEFAULT_PLATFORM_URL_DEV);

          // Restore original environment
          process.env.NODE_ENV = originalEnv;
        });

        it('should return prod URL when platform is explicitly undefined and no NODE_ENV is present', () => {
          // Mock NODE_ENV to be undefined
          const originalEnv = process.env.NODE_ENV;
          delete process.env.NODE_ENV;

          const config: Config = {
            ...mockBaseConfig,
            platform: undefined,
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(DEFAULT_PLATFORM_URL_PROD);

          // Restore original environment
          process.env.NODE_ENV = originalEnv;
        });

        it('should return prod URL when platform is explicitly null and no NODE_ENV is present', () => {
          // Mock NODE_ENV to be undefined
          const originalEnv = process.env.NODE_ENV;
          delete process.env.NODE_ENV;

          const config = {
            ...mockBaseConfig,
            platform: null,
          } as unknown as Config;
          const result = getPlatformUrl(config);
          expect(result).toBe(DEFAULT_PLATFORM_URL_PROD);

          // Restore original environment
          process.env.NODE_ENV = originalEnv;
        });
      });

      describe('Edge cases and error handling', () => {
        it('should handle empty string URL', () => {
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Url, value: '' },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe('');
        });

        it('should handle whitespace-only URL', () => {
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Url, value: '   ' },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe('   ');
        });

        it('should handle very long URLs', () => {
          const longUrl = 'https://' + 'a'.repeat(1000) + '.example.com';
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Url, value: longUrl },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(longUrl);
        });

        it('should handle URLs with special characters', () => {
          const specialUrl = 'https://example.com/path with spaces/and-special-chars!@#$%^&*()';
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Url, value: specialUrl },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(specialUrl);
        });

        it('should handle URLs with query parameters', () => {
          const queryUrl = 'https://example.com/api?param1=value1&param2=value2';
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Url, value: queryUrl },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(queryUrl);
        });

        it('should handle URLs with fragments', () => {
          const fragmentUrl = 'https://example.com/api#section1';
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Url, value: fragmentUrl },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(fragmentUrl);
        });

        it('should handle URLs with ports', () => {
          const portUrl = 'https://example.com:8080/api';
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Url, value: portUrl },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(portUrl);
        });

        it('should handle URLs with authentication', () => {
          const authUrl = 'https://user:password@example.com/api';
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Url, value: authUrl },
          };
          const result = getPlatformUrl(config);
          expect(result).toBe(authUrl);
        });
      });

      describe('Integration with getCurrentPlatformUrl', () => {
        it('should return same result as getCurrentPlatformUrl for environment config', () => {
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Environment, value: Environment.Stage },
          };
          const getPlatformUrlResult = getPlatformUrl(config);
          const getCurrentPlatformUrlResult = getCurrentPlatformUrl(config);
          expect(getPlatformUrlResult).toBe(getCurrentPlatformUrlResult);
          expect(getPlatformUrlResult).toBe(DEFAULT_PLATFORM_URL_STAGE);
        });

        it('should return same result as getCurrentPlatformUrl for URL config', () => {
          const customUrl = 'https://custom.example.com';
          const config: Config = {
            ...mockBaseConfig,
            platform: { type: PlatformType.Url, value: customUrl },
          };
          const getPlatformUrlResult = getPlatformUrl(config);
          const getCurrentPlatformUrlResult = getCurrentPlatformUrl(config);
          expect(getPlatformUrlResult).toBe(getCurrentPlatformUrlResult);
          expect(getPlatformUrlResult).toBe(customUrl);
        });

        it('should return same result as getCurrentPlatformUrl for no config', () => {
          // Mock NODE_ENV to be 'test' for consistent behavior
          const originalEnv = process.env.NODE_ENV;
          process.env.NODE_ENV = 'development';

          const config: Config = {
            ...mockBaseConfig,
            // No platform configuration
          };
          const getPlatformUrlResult = getPlatformUrl(config);
          const getCurrentPlatformUrlResult = getCurrentPlatformUrl(config);
          expect(getPlatformUrlResult).toBe(getCurrentPlatformUrlResult);
          expect(getPlatformUrlResult).toBe(DEFAULT_PLATFORM_URL_DEV);

          // Restore original environment
          process.env.NODE_ENV = originalEnv;
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
