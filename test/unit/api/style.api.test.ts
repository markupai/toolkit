import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import {
  submitStyleCheck,
  submitStyleSuggestion,
  submitStyleRewrite,
  styleCheck,
  styleSuggestions,
  styleRewrite,
  getStyleCheck,
  getStyleSuggestion,
  getStyleRewrite,
} from '../../../src/api/style/style.api';
import { STYLE_DEFAULTS } from '../../../src/api/style/style.api.defaults';
import { Status } from '../../../src/utils/api.types';
import type { Config } from '../../../src/utils/api.types';
import { PlatformType, Environment } from '../../../src/utils/api.types';
import { server } from '../setup';
import { apiHandlers } from '../mocks/api.handlers';

// Set up MSW server lifecycle hooks
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Style API Unit Tests', () => {
  const mockConfig: Config = {
    apiKey: 'test-api-key',
    platform: { type: PlatformType.Environment, value: Environment.Dev },
  };
  const mockStyleGuideId = 'test-style-guide-id';
  const mockWorkflowId = 'test-workflow-id';
  const mockStyleAnalysisRequest = {
    content: 'test content',
    style_guide: 'ap',
    dialect: STYLE_DEFAULTS.dialects.americanEnglish,
    tone: STYLE_DEFAULTS.tones.formal,
  };

  describe('Style Analysis Operations', () => {
    it('should submit style check successfully', async () => {
      server.use(apiHandlers.style.checks.success);

      const result = await submitStyleCheck(mockStyleAnalysisRequest, mockConfig);
      expect(result).toEqual({
        status: Status.Running,
        workflow_id: mockWorkflowId,
        message: 'Style check workflow started successfully.',
      });
    });

    it('should submit style suggestion successfully', async () => {
      server.use(apiHandlers.style.suggestions.success);

      const result = await submitStyleSuggestion(mockStyleAnalysisRequest, mockConfig);
      expect(result).toEqual({
        status: Status.Running,
        workflow_id: mockWorkflowId,
        message: 'Style suggestions workflow started successfully.',
      });
    });

    it('should submit style rewrite successfully', async () => {
      server.use(apiHandlers.style.rewrites.success);

      const result = await submitStyleRewrite(mockStyleAnalysisRequest, mockConfig);
      expect(result).toEqual({
        status: Status.Running,
        workflow_id: mockWorkflowId,
        message: 'Style rewrite workflow started successfully.',
      });
    });

    it('should handle style analysis errors', async () => {
      server.use(apiHandlers.style.checks.error);

      await expect(submitStyleCheck(mockStyleAnalysisRequest, mockConfig)).rejects.toThrow(
        'Could not validate credentials',
      );
    });

    it('should submit style check with custom document name', async () => {
      server.use(apiHandlers.style.checks.success);

      const requestWithDocumentName = {
        ...mockStyleAnalysisRequest,
        documentName: 'custom-document.txt',
      };

      const result = await submitStyleCheck(requestWithDocumentName, mockConfig);
      expect(result).toEqual({
        status: Status.Running,
        workflow_id: mockWorkflowId,
        message: 'Style check workflow started successfully.',
      });
    });

    it('should submit style check without document name (uses default)', async () => {
      server.use(apiHandlers.style.checks.success);

      const result = await submitStyleCheck(mockStyleAnalysisRequest, mockConfig);
      expect(result).toEqual({
        status: Status.Running,
        workflow_id: mockWorkflowId,
        message: 'Style check workflow started successfully.',
      });
    });

    it('should submit style check with File content successfully', async () => {
      server.use(apiHandlers.style.checks.success);

      const file = new File(['test file content'], 'test.txt', { type: 'text/plain' });
      const fileDescriptor = { file, mimeType: 'text/plain' };
      const requestWithFile = {
        content: fileDescriptor,
        style_guide: 'ap',
        dialect: STYLE_DEFAULTS.dialects.americanEnglish,
        tone: STYLE_DEFAULTS.tones.formal,
        documentName: 'custom-file.txt',
      };

      const result = await submitStyleCheck(requestWithFile, mockConfig);
      expect(result).toEqual({
        status: Status.Running,
        workflow_id: mockWorkflowId,
        message: 'Style check workflow started successfully.',
      });
    });

    it('should submit style check with Buffer content successfully', async () => {
      server.use(apiHandlers.style.checks.success);

      const buffer = Buffer.from('test buffer content', 'utf8');
      const bufferDescriptor = { buffer, mimeType: 'text/plain' };
      const requestWithBuffer = {
        content: bufferDescriptor,
        style_guide: 'ap',
        dialect: STYLE_DEFAULTS.dialects.americanEnglish,
        tone: STYLE_DEFAULTS.tones.formal,
        documentName: 'custom-buffer.txt',
      };

      const result = await submitStyleCheck(requestWithBuffer, mockConfig);
      expect(result).toEqual({
        status: Status.Running,
        workflow_id: mockWorkflowId,
        message: 'Style check workflow started successfully.',
      });
    });
  });

  describe('Style Analysis with Polling', () => {
    it('should perform style check with polling successfully', async () => {
      server.use(apiHandlers.style.checks.success, apiHandlers.style.checks.poll);

      const result = await styleCheck(mockStyleAnalysisRequest, mockConfig);
      expect(result.status).toBe(Status.Completed);
      expect(result.workflow_id).toBe(mockWorkflowId);
      expect(result.style_guide_id).toBe(mockStyleGuideId);
      expect(result.scores).toBeDefined();
      expect(result.issues).toBeDefined();
    });

    it('should perform style suggestions with polling successfully', async () => {
      server.use(apiHandlers.style.suggestions.success, apiHandlers.style.suggestions.poll);

      const result = await styleSuggestions(mockStyleAnalysisRequest, mockConfig);
      expect(result.status).toBe(Status.Completed);
      expect(result.workflow_id).toBe(mockWorkflowId);
      expect(result.style_guide_id).toBe(mockStyleGuideId);
      expect(result.scores).toBeDefined();
      expect(result.issues).toBeDefined();
    });

    it('should perform style rewrite with polling successfully', async () => {
      server.use(apiHandlers.style.rewrites.success, apiHandlers.style.rewrites.poll);

      const result = await styleRewrite(mockStyleAnalysisRequest, mockConfig);
      expect(result.status).toBe(Status.Completed);
      expect(result.workflow_id).toBe(mockWorkflowId);
      expect(result.style_guide_id).toBe(mockStyleGuideId);
      expect(result.scores).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.rewrite).toBeDefined();
    });

    it('should include terminology scores in rewrite results', async () => {
      server.use(apiHandlers.style.rewrites.success, apiHandlers.style.rewrites.poll);

      const result = await styleRewrite(mockStyleAnalysisRequest, mockConfig);
      expect(result.scores.terminology).toBeDefined();
      expect(typeof result.scores.terminology.score).toBe('number');
      expect(typeof result.scores.terminology.issues).toBe('number');
      expect(result.rewrite_scores.terminology).toBeDefined();
      expect(typeof result.rewrite_scores.terminology.score).toBe('number');
      expect(typeof result.rewrite_scores.terminology.issues).toBe('number');
      expect(result.rewrite_scores.terminology.score).toBe(90);
      expect(result.rewrite_scores.terminology.issues).toBe(0);
    });

    it('should perform style check with polling and custom document name', async () => {
      server.use(apiHandlers.style.checks.success, apiHandlers.style.checks.poll);

      const requestWithDocumentName = {
        ...mockStyleAnalysisRequest,
        documentName: 'test-document.txt',
      };

      const result = await styleCheck(requestWithDocumentName, mockConfig);
      expect(result.status).toBe(Status.Completed);
      expect(result.workflow_id).toBe(mockWorkflowId);
      expect(result.style_guide_id).toBe(mockStyleGuideId);
      expect(result.scores).toBeDefined();
      expect(result.issues).toBeDefined();
    });

    it('should perform style suggestions with polling and custom document name', async () => {
      server.use(apiHandlers.style.suggestions.success, apiHandlers.style.suggestions.poll);

      const requestWithDocumentName = {
        ...mockStyleAnalysisRequest,
        documentName: 'suggestions-document.txt',
      };

      const result = await styleSuggestions(requestWithDocumentName, mockConfig);
      expect(result.status).toBe(Status.Completed);
      expect(result.workflow_id).toBe(mockWorkflowId);
      expect(result.style_guide_id).toBe(mockStyleGuideId);
      expect(result.scores).toBeDefined();
      expect(result.issues).toBeDefined();
    });

    it('should perform style rewrite with polling and custom document name', async () => {
      server.use(apiHandlers.style.rewrites.success, apiHandlers.style.rewrites.poll);

      const requestWithDocumentName = {
        ...mockStyleAnalysisRequest,
        documentName: 'rewrite-document.txt',
      };

      const result = await styleRewrite(requestWithDocumentName, mockConfig);
      expect(result.status).toBe(Status.Completed);
      expect(result.workflow_id).toBe(mockWorkflowId);
      expect(result.style_guide_id).toBe(mockStyleGuideId);
      expect(result.scores).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.rewrite).toBeDefined();
    });

    it('should perform style check with polling using File content', async () => {
      server.use(apiHandlers.style.checks.success, apiHandlers.style.checks.poll);

      const file = new File(['test file content for polling'], 'polling-test.txt', { type: 'text/plain' });
      const fileDescriptor = { file, mimeType: 'text/plain' };
      const requestWithFile = {
        content: fileDescriptor,
        style_guide: 'ap',
        dialect: STYLE_DEFAULTS.dialects.americanEnglish,
        tone: STYLE_DEFAULTS.tones.formal,
      };

      const result = await styleCheck(requestWithFile, mockConfig);
      expect(result.status).toBe(Status.Completed);
      expect(result.workflow_id).toBe(mockWorkflowId);
      expect(result.style_guide_id).toBe(mockStyleGuideId);
      expect(result.scores).toBeDefined();
      expect(result.issues).toBeDefined();
    });

    it('should perform style check with polling using Buffer content', async () => {
      server.use(apiHandlers.style.checks.success, apiHandlers.style.checks.poll);

      const buffer = Buffer.from('test buffer content for polling', 'utf8');
      const bufferDescriptor = { buffer, mimeType: 'text/plain' };
      const requestWithBuffer = {
        content: bufferDescriptor,
        style_guide: 'ap',
        dialect: STYLE_DEFAULTS.dialects.americanEnglish,
        tone: STYLE_DEFAULTS.tones.formal,
      };

      const result = await styleCheck(requestWithBuffer, mockConfig);
      expect(result.status).toBe(Status.Completed);
      expect(result.workflow_id).toBe(mockWorkflowId);
      expect(result.style_guide_id).toBe(mockStyleGuideId);
      expect(result.scores).toBeDefined();
      expect(result.issues).toBeDefined();
    });
  });

  describe('Style Check Results', () => {
    it('should get style check results by workflow ID', async () => {
      server.use(apiHandlers.style.checks.poll);

      const result = await getStyleCheck(mockWorkflowId, mockConfig);
      expect(result.status).toBe(Status.Completed);
      expect(result.workflow_id).toBe(mockWorkflowId);
      expect(result.style_guide_id).toBe(mockStyleGuideId);
      expect(result.scores).toBeDefined();
      expect(result.issues).toBeDefined();
    });

    it('should include terminology scores in style check results', async () => {
      server.use(apiHandlers.style.checks.poll);

      const result = await getStyleCheck(mockWorkflowId, mockConfig);
      expect(result.scores.terminology).toBeDefined();
      expect(typeof result.scores.terminology.score).toBe('number');
      expect(typeof result.scores.terminology.issues).toBe('number');
      expect(result.scores.terminology.score).toBe(85);
      expect(result.scores.terminology.issues).toBe(0);
    });
  });

  describe('Style Suggestion and Rewrite Results', () => {
    it('should get style suggestion results by workflow ID', async () => {
      server.use(apiHandlers.style.suggestions.poll);

      const result = await getStyleSuggestion(mockWorkflowId, mockConfig);
      expect(result.status).toBe(Status.Completed);
      expect(result.workflow_id).toBe(mockWorkflowId);
      expect(result.style_guide_id).toBe(mockStyleGuideId);
      expect(result.scores).toBeDefined();
      expect(result.issues).toBeDefined();
      // Check for suggestion in issues
      if (result.issues && result.issues.length > 0) {
        const issue = result.issues[0];
        expect(issue.suggestion).toBeDefined();
        expect(typeof issue.suggestion).toBe('string');
      }
    });

    it('should get style rewrite results by workflow ID', async () => {
      server.use(apiHandlers.style.rewrites.poll);

      const result = await getStyleRewrite(mockWorkflowId, mockConfig);
      expect(result.status).toBe(Status.Completed);
      expect(result.style_guide_id).toBe(mockStyleGuideId);
      expect(result.scores).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.rewrite).toBeDefined();
      expect(typeof result.rewrite).toBe('string');
      expect(result.rewrite_scores).toBeDefined();
      expect(result.rewrite_scores.quality).toBeDefined();
      expect(result.rewrite_scores.clarity).toBeDefined();
      expect(result.rewrite_scores.grammar).toBeDefined();
      expect(result.rewrite_scores.style_guide).toBeDefined();
      expect(result.rewrite_scores.tone).toBeDefined();
      expect(result.rewrite_scores.terminology).toBeDefined();
      // Check for suggestion in issues
      if (result.issues && result.issues.length > 0) {
        const issue = result.issues[0];
        expect(issue.suggestion).toBeDefined();
        expect(typeof issue.suggestion).toBe('string');
      }
    });
  });
});
