import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listStyleGuides } from '../../../src/api/style/style.api';
import { getData } from '../../../src/utils/api';

// Mock the utility functions
vi.mock('../../../src/utils/api', () => ({
  getData: vi.fn(),
  postData: vi.fn(),
  putData: vi.fn(),
  deleteData: vi.fn(),
  pollWorkflowForResult: vi.fn(),
}));

describe('Style API Unit Tests', () => {
  const mockApiKey = 'test-api-key';
  const mockStyleGuideId = 'test-style-guide-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Style Guide Operations', () => {
    it('should list style guides', async () => {
      const mockResponse = {
        [mockStyleGuideId]: 'Test Style Guide',
      };
      vi.mocked(getData).mockResolvedValueOnce(mockResponse);
      const result = await listStyleGuides(mockApiKey);
      expect(result).toEqual(mockResponse);
      expect(getData).toHaveBeenCalledWith('/v1/style-guides', mockApiKey);
    });
  });
});
