import { describe, it, expect, beforeAll } from 'vitest';
import { listStyleGuides, createStyleGuide, validateToken } from '../../../src/api/style/style-guides.api';
import { PlatformType } from '../../../src/utils/api.types';
import type { Config } from '../../../src/utils/api.types';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createStyleGuideReqFromPath } from '../../../src/api/style/style.api.utils';

describe('Style Guide Integration Tests', () => {
  let config: Config;
  beforeAll(() => {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      throw new Error('API_KEY environment variable is required for integration tests');
    }
    config = {
      apiKey,
      platform: { type: PlatformType.Url, value: process.env.TEST_PLATFORM_URL! },
    };
  });

  describe('Style Guide Listing', () => {
    it('should list style guides', async () => {
      const response = await listStyleGuides(config);
      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);
      const firstStyleGuide = response[0];
      expect(firstStyleGuide).toHaveProperty('id');
      expect(firstStyleGuide).toHaveProperty('name');
      expect(firstStyleGuide).toHaveProperty('created_at');
      expect(firstStyleGuide).toHaveProperty('created_by');
      expect(firstStyleGuide).toHaveProperty('status');
      expect(firstStyleGuide).toHaveProperty('updated_at');
      expect(firstStyleGuide).toHaveProperty('updated_by');
    });
  });

  describe('Style Guide Creation', () => {
    it('should create a new style guide from PDF file', async () => {
      const pdfPath = join(__dirname, '../test-data/sample-style-guide.pdf');
      const pdfBuffer = readFileSync(pdfPath);
      const pdfFile = new File([pdfBuffer], 'sample-style-guide.pdf', { type: 'application/pdf' });
      const randomNumber = Math.floor(Math.random() * 10000);
      const styleGuideName = `Integration Test Style Guide ${randomNumber}`;
      const response = await createStyleGuide({ file: pdfFile, name: styleGuideName }, config);
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(styleGuideName);
      expect(response.created_at).toBeDefined();
      expect(response.created_by).toBeDefined();
      expect(response.status).toBeDefined();
      expect(response.updated_at).toBeDefined();
      expect(response.updated_by).toBeDefined();
      expect(typeof response.id).toBe('string');
      expect(typeof response.name).toBe('string');
      expect(typeof response.created_at).toBe('string');
      expect(typeof response.created_by).toBe('string');
      expect(typeof response.status).toBe('string');
      expect(typeof response.updated_at === 'string' || response.updated_at === null).toBe(true);
      expect(typeof response.updated_by === 'string' || response.updated_by === null).toBe(true);
      expect(response.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should create multiple style guides with unique names', async () => {
      const pdfPath = join(__dirname, '../test-data/sample-style-guide.pdf');
      const pdfBuffer = readFileSync(pdfPath);
      const pdfFile = new File([pdfBuffer], 'sample-style-guide.pdf', { type: 'application/pdf' });
      const randomNumber1 = Math.floor(Math.random() * 10000);
      const randomNumber2 = Math.floor(Math.random() * 10000);
      const styleGuideName1 = `Integration Test Style Guide A ${randomNumber1}`;
      const styleGuideName2 = `Integration Test Style Guide B ${randomNumber2}`;
      const response1 = await createStyleGuide({ file: pdfFile, name: styleGuideName1 }, config);
      const response2 = await createStyleGuide({ file: pdfFile, name: styleGuideName2 }, config);
      expect(response1.name).toBe(styleGuideName1);
      expect(response2.name).toBe(styleGuideName2);
      expect(response1.id).not.toBe(response2.id);
    });

    it('should create style guide using utility function from file path', async () => {
      const pdfPath = join(__dirname, '../test-data/batteries.pdf');
      const randomNumber = Math.floor(Math.random() * 10000);
      const styleGuideName = `Utility Test Style Guide ${randomNumber}`;
      const request = await createStyleGuideReqFromPath(pdfPath, styleGuideName);
      expect(request).toBeDefined();
      expect(request.file).toBeInstanceOf(File);
      expect(request.file.name).toBe('batteries.pdf');
      expect(request.file.type).toBe('application/pdf');
      expect(request.name).toBe(styleGuideName);
      const response = await createStyleGuide(request, config);
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(styleGuideName);
      expect(response.created_at).toBeDefined();
      expect(response.created_by).toBeDefined();
      expect(response.status).toBeDefined();
      expect(response.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should create style guide using utility function without custom name', async () => {
      const pdfPath2 = join(__dirname, '../test-data/batteries.pdf');
      const request2 = await createStyleGuideReqFromPath(pdfPath2);
      expect(request2).toBeDefined();
      expect(request2.file).toBeInstanceOf(File);
      expect(request2.file.name).toBe('batteries.pdf');
      expect(request2.file.type).toBe('application/pdf');
      expect(request2.name).toBe('batteries');
      const response = await createStyleGuide(request2, config);
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe('batteries');
      expect(response.created_at).toBeDefined();
      expect(response.created_by).toBeDefined();
      expect(response.status).toBeDefined();
      expect(response.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('validateToken', () => {
    it('should return true for valid API key', async () => {
      const result = await validateToken(config);
      expect(result).toBe(true);
    });

    it('should return false for invalid API key', async () => {
      const invalidConfig: Config = {
        apiKey: 'invalid-api-key',
        platform: { type: PlatformType.Url, value: process.env.TEST_PLATFORM_URL! },
      };

      const result = await validateToken(invalidConfig);
      expect(result).toBe(false);
    });

    it('should return false for empty API key', async () => {
      const emptyConfig: Config = {
        apiKey: '',
        platform: { type: PlatformType.Url, value: process.env.TEST_PLATFORM_URL! },
      };

      const result = await validateToken(emptyConfig);
      expect(result).toBe(false);
    });

    it('should return false for invalid platform URL', async () => {
      const invalidUrlConfig: Config = {
        apiKey: process.env.API_KEY || '',
        platform: { type: PlatformType.Url, value: 'https://invalid-url-that-does-not-exist.com' },
      };

      const result = await validateToken(invalidUrlConfig);
      expect(result).toBe(false);
    });
  });
});
