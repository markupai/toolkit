import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import {
  verifyPlatformUrl,
  getCurrentPlatformUrl,
  getPlatformUrl,
  initEndpoint,
  DEFAULT_PLATFORM_URL_PROD,
  DEFAULT_PLATFORM_URL_STAGE,
  DEFAULT_PLATFORM_URL_DEV,
} from "../../../src/utils/api";
import { PlatformType, Environment, CUSTOM_HEADERS } from "../../../src/utils/api.types";
import type { Config } from "../../../src/utils/api.types";
import { server } from "../setup";
import { http, HttpResponse } from "msw";

const mockApiKey = "test-api-key";

const mockBaseConfig: Config = {
  apiKey: mockApiKey,
  platform: { type: PlatformType.Environment, value: Environment.Dev },
};

beforeAll(() => {
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

describe("API Utilities Unit Tests", () => {
  describe("Platform URL Functions", () => {
    it("should return correct platform URL for Dev environment", () => {
      const config: Config = {
        apiKey: "test-key",
        platform: { type: PlatformType.Environment, value: Environment.Dev },
      };
      const result = getPlatformUrl(config);
      expect(result).toBe(DEFAULT_PLATFORM_URL_DEV);
    });

    it("should return correct platform URL for Stage environment", () => {
      const config: Config = {
        apiKey: "test-key",
        platform: { type: PlatformType.Environment, value: Environment.Stage },
      };
      const result = getPlatformUrl(config);
      expect(result).toBe(DEFAULT_PLATFORM_URL_STAGE);
    });

    it("should return correct platform URL for Prod environment", () => {
      const config: Config = {
        apiKey: "test-key",
        platform: { type: PlatformType.Environment, value: Environment.Prod },
      };
      const result = getPlatformUrl(config);
      expect(result).toBe(DEFAULT_PLATFORM_URL_PROD);
    });

    it("should return custom platform URL when provided", () => {
      const customUrl = "https://custom.markup.ai";
      const config: Config = {
        apiKey: "test-key",
        platform: { type: PlatformType.Url, value: customUrl },
      };
      const result = getPlatformUrl(config);
      expect(result).toBe(customUrl);
    });

    it("should default to Prod URL when no platform is specified", () => {
      const config: Config = {
        apiKey: "test-key",
      };
      const result = getPlatformUrl(config);
      expect(result).toBe(DEFAULT_PLATFORM_URL_PROD);
    });

    it("should return current platform URL", () => {
      const config: Config = {
        apiKey: "test-key",
        platform: { type: PlatformType.Environment, value: Environment.Dev },
      };
      const result = getCurrentPlatformUrl(config);
      expect(result).toBe(DEFAULT_PLATFORM_URL_DEV);
    });
  });

  describe("Custom Headers", () => {
    it("should export CUSTOM_HEADERS constant with recommended header names", () => {
      expect(CUSTOM_HEADERS).toBeDefined();
      expect(CUSTOM_HEADERS.INTEGRATION_ID).toBe("x-integration-id");
    });

    it("should create client without custom headers when not provided", () => {
      const config: Config = {
        apiKey: "test-key",
        platform: { type: PlatformType.Environment, value: Environment.Dev },
      };

      // Should not throw an error
      expect(() => {
        const result = getPlatformUrl(config);
        expect(result).toBe(DEFAULT_PLATFORM_URL_DEV);
      }).not.toThrow();
    });

    it("should accept custom headers in config", () => {
      const config: Config = {
        apiKey: "test-key",
        platform: { type: PlatformType.Environment, value: Environment.Dev },
        headers: {
          [CUSTOM_HEADERS.INTEGRATION_ID]: "test-integration",
          "x-custom-header": "custom-value",
        },
      };

      expect(config.headers).toBeDefined();
      expect(config.headers?.[CUSTOM_HEADERS.INTEGRATION_ID]).toBe("test-integration");
      expect(config.headers?.["x-custom-header"]).toBe("custom-value");
    });

    it("should accept empty headers object", () => {
      const config: Config = {
        apiKey: "test-key",
        headers: {},
      };

      expect(config.headers).toBeDefined();
      expect(Object.keys(config.headers || {})).toHaveLength(0);
    });

    it("should pass custom headers to API client during requests", async () => {
      const customHeaders = {
        [CUSTOM_HEADERS.INTEGRATION_ID]: "test-integration-123",
        "x-custom-tracking": "tracking-value",
      };

      const config: Config = {
        apiKey: mockApiKey,
        platform: { type: PlatformType.Environment, value: Environment.Dev },
        headers: customHeaders,
      };

      // Create a mock handler that captures the request headers
      let capturedHeaders: Headers | undefined;
      server.use(
        http.post("*/v1/style/checks", ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({
            status: "running",
            workflow_id: "test-workflow-id",
            message: "Style check workflow started successfully.",
          });
        }),
      );

      const client = initEndpoint(config);

      // Make a request to trigger the handler (may fail, we only care about headers being sent)
      await client.styleChecks
        .createStyleCheck({
          file_upload: new File(["test content"], "test.txt", { type: "text/plain" }),
          dialect: "american_english",
          style_guide: "ap",
        })
        .catch(() => {
          // Ignore errors, we only care about headers
        });

      // Verify custom headers were included
      expect(capturedHeaders).toBeDefined();
      if (capturedHeaders) {
        expect(capturedHeaders.get(CUSTOM_HEADERS.INTEGRATION_ID)).toBe("test-integration-123");
        expect(capturedHeaders.get("x-custom-tracking")).toBe("tracking-value");
      }
    });

    it("should not include headers property when headers not provided in config", () => {
      const config: Config = {
        apiKey: mockApiKey,
        platform: { type: PlatformType.Environment, value: Environment.Dev },
      };

      // Should create client successfully without headers
      const client = initEndpoint(config);
      expect(client).toBeDefined();
      expect(client.styleChecks).toBeDefined();
    });
  });

  describe("Platform URL Verification", () => {
    it("should verify platform URL successfully", async () => {
      server.use(
        http.get("*/v1/style-guides", () => {
          return HttpResponse.json({ data: "test" }, { status: 200 });
        }),
      );

      const result = await verifyPlatformUrl(mockBaseConfig);
      expect(result.success).toBe(true);
      expect(result.url).toBe(DEFAULT_PLATFORM_URL_DEV);
      expect(result.error).toBeUndefined();
    });

    it("should handle platform URL verification failure", async () => {
      server.use(
        http.get("*/v1/style-guides", () => {
          return HttpResponse.json({ error: "Not found" }, { status: 404 });
        }),
      );

      const result = await verifyPlatformUrl(mockBaseConfig);
      expect(result.success).toBe(false);
      expect(result.url).toBe(DEFAULT_PLATFORM_URL_DEV);
      expect(result.error).toContain("HTTP 404");
    });

    it("should handle network errors during verification", async () => {
      server.use(
        http.get("*/v1/style-guides", () => {
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
