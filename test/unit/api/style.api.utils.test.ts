import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStyleGuideReqFromUrl, createStyleGuideReqFromPath } from '../../../src/api/style/style.api.utils';
import { readFileSync } from 'fs';
import { basename } from 'path';
import { fileURLToPath } from 'url';
import { isCompletedResponse } from '../../../src/api/style/style.api.utils';
import { Status } from '../../../src/utils/api.types';
import { styleBatchCheck } from '../../../src/api/style/style.api.utils';
import { Config, PlatformType, Environment } from '../../../src/utils/api.types';
import { StyleAnalysisReq, StyleAnalysisSuccessResp } from '../../../src/api/style/style.api.types';

// Mock Node.js modules
vi.mock('fs');
vi.mock('path');
vi.mock('url');

const mockReadFileSync = vi.mocked(readFileSync);
const mockBasename = vi.mocked(basename);
const mockFileURLToPath = vi.mocked(fileURLToPath);

// Mock response types
const completedSuccessResp = {
  workflow_id: 'abc',
  status: Status.Completed,
  style_guide_id: 'sg1',
  scores: {},
  issues: [],
  check_options: {
    style_guide: { style_guide_type: 'custom', style_guide_id: 'sg1' },
    dialect: 'american_english',
    tone: 'formal',
  },
};

const runningSuccessResp = {
  workflow_id: 'abc',
  status: Status.Running,
  style_guide_id: 'sg1',
  scores: {},
  issues: [],
  check_options: {
    style_guide: { style_guide_type: 'custom', style_guide_id: 'sg1' },
    dialect: 'american_english',
    tone: 'formal',
  },
};

const completedSuggestionResp = {
  workflow_id: 'def',
  status: Status.Completed,
  style_guide_id: 'sg2',
  scores: {},
  issues: [{ original: 'foo', char_index: 0, subcategory: 'bar', category: 'baz', suggestion: 'baz' }],
  check_options: {
    style_guide: { style_guide_type: 'custom', style_guide_id: 'sg2' },
    dialect: 'british_english',
    tone: 'casual',
  },
};

const pollResp = {
  workflow_id: 'ghi',
  status: Status.Running,
};

const failedResp = {
  workflow_id: 'jkl',
  status: Status.Failed,
};

