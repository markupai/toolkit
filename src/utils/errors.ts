// Error type enums to avoid string repetition
export enum ErrorType {
  // API Error Types (from server responses)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  WORKFLOW_NOT_FOUND = 'workflowNotFound',

  // SDK Error Types (for non-API errors)
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

// Simplified AcrolinxError with consolidated error information
export class AcrolinxError extends Error {
  public readonly statusCode?: number; // Optional - only present for API errors
  public readonly type: ErrorType;
  public readonly rawErrorData: Record<string, unknown>;

  constructor(message: string, type: ErrorType, statusCode?: number, rawErrorData: Record<string, unknown> = {}) {
    super(message);
    this.name = 'AcrolinxError';
    this.statusCode = statusCode;
    this.type = type;
    this.rawErrorData = rawErrorData;

    // This is needed to make instanceof work correctly
    Object.setPrototypeOf(this, AcrolinxError.prototype);
  }

  /**
   * Creates an AcrolinxError from an API response
   * Handles both error formats and consolidates them into a unified interface:
   * - 404 format: { error: { code, message, description } }
   * - 422 format: { detail: [{ loc, msg, type }] }
   */
  static fromResponse(response: Response, errorData: Record<string, unknown>): AcrolinxError {
    const statusCode = response.status;

    // Try to parse as API error format (404, etc.)
    if (this.isApiErrorResponse(errorData)) {
      const { error } = errorData as ApiErrorResponse;
      const message = error.description || error.message;
      const type = error.code as ErrorType;

      return new AcrolinxError(message, type, statusCode, errorData);
    }

    // Try to parse as validation error format (422, etc.)
    if (this.isValidationErrorResponse(errorData)) {
      const { detail } = errorData as ValidationErrorResponse;
      const validationMessages = detail.map((d) => d.msg).join('; ');
      const message = `Validation failed: ${validationMessages}`;

      return new AcrolinxError(message, ErrorType.VALIDATION_ERROR, statusCode, errorData);
    }

    // Fallback for unknown error formats
    const detail = typeof errorData.detail === 'string' ? errorData.detail : undefined;
    const message = typeof errorData.message === 'string' ? errorData.message : undefined;
    const errorMessage = message || detail || `HTTP error! status: ${statusCode}`;

    return new AcrolinxError(errorMessage, ErrorType.UNKNOWN_ERROR, statusCode, errorData);
  }

  /**
   * Creates an AcrolinxError for non-API errors (network, timeout, etc.)
   */
  static fromError(error: Error, type: ErrorType): AcrolinxError {
    return new AcrolinxError(error.message, type, undefined, { originalError: error });
  }

  /**
   * Check if the error data matches the API error format
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
   * Check if the error data matches the validation error format
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
    if (!this.isValidationError || !this.rawErrorData.detail || !Array.isArray(this.rawErrorData.detail)) {
      return {};
    }

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
}
