import dotenv from 'dotenv';
import { beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { setPlatformUrl } from '../../src/utils/api';

// Load environment variables before running integration tests
beforeAll(() => {
  const envPath = path.resolve(process.cwd(), '.env');
  
  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    throw new Error(`.env file not found at ${envPath}. Please create it with your API_KEY.`);
  }

  // Load from the root directory
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    throw new Error(`Error loading .env file: ${result.error.message}`);
  }

  // Validate required environment variables
  if (!process.env.API_KEY) {
    throw new Error('API_KEY environment variable is required for integration tests. Please add it to your .env file.');
  }

  // Set the platform URL for testing
  const testUrl = process.env.TEST_PLATFORM_URL || 'http://localhost:8000';
  setPlatformUrl(testUrl);
});
