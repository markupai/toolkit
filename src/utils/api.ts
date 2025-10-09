import { MarkupAIClient } from "@markupai/api";
import { Environment, PlatformType } from "./api.types";
import type { Config } from "./api.types";
import { ApiError, ErrorType } from "./errors";

export const DEFAULT_PLATFORM_URL_PROD = "https://api.markup.ai";
export const DEFAULT_PLATFORM_URL_STAGE = "https://api.stg.markup.ai";
export const DEFAULT_PLATFORM_URL_DEV = "https://api.dev.markup.ai";

function getCommonHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

export function getPlatformUrl(config: Config): string {
  if (config.platform) {
    if (config.platform.type === PlatformType.Environment) {
      // Handle environment enum
      switch (config.platform.value) {
        case Environment.Stage:
          return DEFAULT_PLATFORM_URL_STAGE;
        case Environment.Dev:
          return DEFAULT_PLATFORM_URL_DEV;
        case Environment.Prod:
          return DEFAULT_PLATFORM_URL_PROD;
        default:
          return DEFAULT_PLATFORM_URL_PROD; // Default to prod
      }
    } else {
      // Handle custom URL
      return config.platform.value;
    }
  }

  return DEFAULT_PLATFORM_URL_PROD;
}

// Helper function to get the current platform URL for debugging
export function getCurrentPlatformUrl(config: Config): string {
  return getPlatformUrl(config);
}

// Helper function to build the full URL with proper slash handling
function buildFullUrl(platformUrl: string, endpoint: string): string {
  const baseUrl = platformUrl.endsWith("/") ? platformUrl.slice(0, -1) : platformUrl;
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
}

// Helper function to verify platform URL is reachable
export async function verifyPlatformUrl(
  config: Config,
): Promise<{ success: boolean; url: string; error?: string }> {
  const platformUrl = getPlatformUrl(config);
  try {
    // TODO: This is a temporary fix to verify the platform URL is reachable.
    // We should use a health check endpoint instead.
    const fullUrl = buildFullUrl(platformUrl, "/v1/style-guides");
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: getCommonHeaders(config.apiKey),
    });
    return {
      success: response.ok,
      url: platformUrl,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    return {
      success: false,
      url: platformUrl,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function initEndpoint(config: Config): MarkupAIClient {
  const platformUrl = getPlatformUrl(config);
  const rawClient = new MarkupAIClient({ token: config.apiKey, baseUrl: platformUrl });
  return wrapClientWithRateLimit(rawClient, config);
}

// Generic rate limit aware retry helper for SDK calls
export async function withRateLimitRetry<T>(
  operation: () => Promise<T>,
  config: Config,
  operationLabel?: string,
): Promise<T> {
  const maxRetries = config.rateLimit?.maxRetries ?? 5;
  const baseDelay = config.rateLimit?.initialDelayMs ?? 1_000;
  const maxDelay = config.rateLimit?.maxDelayMs ?? 16_000;
  const jitter = config.rateLimit?.jitter ?? true;

  let attempt = 0;
  for (;;) {
    try {
      return await operation();
    } catch (err) {
      type RateLimitLike = {
        statusCode?: number;
        status?: number;
        body?: Record<string, unknown>;
        headers?: Record<string, unknown>;
      };
      const error = err as RateLimitLike | Error;

      const status =
        (error as RateLimitLike)?.statusCode ?? (error as RateLimitLike)?.status ?? undefined;
      const isRateLimit = status === 429;

      if (!isRateLimit) {
        // rethrow non-rate limit errors immediately
        throw err;
      }

      if (attempt >= maxRetries) {
        // Convert into our ApiError with rate limit type
        if ("statusCode" in (error as RateLimitLike)) {
          const errBody = ((error as RateLimitLike).body as Record<string, unknown>) ?? {
            detail: "Rate limit exceeded",
          };
          const apiErr = ApiError.fromResponse(429, errBody);
          // Attach original error as cause for debugging/transparency
          throw new ApiError(
            apiErr.message,
            apiErr.type,
            apiErr.statusCode,
            apiErr.rawErrorData,
            err as Error,
          );
        }
        throw new ApiError(
          "Rate limit exceeded",
          ErrorType.RATE_LIMIT_ERROR,
          429,
          {},
          err as Error,
        );
      }

      // Respect Retry-After header if available
      let delayMs: number | undefined;
      const headers = (error as RateLimitLike)?.headers;
      const retryAfterHeader = (headers?.["Retry-After"] ??
        headers?.["retry-after"] ??
        headers?.["retry_after"]) as string | number | undefined;

      if (retryAfterHeader !== undefined) {
        const retryAfterSec =
          typeof retryAfterHeader === "string"
            ? Number.parseFloat(retryAfterHeader)
            : Number(retryAfterHeader);
        if (!Number.isNaN(retryAfterSec) && Number.isFinite(retryAfterSec)) {
          delayMs = Math.max(0, Math.floor(retryAfterSec * 1_000));
        }
      }

      // If X-RateLimit-Reset is present (epoch seconds), compute until reset
      if (!delayMs && headers && (headers["X-RateLimit-Reset"] || headers["x-ratelimit-reset"])) {
        const reset = (headers["X-RateLimit-Reset"] ?? headers["x-ratelimit-reset"]) as
          | string
          | number;
        const resetEpochSec =
          typeof reset === "string" ? Number.parseInt(reset, 10) : Number(reset);
        if (!Number.isNaN(resetEpochSec)) {
          const msUntilReset = resetEpochSec * 1_000 - Date.now();
          if (Number.isFinite(msUntilReset)) {
            delayMs = Math.max(0, msUntilReset);
          }
        }
      }

      // Fallback to exponential backoff
      if (!delayMs) {
        const backoff = Math.min(maxDelay, baseDelay * Math.pow(2, attempt));
        delayMs = jitter ? Math.floor(backoff / 2 + Math.random() * (backoff / 2)) : backoff;
      }

      if (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "test") {
        console.warn(
          `[RateLimit] ${operationLabel ?? "operation"} attempt ${attempt + 1} hit 429. Retrying in ${delayMs} ms...`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempt += 1;
      continue;
    }
  }
}

// Deep Proxy wrapper to apply rate limit retry to all SDK method calls
function wrapClientWithRateLimit<T extends object>(
  client: T,
  config: Config,
  path: string = "client",
): T {
  const proxyCache = new WeakMap<object, object>();

  const makeProxy = <U extends object>(target: U, currentPath: string): U => {
    if (typeof target !== "object" || target === null) return target;
    const cached = proxyCache.get(target);
    if (cached) return cached as U;

    const proxy = new Proxy(target as object, {
      get: (t: object, prop: string | symbol, receiver: unknown) => {
        const value = Reflect.get(t as Record<string | symbol, unknown>, prop, receiver as object);

        // If value is a function, return a wrapped function that retries on 429
        if (typeof value === "function") {
          const methodLabel = `${currentPath}.${String(prop)}`;
          type AnyAsyncMethod = (...methodArgs: unknown[]) => Promise<unknown>;
          const original = value as AnyAsyncMethod;
          return (...args: unknown[]) =>
            withRateLimitRetry(() => original.apply(t, args), config, methodLabel);
        }

        // If value is an object, recursively proxy it
        if (typeof value === "object" && value !== null) {
          return makeProxy(value, `${currentPath}.${String(prop)}`);
        }

        return value;
      },
    });

    proxyCache.set(target, proxy);
    return proxy as U;
  };

  return makeProxy(client, path);
}
