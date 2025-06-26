import type { CreateStyleGuideReq } from './style.api.types';

/**
 * Detects if the current environment is Node.js
 */
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
}

/**
 * Creates a CreateStyleGuideReq from a file URL in Node.js environments.
 * This utility is only available in Node.js environments.
 *
 * @param fileUrl - The URL or path to the PDF file
 * @param name - Optional name for the style guide. If not provided, uses the filename
 * @returns Promise<CreateStyleGuideReq> - The request object ready for createStyleGuide
 * @throws Error if not in Node.js environment or if file cannot be read
 */
export async function createStyleGuideReqFromUrl(fileUrl: string | URL, name?: string): Promise<CreateStyleGuideReq> {
  // Check if we're in a Node.js environment
  if (!isNodeEnvironment()) {
    throw new Error(
      'createStyleGuideReqFromUrl is only available in Node.js environments. In browser environments, use createStyleGuide directly with a File object.',
    );
  }

  try {
    // Dynamic imports to avoid browser bundling issues
    const { readFileSync } = await import('fs');
    const { basename } = await import('path');
    const { fileURLToPath } = await import('url');

    // Convert URL to path if it's a file:// URL
    let filePath: string;
    if (typeof fileUrl === 'string') {
      if (fileUrl.startsWith('file://')) {
        filePath = fileURLToPath(fileUrl);
      } else {
        filePath = fileUrl;
      }
    } else {
      // URL object
      if (fileUrl.protocol === 'file:') {
        filePath = fileURLToPath(fileUrl);
      } else {
        throw new Error('Only file:// URLs are supported. Please provide a local file path or file:// URL.');
      }
    }

    // Read the file
    const fileBuffer = readFileSync(filePath);

    // Get the filename from the path
    const filename = basename(filePath);

    // Validate file extension
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    if (!fileExtension || fileExtension !== 'pdf') {
      throw new Error(`Unsupported file type: ${fileExtension}. Only .pdf files are supported.`);
    }

    // Create File object from buffer
    const file = new File([fileBuffer], filename, {
      type: 'application/pdf',
    });

    // Use provided name or fall back to filename (without extension)
    const styleGuideName = name || filename.replace(/\.pdf$/i, '');

    return {
      file,
      name: styleGuideName,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create style guide request from URL: ${error.message}`);
    }
    throw new Error('Failed to create style guide request from URL: Unknown error');
  }
}

/**
 * Creates a CreateStyleGuideReq from a file path in Node.js environments.
 * This is a convenience wrapper around createStyleGuideReqFromUrl.
 *
 * @param filePath - The path to the PDF file
 * @param name - Optional name for the style guide. If not provided, uses the filename
 * @returns Promise<CreateStyleGuideReq> - The request object ready for createStyleGuide
 * @throws Error if not in Node.js environment or if file cannot be read
 */
export async function createStyleGuideReqFromPath(filePath: string, name?: string): Promise<CreateStyleGuideReq> {
  return createStyleGuideReqFromUrl(filePath, name);
}
