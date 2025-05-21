import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  submitRewrite,
  submitCheck,
  submitRewriteAndGetResult,
  submitCheckAndGetResult,
} from '../../../src/api/demo.api';
import { makeRequest, pollWorkflowForResult } from '../../../src/utils/api';
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
  makeRequest: vi.fn(),
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

      vi.mocked(makeRequest).mockResolvedValueOnce(mockResponse);

      const result = await submitRewrite(mockRequest, mockApiKey);
      expect(result).toEqual(mockResponse);
      expect(makeRequest).toHaveBeenCalledWith(
        expect.stringContaining('/v1/rewrites/'),
        'POST',
        expect.any(FormData),
        mockApiKey,
      );
    });

    it('should submit a check', async () => {
      const mockResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Check workflow started successfully.',
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockResponse);

      const result = await submitCheck(mockRequest, mockApiKey);
      expect(result).toEqual(mockResponse);
      expect(makeRequest).toHaveBeenCalledWith(
        expect.stringContaining('/v1/checks/'),
        'POST',
        expect.any(FormData),
        mockApiKey,
      );
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

      vi.mocked(makeRequest).mockResolvedValueOnce(mockSubmitResponse);
      vi.mocked(pollWorkflowForResult).mockResolvedValueOnce(mockPolledResponse);

      const result = await submitRewriteAndGetResult(mockRequest, mockApiKey);
      expect(result).toEqual(mockPolledResponse.result);
    });

    it('should submit check and get result', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Check workflow started successfully.',
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

      vi.mocked(makeRequest).mockResolvedValueOnce(mockSubmitResponse);
      vi.mocked(pollWorkflowForResult).mockResolvedValueOnce(mockPolledResponse);

      const result = await submitCheckAndGetResult(mockRequest, mockApiKey);
      expect(result).toEqual(mockPolledResponse.result);
    });

    it('should handle rewrite polling failure', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Rewrite workflow started successfully.',
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockSubmitResponse);
      vi.mocked(pollWorkflowForResult).mockRejectedValueOnce(
        new Error(`Workflow failed with status: ${Status.Failed}`),
      );

      await expect(submitRewriteAndGetResult(mockRequest, mockApiKey)).rejects.toThrow(
        `Workflow failed with status: ${Status.Failed}`,
      );
    });

    it('should handle check polling failure', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Check workflow started successfully.',
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockSubmitResponse);
      vi.mocked(pollWorkflowForResult).mockRejectedValueOnce(
        new Error(`Workflow failed with status: ${Status.Failed}`),
      );

      await expect(submitCheckAndGetResult(mockRequest, mockApiKey)).rejects.toThrow(
        `Workflow failed with status: ${Status.Failed}`,
      );
    });

    it('should handle missing workflow ID for rewrite', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: '',
        message: 'Rewrite workflow started successfully.',
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockSubmitResponse);

      await expect(submitRewriteAndGetResult(mockRequest, mockApiKey)).rejects.toThrow(
        'No workflow_id received from initial rewrite request',
      );
    });

    it('should handle missing workflow ID for check', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: '',
        message: 'Check workflow started successfully.',
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockSubmitResponse);

      await expect(submitCheckAndGetResult(mockRequest, mockApiKey)).rejects.toThrow(
        'No workflow_id received from initial check request',
      );
    });
  });
});
