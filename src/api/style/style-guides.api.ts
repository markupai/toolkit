import type { StyleGuides, StyleGuide, CreateStyleGuideReq, StyleGuideUpdateReq } from './style.api.types';
import type { Config } from '../../utils/api.types';
import { initEndpoint } from './style.api.utils';
import { acrolinxError } from 'acrolinx-nextgen-api';
import { AcrolinxError } from '../../utils/errors';

// List all style guides
export async function listStyleGuides(config: Config): Promise<StyleGuides> {
  try {
    const client = initEndpoint(config);
    return (await client.styleGuides.listStyleGuides()) as StyleGuides;
  } catch (error) {
    if (error instanceof acrolinxError) {
      throw AcrolinxError.fromResponse(error.statusCode || 0, error.body as Record<string, unknown>);
    }
    throw new Error(`Failed to list style guides: ${error}`);
  }
}

// Fetch a single style guide by ID
export async function getStyleGuide(styleGuideId: string, config: Config): Promise<StyleGuide> {
  try {
    const client = initEndpoint(config);
    return (await client.styleGuides.getStyleGuide(styleGuideId)) as StyleGuide;
  } catch (error) {
    if (error instanceof acrolinxError) {
      throw AcrolinxError.fromResponse(error.statusCode || 0, error.body as Record<string, unknown>);
    }
    throw new Error(`Failed to get style guide: ${error}`);
  }
}

// Create a new style guide from a File object
export async function createStyleGuide(request: CreateStyleGuideReq, config: Config): Promise<StyleGuide> {
  const { file, name } = request;
  // Validate file type - only PDF files are supported
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || fileExtension !== 'pdf') {
    throw new Error(`Unsupported file type: ${fileExtension}. Only .pdf files are supported.`);
  }

  try {
    const client = initEndpoint(config);
    return (await client.styleGuides.createStyleGuide(file, {
      name,
    })) as StyleGuide;
  } catch (error) {
    if (error instanceof acrolinxError) {
      throw AcrolinxError.fromResponse(error.statusCode || 0, error.body as Record<string, unknown>);
    }
    throw new Error(`Failed to create style guide: ${error}`);
  }
}

// Update a style guide by ID
export async function updateStyleGuide(
  styleGuideId: string,
  updates: StyleGuideUpdateReq,
  config: Config,
): Promise<StyleGuide> {
  try {
    const client = initEndpoint(config);
    return (await client.styleGuides.updateStyleGuide(styleGuideId, updates)) as StyleGuide;
  } catch (error) {
    if (error instanceof acrolinxError) {
      throw AcrolinxError.fromResponse(error.statusCode || 0, error.body as Record<string, unknown>);
    }
    throw new Error(`Failed to update style guide: ${error}`);
  }
}

// Delete a style guide by ID
export async function deleteStyleGuide(styleGuideId: string, config: Config): Promise<void> {
  try {
    const client = initEndpoint(config);
    await client.styleGuides.deleteStyleGuide(styleGuideId);
  } catch (error) {
    if (error instanceof acrolinxError) {
      throw AcrolinxError.fromResponse(error.statusCode || 0, error.body as Record<string, unknown>);
    }
    throw new Error(`Failed to delete style guide: ${error}`);
  }
}

/**
 * Validates an API token by attempting to call the listStyleGuides endpoint.
 * Returns true if the token is valid (response is ok), false otherwise.
 * @param config - The configuration object containing the API key and platform settings
 * @returns Promise<boolean> - True if token is valid, false otherwise
 */
export async function validateToken(config: Config): Promise<boolean> {
  try {
    await listStyleGuides(config);
    return true;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}