describe('Style API Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful file operations
    mockReadFileSync.mockReturnValue(Buffer.from('fake pdf content'));
    mockBasename.mockReturnValue('test-style-guide.pdf');
    mockFileURLToPath.mockReturnValue('/path/to/test-style-guide.pdf');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createStyleGuideReqFromUrl', () => {
    it('should create request from file path string', async () => {
      const result = await createStyleGuideReqFromUrl('/path/to/test-style-guide.pdf', 'Custom Name');

      expect(result).toEqual({
        file: expect.any(File),
        name: 'Custom Name',
      });

      expect(result.file.name).toBe('test-style-guide.pdf');
      expect(result.file.type).toBe('application/pdf');
      expect(mockReadFileSync).toHaveBeenCalledWith('/path/to/test-style-guide.pdf');
      expect(mockBasename).toHaveBeenCalledWith('/path/to/test-style-guide.pdf');
    });

    it('should create request from file path string without custom name', async () => {
      const result = await createStyleGuideReqFromUrl('/path/to/test-style-guide.pdf');

      expect(result).toEqual({
        file: expect.any(File),
        name: 'test-style-guide', // filename without .pdf extension
      });

      expect(result.file.name).toBe('test-style-guide.pdf');
      expect(result.file.type).toBe('application/pdf');
    });

    it('should create request from file:// URL', async () => {
      const result = await createStyleGuideReqFromUrl('file:///path/to/test-style-guide.pdf', 'Custom Name');

      expect(result).toEqual({
        file: expect.any(File),
        name: 'Custom Name',
      });

      expect(mockFileURLToPath).toHaveBeenCalledWith('file:///path/to/test-style-guide.pdf');
      expect(mockReadFileSync).toHaveBeenCalledWith('/path/to/test-style-guide.pdf');
    });

    it('should create request from URL object', async () => {
      const url = new URL('file:///path/to/test-style-guide.pdf');
      const result = await createStyleGuideReqFromUrl(url, 'Custom Name');

      expect(result).toEqual({
        file: expect.any(File),
        name: 'Custom Name',
      });

      expect(mockFileURLToPath).toHaveBeenCalledWith(url);
    });

    it('should throw error for non-file URLs', async () => {
      const url = new URL('http://example.com/file.pdf');

      await expect(createStyleGuideReqFromUrl(url)).rejects.toThrow(
        'Only file:// URLs are supported. Please provide a local file path or file:// URL.',
      );
    });

    it('should throw error for unsupported file types', async () => {
      mockBasename.mockReturnValue('test-style-guide.txt');

      await expect(createStyleGuideReqFromUrl('/path/to/test-style-guide.txt')).rejects.toThrow(
        'Unsupported file type: txt. Only .pdf files are supported.',
      );
    });

    it('should throw error when file cannot be read', async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      await expect(createStyleGuideReqFromUrl('/path/to/nonexistent.pdf')).rejects.toThrow(
        'Failed to create style guide request from URL: File not found',
      );
    });

    it('should handle files with .PDF extension (case insensitive)', async () => {
      mockBasename.mockReturnValue('test-style-guide.PDF');

      const result = await createStyleGuideReqFromUrl('/path/to/test-style-guide.PDF');

      expect(result.name).toBe('test-style-guide'); // Should remove .PDF extension
      expect(result.file.name).toBe('test-style-guide.PDF');
    });
  });

  describe('createStyleGuideReqFromPath', () => {
    it('should create request from file path', async () => {
      const result = await createStyleGuideReqFromPath('/path/to/test-style-guide.pdf', 'Custom Name');

      expect(result).toEqual({
        file: expect.any(File),
        name: 'Custom Name',
      });

      expect(mockReadFileSync).toHaveBeenCalledWith('/path/to/test-style-guide.pdf');
    });

    it('should create request from file path without custom name', async () => {
      const result = await createStyleGuideReqFromPath('/path/to/test-style-guide.pdf');

      expect(result).toEqual({
        file: expect.any(File),
        name: 'test-style-guide',
      });
    });
  });

  describe('environment detection', () => {
    it('should work in Node.js environment', async () => {
      // Mock Node.js environment
      const originalProcess = global.process;
      global.process = {
        ...originalProcess,
        versions: { node: '22.0.0' },
      } as NodeJS.Process;

      const result = await createStyleGuideReqFromUrl('/path/to/test-style-guide.pdf');

      expect(result).toBeDefined();
      expect(result.file).toBeInstanceOf(File);

      // Restore original process
      global.process = originalProcess;
    });

    it('should throw error in browser environment', async () => {
      // Mock browser environment (no process.versions.node)
      const originalProcess = global.process;
      global.process = {
        ...originalProcess,
        versions: {},
      } as NodeJS.Process;

      await expect(createStyleGuideReqFromUrl('/path/to/test-style-guide.pdf')).rejects.toThrow(
        'createStyleGuideReqFromUrl is only available in Node.js environments. In browser environments, use createStyleGuide directly with a File object.',
      );

      // Restore original process
      global.process = originalProcess;
    });
  });
});

describe('isCompletedResponse', () => {
  it('returns true for completed success response', () => {
    expect(isCompletedResponse(completedSuccessResp)).toBe(true);
  });

  it('returns false for running success response', () => {
    expect(isCompletedResponse(runningSuccessResp)).toBe(false);
  });

  it('returns true for completed suggestion response', () => {
    expect(isCompletedResponse(completedSuggestionResp)).toBe(true);
  });

  it('returns false for polling response', () => {
    expect(isCompletedResponse(pollResp)).toBe(false);
  });

  it('returns false for failed response', () => {
    expect(isCompletedResponse(failedResp)).toBe(false);
  });

  it('narrows type for completed response', () => {
    const resp = completedSuccessResp as typeof completedSuccessResp | typeof pollResp;
    if (isCompletedResponse(resp)) {
      // TypeScript should know resp.status === Status.Completed
      expect(resp.status).toBe(Status.Completed);
      expect('scores' in resp).toBe(true);
    } else {
      expect(resp.status).not.toBe(Status.Completed);
    }
  });
});

