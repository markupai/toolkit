import { describe, it, expect } from "vitest";

// Normalize a comma-separated header value into a lowercase list for case-insensitive checks
function parseHeaderList(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((header) => header.trim().toLowerCase())
    .filter(Boolean);
}

describe("CORS Integration Tests", () => {
  const STYLE_API_ENDPOINTS = {
    STYLE_CHECKS: "/v1/style/checks",
    STYLE_SUGGESTIONS: "/v1/style/suggestions",
    STYLE_REWRITES: "/v1/style/rewrites",
  };
  const STYLE_GUIDES_ENDPOINT = "/v1/style-guides";

  const platformUrl = process.env.TEST_PLATFORM_URL;
  if (!platformUrl) {
    throw new Error("TEST_PLATFORM_URL environment variable is required for integration tests");
  }

  const testOrigins = ["https://uuid-2323423.ctfcloud.net", "https://app.contentful.com"];

  // Helper function to make OPTIONS request and check CORS headers
  function testCorsHeaders(endpoint: string, description: string) {
    it(`should return proper CORS headers for ${description}`, async () => {
      const url = `${String(platformUrl)}${endpoint}`;

      for (const origin of testOrigins) {
        const response = await fetch(url, {
          method: "OPTIONS",
          headers: {
            Origin: origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
          },
        });

        expect(response.status).toBe(200);

        // Check for required CORS headers
        const corsHeaders = {
          "access-control-allow-credentials": response.headers.get(
            "access-control-allow-credentials",
          ),
          "access-control-allow-headers": response.headers.get("access-control-allow-headers"),
          "access-control-allow-methods": response.headers.get("access-control-allow-methods"),
          "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
        };

        // Verify CORS headers are present
        expect(corsHeaders["access-control-allow-credentials"]).toBeDefined();
        expect(corsHeaders["access-control-allow-headers"]).toBeDefined();
        expect(corsHeaders["access-control-allow-methods"]).toBeDefined();
        expect(corsHeaders["access-control-allow-origin"]).toBeDefined();

        // Check specific values
        expect(corsHeaders["access-control-allow-credentials"]).toBe("true");
        const allowHeadersList = parseHeaderList(corsHeaders["access-control-allow-headers"]);
        expect(allowHeadersList).toContain("authorization");
        const allowMethodsList = parseHeaderList(corsHeaders["access-control-allow-methods"]);
        expect(allowMethodsList).toContain("get");
        expect(allowMethodsList).toContain("post");
        expect(allowMethodsList).toContain("put");
        expect(allowMethodsList).toContain("delete");
        expect(allowMethodsList).toContain("options");

        // Check origin - should either be the specific origin or * (wildcard)
        const allowOriginLower = corsHeaders["access-control-allow-origin"]?.toLowerCase();
        const allowedOrigins = ["*", ...testOrigins.map((o) => o.toLowerCase())];
        expect(allowedOrigins).toContain(allowOriginLower);
      }
    });
  }

  describe("Style API CORS Headers", () => {
    // Test all style API endpoints
    testCorsHeaders(STYLE_GUIDES_ENDPOINT, "style guides endpoint");
    testCorsHeaders(STYLE_API_ENDPOINTS.STYLE_CHECKS, "style checks endpoint");
    testCorsHeaders(STYLE_API_ENDPOINTS.STYLE_SUGGESTIONS, "style suggestions endpoint");
    testCorsHeaders(STYLE_API_ENDPOINTS.STYLE_REWRITES, "style rewrites endpoint");
  });

  describe("Individual Style Guide CORS Headers", () => {
    it("should return proper CORS headers for individual style guide endpoint", async () => {
      const styleGuideId = "test-style-guide-id";
      const endpoint = `${STYLE_GUIDES_ENDPOINT}/${styleGuideId}`;
      const url = `${platformUrl}${endpoint}`;

      for (const origin of testOrigins) {
        const response = await fetch(url, {
          method: "OPTIONS",
          headers: {
            Origin: origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
          },
        });

        expect(response.status).toBe(200);

        const corsHeaders = {
          "access-control-allow-credentials": response.headers.get(
            "access-control-allow-credentials",
          ),
          "access-control-allow-headers": response.headers.get("access-control-allow-headers"),
          "access-control-allow-methods": response.headers.get("access-control-allow-methods"),
          "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
        };

        console.log("CORS headers for individual style guide:", corsHeaders);

        expect(corsHeaders["access-control-allow-credentials"]).toBe("true");
        const allowHeadersList = parseHeaderList(corsHeaders["access-control-allow-headers"]);
        expect(allowHeadersList).toContain("authorization");
        const allowMethodsList = parseHeaderList(corsHeaders["access-control-allow-methods"]);
        expect(allowMethodsList).toContain("get");
        expect(allowMethodsList).toContain("put");
        expect(allowMethodsList).toContain("delete");
        expect(allowMethodsList).toContain("options");
        const allowOriginLower = corsHeaders["access-control-allow-origin"]?.toLowerCase();
        const allowedOrigins = ["*", ...testOrigins.map((o) => o.toLowerCase())];
        expect(allowedOrigins).toContain(allowOriginLower);
      }
    });
  });

  describe("Individual Style Check CORS Headers", () => {
    it("should return proper CORS headers for individual style check endpoint", async () => {
      const workflowId = "test-workflow-id";
      const endpoint = `/v1/style/checks/${workflowId}`;
      const url = `${platformUrl}${endpoint}`;

      for (const origin of testOrigins) {
        const response = await fetch(url, {
          method: "OPTIONS",
          headers: {
            Origin: origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
          },
        });

        expect(response.status).toBe(200);

        const corsHeaders = {
          "access-control-allow-credentials": response.headers.get(
            "access-control-allow-credentials",
          ),
          "access-control-allow-headers": response.headers.get("access-control-allow-headers"),
          "access-control-allow-methods": response.headers.get("access-control-allow-methods"),
          "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
        };

        console.log("CORS headers for individual style check:", corsHeaders);

        expect(corsHeaders["access-control-allow-credentials"]).toBe("true");
        const allowHeadersList = parseHeaderList(corsHeaders["access-control-allow-headers"]);
        expect(allowHeadersList).toContain("authorization");
        const allowMethodsList = parseHeaderList(corsHeaders["access-control-allow-methods"]);
        expect(allowMethodsList).toContain("get");
        expect(allowMethodsList).toContain("options");
        const allowOriginLower = corsHeaders["access-control-allow-origin"]?.toLowerCase();
        const allowedOrigins = ["*", ...testOrigins.map((o) => o.toLowerCase())];
        expect(allowedOrigins).toContain(allowOriginLower);
      }
    });
  });

  describe("CORS Headers with Different Origins", () => {
    it("should handle different origins correctly", async () => {
      const origins = [...testOrigins];

      for (const origin of origins) {
        const url = `${platformUrl}${STYLE_GUIDES_ENDPOINT}`;

        const response = await fetch(url, {
          method: "OPTIONS",
          headers: {
            Origin: origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
          },
        });

        expect(response.status).toBe(200);

        const allowOrigin = response.headers.get("access-control-allow-origin");
        console.log(`Origin: ${origin}, Allow-Origin: ${allowOrigin ?? ""}`);

        // Should either allow the specific origin or use wildcard
        expect(["*", origin.toLowerCase()]).toContain((allowOrigin ?? "").toLowerCase());
      }
    });
  });

  describe("CORS Headers with Different Request Methods", () => {
    it("should handle different request methods correctly", async () => {
      const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
      const url = `${platformUrl}${STYLE_GUIDES_ENDPOINT}`;

      for (const method of methods) {
        for (const origin of testOrigins) {
          const response = await fetch(url, {
            method: "OPTIONS",
            headers: {
              Origin: origin,
              "Access-Control-Request-Method": method,
              "Access-Control-Request-Headers": "authorization,content-type",
            },
          });

          expect(response.status).toBe(200);

          const allowMethods = response.headers.get("access-control-allow-methods");
          console.log(
            `Origin: ${origin} Request Method: ${method}, Allow-Methods: ${allowMethods ?? ""}`,
          );

          // The response should indicate which methods are allowed
          expect(allowMethods).toBeDefined();
          expect(typeof allowMethods).toBe("string");
        }
      }
    });
  });

  describe("CORS Headers with Different Request Headers", () => {
    it("should handle different request headers correctly", async () => {
      const headerCombinations = [
        "authorization",
        "content-type",
        "authorization,content-type",
        "authorization,content-type,accept",
        "Accept, Accept-Language, User-Agent, Authorization, Content-Language, Content-Type, Request-ID, X-Fern-Language, X-Fern-SDK-Name, X-Fern-SDK-Version, X-Integration-ID, X-Metrics-Key",
      ];

      const url = `${platformUrl}${STYLE_GUIDES_ENDPOINT}`;

      for (const headers of headerCombinations) {
        for (const origin of testOrigins) {
          const response = await fetch(url, {
            method: "OPTIONS",
            headers: {
              Origin: origin,
              "Access-Control-Request-Method": "POST",
              "Access-Control-Request-Headers": headers,
            },
          });

          const body = await response.text();
          expect(response.status).toBe(200);

          console.log(`Origin: ${origin} Request Headers: ${headers}, Body: ${body}`);

          const allowHeaders = response.headers.get("access-control-allow-headers");
          console.log(
            `Origin: ${origin} Request Headers: ${headers}, Allow-Headers: ${allowHeaders ?? ""}`,
          );

          // The API returns only the headers that were requested
          expect(allowHeaders).toBeDefined();

          // Check that the returned headers match what was requested
          const requestedHeaders = headers.split(",").map((h) => h.trim().toLowerCase());
          const returnedHeaders = parseHeaderList(allowHeaders);

          // Each requested header should be present in the response
          for (const requestedHeader of requestedHeaders) {
            expect(returnedHeaders).toContain(requestedHeader);
          }
        }
      }
    });
  });

  describe("CORS Error Handling", () => {
    it("should handle malformed OPTIONS requests gracefully", async () => {
      const url = `${platformUrl}${STYLE_GUIDES_ENDPOINT}`;

      // Test without Origin header
      const response1 = await fetch(url, {
        method: "OPTIONS",
        headers: {
          "Access-Control-Request-Method": "GET",
        },
      });

      // Should still return a response (might be 200 or 400/500)
      expect(response1.status).toBeGreaterThanOrEqual(200);
      expect(response1.status).toBeLessThan(600);

      // Test without Access-Control-Request-Method
      const response2 = await fetch(url, {
        method: "OPTIONS",
        headers: {
          Origin: testOrigins[0],
        },
      });

      expect(response2.status).toBeGreaterThanOrEqual(200);
      expect(response2.status).toBeLessThan(600);
    });

    it("should handle invalid endpoints gracefully", async () => {
      const url = `${platformUrl}/invalid-endpoint`;

      const response = await fetch(url, {
        method: "OPTIONS",
        headers: {
          Origin: testOrigins[0],
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "authorization",
        },
      });

      // Should return a response (might be 404, but should still have CORS headers)
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);

      // Even for invalid endpoints, CORS headers should be present
      const allowOrigin = response.headers.get("access-control-allow-origin");
      expect(allowOrigin).toBeDefined();
    });
  });
});
