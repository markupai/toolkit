import { acrolinxClient } from 'acrolinx-nextgen-api';
import { Environment, PlatformType } from './api.types';
import type { Config } from './api.types';

export const DEFAULT_PLATFORM_URL_PROD = 'https://app.acrolinx.cloud';
export const DEFAULT_PLATFORM_URL_STAGE = 'https://app.stg.acrolinx-cloud.net';
export const DEFAULT_PLATFORM_URL_DEV = 'https://app.dev.acrolinx-cloud.net';

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
  const baseUrl = platformUrl.endsWith('/') ? platformUrl.slice(0, -1) : platformUrl;
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
}

// Helper function to verify platform URL is reachable
export async function verifyPlatformUrl(config: Config): Promise<{ success: boolean; url: string; error?: string }> {
  const platformUrl = getPlatformUrl(config);
  try {
    // TODO: This is a temporary fix to verify the platform URL is reachable.
    // We should use a health check endpoint instead.
    const fullUrl = buildFullUrl(platformUrl, '/v1/style-guides');
    const response = await fetch(fullUrl, {
      method: 'GET',
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
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function initEndpoint(config: Config): acrolinxClient {
  const platformUrl = getPlatformUrl(config);
  return new acrolinxClient({ token: config.apiKey, baseUrl: platformUrl });
}
