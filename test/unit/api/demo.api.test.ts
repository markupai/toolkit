import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitRewrite, check, rewrite } from '../../../src/api/demo/demo.api';
import { postData, pollWorkflowForResult } from '../../../src/utils/api';
import {
  AnalysisRequest,
  AnalysisSubmissionResponse,
  AnalysisSuccessResponse,
} from '../../../src/api/demo/demo.api.types';
import { DEMO_DEFAULTS } from '../../../src/api/demo/demo.api.defaults';
import { Status } from '../../../src/utils/api.types';

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
      dialect: DEMO_DEFAULTS.dialects.americanEnglish,
      tone: DEMO_DEFAULTS.tones.formal,
      styleGuide: DEMO_DEFAULTS.styleGuides.microsoft,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Operations', () => {
    it('should submit a rewrite', async () => {
      const mockResponse: AnalysisSubmissionResponse = {
        status: Status.Running,
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
        status: Status.Running,
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
        status: Status.Running,
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
            content_score: {
              error: null,
              duration: 0.01502,
              model: '',
              parameters: {
                dialect: null,
                tone: null,
                style_guide: null,
                max_words: null,
              },
              provider: '',
              repair_log: [],
              run_id: '01971243-c7ad-75cc-b2fb-7d9b4995e7d9',
              token_usage: {
                completion_tokens: -1,
                prompt_tokens: -1,
                total_tokens: -1,
              },
              workflow_id: mockWorkflowId,
              analysis: {
                avg_sentence_length: 20.96,
                avg_word_length: 4.92,
                complexity_score: 13.29,
                readability_score: 28.13,
                sentence_count: 28,
                vocabulary_score: 54.86,
                word_count: 587,
              },
              feedback: 'Low content quality. The text needs significant revision for better readability.',
              score: 0.0,
              suggestions: [
                'Use shorter sentences and simpler words to improve readability.',
                'Your text may be too complex. Consider simplifying vocabulary and sentence structure.',
              ],
              target_score: null,
            },
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

      const response = await rewrite(mockRequest, mockApiKey);
      expect(response).toEqual(mockPolledResponse);
    });

    it('should handle rewrite polling failure', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        status: Status.Failed,
        workflow_id: mockWorkflowId,
        message: 'Rewrite workflow started successfully.',
      };

      vi.mocked(postData).mockResolvedValueOnce(mockSubmitResponse);
      vi.mocked(pollWorkflowForResult).mockRejectedValueOnce(
        new Error(`Workflow failed with status: ${Status.Failed}`),
      );

      await expect(rewrite(mockRequest, mockApiKey)).rejects.toThrow(`Workflow failed with status: ${Status.Failed}`);
    });

    it('should handle missing workflow ID for rewrite', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        status: Status.Failed,
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