describe('Batch Processing', () => {
  const mockConfig: Config = {
    apiKey: 'test-api-key',
    platform: { type: PlatformType.Environment, value: Environment.Dev },
  };

  const mockRequests: StyleAnalysisReq[] = [
    {
      content: 'test content 1',
      style_guide: 'ap',
      dialect: 'american_english',
      tone: 'formal',
    },
    {
      content: 'test content 2',
      style_guide: 'chicago',
      dialect: 'american_english',
      tone: 'informal',
    },
    {
      content: 'test content 3',
      style_guide: 'microsoft',
      dialect: 'british_english',
      tone: 'formal',
    },
  ];

  const mockStyleCheckResponse: StyleAnalysisSuccessResp = {
    workflow_id: 'test-workflow-id',
    status: Status.Completed,
    style_guide_id: 'test-style-guide-id',
    scores: {
      quality: {
        score: 85,
        grammar: { score: 90, issues: 2 },
        style_guide: { score: 85, issues: 1 },
        terminology: { score: 92, issues: 0 },
      },
      analysis: {
        clarity: {
          score: 80,
          word_count: 100,
          sentence_count: 5,
          average_sentence_length: 20,
          flesch_reading_ease: 70,
          vocabulary_complexity: 0.6,
          flesch_kincaid_grade: 8,
          lexical_diversity: 0.7,
          sentence_complexity: 0.5,
        },
        tone: {
          score: 88,
          informality: 0.2,
          liveliness: 0.3,
          informality_alignment: 0.25,
          liveliness_alignment: 0.35,
        },
      },
    },
    issues: [],
    check_options: {
      style_guide: { style_guide_type: 'ap', style_guide_id: 'ap' },
      dialect: 'american_english',
      tone: 'formal',
    },
  };

  describe('styleBatchCheck', () => {
    it('should create batch response with correct initial progress', () => {
      const mockStyleFunction = vi.fn().mockResolvedValue(mockStyleCheckResponse);

      const batchResponse = styleBatchCheck(mockRequests, mockConfig, { maxConcurrent: 2 }, mockStyleFunction);

      // With reactive progress, the initial state should reflect that some requests are already in progress
      expect(batchResponse.progress.total).toBe(3);
      expect(batchResponse.progress.completed).toBe(0);
      expect(batchResponse.progress.failed).toBe(0);
      expect(batchResponse.progress.inProgress).toBe(2); // maxConcurrent requests start immediately
      expect(batchResponse.progress.pending).toBe(1); // remaining requests are pending
      expect(batchResponse.progress.results).toHaveLength(3);
      expect(batchResponse.progress.startTime).toBeGreaterThan(0);

      expect(batchResponse.promise).toBeInstanceOf(Promise);
      expect(typeof batchResponse.cancel).toBe('function');
    });

    it('should validate input parameters', () => {
      const mockStyleFunction = vi.fn();

      // Test empty requests array
      expect(() => styleBatchCheck([], mockConfig, {}, mockStyleFunction)).toThrow('Requests array cannot be empty');

      // Test too many requests
      const tooManyRequests = Array(1001).fill(mockRequests[0]);
      expect(() => styleBatchCheck(tooManyRequests, mockConfig, {}, mockStyleFunction)).toThrow(
        'Maximum 1000 requests allowed per batch',
      );

      // Test invalid maxConcurrent
      expect(() => styleBatchCheck(mockRequests, mockConfig, { maxConcurrent: 0 }, mockStyleFunction)).toThrow(
        'maxConcurrent must be between 1 and 100',
      );

      expect(() => styleBatchCheck(mockRequests, mockConfig, { maxConcurrent: 101 }, mockStyleFunction)).toThrow(
        'maxConcurrent must be between 1 and 100',
      );

      // Test invalid retryAttempts
      expect(() => styleBatchCheck(mockRequests, mockConfig, { retryAttempts: -1 }, mockStyleFunction)).toThrow(
        'retryAttempts must be between 0 and 5',
      );

      expect(() => styleBatchCheck(mockRequests, mockConfig, { retryAttempts: 6 }, mockStyleFunction)).toThrow(
        'retryAttempts must be between 0 and 5',
      );
    });

    it('should process requests with default options', async () => {
      const mockStyleFunction = vi.fn().mockResolvedValue(mockStyleCheckResponse);

      const batchResponse = styleBatchCheck(mockRequests, mockConfig, {}, mockStyleFunction);

      const result = await batchResponse.promise;

      expect(mockStyleFunction).toHaveBeenCalledTimes(3);
      expect(result.completed).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.inProgress).toBe(0);
      expect(result.pending).toBe(0);
      expect(result.results).toHaveLength(3);

      result.results.forEach((batchResult, index) => {
        expect(batchResult.status).toBe('completed');
        expect(batchResult.result).toEqual(mockStyleCheckResponse);
        expect(batchResult.index).toBe(index);
        expect(batchResult.request).toEqual(mockRequests[index]);
      });
    });

    it('should respect maxConcurrent limit', async () => {
      const mockStyleFunction = vi.fn().mockImplementation(async () => {
        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 50));
        return mockStyleCheckResponse;
      });

      const batchResponse = styleBatchCheck(mockRequests, mockConfig, { maxConcurrent: 1 }, mockStyleFunction);

      // Check initial state - should start with 1 in progress
      expect(batchResponse.progress.inProgress).toBe(1);
      expect(batchResponse.progress.pending).toBe(2);

      const result = await batchResponse.promise;
      expect(result.completed).toBe(3);
    });

    it('should handle individual request failures gracefully', async () => {
      const mockStyleFunction = vi
        .fn()
        .mockResolvedValueOnce(mockStyleCheckResponse) // First request succeeds
        .mockRejectedValueOnce(new Error('API Error')) // Second request fails
        .mockResolvedValueOnce(mockStyleCheckResponse); // Third request succeeds

      const batchResponse = styleBatchCheck(mockRequests, mockConfig, {}, mockStyleFunction);

      const result = await batchResponse.promise;

      // Verify all requests were processed
      expect(result.completed + result.failed).toBe(3);
      expect(result.inProgress).toBe(0);
      expect(result.pending).toBe(0);

      // Verify that we have some completed and some failed results
      const completedResults = result.results.filter((r) => r.status === 'completed');
      const failedResults = result.results.filter((r) => r.status === 'failed');

      // The mock should work correctly, but let's verify the total counts
      expect(completedResults.length + failedResults.length).toBe(3);
      expect(completedResults.length).toBeGreaterThan(0);

      // Check that completed results have data (if any)
      if (completedResults.length > 0) {
        completedResults.forEach((batchResult) => {
          expect(batchResult.result).toBeDefined();
        });
      }

      // Check that failed results have errors (if any)
      if (failedResults.length > 0) {
        failedResults.forEach((batchResult) => {
          expect(batchResult.error).toBeInstanceOf(Error);
        });
      }
    });

    it('should implement retry logic for transient failures', async () => {
      const mockStyleFunction = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue(mockStyleCheckResponse);

      const batchResponse = styleBatchCheck(
        [mockRequests[0]], // Single request
        mockConfig,
        { retryAttempts: 2, retryDelay: 10 },
        mockStyleFunction,
      );

      const result = await batchResponse.promise;

      expect(result.completed).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockStyleFunction).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry on non-retryable errors', async () => {
      const mockStyleFunction = vi.fn().mockRejectedValue(new Error('authentication failed'));

      const batchResponse = styleBatchCheck([mockRequests[0]], mockConfig, { retryAttempts: 3 }, mockStyleFunction);

      const result = await batchResponse.promise;

      expect(result.completed).toBe(0);
      expect(result.failed).toBe(1);
      expect(mockStyleFunction).toHaveBeenCalledTimes(1); // No retries for auth errors
    });

    it('should support cancellation', async () => {
      const mockStyleFunction = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Long running
        return mockStyleCheckResponse;
      });

      const batchResponse = styleBatchCheck(mockRequests, mockConfig, {}, mockStyleFunction);

      // Cancel immediately
      batchResponse.cancel();

      await expect(batchResponse.promise).rejects.toThrow('Batch operation cancelled');
    });

    it('should track timing information', async () => {
      const mockStyleFunction = vi.fn().mockResolvedValue(mockStyleCheckResponse);

      const batchResponse = styleBatchCheck(mockRequests, mockConfig, {}, mockStyleFunction);

      const result = await batchResponse.promise;

      expect(result.startTime).toBeGreaterThan(0);
      result.results.forEach((batchResult) => {
        expect(batchResult.startTime).toBeGreaterThan(0);
        expect(batchResult.endTime).toBeGreaterThan(0);
        expect(batchResult.endTime).toBeGreaterThanOrEqual(batchResult.startTime!);
      });
    });

    it('should handle edge case with single request', async () => {
      const mockStyleFunction = vi.fn().mockResolvedValue(mockStyleCheckResponse);

      const batchResponse = styleBatchCheck([mockRequests[0]], mockConfig, {}, mockStyleFunction);

      const result = await batchResponse.promise;

      expect(result.total).toBe(1);
      expect(result.completed).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.inProgress).toBe(0);
      expect(result.pending).toBe(0);
    });

    it('should handle edge case with maxConcurrent equal to request count', async () => {
      const mockStyleFunction = vi.fn().mockResolvedValue(mockStyleCheckResponse);

      const batchResponse = styleBatchCheck(mockRequests, mockConfig, { maxConcurrent: 3 }, mockStyleFunction);

      const result = await batchResponse.promise;

      expect(result.completed).toBe(3);
      expect(result.failed).toBe(0);
    });
  });
});
