import dotenv from "dotenv";
import { beforeAll } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { DEFAULT_PLATFORM_URL_DEV } from "../../src/utils/api";

// Load environment variables before running integration tests
beforeAll(() => {
  // Load from .env file if it exists (dotenv won't overwrite existing env vars)
  const envPath = path.resolve(process.cwd(), ".env");

  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });

    if (result.error) {
      throw new Error(`Error loading .env file: ${result.error.message}`);
    }
  }

  // Validate required environment variables
  if (!process.env.API_KEY) {
    throw new Error(
      "API_KEY environment variable is required for integration tests. Please set it in your environment or add it to your .env file.",
    );
  }

  // Set TEST_PLATFORM_URL if not provided, defaulting to DEFAULT_PLATFORM_URL_DEV
  if (!process.env.TEST_PLATFORM_URL) {
    process.env.TEST_PLATFORM_URL = DEFAULT_PLATFORM_URL_DEV;
  }
});
