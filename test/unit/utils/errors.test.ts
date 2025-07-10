import { describe, it, expect } from 'vitest';
import { AcrolinxError, ApiErrorResponse, ValidationErrorResponse, ErrorType } from '../../../src/utils/errors';

describe('AcrolinxError', () => {
  describe('fromResponse', () => {
    it('should handle 404 API error format', () => {
      const mockResponse = new Response('Not Found', { status: 404 });
      const errorData: ApiErrorResponse = {
        error: {
          code: 'workflowNotFound',
          message: 'The workflow was not found.',
          description: "The client attempted to poll or retrieve results for an ID that doesn't exist.",
        },
      };

      const error = AcrolinxError.fromResponse(mockResponse, errorData);

      expect(error).toBeInstanceOf(AcrolinxError);
      expect(error.statusCode).toBe(404);
      expect(error.type).toBe(ErrorType.WORKFLOW_NOT_FOUND);
      expect(error.message).toBe("The client attempted to poll or retrieve results for an ID that doesn't exist.");
      expect(error.isNotFoundError).toBe(true);
      expect(error.isValidationError).toBe(false);
      expect(error.isApiError).toBe(true);
    });

    it('should handle 422 validation error format', () => {
      const mockResponse = new Response('Unprocessable Entity', { status: 422 });
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

      const error = AcrolinxError.fromResponse(mockResponse, errorData);

      expect(error).toBeInstanceOf(AcrolinxError);
      expect(error.statusCode).toBe(422);
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe('Validation failed: field required; ensure this value has at least 1 characters');
      expect(error.isNotFoundError).toBe(false);
      expect(error.isValidationError).toBe(true);
      expect(error.isApiError).toBe(true);
    });

    it('should handle unknown error format', () => {
      const mockResponse = new Response('Internal Server Error', { status: 500 });
      const errorData = {
        message: 'Something went wrong',
        detail: 'Internal server error occurred',
      };

      const error = AcrolinxError.fromResponse(mockResponse, errorData);

      expect(error).toBeInstanceOf(AcrolinxError);
      expect(error.statusCode).toBe(500);
      expect(error.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(error.message).toBe('Something went wrong');
      expect(error.isNotFoundError).toBe(false);
      expect(error.isValidationError).toBe(false);
      expect(error.isApiError).toBe(true);
    });

    it('should handle empty error data', () => {
      const mockResponse = new Response('Bad Request', { status: 400 });
      const errorData = {};

      const error = AcrolinxError.fromResponse(mockResponse, errorData);

      expect(error).toBeInstanceOf(AcrolinxError);
      expect(error.statusCode).toBe(400);
      expect(error.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(error.message).toBe('HTTP error! status: 400');
      expect(error.isApiError).toBe(true);
    });

    it('should use description over message for API errors', () => {
      const mockResponse = new Response('Not Found', { status: 404 });
      const errorData: ApiErrorResponse = {
        error: {
          code: 'workflowNotFound',
          message: 'Short message',
          description: 'Detailed description of what went wrong',
        },
      };

      const error = AcrolinxError.fromResponse(mockResponse, errorData);

      expect(error.message).toBe('Detailed description of what went wrong');
      expect(error.type).toBe(ErrorType.WORKFLOW_NOT_FOUND);
    });

    it('should fallback to message when description is not available', () => {
      const mockResponse = new Response('Not Found', { status: 404 });
      const errorData = {
        error: {
          code: 'workflowNotFound',
          message: 'The workflow was not found.',
        },
      };

      const error = AcrolinxError.fromResponse(mockResponse, errorData);

      expect(error.message).toBe('The workflow was not found.');
      expect(error.type).toBe(ErrorType.WORKFLOW_NOT_FOUND);
    });
  });

  describe('fromError', () => {
    it('should create error from non-API errors', () => {
      const originalError = new Error('Network connection failed');
      const error = AcrolinxError.fromError(originalError, ErrorType.NETWORK_ERROR);

      expect(error).toBeInstanceOf(AcrolinxError);
      expect(error.message).toBe('Network connection failed');
      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.statusCode).toBeUndefined();
      expect(error.isApiError).toBe(false);
      expect(error.isNetworkError).toBe(true);
      expect(error.rawErrorData.originalError).toBe(originalError);
    });

    it('should create timeout error', () => {
      const originalError = new Error('Request timeout');
      const error = AcrolinxError.fromError(originalError, ErrorType.TIMEOUT_ERROR);

      expect(error.type).toBe(ErrorType.TIMEOUT_ERROR);
      expect(error.isTimeoutError).toBe(true);
      expect(error.isApiError).toBe(false);
    });
  });

  describe('getValidationErrors', () => {
    it('should return structured validation errors', () => {
      const mockResponse = new Response('Unprocessable Entity', { status: 422 });
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

      const error = AcrolinxError.fromResponse(mockResponse, errorData);
      const validationErrors = error.getValidationErrors();

      expect(validationErrors).toEqual({
        'body.content': ['field required', 'invalid content type'],
        'body.style_guide_id': ['ensure this value has at least 1 characters'],
      });
    });

    it('should return empty object for non-validation errors', () => {
      const mockResponse = new Response('Not Found', { status: 404 });
      const errorData: ApiErrorResponse = {
        error: {
          code: 'workflowNotFound',
          message: 'The workflow was not found.',
          description: "The client attempted to poll or retrieve results for an ID that doesn't exist.",
        },
      };

      const error = AcrolinxError.fromResponse(mockResponse, errorData);
      const validationErrors = error.getValidationErrors();

      expect(validationErrors).toEqual({});
    });
  });

  describe('constructor', () => {
    it('should create error with all properties', () => {
      const error = new AcrolinxError('Test error', ErrorType.UNKNOWN_ERROR, 400, { test: 'data' });

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(error.rawErrorData).toEqual({ test: 'data' });
      expect(error.isApiError).toBe(true);
    });

    it('should create error without status code for non-API errors', () => {
      const error = new AcrolinxError('Network error', ErrorType.NETWORK_ERROR, undefined, { test: 'data' });

      expect(error.message).toBe('Network error');
      expect(error.statusCode).toBeUndefined();
      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.isApiError).toBe(false);
      expect(error.isNetworkError).toBe(true);
    });
  });

  describe('error type guards', () => {
    it('should correctly identify validation errors', () => {
      const mockResponse = new Response('Unprocessable Entity', { status: 422 });
      const errorData: ValidationErrorResponse = {
        detail: [
          {
            loc: ['field'],
            msg: 'error',
            type: 'type',
          },
        ],
      };

      const error = AcrolinxError.fromResponse(mockResponse, errorData);
      expect(error.isValidationError).toBe(true);
    });

    it('should correctly identify not found errors', () => {
      const mockResponse = new Response('Not Found', { status: 404 });
      const errorData: ApiErrorResponse = {
        error: {
          code: 'workflowNotFound',
          message: 'Not found',
          description: 'Description',
        },
      };

      const error = AcrolinxError.fromResponse(mockResponse, errorData);
      expect(error.isNotFoundError).toBe(true);
    });

    it('should identify 404 status as not found even without specific error code', () => {
      const mockResponse = new Response('Not Found', { status: 404 });
      const errorData = { message: 'Not found' };

      const error = AcrolinxError.fromResponse(mockResponse, errorData);
      expect(error.isNotFoundError).toBe(true);
    });

    it('should identify 422 status as validation error even without specific error code', () => {
      const mockResponse = new Response('Unprocessable Entity', { status: 422 });
      const errorData = { message: 'Validation failed' };

      const error = AcrolinxError.fromResponse(mockResponse, errorData);
      expect(error.isValidationError).toBe(true);
    });

    it('should correctly identify workflow failed errors', () => {
      const error = new AcrolinxError('Workflow failed', ErrorType.WORKFLOW_FAILED);
      expect(error.isWorkflowFailed).toBe(true);
      expect(error.isApiError).toBe(false);
    });

    it('should correctly identify timeout errors', () => {
      const error = new AcrolinxError('Timeout', ErrorType.TIMEOUT_ERROR);
      expect(error.isTimeoutError).toBe(true);
      expect(error.isApiError).toBe(false);
    });
  });
});
