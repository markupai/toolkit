export const API_ENDPOINTS = {
  REWRITES: '/v1/rewrites/',
  CHECKS: '/v1/checks/',
  STYLE_GUIDES: '/v1/style-guides',
  STYLE_CHECKS: '/v1/style/checks',
  STYLE_SUGGESTIONS: '/v1/style/suggestions',
  STYLE_REWRITES: '/v1/style-rewrites',
} as const;

// Export all API functions
export * from './api/style.api';
export * from './api/demo.api';
