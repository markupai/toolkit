// Error type enums to avoid string repetition
export enum ErrorType {
  // API Error Types (from server responses)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  WORKFLOW_NOT_FOUND = 'workflowNotFound',
  UNAUTHORIZED_ERROR = 'UNAUTHORIZED_ERROR',
  PAYLOAD_TOO_LARGE_ERROR = 'PAYLOAD_TOO_LARGE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',

  // Toolkit Error Types (for non-API errors)
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  WORKFLOW_FAILED = 'WORKFLOW_FAILED',
  UNEXPECTED_STATUS = 'UNEXPECTED_STATUS',
  POLLING_ERROR = 'POLLING_ERROR',
}

// Error types for different API error formats
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    description: string;
  };
  [key: string]: unknown;
}

export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ValidationErrorResponse {
  detail: ValidationErrorDetail[];
  [key: string]: unknown;
}

// New error response interfaces based on the provided examples
export interface StandardErrorResponse {
  detail: string;
  status: number;
  request_id: string;
  [key: string]: unknown;
}

export interface ValidationErrorResponse422 {
  detail: string;
  status: number;
  request_id: string;
  errors: ValidationErrorDetail[];
  [key: string]: unknown;
}

export interface PayloadTooLargeErrorResponse {
  summary: string;
  value: {
    detail: string;
    status: number;
    request_id: string;
  };
  [key: string]: unknown;
}

// Simplified ApIError with consolidated error information
export class ApIError extends Error {
  public readonly statusCode?: number; // Optional - only present for API errors
  public readonly type: ErrorType;
  public readonly rawErrorData: Record<string, unknown>;

  constructor(message: string, type: ErrorType, statusCode?: number, rawErrorData: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApIError';
    this.statusCode = statusCode;
    this.type = type;
    this.rawErrorData = rawErrorData;

    // This is needed to make instanceof work correctly
    Object.setPrototypeOf(this, ApIError.prototype);
  }

  /**
   * Creates an ApIError from an API response
   * Uses status code-based error type detection for better maintainability
   */
  static fromResponse(statusCode: number, errorData: Record<string, unknown>): ApIError {
    // Handle different status codes with appropriate error types
    switch (statusCode) {
      case 400:
        return this.handle400Error(errorData, statusCode);
      case 401:
        return this.handle401Error(errorData, statusCode);
      case 404:
        return this.handle404Error(errorData, statusCode);
      case 413:
        return this.handle413Error(errorData, statusCode);
      case 422:
        return this.handle422Error(errorData, statusCode);
      case 500:
        return this.handle500Error(errorData, statusCode);
      default:
        return this.handleUnknownError(errorData, statusCode);
    }
  }

  /**
   * Handle 400 Bad Request errors
   */
  private static handle400Error(errorData: Record<string, unknown>, statusCode: number): ApIError {
    const message = typeof errorData.message === 'string' ? errorData.message : undefined;
    const detail = typeof errorData.detail === 'string' ? errorData.detail : undefined;
    const errorMessage = message || detail || `Bad Request (${statusCode})`;

    return new ApIError(errorMessage, ErrorType.UNKNOWN_ERROR, statusCode, errorData);
  }

  /**
   * Handle 401 Unauthorized errors
   */
  private static handle401Error(errorData: Record<string, unknown>, statusCode: number): ApIError {
    // Handle the specific 401 format with code, message, description
    if (this.isApiErrorResponse(errorData)) {
      const { error } = errorData as ApiErrorResponse;
      const message = error.description || error.message;

      return new ApIError(message, ErrorType.UNAUTHORIZED_ERROR, statusCode, errorData);
    }

    // Handle direct format with code, message, description
    if (this.isDirectApiErrorResponse(errorData)) {
      const message = (errorData.description as string) || (errorData.message as string);

      return new ApIError(message, ErrorType.UNAUTHORIZED_ERROR, statusCode, errorData);
    }

    // Fallback for other 401 formats
    const detail = typeof errorData.detail === 'string' ? errorData.detail : undefined;
    const message = detail || `Unauthorized (${statusCode})`;

    return new ApIError(message, ErrorType.UNAUTHORIZED_ERROR, statusCode, errorData);
  }

  /**
   * Handle 404 Not Found errors
   */
  private static handle404Error(errorData: Record<string, unknown>, statusCode: number): ApIError {
    // Handle the specific 404 format with error object
    if (this.isApiErrorResponse(errorData)) {
      const { error } = errorData as ApiErrorResponse;
      const message = error.description || error.message;
      const type = error.code as ErrorType;

      return new ApIError(message, type, statusCode, errorData);
    }

    // Handle standard 404 format
    const detail = typeof errorData.detail === 'string' ? errorData.detail : undefined;
    const message = detail || `Not Found (${statusCode})`;

    return new ApIError(message, ErrorType.WORKFLOW_NOT_FOUND, statusCode, errorData);
  }

