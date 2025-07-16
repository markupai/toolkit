import type { CreateStyleGuideReq } from './style.api.types';
import { postData } from '../../utils/api';
import { pollWorkflowForResult } from '../../utils/api';
import { Status } from '../../utils/api.types';
import type { Config, ApiConfig, Status as StatusType } from '../../utils/api.types';
import type { StyleAnalysisSubmitResp } from './style.api.types';

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

// Helper function to get MIME type from filename
export function getMimeTypeFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'txt':
      return 'text/plain';
    case 'md':
      return 'text/markdown';
    case 'html':
      return 'text/html';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc':
      return 'application/msword';
    default:
      return 'application/octet-stream';
  }
}

// Helper function to check if an object is a Buffer
export function isBuffer(obj: unknown): obj is Buffer {
  if (typeof Buffer !== 'undefined') {
    return Buffer.isBuffer(obj);
  }
  return false;
}

import type { StyleAnalysisReq, FileDescriptor, BufferDescriptor } from './style.api.types';

// Helper function to create form data from style analysis request
export async function createStyleFormData(request: StyleAnalysisReq): Promise<FormData> {
  const formData = new FormData();
  const filename = request.documentName || 'unknown.txt';

  if (typeof request.content === 'string') {
    formData.append('file_upload', new Blob([request.content], { type: 'text/plain' }), filename);
  } else if (typeof File !== 'undefined' && 'file' in request.content && request.content.file instanceof File) {
    const fileDescriptor = request.content as FileDescriptor;
    formData.append('file_upload', fileDescriptor.file, filename);
  } else if ('buffer' in request.content && isBuffer(request.content.buffer)) {
    const bufferDescriptor = request.content as BufferDescriptor;
    const mimeType = bufferDescriptor.mimeType || getMimeTypeFromFilename(filename);
    const blob = new Blob([bufferDescriptor.buffer], { type: mimeType });
    formData.append('file_upload', blob, filename);
  } else {
    throw new Error('Invalid content type. Expected string, FileDescriptor, or BufferDescriptor.');
  }

  formData.append('style_guide', request.style_guide || '');
  formData.append('dialect', (request.dialect || 'american_english').toString());
  formData.append('tone', (request.tone || 'formal').toString());
  return formData;
}

// Helper function to handle style analysis submission and polling
export async function submitAndPollStyleAnalysis<T extends { status: StatusType }>(
  endpoint: string,
  request: StyleAnalysisReq,
  config: Config,
): Promise<T> {
  const apiConfig: ApiConfig = {
    ...config,
    endpoint,
  };

  const formData = await createStyleFormData(request);
  const initialResponse = await postData<StyleAnalysisSubmitResp>(apiConfig, formData);

  if (!initialResponse.workflow_id) {
    throw new Error(`No workflow_id received from initial ${endpoint} request`);
  }

  const polledResponse = await pollWorkflowForResult<T>(initialResponse.workflow_id, apiConfig);

  if (polledResponse.status === Status.Completed) {
    return polledResponse;
  }
  throw new Error(`${endpoint} failed with status: ${polledResponse.status}`);
}
