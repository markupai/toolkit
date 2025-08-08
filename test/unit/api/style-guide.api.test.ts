import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import {
  listStyleGuides,
  getStyleGuide,
  createStyleGuide,
  updateStyleGuide,
  deleteStyleGuide,
  validateToken,
} from '../../../src/api/style/style-guides.api';
import { PlatformType, Environment } from '../../../src/utils/api.types';
import type { Config } from '../../../src/utils/api.types';
import { server } from '../setup';
import { apiHandlers } from '../mocks/api.handlers';
import { http, HttpResponse } from 'msw';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Style Guide Unit Tests', () => {
  const mockConfig: Config = {
    apiKey: 'test-api-key',
    platform: { type: PlatformType.Environment, value: Environment.Dev },
  };
  const mockStyleGuideId = 'test-style-guide-id';

  describe('Style Guide Operations', () => {
    it('should list style guides successfully', async () => {
      server.use(apiHandlers.style.guides.success);
      const result = await listStyleGuides(mockConfig);
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
      const result = await getStyleGuide(mockStyleGuideId, mockConfig);
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
      const result = await createStyleGuide({ file, name: 'Test Style Guide' }, mockConfig);
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
      const result = await updateStyleGuide(mockStyleGuideId, { name: 'Updated Style Guide' }, mockConfig);
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
      await expect(deleteStyleGuide(mockStyleGuideId, mockConfig)).resolves.not.toThrow();
    });

    it('should handle style guide errors', async () => {
      server.use(apiHandlers.style.guides.error);
      await expect(listStyleGuides(mockConfig)).rejects.toThrow('Failed to list style guides');
    });
  });

  describe('validateToken', () => {
    it('should return true when token is valid', async () => {
      server.use(apiHandlers.style.guides.success);

      const result = await validateToken(mockConfig);
      expect(result).toBe(true);
    });

    it('should return false when token is invalid (401 error)', async () => {
      server.use(apiHandlers.style.guides.error);

      const result = await validateToken(mockConfig);
      expect(result).toBe(false);
    });

    it('should return false when network error occurs', async () => {
      server.use(apiHandlers.api.error.network);

      const result = await validateToken(mockConfig);
      expect(result).toBe(false);
    });

    it('should return false when API returns 403 Forbidden', async () => {
      server.use(
        http.get('*/v1/style-guides', () => {
          return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
        }),
      );

      const result = await validateToken(mockConfig);
      expect(result).toBe(false);
    });

    it('should return false when API returns 500 Internal Server Error', async () => {
      server.use(
        http.get('*/v1/style-guides', () => {
          return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
        }),
      );

      const result = await validateToken(mockConfig);
      expect(result).toBe(false);
    });
  });
});
