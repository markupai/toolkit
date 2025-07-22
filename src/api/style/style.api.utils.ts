import type { CreateStyleGuideReq } from './style.api.types';
import { postData } from '../../utils/api';
import { pollWorkflowForResult } from '../../utils/api';
import { Status } from '../../utils/api.types';
import type { Config, ApiConfig, Status as StatusType } from '../../utils/api.types';
import type { StyleAnalysisSubmitResp } from './style.api.types';
import type { ResponseBase } from '../../utils/api.types';

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

// Generic type guard for completed responses
export function isCompletedResponse<T extends ResponseBase>(resp: T): resp is T & { status: Status.Completed } {
  return resp.status === Status.Completed;
}

// Batch processing utilities
import type {
  BatchOptions,
  BatchResult,
  BatchProgress,
  BatchResponse,
  StyleAnalysisResponseType,
} from './style.api.types';

// Type dispatcher for style functions
type StyleFunction<T> = (request: StyleAnalysisReq, config: Config) => Promise<T>;

// Queue management for batch processing
class BatchQueue<T extends StyleAnalysisResponseType> {
  private inProgress = new Set<number>();
  public results: Array<BatchResult<T>> = [];
  private cancelled = false;
  private resolvePromise?: (value: BatchProgress<T>) => void;
  private rejectPromise?: (reason: Error) => void;
  public startTime: number;
  public estimatedCompletionTime?: number;

  constructor(
    private requests: StyleAnalysisReq[],
    private config: Config,
    private styleFunction: StyleFunction<T>,
    private options: Required<BatchOptions>,
    private onProgressUpdate?: (progress: BatchProgress<T>) => void,
  ) {
    this.startTime = Date.now();
    this.initializeResults();
  }

  private initializeResults(): void {
    this.results = this.requests.map((request, index) => ({
      index,
      request,
      status: 'pending' as const,
    }));
  }

  private getProgress(): BatchProgress<T> {
    const completed = this.results.filter((r) => r.status === 'completed').length;
    const failed = this.results.filter((r) => r.status === 'failed').length;
    const inProgress = this.results.filter((r) => r.status === 'in-progress').length;
    const pending = this.results.filter((r) => r.status === 'pending').length;

    return {
      total: this.requests.length,
      completed,
      failed,
      inProgress,
      pending,
      results: [...this.results],
      startTime: Date.now(),
    };
  }

  private updateProgress(): void {
    if (this.onProgressUpdate) {
      this.onProgressUpdate(this.getProgress());
    }
  }

  private async processRequest(index: number, request: StyleAnalysisReq): Promise<void> {
    if (this.cancelled) return;

    try {
      // Update status to in-progress
      this.results[index] = {
        ...this.results[index],
        status: 'in-progress',
        startTime: Date.now(),
      };
      this.updateProgress();

      // Execute the style function with retry logic
      const result = await this.executeWithRetry(request);

      // If result is undefined, treat as failure
      if (typeof result === 'undefined') {
        this.results[index] = {
          ...this.results[index],
          status: 'failed',
          error: new Error('Batch operation returned undefined result'),
          endTime: Date.now(),
        };
      } else {
        // Update with success
        this.results[index] = {
          ...this.results[index],
          status: 'completed',
          result,
          endTime: Date.now(),
        };
      }
    } catch (error) {
      // Update with failure
      this.results[index] = {
        ...this.results[index],
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
        endTime: Date.now(),
      };
    } finally {
      this.inProgress.delete(index);
      this.updateProgress();
      this.processNext();
    }
  }

  private async executeWithRetry(request: StyleAnalysisReq): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.options.retryAttempts; attempt++) {
      try {
        return await this.styleFunction(request, this.config);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on certain error types
        if (this.shouldNotRetry(lastError)) {
          throw lastError;
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.options.retryAttempts) {
          await this.delay(this.options.retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  private shouldNotRetry(error: Error): boolean {
    // Don't retry on authentication, authorization, or validation errors
    const nonRetryableErrors = [
      'authentication',
      'authorization',
      'validation',
      'invalid',
      'unauthorized',
      'forbidden',
    ];

    return nonRetryableErrors.some((keyword) => error.message.toLowerCase().includes(keyword));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private processNext(): void {
    if (this.cancelled) return;

    // Find next pending request
    const nextRequest = this.results.find((r) => r.status === 'pending');
    if (!nextRequest) {
      // No more pending requests, check if we're done
      if (this.inProgress.size === 0) {
        this.resolvePromise?.(this.getProgress());
      }
      return;
    }

    // Check if we can start more requests
    if (this.inProgress.size >= this.options.maxConcurrent) {
      return;
    }

    // Start processing the next request
    this.inProgress.add(nextRequest.index);
    this.processRequest(nextRequest.index, nextRequest.request);
  }

  public start(): Promise<BatchProgress<T>> {
    return new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      // Start initial batch of requests
      const initialBatch = Math.min(this.options.maxConcurrent, this.requests.length);

      for (let i = 0; i < initialBatch; i++) {
        this.inProgress.add(i);
        this.processRequest(i, this.requests[i]);
      }
    });
  }

  public cancel(): void {
    this.cancelled = true;
    this.rejectPromise?.(new Error('Batch operation cancelled'));
  }
}

// Main batch processing function
export function styleBatchCheck<T extends StyleAnalysisResponseType>(
  requests: StyleAnalysisReq[],
  config: Config,
  options: BatchOptions = {},
  styleFunction: StyleFunction<T>,
): BatchResponse<T> {
  // Validate inputs
  if (!requests || requests.length === 0) {
    throw new Error('Requests array cannot be empty');
  }

  if (requests.length > 1000) {
    throw new Error('Maximum 1000 requests allowed per batch');
  }

  // Set default options
  const defaultOptions: Required<BatchOptions> = {
    maxConcurrent: 100,
    retryAttempts: 2,
    retryDelay: 1000,
    timeout: 300000, // 5 minutes
  };

  const finalOptions: Required<BatchOptions> = {
    ...defaultOptions,
    ...options,
  };

  // Validate options
  if (finalOptions.maxConcurrent < 1 || finalOptions.maxConcurrent > 100) {
    throw new Error('maxConcurrent must be between 1 and 100');
  }

  if (finalOptions.retryAttempts < 0 || finalOptions.retryAttempts > 5) {
    throw new Error('retryAttempts must be between 0 and 5');
  }

  // Create queue and start processing
  const queue = new BatchQueue<T>(requests, config, styleFunction, finalOptions);

  const promise = queue.start();

  // Create a reactive progress object that always reflects current state
  const progressObject = {
    get total() {
      return requests.length;
    },
    get completed() {
      return queue.results.filter((r) => r.status === 'completed').length;
    },
    get failed() {
      return queue.results.filter((r) => r.status === 'failed').length;
    },
    get inProgress() {
      return queue.results.filter((r) => r.status === 'in-progress').length;
    },
    get pending() {
      return queue.results.filter((r) => r.status === 'pending').length;
    },
    get results() {
      return [...queue.results];
    },
    get startTime() {
      return queue.startTime;
    },
    get estimatedCompletionTime() {
      return queue.estimatedCompletionTime;
    },
  } as BatchProgress<T>;

  return {
    progress: progressObject,
    promise,
    cancel: () => queue.cancel(),
  };
}
