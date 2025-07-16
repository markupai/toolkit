import { getData, postData, patchData, deleteData } from '../../utils/api';
import type { StyleGuides, StyleGuide, CreateStyleGuideReq, StyleGuideUpdateReq } from './style.api.types';
import type { Config, ApiConfig } from '../../utils/api.types';

export const STYLE_GUIDES_ENDPOINT = '/v1/style-guides';

// List all style guides
export async function listStyleGuides(config: Config): Promise<StyleGuides> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: STYLE_GUIDES_ENDPOINT,
  };
  return getData<StyleGuides>(apiConfig);
}

// Fetch a single style guide by ID
export async function getStyleGuide(styleGuideId: string, config: Config): Promise<StyleGuide> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: `${STYLE_GUIDES_ENDPOINT}/${styleGuideId}`,
  };
  return getData<StyleGuide>(apiConfig);
}

// Create a new style guide from a File object
export async function createStyleGuide(request: CreateStyleGuideReq, config: Config): Promise<StyleGuide> {
  const { file, name } = request;
  // Validate file type - only PDF files are supported
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || fileExtension !== 'pdf') {
    throw new Error(`Unsupported file type: ${fileExtension}. Only .pdf files are supported.`);
  }
  const apiConfig: ApiConfig = {
    ...config,
    endpoint: STYLE_GUIDES_ENDPOINT,
  };
  const formData = new FormData();
  formData.append('file_upload', file);
  formData.append('name', name);
  return postData<StyleGuide>(apiConfig, formData);
}

// Update a style guide by ID
export async function updateStyleGuide(
  styleGuideId: string,
  updates: StyleGuideUpdateReq,
  config: Config,
): Promise<StyleGuide> {
  const apiConfig = {
    ...config,
    endpoint: `${STYLE_GUIDES_ENDPOINT}/${styleGuideId}`,
  };
  return patchData<StyleGuide>(apiConfig, JSON.stringify(updates));
}

// Delete a style guide by ID
export async function deleteStyleGuide(styleGuideId: string, config: Config): Promise<void> {
  const apiConfig = {
    ...config,
    endpoint: `${STYLE_GUIDES_ENDPOINT}/${styleGuideId}`,
  };
  await deleteData<void>(apiConfig);
}