  /**
   * Handle 413 Payload Too Large errors
   */
  private static handle413Error(errorData: Record<string, unknown>, statusCode: number): ApIError {
    // Handle the specific 413 format with summary and value
    if (this.isPayloadTooLargeErrorResponse(errorData)) {
      const { summary, value } = errorData as PayloadTooLargeErrorResponse;
      const message = summary || value.detail || `Payload Too Large (${statusCode})`;

      return new ApIError(message, ErrorType.PAYLOAD_TOO_LARGE_ERROR, statusCode, errorData);
    }

    // Fallback for other 413 formats
    const detail = typeof errorData.detail === 'string' ? errorData.detail : undefined;
    const message = detail || `Payload Too Large (${statusCode})`;

    return new ApIError(message, ErrorType.PAYLOAD_TOO_LARGE_ERROR, statusCode, errorData);
  }

  /**
   * Handle 422 Validation errors
   */
  private static handle422Error(errorData: Record<string, unknown>, statusCode: number): ApIError {
    // Handle the specific 422 format with errors array
    if (this.isValidationErrorResponse422(errorData)) {
      const { errors } = errorData as ValidationErrorResponse422;
      const validationMessages = errors.map((e) => e.msg).join('; ');
      const message = `Validation failed: ${validationMessages}`;

      return new ApIError(message, ErrorType.VALIDATION_ERROR, statusCode, errorData);
    }

    // Handle legacy validation format
    if (this.isValidationErrorResponse(errorData)) {
      const { detail } = errorData as ValidationErrorResponse;
      const validationMessages = detail.map((d) => d.msg).join('; ');
      const message = `Validation failed: ${validationMessages}`;

      return new ApIError(message, ErrorType.VALIDATION_ERROR, statusCode, errorData);
    }

    // Fallback for other 422 formats
    const detail = typeof errorData.detail === 'string' ? errorData.detail : undefined;
    const message = detail || `Validation Error (${statusCode})`;

    return new ApIError(message, ErrorType.VALIDATION_ERROR, statusCode, errorData);
  }

  /**
   * Handle 500 Internal Server errors
   */
  private static handle500Error(errorData: Record<string, unknown>, statusCode: number): ApIError {
    const message = typeof errorData.message === 'string' ? errorData.message : undefined;
    const detail = typeof errorData.detail === 'string' ? errorData.detail : undefined;
    const errorMessage = message || detail || `Internal Server Error (${statusCode})`;

    return new ApIError(errorMessage, ErrorType.INTERNAL_SERVER_ERROR, statusCode, errorData);
  }

  /**
   * Handle unknown status codes
   */
  private static handleUnknownError(errorData: Record<string, unknown>, statusCode: number): ApIError {
    const detail = typeof errorData.detail === 'string' ? errorData.detail : undefined;
    const message = typeof errorData.message === 'string' ? errorData.message : undefined;
    const errorMessage = message || detail || `HTTP error! status: ${statusCode}`;

    return new ApIError(errorMessage, ErrorType.UNKNOWN_ERROR, statusCode, errorData);
  }

  /**
   * Creates an ApIError for non-API errors (network, timeout, etc.)
   */
  static fromError(error: Error, type: ErrorType): ApIError {
    return new ApIError(error.message, type, undefined, { originalError: error });
  }

  /**
   * Check if the error data matches the API error format (for 401 errors)
   */
  private static isApiErrorResponse(
    errorData: Record<string, unknown>,
  ): errorData is Record<string, unknown> & ApiErrorResponse {
    return (
      typeof errorData === 'object' &&
      errorData !== null &&
      'error' in errorData &&
      typeof errorData.error === 'object' &&
      errorData.error !== null &&
      'code' in errorData.error &&
      'message' in errorData.error &&
      typeof errorData.error.code === 'string' &&
      typeof errorData.error.message === 'string'
    );
  }

  /**
   * Check if the error data matches the direct API error format (code, message, description at root level)
   */
  private static isDirectApiErrorResponse(
    errorData: Record<string, unknown>,
  ): errorData is Record<string, unknown> & { code: string; message: string; description?: string } {
    return (
      typeof errorData === 'object' &&
      errorData !== null &&
      'code' in errorData &&
      'message' in errorData &&
      typeof errorData.code === 'string' &&
      typeof errorData.message === 'string'
    );
  }

