import { describe, it, expect, beforeAll } from 'vitest';
import { Endpoint } from '../../src/main';
import { Dialect, AnalysisRequest, Tone, StyleGuide } from '../../src/types/rewrite';

describe('Check Integration Tests', () => {
  let endpoint: Endpoint;

  const mockCheckRequest: AnalysisRequest = {
    content: 'This is a test content that needs to be checked.',
    guidanceSettings: {
      dialect: Dialect.AmericanEnglish,
      tone: Tone.Formal,
      styleGuide: StyleGuide.Microsoft,
    },
  };

  const invalidRequest: AnalysisRequest = {
    content: '',
    guidanceSettings: {
      dialect: Dialect.AmericanEnglish,
      tone: Tone.Formal,
      styleGuide: StyleGuide.Microsoft,
    },
  };

  beforeAll(() => {
    if (!process.env.ACROLINX_API_KEY) {
      throw new Error('ACROLINX_API_KEY environment variable is required for integration tests');
    }

    endpoint = new Endpoint({
      platformUrl: process.env.ACROLINX_PLATFORM_URL || 'https://api.acrolinx.com',
      apiKey: process.env.ACROLINX_API_KEY,
    });
  });

  it('should successfully submit check request', async () => {
    const result = await endpoint.submitCheck(mockCheckRequest);

    expect(result).toBeDefined();
    expect(result.workflow_id).toBeDefined();
    expect(typeof result.workflow_id).toBe('string');
    expect(result.message).toBeDefined();
    expect(typeof result.message).toBe('string');
  });

  it('should successfully complete check content and poll workflow', async () => {
    const result = await endpoint.submitCheckAndGetResult(mockCheckRequest);

    expect(result).toBeDefined();
    expect(result.merged_text).toBeDefined();
    expect(result.errors).toBeDefined();
    expect(result.final_scores).toBeDefined();
    expect(result.initial_scores).toBeDefined();
    expect(result.original_text).toBeDefined();
    expect(result.results).toBeDefined();
  });

  it('should handle invalid API key', async () => {
    const invalidEndpoint = new Endpoint({
      platformUrl: process.env.ACROLINX_PLATFORM_URL || 'https://api.acrolinx.com',
      apiKey: 'invalid-api-key',
    });

    await expect(invalidEndpoint.submitCheck(mockCheckRequest)).rejects.toThrow();
  });

  it('should handle invalid content', async () => {
    await expect(endpoint.submitCheck(invalidRequest)).rejects.toThrow();
  });
});
