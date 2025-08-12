import { describe, it, expect } from 'vitest';
import {
  ApIError,
  ApiErrorResponse,
  ValidationErrorResponse,
  ErrorType,
  ValidationErrorResponse422,
  PayloadTooLargeErrorResponse,
} from '../../../src/utils/errors';

describe('ApIError', () => {
  describe('fromResponse', () => {
    it('should handle 400 Bad Request errors', () => {
      const errorData = {
        detail: 'Workflow not found',
        status: 400,
        request_id: '2fde4ca0-01f9-4343-8e40-2d85793a3897',
      };

      const error = ApIError.fromResponse(400, errorData);

      expect(error).toBeInstanceOf(ApIError);
      expect(error.statusCode).toBe(400);
      expect(error.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(error.message).toBe('Workflow not found');
      expect(error.isApiError).toBe(true);
    });

    it('should handle 401 Unauthorized errors with API format', () => {
      const errorData = {
        code: 'auth',
        message: 'Invalid API key',
        description:
          'API key is not valid, maybe it expired or has been revoked. Log into the API key management app to create a new one.',
      };

      const error = ApIError.fromResponse(401, errorData);

      expect(error).toBeInstanceOf(ApIError);
      expect(error.statusCode).toBe(401);
      expect(error.type).toBe(ErrorType.UNAUTHORIZED_ERROR);
      expect(error.message).toBe(
        'API key is not valid, maybe it expired or has been revoked. Log into the API key management app to create a new one.',
      );
      expect(error.isUnauthorizedError).toBe(true);
      expect(error.isApiError).toBe(true);
    });

    it('should handle 401 Unauthorized errors with standard format', () => {
      const errorData = {
        detail: 'Invalid API key',
        status: 401,
        request_id: '2fde4ca0-01f9-4343-8e40-2d85793a3897',
      };

      const error = ApIError.fromResponse(401, errorData);

      expect(error).toBeInstanceOf(ApIError);
      expect(error.statusCode).toBe(401);
      expect(error.type).toBe(ErrorType.UNAUTHORIZED_ERROR);
      expect(error.message).toBe('Invalid API key');
      expect(error.isUnauthorizedError).toBe(true);
      expect(error.isApiError).toBe(true);
    });

    it('should handle 404 API error format', () => {
      const errorData: ApiErrorResponse = {
        error: {
          code: 'workflowNotFound',
          message: 'The workflow was not found.',
          description: "The client attempted to poll or retrieve results for an ID that doesn't exist.",
        },
      };

      const error = ApIError.fromResponse(404, errorData);

      expect(error).toBeInstanceOf(ApIError);
      expect(error.statusCode).toBe(404);
      expect(error.type).toBe(ErrorType.WORKFLOW_NOT_FOUND);
      expect(error.message).toBe("The client attempted to poll or retrieve results for an ID that doesn't exist.");
      expect(error.isNotFoundError).toBe(true);
      expect(error.isValidationError).toBe(false);
      expect(error.isApiError).toBe(true);
    });

    it('should handle 404 standard error format', () => {
      const errorData = {
        detail: 'Workflow not found',
        status: 404,
        request_id: '2fde4ca0-01f9-4343-8e40-2d85793a3897',
      };

      const error = ApIError.fromResponse(404, errorData);

      expect(error).toBeInstanceOf(ApIError);
      expect(error.statusCode).toBe(404);
      expect(error.type).toBe(ErrorType.WORKFLOW_NOT_FOUND);
      expect(error.message).toBe('Workflow not found');
      expect(error.isNotFoundError).toBe(true);
      expect(error.isApiError).toBe(true);
    });

    it('should handle 413 Payload Too Large errors', () => {
      const errorData: PayloadTooLargeErrorResponse = {
        summary: 'Uploaded file is too large.',
        value: {
          detail: 'Maximum allowed file size is 1.5 MB',
          status: 413,
          request_id: '2fde4ca0-01f9-4343-8e40-2d85793a3897',
        },
      };

      const error = ApIError.fromResponse(413, errorData);

      expect(error).toBeInstanceOf(ApIError);
      expect(error.statusCode).toBe(413);
      expect(error.type).toBe(ErrorType.PAYLOAD_TOO_LARGE_ERROR);
      expect(error.message).toBe('Uploaded file is too large.');
      expect(error.isPayloadTooLargeError).toBe(true);
      expect(error.isApiError).toBe(true);
    });

    it('should handle 413 Payload Too Large errors with fallback', () => {
      const errorData = {
        detail: 'File size exceeds limit',
        status: 413,
        request_id: '2fde4ca0-01f9-4343-8e40-2d85793a3897',
      };

      const error = ApIError.fromResponse(413, errorData);

      expect(error).toBeInstanceOf(ApIError);
      expect(error.statusCode).toBe(413);
      expect(error.type).toBe(ErrorType.PAYLOAD_TOO_LARGE_ERROR);
      expect(error.message).toBe('File size exceeds limit');
      expect(error.isPayloadTooLargeError).toBe(true);
      expect(error.isApiError).toBe(true);
    });

    it('should handle 422 validation error format (new format)', () => {
      const errorData: ValidationErrorResponse422 = {
        detail: 'Invalid request',
        status: 422,
        request_id: '2fde4ca0-01f9-4343-8e40-2d85793a3897',
        errors: [
          {
            type: 'value_error',
            loc: ['body', 'file_upload'],
            msg: 'Value error, File must be one of the following content types: application/pdf, text/plain',
            input: {
              filename: 'not_text.png',
              size: 21286,
            },
            ctx: {
              error: {},
            },
          },
          {
            type: 'enum',
            loc: ['body', 'dialect'],
            msg: "Input should be 'american_english', 'british_oxford' or 'canadian_english'",
            input: 'spanish',
            ctx: {
              expected: "'american_english', 'british_oxford' or 'canadian_english'",
            },
          },
        ],
      };

      const error = ApIError.fromResponse(422, errorData);

      expect(error).toBeInstanceOf(ApIError);
      expect(error.statusCode).toBe(422);
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe(
        "Validation failed: Value error, File must be one of the following content types: application/pdf, text/plain; Input should be 'american_english', 'british_oxford' or 'canadian_english'",
      );
      expect(error.isNotFoundError).toBe(false);
      expect(error.isValidationError).toBe(true);
      expect(error.isApiError).toBe(true);
    });

    it('should handle 422 validation error format (legacy)', () => {
      const errorData: ValidationErrorResponse = {
        detail: [
          {
            loc: ['body', 'content', 0],
            msg: 'field required',
            type: 'value_error.missing',
          },
          {
            loc: ['body', 'style_guide_id'],
            msg: 'ensure this value has at least 1 characters',
            type: 'value_error.any_str.min_length',
          },
        ],
      };

      const error = ApIError.fromResponse(422, errorData);

      expect(error).toBeInstanceOf(ApIError);
      expect(error.statusCode).toBe(422);
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe('Validation failed: field required; ensure this value has at least 1 characters');
      expect(error.isNotFoundError).toBe(false);
      expect(error.isValidationError).toBe(true);
      expect(error.isApiError).toBe(true);
    });

    it('should handle 500 Internal Server errors', () => {
      const errorData = {
        detail:
          'An internal server error occurred. Please try again or contact support with the request ID if the issue persists.',
        status: 500,
        request_id: '2fde4ca0-01f9-4343-8e40-2d85793a3897',
      };

      const error = ApIError.fromResponse(500, errorData);

      expect(error).toBeInstanceOf(ApIError);
      expect(error.statusCode).toBe(500);
      expect(error.type).toBe(ErrorType.INTERNAL_SERVER_ERROR);
      expect(error.message).toBe(
        'An internal server error occurred. Please try again or contact support with the request ID if the issue persists.',
      );
      expect(error.isInternalServerError).toBe(true);
      expect(error.isApiError).toBe(true);
    });

    it('should handle unknown error format', () => {
      const errorData = {
        message: 'Something went wrong',
        detail: 'Internal server error occurred',
      };

      const error = ApIError.fromResponse(500, errorData);

      expect(error).toBeInstanceOf(ApIError);
      expect(error.statusCode).toBe(500);
      expect(error.type).toBe(ErrorType.INTERNAL_SERVER_ERROR);
      expect(error.message).toBe('Something went wrong');
      expect(error.isNotFoundError).toBe(false);
      expect(error.isValidationError).toBe(false);
      expect(error.isApiError).toBe(true);
    });

    it('should handle empty error data', () => {
      const errorData = {};

      const error = ApIError.fromResponse(400, errorData);

      expect(error).toBeInstanceOf(ApIError);
      expect(error.statusCode).toBe(400);
      expect(error.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(error.message).toBe('Bad Request (400)');
      expect(error.isApiError).toBe(true);
    });

    it('should use description over message for API errors', () => {
      const errorData: ApiErrorResponse = {
        error: {
          code: 'workflowNotFound',
          message: 'Short message',
          description: 'Detailed description of what went wrong',
        },
      };

      const error = ApIError.fromResponse(404, errorData);

      expect(error.message).toBe('Detailed description of what went wrong');
      expect(error.type).toBe(ErrorType.WORKFLOW_NOT_FOUND);
    });

    it('should fallback to message when description is not available', () => {
      const errorData = {
        error: {
          code: 'workflowNotFound',
          message: 'The workflow was not found.',
        },
      };

      const error = ApIError.fromResponse(404, errorData);

      expect(error.message).toBe('The workflow was not found.');
      expect(error.type).toBe(ErrorType.WORKFLOW_NOT_FOUND);
    });
  });

  describe('fromError', () => {
    it('should create error from non-API errors', () => {
      const originalError = new Error('Network connection failed');
      const error = ApIError.fromError(originalError, ErrorType.NETWORK_ERROR);

      expect(error).toBeInstanceOf(ApIError);
      expect(error.message).toBe('Network connection failed');
      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.statusCode).toBeUndefined();
      expect(error.isApiError).toBe(false);
      expect(error.isNetworkError).toBe(true);
      expect(error.rawErrorData.originalError).toBe(originalError);
    });

    it('should create timeout error', () => {
      const originalError = new Error('Request timeout');
      const error = ApIError.fromError(originalError, ErrorType.TIMEOUT_ERROR);

      expect(error.type).toBe(ErrorType.TIMEOUT_ERROR);
      expect(error.isTimeoutError).toBe(true);
      expect(error.isApiError).toBe(false);
    });
  });

  describe('getValidationErrors', () => {
    it('should return structured validation errors for new 422 format', () => {
      const errorData: ValidationErrorResponse422 = {
        detail: 'Invalid request',
        status: 422,
        request_id: '2fde4ca0-01f9-4343-8e40-2d85793a3897',
        errors: [
          {
            loc: ['body', 'file_upload'],
            msg: 'Value error, File must be one of the following content types: application/pdf, text/plain',
            type: 'value_error',
          },
          {
            loc: ['body', 'file_upload'],
            msg: 'File size too large',
            type: 'value_error',
          },
          {
            loc: ['body', 'dialect'],
            msg: "Input should be 'american_english', 'british_oxford' or 'canadian_english'",
            type: 'enum',
          },
        ],
      };

      const error = ApIError.fromResponse(422, errorData);
      const validationErrors = error.getValidationErrors();

      expect(validationErrors).toEqual({
        'body.file_upload': [
          'Value error, File must be one of the following content types: application/pdf, text/plain',
          'File size too large',
        ],
        'body.dialect': ["Input should be 'american_english', 'british_oxford' or 'canadian_english'"],
      });
    });

    it('should return structured validation errors for legacy format', () => {
      const errorData: ValidationErrorResponse = {
        detail: [
          {
            loc: ['body', 'content'],
            msg: 'field required',
            type: 'value_error.missing',
          },
          {
            loc: ['body', 'content'],
            msg: 'invalid content type',
            type: 'value_error.invalid',
          },
          {
            loc: ['body', 'style_guide_id'],
            msg: 'ensure this value has at least 1 characters',
            type: 'value_error.any_str.min_length',
          },
        ],
      };

      const error = ApIError.fromResponse(422, errorData);
      const validationErrors = error.getValidationErrors();

      expect(validationErrors).toEqual({
        'body.content': ['field required', 'invalid content type'],
        'body.style_guide_id': ['ensure this value has at least 1 characters'],
      });
    });

    it('should return empty object for non-validation errors', () => {
      const errorData: ApiErrorResponse = {
        error: {
          code: 'workflowNotFound',
          message: 'The workflow was not found.',
          description: "The client attempted to poll or retrieve results for an ID that doesn't exist.",
        },
      };

      const error = ApIError.fromResponse(404, errorData);
      const validationErrors = error.getValidationErrors();

      expect(validationErrors).toEqual({});
    });
  });

  describe('constructor', () => {
    it('should create error with all properties', () => {
      const error = new ApIError('Test error', ErrorType.UNKNOWN_ERROR, 400, { test: 'data' });

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(error.rawErrorData).toEqual({ test: 'data' });
      expect(error.isApiError).toBe(true);
    });

    it('should create error without status code for non-API errors', () => {
      const error = new ApIError('Network error', ErrorType.NETWORK_ERROR, undefined, { test: 'data' });

      expect(error.message).toBe('Network error');
      expect(error.statusCode).toBeUndefined();
      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.isApiError).toBe(false);
      expect(error.isNetworkError).toBe(true);
    });
  });

  describe('error type guards', () => {
    it('should correctly identify validation errors', () => {
      const errorData: ValidationErrorResponse = {
        detail: [
          {
            loc: ['field'],
            msg: 'error',
            type: 'type',
          },
        ],
      };

      const error = ApIError.fromResponse(422, errorData);
      expect(error.isValidationError).toBe(true);
    });

    it('should correctly identify not found errors', () => {
      const errorData: ApiErrorResponse = {
        error: {
          code: 'workflowNotFound',
          message: 'Not found',
          description: 'Description',
        },
      };

      const error = ApIError.fromResponse(404, errorData);
      expect(error.isNotFoundError).toBe(true);
    });

    it('should identify 404 status as not found even without specific error code', () => {
      const errorData = { message: 'Not found' };

      const error = ApIError.fromResponse(404, errorData);
      expect(error.isNotFoundError).toBe(true);
    });

    it('should identify 422 status as validation error even without specific error code', () => {
      const errorData = { message: 'Validation failed' };

      const error = ApIError.fromResponse(422, errorData);
      expect(error.isValidationError).toBe(true);
    });

    it('should correctly identify unauthorized errors', () => {
      const errorData = { detail: 'Invalid API key' };

      const error = ApIError.fromResponse(401, errorData);
      expect(error.isUnauthorizedError).toBe(true);
    });

    it('should correctly identify payload too large errors', () => {
      const errorData = { detail: 'File too large' };

      const error = ApIError.fromResponse(413, errorData);
      expect(error.isPayloadTooLargeError).toBe(true);
    });

    it('should correctly identify internal server errors', () => {
      const errorData = { detail: 'Server error' };

      const error = ApIError.fromResponse(500, errorData);
      expect(error.isInternalServerError).toBe(true);
    });

    it('should correctly identify workflow failed errors', () => {
      const error = new ApIError('Workflow failed', ErrorType.WORKFLOW_FAILED);
      expect(error.isWorkflowFailed).toBe(true);
      expect(error.isApiError).toBe(false);
    });

    it('should correctly identify timeout errors', () => {
      const error = new ApIError('Timeout', ErrorType.TIMEOUT_ERROR);
      expect(error.isTimeoutError).toBe(true);
      expect(error.isApiError).toBe(false);
    });
  });
});
