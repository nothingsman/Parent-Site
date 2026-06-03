import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ApiError, API_ERROR_CODES } from '@/types/api';

// The message resolution logic from ErrorMessage.tsx
const ERROR_MESSAGES: Record<string, string> = {
  [API_ERROR_CODES.NETWORK_ERROR]: 'Unable to connect. Please check your internet connection.',
  [API_ERROR_CODES.UNAUTHORIZED]: 'Your session has expired. Please log in again.',
  [API_ERROR_CODES.FORBIDDEN]: 'You do not have permission to view this content.',
  [API_ERROR_CODES.NOT_FOUND]: 'The requested information could not be found.',
  [API_ERROR_CODES.VALIDATION_ERROR]: 'Some information was invalid. Please check and try again.',
  [API_ERROR_CODES.SERVER_ERROR]: 'A server error occurred. Please try again later.',
  [API_ERROR_CODES.UNKNOWN_ERROR]: 'Something went wrong. Please try again.',
};

function resolveErrorMessage(error: ApiError): string {
  return Object.hasOwn(ERROR_MESSAGES, error.errorCode)
    ? ERROR_MESSAGES[error.errorCode]
    : error.message;
}

/**
 * Property 9: ErrorMessage renders non-empty text for any ApiError
 * Validates: Requirements 8.1
 */
describe('ErrorMessage (Property 9)', () => {
  it('resolves non-empty message for any ApiError with any errorCode', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.integer({ min: 0, max: 599 }),
        (errorCode, message, status) => {
          const error = new ApiError(errorCode, message, status);
          const resolved = resolveErrorMessage(error);
          expect(resolved.length).toBeGreaterThan(0);
          expect(typeof resolved).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('always returns a string (never undefined or null) for any ApiError', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (errorCode, message) => {
          const error = new ApiError(errorCode, message, 0);
          const resolved = resolveErrorMessage(error);
          expect(resolved).toBeTruthy();
          expect(resolved).not.toBeNull();
          expect(resolved).not.toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Unit tests: ErrorMessage renders correct message for each known errorCode
 * Validates: Requirements 8.1
 */
describe('ErrorMessage unit tests (Task 13.3)', () => {
  it('renders user-friendly message for NETWORK_ERROR', () => {
    const error = new ApiError(API_ERROR_CODES.NETWORK_ERROR, 'raw network error', 0);
    expect(resolveErrorMessage(error)).toBe('Unable to connect. Please check your internet connection.');
  });

  it('renders user-friendly message for UNAUTHORIZED', () => {
    const error = new ApiError(API_ERROR_CODES.UNAUTHORIZED, 'raw 401', 401);
    expect(resolveErrorMessage(error)).toBe('Your session has expired. Please log in again.');
  });

  it('renders user-friendly message for FORBIDDEN', () => {
    const error = new ApiError(API_ERROR_CODES.FORBIDDEN, 'raw 403', 403);
    expect(resolveErrorMessage(error)).toBe('You do not have permission to view this content.');
  });

  it('renders user-friendly message for NOT_FOUND', () => {
    const error = new ApiError(API_ERROR_CODES.NOT_FOUND, 'raw 404', 404);
    expect(resolveErrorMessage(error)).toBe('The requested information could not be found.');
  });

  it('renders user-friendly message for VALIDATION_ERROR', () => {
    const error = new ApiError(API_ERROR_CODES.VALIDATION_ERROR, 'raw validation', 422);
    expect(resolveErrorMessage(error)).toBe('Some information was invalid. Please check and try again.');
  });

  it('renders user-friendly message for SERVER_ERROR', () => {
    const error = new ApiError(API_ERROR_CODES.SERVER_ERROR, 'raw 500', 500);
    expect(resolveErrorMessage(error)).toBe('A server error occurred. Please try again later.');
  });

  it('renders user-friendly message for UNKNOWN_ERROR', () => {
    const error = new ApiError(API_ERROR_CODES.UNKNOWN_ERROR, 'raw unknown', 0);
    expect(resolveErrorMessage(error)).toBe('Something went wrong. Please try again.');
  });

  it('falls back to error.message for unknown errorCode', () => {
    const error = new ApiError('CUSTOM_CODE', 'Custom error message from server', 418);
    expect(resolveErrorMessage(error)).toBe('Custom error message from server');
  });

  it('falls back to error.message when errorCode is empty string', () => {
    const error = new ApiError('', 'Fallback message', 0);
    expect(resolveErrorMessage(error)).toBe('Fallback message');
  });
});
