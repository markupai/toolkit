import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import {
  listStyleGuides,
  getStyleGuide,
  submitStyleCheck,
  submitStyleSuggestion,
  submitStyleRewrite,
  styleCheck,
  styleSuggestions,
  styleRewrite,
  createStyleGuide,
  getStyleCheck,
  updateStyleGuide,
  deleteStyleGuide,
} from '../../../src/api/style/style.api';
import { Status } from '../../../src/utils/api.types';
import { server } from '../setup';
import { apiHandlers } from '../mocks/api.handlers';

// Set up MSW server lifecycle hooks
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Style API Unit Tests', () => {
  const mockApiKey = 'test-api-key';
  const mockStyleGuideId = 'test-style-guide-id';
  const mockWorkflowId = 'test-workflow-id';
  const mockStyleAnalysisRequest = {
    content: 'test content',
    style_guide: 'ap',
    dialect: 'american_english',
    tone: 'formal',
  };

  describe('Style Guide Operations', () => {
    it('should list style guides successfully', async () => {
      server.use(apiHandlers.style.guides.success);

      const result = await listStyleGuides(mockApiKey);
      expect(result).toEqual([
        {
          id: mockStyleGuideId,
          name: 'Test Style Guide',
          created_at: '2025-06-20T11:46:30.537Z',
          created_by: 'test-user',
          status: 'running',
          updated_at: '2025-06-20T11:46:30.537Z',
          updated_by: 'test-user',
        },
      ]);
    });

    it('should get a single style guide successfully', async () => {
      server.use(apiHandlers.style.guides.getSuccess);

      const result = await getStyleGuide(mockStyleGuideId, mockApiKey);
      expect(result).toEqual({
        id: mockStyleGuideId,
        name: 'Test Style Guide',
        created_at: '2025-06-20T11:46:30.537Z',
        created_by: 'test-user',
        status: 'running',
        updated_at: '2025-06-20T11:46:30.537Z',
        updated_by: 'test-user',
      });
    });

    it('should create a style guide successfully', async () => {
      server.use(apiHandlers.style.guides.createSuccess);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const result = await createStyleGuide({ file, name: 'Test Style Guide' }, mockApiKey);
      expect(result).toEqual({
        id: 'new-style-guide-id',
        name: 'Test Style Guide',
        created_at: '2025-06-20T11:46:30.537Z',
        created_by: 'test-user',
        status: 'running',
        updated_at: '2025-06-20T11:46:30.537Z',
        updated_by: 'test-user',
      });
    });

    it('should update a style guide successfully', async () => {
      server.use(apiHandlers.style.guides.updateSuccess);

      const result = await updateStyleGuide(mockStyleGuideId, { name: 'Updated Style Guide' }, mockApiKey);
      expect(result).toEqual({
        id: mockStyleGuideId,
        name: 'Updated Style Guide',
        created_at: '2025-06-20T11:46:30.537Z',
        created_by: 'test-user',
        status: 'running',
        updated_at: '2025-06-20T12:00:00.000Z',
        updated_by: 'test-user',
      });
    });

    it('should delete a style guide successfully', async () => {
      server.use(apiHandlers.style.guides.deleteSuccess);

      await expect(deleteStyleGuide(mockStyleGuideId, mockApiKey)).resolves.toBeUndefined();
    });

    it('should handle style guide errors', async () => {
      server.use(apiHandlers.style.guides.error);

      await expect(listStyleGuides(mockApiKey)).rejects.toThrow('Failed to list style guides');
    });
  });

  describe('Style Analysis Operations', () => {
    it('should submit style check successfully', async () => {
      server.use(apiHandlers.style.checks.success);

      const result = await submitStyleCheck(mockStyleAnalysisRequest, mockApiKey);
      expect(result).toEqual({
        status: Status.Running,
        workflow_id: mockWorkflowId,
        message: 'Style check workflow started successfully.',
      });
    });

    it('should submit style suggestion successfully', async () => {
      server.use(apiHandlers.style.suggestions.success);

      const result = await submitStyleSuggestion(mockStyleAnalysisRequest, mockApiKey);
      expect(result).toEqual({
        status: Status.Running,
        workflow_id: mockWorkflowId,
        message: 'Style suggestions workflow started successfully.',
      });
    });

    it('should submit style rewrite successfully', async () => {
      server.use(apiHandlers.style.rewrites.success);

      const result = await submitStyleRewrite(mockStyleAnalysisRequest, mockApiKey);
      expect(result).toEqual({
        status: Status.Running,
        workflow_id: mockWorkflowId,
        message: 'Style rewrite workflow started successfully.',
      });
    });

    it('should handle style analysis errors', async () => {
      server.use(apiHandlers.style.checks.error);

      await expect(submitStyleCheck(mockStyleAnalysisRequest, mockApiKey)).rejects.toThrow(
        'Could not validate credentials',
      );
    });
  });

  describe('Style Analysis with Polling', () => {
    it('should perform style check with polling successfully', async () => {
      server.use(apiHandlers.style.checks.success, apiHandlers.style.checks.poll);

      const result = await styleCheck(mockStyleAnalysisRequest, mockApiKey);
      expect(result.status).toBe(Status.Completed);
      expect(result.style_guide_id).toBe(mockStyleGuideId);
      expect(result.scores).toBeDefined();
      expect(result.issues).toBeDefined();
    });

    it('should perform style suggestions with polling successfully', async () => {
      server.use(apiHandlers.style.suggestions.success, apiHandlers.style.suggestions.poll);

      const result = await styleSuggestions(mockStyleAnalysisRequest, mockApiKey);
      expect(result.status).toBe(Status.Completed);
      expect(result.style_guide_id).toBe(mockStyleGuideId);
      expect(result.scores).toBeDefined();
      expect(result.issues).toBeDefined();
    });

    it('should perform style rewrite with polling successfully', async () => {
      server.use(apiHandlers.style.rewrites.success, apiHandlers.style.rewrites.poll);

      const result = await styleRewrite(mockStyleAnalysisRequest, mockApiKey);
      expect(result.status).toBe(Status.Completed);
      expect(result.style_guide_id).toBe(mockStyleGuideId);
      expect(result.scores).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.rewrite).toBeDefined();
    });
  });

  describe('Style Check Results', () => {
    it('should get style check results by workflow ID', async () => {
      server.use(apiHandlers.style.checks.poll);

      const result = await getStyleCheck(mockWorkflowId, mockApiKey);
      expect(result.status).toBe(Status.Completed);
      expect(result.style_guide_id).toBe(mockStyleGuideId);
      expect(result.scores).toBeDefined();
      expect(result.issues).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported file type for style guide creation', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      await expect(createStyleGuide({ file, name: 'Test Style Guide' }, mockApiKey)).rejects.toThrow(
        'Unsupported file type: txt. Only .pdf files are supported.',
      );
    });
  });
});
