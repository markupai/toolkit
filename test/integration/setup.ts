import dotenv from 'dotenv';
import { beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { setPlatformUrl } from '../../src/utils/api';

// Load environment variables before running integration tests
beforeAll(() => {
  // Load from .env file if it exists (dotenv won't overwrite existing env vars)
  const envPath = path.resolve(process.cwd(), '.env');

  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });

    if (result.error) {
      throw new Error(`Error loading .env file: ${result.error.message}`);
    }
  }

  // Validate required environment variables
  if (!process.env.API_KEY) {
    throw new Error(
      'API_KEY environment variable is required for integration tests. Please set it in your environment or add it to your .env file.',
    );
  }

  if (!process.env.TEST_PLATFORM_URL) {
    throw new Error(
      'TEST_PLATFORM_URL environment variable is required for integration tests. Please set it in your environment or add it to your .env file.',
    );
  }

  // Set the platform URL for testing
  const testUrl = process.env.TEST_PLATFORM_URL || 'http://localhost:8000';
  setPlatformUrl(testUrl);
});
