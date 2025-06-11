import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { submitRewrite, submitCheck, check, rewrite } from '../../../src/api/demo/demo.api';
import { AnalysisRequest } from '../../../src/api/demo/demo.api.types';
import { DEMO_DEFAULTS } from '../../../src/api/demo/demo.api.defaults';
import { Status } from '../../../src/utils/api.types';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';
import { PLATFORM_URL } from '../../../src/utils/api';

// Set up MSW server lifecycle hooks
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Define handlers for demo API endpoints
const demoHandlers = {
  rewrite: {
    submit: http.post(`${PLATFORM_URL}/v1/rewrites/`, () => {
      return HttpResponse.json({
        status: Status.Running,
        workflow_id: 'test-workflow-id',
        message: 'Rewrite workflow started successfully.',
      });
    }),
    poll: http.get(`${PLATFORM_URL}/v1/rewrites/:workflowId`, () => {
      return HttpResponse.json({
        status: Status.Completed,
        workflow_id: 'test-workflow-id',
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
              workflow_id: 'test-workflow-id',
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
      });
    }),
    failed: http.get(`${PLATFORM_URL}/v1/rewrites/:workflowId`, () => {
      return HttpResponse.json({
        status: Status.Failed,
        workflow_id: 'test-workflow-id',
      });
    }),
    emptyWorkflowId: http.post(`${PLATFORM_URL}/v1/rewrites/`, () => {
      return HttpResponse.json({
        status: Status.Failed,
        workflow_id: '',
        message: 'Rewrite workflow started successfully.',
      });
    }),
  },
  check: {
    submit: http.post(`${PLATFORM_URL}/v1/checks/`, () => {
      return HttpResponse.json({
        status: Status.Running,
        workflow_id: 'test-workflow-id',
        message: 'Check workflow started successfully.',
      });
    }),
    poll: http.get(`${PLATFORM_URL}/v1/checks/:workflowId`, () => {
      return HttpResponse.json({
        status: Status.Completed,
        workflow_id: 'test-workflow-id',
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
              workflow_id: 'test-workflow-id',
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
      });
    }),
    failed: http.get(`${PLATFORM_URL}/v1/checks/:workflowId`, () => {
      return HttpResponse.json({
        status: Status.Failed,
        workflow_id: 'test-workflow-id',
      });
    }),
    emptyWorkflowId: http.post(`${PLATFORM_URL}/v1/checks/`, () => {
      return HttpResponse.json({
        status: Status.Failed,
        workflow_id: '',
        message: 'Check workflow started successfully.',
      });
    }),
  },
};

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

  describe('Basic Operations', () => {
    it('should submit a rewrite', async () => {
      server.use(demoHandlers.rewrite.submit);

      const result = await submitRewrite(mockRequest, mockApiKey);
      expect(result).toEqual({
        status: Status.Running,
        workflow_id: mockWorkflowId,
        message: 'Rewrite workflow started successfully.',
      });
    });

    it('should submit a check', async () => {
      server.use(demoHandlers.check.submit);

      const result = await submitCheck(mockRequest, mockApiKey);
      expect(result).toEqual({
        status: Status.Running,
        workflow_id: mockWorkflowId,
        message: 'Check workflow started successfully.',
      });
    });
  });

  describe('Operations with Polling', () => {
    it('should submit rewrite and get result', async () => {
      server.use(demoHandlers.rewrite.submit, demoHandlers.rewrite.poll);

      const response = await rewrite(mockRequest, mockApiKey);
      expect(response.status).toBe(Status.Completed);
      expect(response.workflow_id).toBe(mockWorkflowId);
      expect(response.result).toBeDefined();
    });

    it('should handle rewrite polling failure', async () => {
      server.use(demoHandlers.rewrite.submit, demoHandlers.rewrite.failed);

      await expect(rewrite(mockRequest, mockApiKey)).rejects.toThrow(`Rewrite failed with status: ${Status.Failed}`);
    });

    it('should handle missing workflow ID for rewrite', async () => {
      server.use(demoHandlers.rewrite.emptyWorkflowId);

      await expect(rewrite(mockRequest, mockApiKey)).rejects.toThrow(
        'No workflow_id received from initial rewrite request',
      );
    });

    it('should submit check and get result', async () => {
      server.use(demoHandlers.check.submit, demoHandlers.check.poll);

      const response = await check(mockRequest, mockApiKey);
      expect(response.status).toBe(Status.Completed);
      expect(response.workflow_id).toBe(mockWorkflowId);
      expect(response.result).toBeDefined();
    });

    it('should handle check polling failure', async () => {
      server.use(demoHandlers.check.submit, demoHandlers.check.failed);

      await expect(check(mockRequest, mockApiKey)).rejects.toThrow(`Check failed with status: ${Status.Failed}`);
    });

    it('should handle missing workflow ID for check', async () => {
      server.use(demoHandlers.check.emptyWorkflowId);

      await expect(check(mockRequest, mockApiKey)).rejects.toThrow(
        'No workflow_id received from initial check request',
      );
    });
  });
});
