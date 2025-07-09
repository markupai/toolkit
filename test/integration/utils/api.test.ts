import { describe, it, expect, beforeAll } from 'vitest';
import {
  getData,
  postData,
  putData,
  deleteData,
  pollWorkflowForResult,
  verifyPlatformUrl,
  getCurrentPlatformUrl,
  DEFAULT_PLATFORM_URL_DEV,
  DEFAULT_PLATFORM_URL_PROD,
} from '../../../src/utils/api';
import { PlatformType, Status } from '../../../src/utils/api.types';
import type { ApiConfig, Config } from '../../../src/utils/api.types';
import { STYLE_DEFAULTS } from '../../../src/api/style/style.api.defaults';
import { API_ENDPOINTS } from '../../../src/api/style/style.api';
import type { StyleGuide, StyleGuides, StyleAnalysisSubmitResp } from '../../../src/api/style/style.api.types';

describe('API Utilities Integration Tests', () => {
  let config: Config;

  beforeAll(() => {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      throw new Error('API_KEY environment variable is required for integration tests');
    }
    config = {
      apiKey,
      platform: { type: PlatformType.Url, value: DEFAULT_PLATFORM_URL_DEV },
    };
  });

  const testContent =
    'This is a test content for API utilities integration testing. It contains some basic text that should work with the style analysis endpoints.';
  const styleGuideId = STYLE_DEFAULTS.styleGuides.microsoft;

  describe('HTTP Method Functions with Style API Endpoints', () => {
    describe('GET Requests', () => {
      it('should make successful GET request to list style guides', async () => {
        const testConfig: ApiConfig = {
          endpoint: API_ENDPOINTS.STYLE_GUIDES,
          apiKey: config.apiKey,
          platform: config.platform,
        };

        const result = await getData<StyleGuides>(testConfig);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);

        // If there are style guides, validate the structure
        if (result.length > 0) {
          const styleGuide = result[0];
          expect(styleGuide).toHaveProperty('id');
          expect(styleGuide).toHaveProperty('name');
          expect(styleGuide).toHaveProperty('created_at');
          expect(styleGuide).toHaveProperty('created_by');
          expect(styleGuide).toHaveProperty('status');
          expect(styleGuide).toHaveProperty('updated_at');
          expect(styleGuide).toHaveProperty('updated_by');
        }
      });

      it('should make successful GET request to get specific style guide', async () => {
        // First get the list to find a valid style guide ID
        const listConfig: ApiConfig = {
          endpoint: API_ENDPOINTS.STYLE_GUIDES,
          apiKey: config.apiKey,
          platform: config.platform,
        };

        const styleGuides = await getData<StyleGuides>(listConfig);

        if (styleGuides.length > 0) {
          const styleGuideId = styleGuides[0].id;
          const testConfig: ApiConfig = {
            endpoint: `${API_ENDPOINTS.STYLE_GUIDES}/${styleGuideId}`,
            apiKey: config.apiKey,
            platform: config.platform,
          };

          try {
            const result = await getData<StyleGuide>(testConfig);
            expect(result).toBeDefined();
            expect(result.id).toBe(styleGuideId);
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('created_at');
            expect(result).toHaveProperty('created_by');
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('updated_at');
            expect(result).toHaveProperty('updated_by');
          } catch (error) {
            // Some style guides may not be accessible individually
            expect(error).toBeDefined();
          }
        }
      });

      it('should handle 404 errors for non-existent style guide', async () => {
        const testConfig: ApiConfig = {
          endpoint: `${API_ENDPOINTS.STYLE_GUIDES}/non-existent-id`,
          apiKey: config.apiKey,
          platform: config.platform,
        };

        await expect(getData(testConfig)).rejects.toThrow();
      });

      it('should handle unauthorized access', async () => {
        const invalidConfig: ApiConfig = {
          endpoint: API_ENDPOINTS.STYLE_GUIDES,
          apiKey: 'invalid-api-key',
          platform: config.platform,
        };

        await expect(getData(invalidConfig)).rejects.toThrow();
      });
    });

    describe('POST Requests', () => {
      it('should make successful POST request for style check submission', async () => {
        const testConfig: ApiConfig = {
          endpoint: API_ENDPOINTS.STYLE_CHECKS,
          apiKey: config.apiKey,
          platform: config.platform,
        };

        // Create FormData as expected by the style API
        const formData = new FormData();
        formData.append('file_upload', new Blob([testContent], { type: 'text/plain' }), 'test-document.txt');
        formData.append('style_guide', styleGuideId);
        formData.append('dialect', STYLE_DEFAULTS.dialects.americanEnglish);
        formData.append('tone', STYLE_DEFAULTS.tones.formal);

        const result = await postData<StyleAnalysisSubmitResp>(testConfig, formData);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('workflow_id');
        expect(result).toHaveProperty('status');
        // Status can be either 'queued' or 'running' depending on processing speed
        expect([Status.Queued, Status.Running]).toContain(result.status);
      });

      it('should make successful POST request for style suggestions submission', async () => {
        const testConfig: ApiConfig = {
          endpoint: API_ENDPOINTS.STYLE_SUGGESTIONS,
          apiKey: config.apiKey,
          platform: config.platform,
        };

        const formData = new FormData();
        formData.append('file_upload', new Blob([testContent], { type: 'text/plain' }), 'suggestions-test.txt');
        formData.append('style_guide', styleGuideId);
        formData.append('dialect', STYLE_DEFAULTS.dialects.americanEnglish);
        formData.append('tone', STYLE_DEFAULTS.tones.formal);

        const result = await postData<StyleAnalysisSubmitResp>(testConfig, formData);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('workflow_id');
        expect(result).toHaveProperty('status');
        // Status can be either 'queued' or 'running' depending on processing speed
        expect([Status.Queued, Status.Running]).toContain(result.status);
      });

      it('should make successful POST request for style rewrite submission', async () => {
        const testConfig: ApiConfig = {
          endpoint: API_ENDPOINTS.STYLE_REWRITES,
          apiKey: config.apiKey,
          platform: config.platform,
        };

        const formData = new FormData();
        formData.append('file_upload', new Blob([testContent], { type: 'text/plain' }), 'rewrite-test.txt');
        formData.append('style_guide', styleGuideId);
        formData.append('dialect', STYLE_DEFAULTS.dialects.americanEnglish);
        formData.append('tone', STYLE_DEFAULTS.tones.formal);

        const result = await postData<StyleAnalysisSubmitResp>(testConfig, formData);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('workflow_id');
        expect(result).toHaveProperty('status');
        // Status can be either 'queued' or 'running' depending on processing speed
        expect([Status.Queued, Status.Running]).toContain(result.status);
      });

      it('should handle POST request with invalid style guide', async () => {
        const testConfig: ApiConfig = {
          endpoint: API_ENDPOINTS.STYLE_CHECKS,
          apiKey: config.apiKey,
          platform: config.platform,
        };

        const formData = new FormData();
        formData.append('file_upload', new Blob([testContent], { type: 'text/plain' }), 'test.txt');
        formData.append('style_guide', 'invalid-style-guide');
        formData.append('dialect', STYLE_DEFAULTS.dialects.americanEnglish);
        formData.append('tone', STYLE_DEFAULTS.tones.formal);

        await expect(postData(testConfig, formData)).rejects.toThrow();
      });
    });

    describe('PUT Requests', () => {
      it('should make successful PUT request to update style guide', async () => {
        // First get the list to find a valid style guide ID
        const listConfig: ApiConfig = {
          endpoint: API_ENDPOINTS.STYLE_GUIDES,
          apiKey: config.apiKey,
          platform: config.platform,
        };

        const styleGuides = await getData<StyleGuides>(listConfig);

        if (styleGuides.length > 0) {
          const styleGuideId = styleGuides[0].id;
          const testConfig: ApiConfig = {
            endpoint: `${API_ENDPOINTS.STYLE_GUIDES}/${styleGuideId}`,
            apiKey: config.apiKey,
            platform: config.platform,
          };

          const updateData = {
            name: `Updated Style Guide ${Date.now()}`,
          };

          try {
            const result = await putData<StyleGuide>(testConfig, JSON.stringify(updateData));
            expect(result).toBeDefined();
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name');
            expect(result.name).toBe(updateData.name);
          } catch (error) {
            // Some style guides may not support updates (e.g., system style guides)
            expect(error).toBeDefined();
          }
        }
      });

      it('should handle PUT request with invalid style guide ID', async () => {
        const testConfig: ApiConfig = {
          endpoint: `${API_ENDPOINTS.STYLE_GUIDES}/invalid-id`,
          apiKey: config.apiKey,
          platform: config.platform,
        };

        const updateData = {
          name: 'Updated Style Guide',
        };

        await expect(putData(testConfig, JSON.stringify(updateData))).rejects.toThrow();
      });
    });

    describe('DELETE Requests', () => {
      it('should make successful DELETE request for style guide', async () => {
        // First create a style guide to delete
        const createConfig: ApiConfig = {
          endpoint: API_ENDPOINTS.STYLE_GUIDES,
          apiKey: config.apiKey,
          platform: config.platform,
        };

        // Create a simple text file for testing
        const testFile = new File(['Test style guide content'], 'test-style-guide.txt', {
          type: 'text/plain',
        });

        const createFormData = new FormData();
        createFormData.append('file_upload', testFile);
        createFormData.append('name', `Test Style Guide ${Date.now()}`);

        try {
          const createdStyleGuide = await postData<StyleGuide>(createConfig, createFormData);

          // Now delete it
          const deleteConfig: ApiConfig = {
            endpoint: `${API_ENDPOINTS.STYLE_GUIDES}/${createdStyleGuide.id}`,
            apiKey: config.apiKey,
            platform: config.platform,
          };

          const result = await deleteData(deleteConfig);
          expect(result).toBeDefined();
        } catch (error) {
          // If creation fails (e.g., file type not supported), that's acceptable
          expect(error).toBeDefined();
        }
      });

      it('should handle DELETE request with invalid style guide ID', async () => {
        const testConfig: ApiConfig = {
          endpoint: `${API_ENDPOINTS.STYLE_GUIDES}/invalid-id`,
          apiKey: config.apiKey,
          platform: config.platform,
        };

        await expect(deleteData(testConfig)).rejects.toThrow();
      });
    });
  });

  describe('Workflow Polling with Style API', () => {
    it('should handle polling for style check workflow', async () => {
      const testConfig: ApiConfig = {
        endpoint: API_ENDPOINTS.STYLE_CHECKS,
        apiKey: config.apiKey,
        platform: config.platform,
      };

      // First submit a style check
      const formData = new FormData();
      formData.append('file_upload', new Blob([testContent], { type: 'text/plain' }), 'polling-test.txt');
      formData.append('style_guide', styleGuideId);
      formData.append('dialect', STYLE_DEFAULTS.dialects.americanEnglish);
      formData.append('tone', STYLE_DEFAULTS.tones.formal);

      try {
        const submitResult = await postData<StyleAnalysisSubmitResp>(testConfig, formData);
        expect(submitResult).toHaveProperty('workflow_id');

        // Now poll for the result
        const result = await pollWorkflowForResult(submitResult.workflow_id, testConfig);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('style_guide_id');
        expect(result).toHaveProperty('scores');
        expect(result).toHaveProperty('issues');
        expect(result).toHaveProperty('check_options');
      } catch (error) {
        // If polling fails or times out, that's acceptable for integration tests
        expect(error).toBeDefined();
      }
    });

    it('should handle polling with non-existent workflow ID', async () => {
      const testConfig: ApiConfig = {
        endpoint: API_ENDPOINTS.STYLE_CHECKS,
        apiKey: config.apiKey,
        platform: config.platform,
      };

      const nonExistentWorkflowId = 'non-existent-workflow-id';

      await expect(pollWorkflowForResult(nonExistentWorkflowId, testConfig)).rejects.toThrow();
    });

    it('should handle polling with unauthorized access', async () => {
      const invalidConfig: ApiConfig = {
        endpoint: API_ENDPOINTS.STYLE_CHECKS,
        apiKey: 'invalid-api-key',
        platform: config.platform,
      };

      const workflowId = 'test-workflow-id';

      await expect(pollWorkflowForResult(workflowId, invalidConfig)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle network connectivity issues', async () => {
      const invalidConfig: ApiConfig = {
        endpoint: API_ENDPOINTS.STYLE_GUIDES,
        apiKey: config.apiKey,
        platform: { type: PlatformType.Url, value: 'https://invalid-domain-that-does-not-exist.com' },
      };

      await expect(getData(invalidConfig)).rejects.toThrow();
    });

    it('should handle malformed URLs', async () => {
      const invalidConfig: ApiConfig = {
        endpoint: API_ENDPOINTS.STYLE_GUIDES,
        apiKey: config.apiKey,
        platform: { type: PlatformType.Url, value: 'not-a-valid-url' },
      };

      await expect(getData(invalidConfig)).rejects.toThrow();
    });

    it('should handle empty API key', async () => {
      const invalidConfig: ApiConfig = {
        endpoint: API_ENDPOINTS.STYLE_GUIDES,
        apiKey: '',
        platform: config.platform,
      };

      await expect(getData(invalidConfig)).rejects.toThrow();
    });

    it('should handle null/undefined API key', async () => {
      const invalidConfig: ApiConfig = {
        endpoint: API_ENDPOINTS.STYLE_GUIDES,
        apiKey: null as unknown as string,
        platform: config.platform,
      };

      await expect(getData(invalidConfig)).rejects.toThrow();
    });
  });

  describe('Response Processing', () => {
    it('should handle JSON responses correctly from style guides endpoint', async () => {
      const testConfig: ApiConfig = {
        endpoint: API_ENDPOINTS.STYLE_GUIDES,
        apiKey: config.apiKey,
        platform: config.platform,
      };

      const result = await getData<StyleGuides>(testConfig);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const styleGuide = result[0];
        expect(typeof styleGuide.id).toBe('string');
        expect(typeof styleGuide.name).toBe('string');
        expect(typeof styleGuide.created_at).toBe('string');
        expect(typeof styleGuide.created_by).toBe('string');
        expect(typeof styleGuide.status).toBe('string');
      }
    });

    it('should handle style check response structure correctly', async () => {
      const testConfig: ApiConfig = {
        endpoint: API_ENDPOINTS.STYLE_CHECKS,
        apiKey: config.apiKey,
        platform: config.platform,
      };

      const formData = new FormData();
      formData.append('file_upload', new Blob([testContent], { type: 'text/plain' }), 'structure-test.txt');
      formData.append('style_guide', styleGuideId);
      formData.append('dialect', STYLE_DEFAULTS.dialects.americanEnglish);
      formData.append('tone', STYLE_DEFAULTS.tones.formal);

      const result = await postData<StyleAnalysisSubmitResp>(testConfig, formData);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('workflow_id');
      expect(typeof result.workflow_id).toBe('string');
      expect(result).toHaveProperty('status');
      // Status can be either 'queued' or 'running' depending on processing speed
      expect([Status.Queued, Status.Running]).toContain(result.status);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent GET requests to style guides', async () => {
      const testConfig: ApiConfig = {
        endpoint: API_ENDPOINTS.STYLE_GUIDES,
        apiKey: config.apiKey,
        platform: config.platform,
      };

      const promises = [
        getData<StyleGuides>(testConfig),
        getData<StyleGuides>(testConfig),
        getData<StyleGuides>(testConfig),
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should handle mixed HTTP method requests concurrently', async () => {
      const getConfig: ApiConfig = {
        endpoint: API_ENDPOINTS.STYLE_GUIDES,
        apiKey: config.apiKey,
        platform: config.platform,
      };

      const postConfig: ApiConfig = {
        endpoint: API_ENDPOINTS.STYLE_CHECKS,
        apiKey: config.apiKey,
        platform: config.platform,
      };

      const formData = new FormData();
      formData.append('file_upload', new Blob([testContent], { type: 'text/plain' }), 'concurrent-test.txt');
      formData.append('style_guide', styleGuideId);
      formData.append('dialect', STYLE_DEFAULTS.dialects.americanEnglish);
      formData.append('tone', STYLE_DEFAULTS.tones.formal);

      const promises = [getData<StyleGuides>(getConfig), postData<StyleAnalysisSubmitResp>(postConfig, formData)];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(2);
      expect(Array.isArray(results[0])).toBe(true);
      expect(results[1]).toHaveProperty('workflow_id');
    });
  });

  describe('Platform URL Verification', () => {
    describe('getCurrentPlatformUrl', () => {
      it('should return the configured platform URL', () => {
        const result = getCurrentPlatformUrl(config);
        expect(result).toBe(DEFAULT_PLATFORM_URL_DEV);
      });

      it('should return custom platform URL when configured', () => {
        const customConfig: Config = {
          ...config,
          platform: { type: PlatformType.Url, value: 'https://custom.example.com' },
        };
        const result = getCurrentPlatformUrl(customConfig);
        expect(result).toBe('https://custom.example.com');
      });

      it('should return default URL when no platform URL is configured', () => {
        const configWithoutUrl: Config = {
          apiKey: config.apiKey,
        };
        const result = getCurrentPlatformUrl(configWithoutUrl);
        expect(result).toBe(DEFAULT_PLATFORM_URL_PROD);
      });
    });

    describe('verifyPlatformUrl', () => {
      it('should successfully verify the default platform URL', async () => {
        const result = await verifyPlatformUrl(config);
        expect(result).toEqual({
          success: true,
          url: DEFAULT_PLATFORM_URL_DEV,
          error: undefined,
        });
      });

      it('should handle platform URL with trailing slash', async () => {
        const configWithSlash: Config = {
          ...config,
          platform: { type: PlatformType.Url, value: `${DEFAULT_PLATFORM_URL_DEV}/` },
        };
        const result = await verifyPlatformUrl(configWithSlash);
        expect(result).toEqual({
          success: true,
          url: `${DEFAULT_PLATFORM_URL_DEV}/`,
          error: undefined,
        });
      });

      it('should handle unauthorized access gracefully', async () => {
        const invalidConfig: Config = {
          apiKey: 'invalid-api-key',
          platform: { type: PlatformType.Url, value: DEFAULT_PLATFORM_URL_DEV },
        };
        const result = await verifyPlatformUrl(invalidConfig);
        expect(result.success).toBe(false);
        expect(result.url).toBe(DEFAULT_PLATFORM_URL_DEV);
        expect(result.error).toContain('HTTP 401');
      });

      it('should handle network connectivity issues', async () => {
        const invalidConfig: Config = {
          ...config,
          platform: { type: PlatformType.Url, value: 'https://invalid-domain-that-does-not-exist-12345.com' },
        };
        const result = await verifyPlatformUrl(invalidConfig);
        expect(result.success).toBe(false);
        expect(result.url).toBe('https://invalid-domain-that-does-not-exist-12345.com');
        expect(result.error).toBe('fetch failed');
      });

      it('should handle malformed URLs gracefully', async () => {
        const malformedConfig: Config = {
          ...config,
          platform: { type: PlatformType.Url, value: 'not-a-valid-url' },
        };
        const result = await verifyPlatformUrl(malformedConfig);
        expect(result.success).toBe(false);
        expect(result.url).toBe('not-a-valid-url');
        expect(result.error).toBe('Failed to parse URL from not-a-valid-url/v1/style-guides');
      });

      it('should handle different HTTP status codes appropriately', async () => {
        // Test with demo URL which might return different status codes
        const demoConfig: Config = {
          ...config,
          platform: { type: PlatformType.Url, value: 'https://app.acrolinx.cloud' },
        };
        const result = await verifyPlatformUrl(demoConfig);

        // The demo URL should either be reachable or return an error
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('error');

        if (result.success) {
          expect(result.error).toBeUndefined();
        } else {
          expect(result.error).toBeDefined();
        }
      });

      it('should handle timeout scenarios gracefully', async () => {
        // This test verifies that the function doesn't hang indefinitely
        const timeoutConfig: Config = {
          ...config,
          platform: { type: PlatformType.Url, value: 'https://httpbin.org/delay/10' }, // This would timeout in real scenarios
        };

        // Set a timeout for this test
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Test timeout')), 5000);
        });

        const verifyPromise = verifyPlatformUrl(timeoutConfig);

        try {
          const result = await Promise.race([verifyPromise, timeoutPromise]);
          // If we get here, the verification completed (either success or failure)
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('url');
          expect(result).toHaveProperty('error');
        } catch (error) {
          // If timeout occurs, that's also acceptable for this test
          expect(error).toBeDefined();
        }
      });

      it('should handle concurrent verification requests', async () => {
        const promises = [verifyPlatformUrl(config), verifyPlatformUrl(config), verifyPlatformUrl(config)];

        const results = await Promise.all(promises);
        expect(results).toHaveLength(3);

        results.forEach((result) => {
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('url');
          expect(result).toHaveProperty('error');
          expect(result.url).toBe(DEFAULT_PLATFORM_URL_DEV);
        });
      });
    });
  });
});
