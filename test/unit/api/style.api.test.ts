import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listStyleGuides,
  createStyleGuide,
  getStyleGuide,
  updateStyleGuide,
  deleteStyleGuide,
  submitStyleCheck,
  submitStyleSuggestion,
  submitStyleRewrite,
  submitStyleCheckAndGetResult,
  submitStyleSuggestionAndGetResult,
  submitStyleRewriteAndGetResult,
} from '../../../src/api/style.api';
import { makeRequest, pollWorkflowForResult } from '../../../src/utils/api';
import {
  Status,
  Dialect,
  Tone,
  AnalysisSubmissionResponse,
  AnalysisSuccessResponse,
  CreateStyleGuideData,
  StyleCheckRequest,
  StyleSuggestionRequest,
  StyleRewriteRequest,
} from '../../../src/api/style';

// Mock the utility functions
vi.mock('../../../src/utils/api', () => ({
  makeRequest: vi.fn(),
  pollWorkflowForResult: vi.fn(),
}));

describe('Style API Unit Tests', () => {
  const mockApiKey = 'test-api-key';
  const mockWorkflowId = 'test-workflow-id';
  const mockStyleGuideId = 'test-style-guide-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Style Guide Operations', () => {
    it('should list style guides', async () => {
      const mockResponse = {
        style_guides: [
          {
            id: mockStyleGuideId,
            name: 'Test Style Guide',
            description: 'Test Description',
            rules: {},
          },
        ],
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockResponse);

      const result = await listStyleGuides(mockApiKey);
      expect(result).toEqual(mockResponse);
      expect(makeRequest).toHaveBeenCalledWith(
        '/v1/style-guides',
        'GET',
        expect.any(FormData),
        mockApiKey,
      );
    });

    it('should create a style guide', async () => {
      const mockRequest: CreateStyleGuideData = {
        name: 'Test Style Guide',
        description: 'Test Description',
        rules: {},
      };

      const mockResponse = {
        id: mockStyleGuideId,
        name: 'Test Style Guide',
        description: 'Test Description',
        rules: {},
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockResponse);

      const result = await createStyleGuide(mockRequest, mockApiKey);
      expect(result).toEqual(mockResponse);
      expect(makeRequest).toHaveBeenCalledWith(
        '/v1/style-guides',
        'POST',
        expect.any(FormData),
        mockApiKey,
      );
    });

    it('should get a style guide', async () => {
      const mockResponse = {
        id: mockStyleGuideId,
        name: 'Test Style Guide',
        description: 'Test Description',
        rules: {},
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockResponse);

      const result = await getStyleGuide(mockStyleGuideId, mockApiKey);
      expect(result).toEqual(mockResponse);
      expect(makeRequest).toHaveBeenCalledWith(
        `/v1/style-guides/${mockStyleGuideId}`,
        'GET',
        expect.any(FormData),
        mockApiKey,
      );
    });

    it('should update a style guide', async () => {
      const mockRequest: CreateStyleGuideData = {
        name: 'Updated Style Guide',
        description: 'Updated Description',
        rules: {},
      };

      const mockResponse = {
        id: mockStyleGuideId,
        name: 'Updated Style Guide',
        description: 'Updated Description',
        rules: {},
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockResponse);

      const result = await updateStyleGuide(mockStyleGuideId, mockRequest, mockApiKey);
      expect(result).toEqual(mockResponse);
      expect(makeRequest).toHaveBeenCalledWith(
        `/v1/style-guides/${mockStyleGuideId}`,
        'PUT',
        expect.any(FormData),
        mockApiKey,
      );
    });

    it('should delete a style guide', async () => {
      const mockResponse = {
        message: 'Style guide deleted successfully',
      };
      vi.mocked(makeRequest).mockResolvedValueOnce(mockResponse);
      const result = await deleteStyleGuide(mockStyleGuideId, mockApiKey);
      expect(result).toEqual(mockResponse);
      expect(makeRequest).toHaveBeenCalledWith(
        `/v1/style-guides/${mockStyleGuideId}`,
        'DELETE',
        expect.any(FormData),
        mockApiKey,
      );
    });
  });

  describe('Style Operations', () => {
    const mockStyleGuide = {
      id: mockStyleGuideId,
      name: 'Test Style Guide',
      description: 'Test Description',
      rules: {},
    };

    const mockCheckRequest: StyleCheckRequest = {
      file_upload: new Blob(['test content']),
      style_guide: mockStyleGuide,
      dialect: Dialect.AmericanEnglish,
      tone: Tone.Formal,
    };

    const mockSuggestionRequest: StyleSuggestionRequest = {
      file_upload: new Blob(['test content']),
      style_guide: mockStyleGuide,
      dialect: Dialect.AmericanEnglish,
      tone: Tone.Formal,
    };

    const mockRewriteRequest: StyleRewriteRequest = {
      file_upload: new Blob(['test content']),
      style_guide: mockStyleGuide,
      dialect: Dialect.AmericanEnglish,
      tone: Tone.Formal,
    };

    it('should submit a style check', async () => {
      const mockResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Style check workflow started successfully.',
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockResponse);

      const result = await submitStyleCheck(mockCheckRequest, mockApiKey);
      expect(result).toEqual(mockResponse);
      expect(makeRequest).toHaveBeenCalledWith(
        '/v1/style/checks',
        'POST',
        expect.any(FormData),
        mockApiKey,
      );
    });

    it('should submit a style suggestion', async () => {
      const mockResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Style suggestion workflow started successfully.',
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockResponse);

      const result = await submitStyleSuggestion(mockSuggestionRequest, mockApiKey);
      expect(result).toEqual(mockResponse);
      expect(makeRequest).toHaveBeenCalledWith(
        '/v1/style/suggestions',
        'POST',
        expect.any(FormData),
        mockApiKey,
      );
    });

    it('should submit a style rewrite', async () => {
      const mockResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Style rewrite workflow started successfully.',
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockResponse);

      const result = await submitStyleRewrite(mockRewriteRequest, mockApiKey);
      expect(result).toEqual(mockResponse);
      expect(makeRequest).toHaveBeenCalledWith(
        '/v1/style-rewrites',
        'POST',
        expect.any(FormData),
        mockApiKey,
      );
    });

    it('should submit a style check and get result', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Style check workflow started successfully.',
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

      const result = await submitStyleCheckAndGetResult(mockCheckRequest, mockApiKey);
      expect(result).toEqual(mockPolledResponse.result);
    });

    it('should submit a style suggestion and get result', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Style suggestion workflow started successfully.',
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

      const result = await submitStyleSuggestionAndGetResult(mockSuggestionRequest, mockApiKey);
      expect(result).toEqual(mockPolledResponse.result);
    });

    it('should submit a style rewrite and get result', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Style rewrite workflow started successfully.',
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

      const result = await submitStyleRewriteAndGetResult(mockRewriteRequest, mockApiKey);
      expect(result).toEqual(mockPolledResponse.result);
    });

    it('should handle style check polling failure', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Style check workflow started successfully.',
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockSubmitResponse);
      vi.mocked(pollWorkflowForResult).mockRejectedValueOnce(
        new Error(`Workflow failed with status: ${Status.Failed}`),
      );

      await expect(submitStyleCheckAndGetResult(mockCheckRequest, mockApiKey)).rejects.toThrow(
        `Workflow failed with status: ${Status.Failed}`,
      );
    });

    it('should handle style suggestion polling failure', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Style suggestion workflow started successfully.',
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockSubmitResponse);
      vi.mocked(pollWorkflowForResult).mockRejectedValueOnce(
        new Error(`Workflow failed with status: ${Status.Failed}`),
      );

      await expect(submitStyleSuggestionAndGetResult(mockSuggestionRequest, mockApiKey)).rejects.toThrow(
        `Workflow failed with status: ${Status.Failed}`,
      );
    });

    it('should handle style rewrite polling failure', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: mockWorkflowId,
        message: 'Style rewrite workflow started successfully.',
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockSubmitResponse);
      vi.mocked(pollWorkflowForResult).mockRejectedValueOnce(
        new Error(`Workflow failed with status: ${Status.Failed}`),
      );

      await expect(submitStyleRewriteAndGetResult(mockRewriteRequest, mockApiKey)).rejects.toThrow(
        `Workflow failed with status: ${Status.Failed}`,
      );
    });

    it('should handle missing workflow ID for style check', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: '',
        message: 'Style check workflow started successfully.',
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockSubmitResponse);

      await expect(submitStyleCheckAndGetResult(mockCheckRequest, mockApiKey)).rejects.toThrow(
        'No workflow_id received from initial style check request',
      );
    });

    it('should handle missing workflow ID for style suggestion', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: '',
        message: 'Style suggestion workflow started successfully.',
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockSubmitResponse);

      await expect(submitStyleSuggestionAndGetResult(mockSuggestionRequest, mockApiKey)).rejects.toThrow(
        'No workflow_id received from initial style suggestion request',
      );
    });

    it('should handle missing workflow ID for style rewrite', async () => {
      const mockSubmitResponse: AnalysisSubmissionResponse = {
        workflow_id: '',
        message: 'Style rewrite workflow started successfully.',
      };

      vi.mocked(makeRequest).mockResolvedValueOnce(mockSubmitResponse);

      await expect(submitStyleRewriteAndGetResult(mockRewriteRequest, mockApiKey)).rejects.toThrow(
        'No workflow_id received from initial style rewrite request',
      );
    });
  });
});
