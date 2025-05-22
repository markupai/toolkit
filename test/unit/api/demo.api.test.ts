import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitRewrite, check, rewrite } from '../../../src/api/demo.api';
import { postData, pollWorkflowForResult } from '../../../src/utils/api';
import {
  Status,
  Dialect,
  Tone,
  StyleGuide,
  AnalysisRequest,
  AnalysisSubmissionResponse,
  AnalysisSuccessResponse,
} from '../../../src/api/style';

// Mock the utility functions
vi.mock('../../../src/utils/api', () => ({
  postData: vi.fn(),
  pollWorkflowForResult: vi.fn(),
}));

describe('Demo API Unit Tests', () => {
  const mockApiKey = 'test-api-key';
  const mockWorkflowId = 'test-workflow-id';
  const mockRequest: AnalysisRequest = {
    content: 'test content',
    guidanceSettings: {
      dialect: Dialect.AmericanEnglish,
      tone: Tone.Formal,
      styleGuide: StyleGuide.Microsoft,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Operations', () => {
    it('should submit a rewrite', async () => {
      const mockResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Rewrite workflow started successfully.',
      };

      vi.mocked(postData).mockResolvedValueOnce(mockResponse);

      const result = await submitRewrite(mockRequest, mockApiKey);
      expect(result).toEqual(mockResponse);
      expect(postData).toHaveBeenCalledWith(expect.stringContaining('/v1/rewrites/'), expect.any(FormData), mockApiKey);
    });

    it('should submit a check', async () => {
      const mockResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Check workflow started successfully.',
      };

      vi.mocked(postData).mockResolvedValueOnce(mockResponse);

      const result = await check(mockRequest, mockApiKey);
      expect(result).toEqual(mockResponse);
      expect(postData).toHaveBeenCalledWith(expect.stringContaining('/v1/checks/'), expect.any(FormData), mockApiKey);
    });
  });

  describe('Operations with Polling', () => {
    it('should submit rewrite and get result', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Rewrite workflow started successfully.',
      };

      const mockPolledResponse: AnalysisSuccessResponse = {
        status: Status.Completed,
        workflow_id: mockWorkflowId,
        result: {
          merged_text: 'test result',
          original_text: 'test content',
          errors: [],
          final_scores: {
            acrolinx_score: null,
            content_score: null,
          },
          initial_scores: {
            acrolinx_score: null,
            content_score: null,
          },
          results: [],
        },
      };

      vi.mocked(postData).mockResolvedValueOnce(mockSubmitResponse);
      vi.mocked(pollWorkflowForResult).mockResolvedValueOnce(mockPolledResponse);

      const result = await rewrite(mockRequest, mockApiKey);
      expect(result).toEqual(mockPolledResponse.result);
    });

    it('should handle rewrite polling failure', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Rewrite workflow started successfully.',
      };

      vi.mocked(postData).mockResolvedValueOnce(mockSubmitResponse);
      vi.mocked(pollWorkflowForResult).mockRejectedValueOnce(
        new Error(`Workflow failed with status: ${Status.Failed}`),
      );

      await expect(rewrite(mockRequest, mockApiKey)).rejects.toThrow(
        `Workflow failed with status: ${Status.Failed}`,
      );
    });

    it('should handle missing workflow ID for rewrite', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: '',
        message: 'Rewrite workflow started successfully.',
      };

      vi.mocked(postData).mockResolvedValueOnce(mockSubmitResponse);

      await expect(rewrite(mockRequest, mockApiKey)).rejects.toThrow(
        'No workflow_id received from initial rewrite request',
      );
    });
  });
});
