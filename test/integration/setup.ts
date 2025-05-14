import dotenv from 'dotenv';
import { beforeAll } from 'vitest';
import path from 'path';

// Load environment variables before running integration tests
beforeAll(() => {
  // Load from the root directory
  const result = dotenv.config({ path: path.resolve(process.cwd(), '.env') });

  if (result.error) {
    console.warn('Warning: .env file not found. Make sure you have set up your environment variables.');
  }

  // Validate required environment variables
  if (!process.env.ACROLINX_API_KEY) {
    throw new Error('ACROLINX_API_KEY environment variable is required for integration tests');
  }
});
