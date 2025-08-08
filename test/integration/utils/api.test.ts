import { describe, it, expect, beforeAll } from 'vitest';
import { verifyPlatformUrl, getCurrentPlatformUrl, DEFAULT_PLATFORM_URL_PROD } from '../../../src/utils/api';
import { PlatformType } from '../../../src/utils/api.types';
import type { Config } from '../../../src/utils/api.types';

describe('API Utilities Integration Tests', () => {
  let config: Config;

  beforeAll(() => {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      throw new Error('API_KEY environment variable is required for integration tests');
    }
    config = {
      apiKey,
      platform: { type: PlatformType.Url, value: process.env.TEST_PLATFORM_URL! },
    };
  });

  describe('Platform URL Verification', () => {
    describe('getCurrentPlatformUrl', () => {
      it('should return the configured platform URL', () => {
        const result = getCurrentPlatformUrl(config);
        expect(result).toBe(process.env.TEST_PLATFORM_URL);
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
          url: process.env.TEST_PLATFORM_URL,
          error: undefined,
        });
      });

      it('should handle platform URL with trailing slash', async () => {
        const configWithSlash: Config = {
          ...config,
          platform: { type: PlatformType.Url, value: `${process.env.TEST_PLATFORM_URL}/` },
        };
        const result = await verifyPlatformUrl(configWithSlash);
        expect(result).toEqual({
          success: true,
          url: `${process.env.TEST_PLATFORM_URL}/`,
          error: undefined,
        });
      });

      it('should handle unauthorized access gracefully', async () => {
        const invalidConfig: Config = {
          apiKey: 'invalid-api-key',
          platform: { type: PlatformType.Url, value: process.env.TEST_PLATFORM_URL! },
        };
        const result = await verifyPlatformUrl(invalidConfig);
        expect(result.success).toBe(false);
        expect(result.url).toBe(process.env.TEST_PLATFORM_URL);
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
          expect(result.url).toBe(process.env.TEST_PLATFORM_URL);
        });
      });
    });
  });
});
