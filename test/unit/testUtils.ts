import { fail } from "node:assert";
import { ErrorType } from "../../src/utils/errors";
import { expect, vi } from "vitest";

export const testTimeout = async (
  pollingFunction: () => Promise<unknown>,
  timeoutMillis: number,
) => {
  let success = false;
  try {
    const promise = pollingFunction();
    vi.advanceTimersByTime(timeoutMillis + 1);
    await promise;
    success = true;
  } catch (error: unknown) {
    expect(error).toHaveProperty("type", ErrorType.TIMEOUT_ERROR);
    expect(error).toHaveProperty("message");
    expect((error as { message: string }).message).toContain("Workflow timed out");
    expect((error as { message: string }).message).toContain("ms");
  }
  if (success) {
    fail("Expected timeout error");
  }
};
