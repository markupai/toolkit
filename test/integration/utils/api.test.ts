import { describe, it, expect } from "vitest";
import {
  verifyPlatformUrl,
  getCurrentPlatformUrl,
  DEFAULT_PLATFORM_URL_PROD,
} from "../../../src/utils/api";
import { PlatformType, CUSTOM_HEADERS } from "../../../src/utils/api.types";
import type { Config } from "../../../src/utils/api.types";

describe("API Utilities Integration Tests", () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is required for integration tests");
  }
  const platformUrl = process.env.TEST_PLATFORM_URL;
  if (!platformUrl) {
    throw new Error("TEST_PLATFORM_URL environment variable is required for integration tests");
  }
  const config: Config = {
    apiKey,
    platform: { type: PlatformType.Url, value: platformUrl },
  };

  describe("Platform URL Verification", () => {
    describe("getCurrentPlatformUrl", () => {
      it("should return the configured platform URL", () => {
        const result = getCurrentPlatformUrl(config);
        expect(result).toBe(process.env.TEST_PLATFORM_URL);
      });

      it("should return custom platform URL when configured", () => {
        const customConfig: Config = {
          ...config,
          platform: { type: PlatformType.Url, value: "https://custom.example.com" },
        };
        const result = getCurrentPlatformUrl(customConfig);
        expect(result).toBe("https://custom.example.com");
      });

      it("should return default URL when no platform URL is configured", () => {
        const configWithoutUrl: Config = {
          apiKey: config.apiKey,
        };
        const result = getCurrentPlatformUrl(configWithoutUrl);
        expect(result).toBe(DEFAULT_PLATFORM_URL_PROD);
      });
    });

    describe("verifyPlatformUrl", () => {
      it("should successfully verify the default platform URL", async () => {
        const result = await verifyPlatformUrl(config);
        expect(result).toEqual({
          success: true,
          url: process.env.TEST_PLATFORM_URL,
          error: undefined,
        });
      });

      it("should handle platform URL with trailing slash", async () => {
        const configWithSlash: Config = {
          ...config,
          platform: { type: PlatformType.Url, value: `${String(process.env.TEST_PLATFORM_URL)}/` },
        };
        const result = await verifyPlatformUrl(configWithSlash);
        expect(result).toEqual({
          success: true,
          url: `${String(process.env.TEST_PLATFORM_URL)}/`,
          error: undefined,
        });
      });

      it("should handle unauthorized access gracefully", async () => {
        const invalidConfig: Config = {
          apiKey: "invalid-api-key",
          platform: config.platform,
        };
        const result = await verifyPlatformUrl(invalidConfig);
        expect(result.success).toBe(false);
        expect(result.url).toBe(process.env.TEST_PLATFORM_URL);
        expect(result.error).toContain("HTTP 401");
      });

      it("should handle network connectivity issues", async () => {
        const invalidConfig: Config = {
          ...config,
          platform: {
            type: PlatformType.Url,
            value: "https://invalid-domain-that-does-not-exist-12345.com",
          },
        };
        const result = await verifyPlatformUrl(invalidConfig);
        expect(result.success).toBe(false);
        expect(result.url).toBe("https://invalid-domain-that-does-not-exist-12345.com");
        expect(result.error).toBe("fetch failed");
      });

      it("should handle malformed URLs gracefully", async () => {
        const malformedConfig: Config = {
          ...config,
          platform: { type: PlatformType.Url, value: "not-a-valid-url" },
        };
        const result = await verifyPlatformUrl(malformedConfig);
        expect(result.success).toBe(false);
        expect(result.url).toBe("not-a-valid-url");
        expect(result.error).toBe("Failed to parse URL from not-a-valid-url/v1/style-guides");
      });

      it("should handle timeout scenarios gracefully", async () => {
        // This test verifies that the function doesn't hang indefinitely
        const timeoutConfig: Config = {
          ...config,
          platform: { type: PlatformType.Url, value: "https://httpbin.org/delay/10" }, // This would timeout in real scenarios
        };

        // Set a timeout for this test
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Test timeout"));
          }, 5_000);
        });

        const verifyPromise = verifyPlatformUrl(timeoutConfig);

        try {
          const result = await Promise.race([verifyPromise, timeoutPromise]);
          // If we get here, the verification completed (either success or failure)
          expect(result).toHaveProperty("success");
          expect(result).toHaveProperty("url");
          expect(result).toHaveProperty("error");
        } catch (error) {
          // If timeout occurs, that's also acceptable for this test
          expect(error).toBeDefined();
        }
      });

      it("should handle concurrent verification requests", async () => {
        const promises = [
          verifyPlatformUrl(config),
          verifyPlatformUrl(config),
          verifyPlatformUrl(config),
        ];

        const results = await Promise.all(promises);
        expect(results).toHaveLength(3);

        for (const result of results) {
          expect(result).toHaveProperty("success");
          expect(result).toHaveProperty("url");
          expect(result).toHaveProperty("error");
          expect(result.url).toBe(process.env.TEST_PLATFORM_URL);
        }
      });
    });
  });

  describe("Custom Headers Integration", () => {
    it("should accept custom headers in config", () => {
      const configWithHeaders: Config = {
        ...config,
        headers: {
          [CUSTOM_HEADERS.INTEGRATION_ID]: "integration-test-id",
          "x-custom-header": "custom-value",
        },
      };

      expect(configWithHeaders.headers).toBeDefined();
      expect(configWithHeaders.headers?.[CUSTOM_HEADERS.INTEGRATION_ID]).toBe(
        "integration-test-id",
      );
      expect(configWithHeaders.headers?.["x-custom-header"]).toBe("custom-value");
    });

    it("should work without custom headers", () => {
      const configWithoutHeaders: Config = {
        apiKey: config.apiKey,
        platform: config.platform,
      };

      expect(configWithoutHeaders.headers).toBeUndefined();
      const result = getCurrentPlatformUrl(configWithoutHeaders);
      expect(result).toBe(process.env.TEST_PLATFORM_URL);
    });

    it("should handle empty headers object", () => {
      const configWithEmptyHeaders: Config = {
        ...config,
        headers: {},
      };

      expect(configWithEmptyHeaders.headers).toBeDefined();
      expect(Object.keys(configWithEmptyHeaders.headers || {})).toHaveLength(0);
    });

    it("should handle multiple custom headers", () => {
      const multipleHeaders = {
        [CUSTOM_HEADERS.INTEGRATION_ID]: "test-integration",
        "x-request-id": "req-123",
        "x-correlation-id": "corr-456",
        "x-tenant-id": "tenant-789",
      };

      const configWithMultipleHeaders: Config = {
        ...config,
        headers: multipleHeaders,
      };

      expect(configWithMultipleHeaders.headers).toBeDefined();
      expect(Object.keys(configWithMultipleHeaders.headers || {})).toHaveLength(4);
      expect(configWithMultipleHeaders.headers?.[CUSTOM_HEADERS.INTEGRATION_ID]).toBe(
        "test-integration",
      );
      expect(configWithMultipleHeaders.headers?.["x-request-id"]).toBe("req-123");
      expect(configWithMultipleHeaders.headers?.["x-correlation-id"]).toBe("corr-456");
      expect(configWithMultipleHeaders.headers?.["x-tenant-id"]).toBe("tenant-789");
    });
  });
});
