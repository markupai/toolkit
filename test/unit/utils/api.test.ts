import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import {
  verifyPlatformUrl,
  getCurrentPlatformUrl,
  getPlatformUrl,
  DEFAULT_PLATFORM_URL_PROD,
  DEFAULT_PLATFORM_URL_STAGE,
  DEFAULT_PLATFORM_URL_DEV,
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
  platform: { type: PlatformType.Environment, value: Environment.Dev },
};

const mockBaseConfig: Config = {
  apiKey: mockApiKey,
  platform: { type: PlatformType.Environment, value: Environment.Dev },
};

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => server.close());

describe('API Utilities Unit Tests', () => {
  describe('Platform URL Functions', () => {
    it('should return correct platform URL for Dev environment', () => {
      const config: Config = {
        apiKey: 'test-key',
        platform: { type: PlatformType.Environment, value: Environment.Dev },
      };
      const result = getPlatformUrl(config);
      expect(result).toBe(DEFAULT_PLATFORM_URL_DEV);
    });

    it('should return correct platform URL for Stage environment', () => {
      const config: Config = {
        apiKey: 'test-key',
        platform: { type: PlatformType.Environment, value: Environment.Stage },
      };
      const result = getPlatformUrl(config);
      expect(result).toBe(DEFAULT_PLATFORM_URL_STAGE);
    });

    it('should return correct platform URL for Prod environment', () => {
      const config: Config = {
        apiKey: 'test-key',
        platform: { type: PlatformType.Environment, value: Environment.Prod },
      };
      const result = getPlatformUrl(config);
      expect(result).toBe(DEFAULT_PLATFORM_URL_PROD);
    });

    it('should return custom platform URL when provided', () => {
      const customUrl = 'https://custom.acrolinx.com';
      const config: Config = {
        apiKey: 'test-key',
        platform: { type: PlatformType.Custom, value: customUrl },
      };
      const result = getPlatformUrl(config);
      expect(result).toBe(customUrl);
    });

    it('should default to Prod URL when no platform is specified', () => {
      const config: Config = {
        apiKey: 'test-key',
      };
      const result = getPlatformUrl(config);
      expect(result).toBe(DEFAULT_PLATFORM_URL_PROD);
    });

    it('should return current platform URL', () => {
      const config: Config = {
        apiKey: 'test-key',
        platform: { type: PlatformType.Environment, value: Environment.Dev },
      };
      const result = getCurrentPlatformUrl(config);
      expect(result).toBe(DEFAULT_PLATFORM_URL_DEV);
    });
  });

  describe('Platform URL Verification', () => {
    it('should verify platform URL successfully', async () => {
      server.use(
        http.get('*/v1/style-guides', () => {
          return HttpResponse.json({ data: 'test' }, { status: 200 });
        }),
      );

      const result = await verifyPlatformUrl(mockBaseConfig);
      expect(result.success).toBe(true);
      expect(result.url).toBe(DEFAULT_PLATFORM_URL_DEV);
      expect(result.error).toBeUndefined();
    });

    it('should handle platform URL verification failure', async () => {
      server.use(
        http.get('*/v1/style-guides', () => {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        }),
      );

      const result = await verifyPlatformUrl(mockBaseConfig);
      expect(result.success).toBe(false);
      expect(result.url).toBe(DEFAULT_PLATFORM_URL_DEV);
      expect(result.error).toContain('HTTP 404');
    });

    it('should handle network errors during verification', async () => {
      server.use(
        http.get('*/v1/style-guides', () => {
          return HttpResponse.error();
        }),
      );

      const result = await verifyPlatformUrl(mockBaseConfig);
      expect(result.success).toBe(false);
      expect(result.url).toBe(DEFAULT_PLATFORM_URL_DEV);
      expect(result.error).toBeDefined();
    });
  });
});
