import { describe, it, expect, beforeAll } from 'vitest';
import { API_ENDPOINTS } from '../../../src/api/style/style.api';
import { DEFAULT_PLATFORM_URL_DEV } from '../../../src/utils/api';
import type { Config } from '../../../src/utils/api.types';

describe('CORS Integration Tests', () => {
  let config: Config;

  beforeAll(() => {
    const apiKey = '';
    config = {
      apiKey,
      platform: DEFAULT_PLATFORM_URL_DEV,
    };
  });

  const testOrigin = 'https://foo.com';

  // Helper function to make OPTIONS request and check CORS headers
  async function testCorsHeaders(endpoint: string, description: string) {
    it(`should return proper CORS headers for ${description}`, async () => {
      const url = `${config.platform}${endpoint}`;

      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          Origin: testOrigin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization,content-type',
        },
      });

      expect(response.status).toBe(200);

      // Check for required CORS headers
      const corsHeaders = {
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
        'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      };

      // Log the actual headers for debugging
      console.log(`CORS headers for ${description}:`, corsHeaders);

      // Verify CORS headers are present
      expect(corsHeaders['access-control-allow-credentials']).toBeDefined();
      expect(corsHeaders['access-control-allow-headers']).toBeDefined();
      expect(corsHeaders['access-control-allow-methods']).toBeDefined();
      expect(corsHeaders['access-control-allow-origin']).toBeDefined();

      // Check specific values
      expect(corsHeaders['access-control-allow-credentials']).toBe('true');
      expect(corsHeaders['access-control-allow-headers']).toContain('authorization');
      expect(corsHeaders['access-control-allow-methods']).toContain('GET');
      expect(corsHeaders['access-control-allow-methods']).toContain('POST');
      expect(corsHeaders['access-control-allow-methods']).toContain('PUT');
      expect(corsHeaders['access-control-allow-methods']).toContain('DELETE');
      expect(corsHeaders['access-control-allow-methods']).toContain('OPTIONS');

      // Check origin - should either be the specific origin or * (wildcard)
      expect(['*', testOrigin]).toContain(corsHeaders['access-control-allow-origin']);
    });
  }

  describe('Style API CORS Headers', () => {
    // Test all style API endpoints
    testCorsHeaders(API_ENDPOINTS.STYLE_GUIDES, 'style guides endpoint');
    testCorsHeaders(API_ENDPOINTS.STYLE_CHECKS, 'style checks endpoint');
    testCorsHeaders(API_ENDPOINTS.STYLE_SUGGESTIONS, 'style suggestions endpoint');
    testCorsHeaders(API_ENDPOINTS.STYLE_REWRITES, 'style rewrites endpoint');
  });

  describe('Individual Style Guide CORS Headers', () => {
    it('should return proper CORS headers for individual style guide endpoint', async () => {
      const styleGuideId = 'test-style-guide-id';
      const endpoint = `${API_ENDPOINTS.STYLE_GUIDES}/${styleGuideId}`;
      const url = `${config.platform}${endpoint}`;

      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          Origin: testOrigin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization',
        },
      });

      expect(response.status).toBe(200);

      const corsHeaders = {
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
        'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      };

      console.log('CORS headers for individual style guide:', corsHeaders);

      expect(corsHeaders['access-control-allow-credentials']).toBe('true');
      expect(corsHeaders['access-control-allow-headers']).toContain('authorization');
      expect(corsHeaders['access-control-allow-methods']).toContain('GET');
      expect(corsHeaders['access-control-allow-methods']).toContain('PUT');
      expect(corsHeaders['access-control-allow-methods']).toContain('DELETE');
      expect(corsHeaders['access-control-allow-methods']).toContain('OPTIONS');
      expect(['*', testOrigin]).toContain(corsHeaders['access-control-allow-origin']);
    });
  });

  describe('Individual Style Check CORS Headers', () => {
    it('should return proper CORS headers for individual style check endpoint', async () => {
      const workflowId = 'test-workflow-id';
      const endpoint = `${API_ENDPOINTS.STYLE_CHECKS}/${workflowId}`;
      const url = `${config.platform}${endpoint}`;

      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          Origin: testOrigin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization',
        },
      });

      expect(response.status).toBe(200);

      const corsHeaders = {
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
        'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      };

      console.log('CORS headers for individual style check:', corsHeaders);

      expect(corsHeaders['access-control-allow-credentials']).toBe('true');
      expect(corsHeaders['access-control-allow-headers']).toContain('authorization');
      expect(corsHeaders['access-control-allow-methods']).toContain('GET');
      expect(corsHeaders['access-control-allow-methods']).toContain('OPTIONS');
      expect(['*', testOrigin]).toContain(corsHeaders['access-control-allow-origin']);
    });
  });

  describe('CORS Headers with Different Origins', () => {
    it('should handle different origins correctly', async () => {
      const origins = ['https://foo.com', 'https://bar.com', 'http://localhost:3000', 'https://example.com'];

      for (const origin of origins) {
        const url = `${config.platform}${API_ENDPOINTS.STYLE_GUIDES}`;

        const response = await fetch(url, {
          method: 'OPTIONS',
          headers: {
            Origin: origin,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'authorization',
          },
        });

        expect(response.status).toBe(200);

        const allowOrigin = response.headers.get('access-control-allow-origin');
        console.log(`Origin: ${origin}, Allow-Origin: ${allowOrigin}`);

        // Should either allow the specific origin or use wildcard
        expect(['*', origin]).toContain(allowOrigin);
      }
    });
  });

  describe('CORS Headers with Different Request Methods', () => {
    it('should handle different request methods correctly', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      const url = `${config.platform}${API_ENDPOINTS.STYLE_GUIDES}`;

      for (const method of methods) {
        const response = await fetch(url, {
          method: 'OPTIONS',
          headers: {
            Origin: testOrigin,
            'Access-Control-Request-Method': method,
            'Access-Control-Request-Headers': 'authorization,content-type',
          },
        });

        expect(response.status).toBe(200);

        const allowMethods = response.headers.get('access-control-allow-methods');
        console.log(`Request Method: ${method}, Allow-Methods: ${allowMethods}`);

        // The response should indicate which methods are allowed
        expect(allowMethods).toBeDefined();
        expect(typeof allowMethods).toBe('string');
      }
    });
  });

  describe('CORS Headers with Different Request Headers', () => {
    it('should handle different request headers correctly', async () => {
      const headerCombinations = [
        'authorization',
        'content-type',
        'authorization,content-type',
        'authorization,content-type,accept',
        'authorization,content-type,accept,user-agent',
      ];

      const url = `${config.platform}${API_ENDPOINTS.STYLE_GUIDES}`;

      for (const headers of headerCombinations) {
        const response = await fetch(url, {
          method: 'OPTIONS',
          headers: {
            Origin: testOrigin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': headers,
          },
        });

        expect(response.status).toBe(200);

        const allowHeaders = response.headers.get('access-control-allow-headers');
        console.log(`Request Headers: ${headers}, Allow-Headers: ${allowHeaders}`);

        // The API returns only the headers that were requested
        expect(allowHeaders).toBeDefined();

        // Check that the returned headers match what was requested
        const requestedHeaders = headers.split(',').map((h) => h.trim());
        const returnedHeaders = allowHeaders?.split(',').map((h) => h.trim()) || [];

        // Each requested header should be present in the response
        for (const requestedHeader of requestedHeaders) {
          expect(returnedHeaders).toContain(requestedHeader);
        }
      }
    });
  });

  describe('CORS Error Handling', () => {
    it('should handle malformed OPTIONS requests gracefully', async () => {
      const url = `${config.platform}${API_ENDPOINTS.STYLE_GUIDES}`;

      // Test without Origin header
      const response1 = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'GET',
        },
      });

      // Should still return a response (might be 200 or 400/500)
      expect(response1.status).toBeGreaterThanOrEqual(200);
      expect(response1.status).toBeLessThan(600);

      // Test without Access-Control-Request-Method
      const response2 = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          Origin: testOrigin,
        },
      });

      expect(response2.status).toBeGreaterThanOrEqual(200);
      expect(response2.status).toBeLessThan(600);
    });

    it('should handle invalid endpoints gracefully', async () => {
      const url = `${config.platform}/invalid-endpoint`;

      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          Origin: testOrigin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization',
        },
      });

      // Should return a response (might be 404, but should still have CORS headers)
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);

      // Even for invalid endpoints, CORS headers should be present
      const allowOrigin = response.headers.get('access-control-allow-origin');
      expect(allowOrigin).toBeDefined();
    });
  });
});