  /**
   * Check if the error data matches the validation error format (legacy)
   */
  private static isValidationErrorResponse(
    errorData: Record<string, unknown>,
  ): errorData is Record<string, unknown> & ValidationErrorResponse {
    return (
      typeof errorData === 'object' &&
      errorData !== null &&
      'detail' in errorData &&
      Array.isArray(errorData.detail) &&
      errorData.detail.length > 0 &&
      errorData.detail.every(
        (item) =>
          typeof item === 'object' &&
          item !== null &&
          'loc' in item &&
          'msg' in item &&
          'type' in item &&
          Array.isArray(item.loc) &&
          typeof item.msg === 'string' &&
          typeof item.type === 'string',
      )
    );
  }

  /**
   * Check if the error data matches the new 422 validation error format
   */
  private static isValidationErrorResponse422(
    errorData: Record<string, unknown>,
  ): errorData is Record<string, unknown> & ValidationErrorResponse422 {
    return (
      typeof errorData === 'object' &&
      errorData !== null &&
      'detail' in errorData &&
      'status' in errorData &&
      'request_id' in errorData &&
      'errors' in errorData &&
      Array.isArray(errorData.errors) &&
      errorData.errors.length > 0 &&
      errorData.errors.every(
        (item) =>
          typeof item === 'object' &&
          item !== null &&
          'loc' in item &&
          'msg' in item &&
          'type' in item &&
          Array.isArray(item.loc) &&
          typeof item.msg === 'string' &&
          typeof item.type === 'string',
      )
    );
  }

  /**
   * Check if the error data matches the 413 payload too large error format
   */
  private static isPayloadTooLargeErrorResponse(
    errorData: Record<string, unknown>,
  ): errorData is Record<string, unknown> & PayloadTooLargeErrorResponse {
    return (
      typeof errorData === 'object' &&
      errorData !== null &&
      'summary' in errorData &&
      'value' in errorData &&
      typeof errorData.value === 'object' &&
      errorData.value !== null &&
      'detail' in errorData.value &&
      'status' in errorData.value &&
      'request_id' in errorData.value
    );
  }

  /**
   * Check if this is an API error (has status code)
   */
  get isApiError(): boolean {
    return this.statusCode !== undefined;
  }

  /**
   * Check if this is a validation error
   */
  get isValidationError(): boolean {
    return this.type === ErrorType.VALIDATION_ERROR || this.statusCode === 422;
  }

  /**
   * Check if this is a not found error
   */
  get isNotFoundError(): boolean {
    return this.statusCode === 404 || this.type === ErrorType.WORKFLOW_NOT_FOUND;
  }

  /**
   * Check if this is an unauthorized error
   */
  get isUnauthorizedError(): boolean {
    return this.statusCode === 401 || this.type === ErrorType.UNAUTHORIZED_ERROR;
  }

  /**
   * Check if this is a payload too large error
   */
  get isPayloadTooLargeError(): boolean {
    return this.statusCode === 413 || this.type === ErrorType.PAYLOAD_TOO_LARGE_ERROR;
  }

  /**
   * Check if this is an internal server error
   */
  get isInternalServerError(): boolean {
    return this.statusCode === 500 || this.type === ErrorType.INTERNAL_SERVER_ERROR;
  }

  /**
   * Check if this is a network error
   */
  get isNetworkError(): boolean {
    return this.type === ErrorType.NETWORK_ERROR;
  }

  /**
   * Check if this is a timeout error
   */
  get isTimeoutError(): boolean {
    return this.type === ErrorType.TIMEOUT_ERROR;
  }

  /**
   * Check if this is a workflow failure error
   */
  get isWorkflowFailed(): boolean {
    return this.type === ErrorType.WORKFLOW_FAILED;
  }

  /**
   * Get validation errors in a structured format (only for validation errors)
   */
  getValidationErrors(): Record<string, string[]> {
    if (!this.isValidationError) {
      return {};
    }

    // Handle new 422 format
    if (this.rawErrorData.errors && Array.isArray(this.rawErrorData.errors)) {
      const errors: Record<string, string[]> = {};

      for (const error of this.rawErrorData.errors as ValidationErrorDetail[]) {
        const field = error.loc.join('.');
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(error.msg);
      }

      return errors;
    }

    // Handle legacy format
    if (this.rawErrorData.detail && Array.isArray(this.rawErrorData.detail)) {
      const errors: Record<string, string[]> = {};

      for (const error of this.rawErrorData.detail as ValidationErrorDetail[]) {
        const field = error.loc.join('.');
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(error.msg);
      }

      return errors;
    }

    return {};
  }
}
