import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStyleGuideReqFromUrl, createStyleGuideReqFromPath } from '../../../src/api/style/style.api.utils';
import { readFileSync } from 'fs';
import { basename } from 'path';
import { fileURLToPath } from 'url';

// Mock Node.js modules
vi.mock('fs');
vi.mock('path');
vi.mock('url');

const mockReadFileSync = vi.mocked(readFileSync);
const mockBasename = vi.mocked(basename);
const mockFileURLToPath = vi.mocked(fileURLToPath);

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
        versions: { node: '18.0.0' },
      } as any;

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
      } as any;

      await expect(createStyleGuideReqFromUrl('/path/to/test-style-guide.pdf')).rejects.toThrow(
        'createStyleGuideReqFromUrl is only available in Node.js environments. In browser environments, use createStyleGuide directly with a File object.',
      );

      // Restore original process
      global.process = originalProcess;
    });
  });
});
