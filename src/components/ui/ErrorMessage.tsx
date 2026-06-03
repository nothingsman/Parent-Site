import React from 'react';
import { API_ERROR_CODES } from '@/types/api';
import type { ApiError } from '@/types/api';

const ERROR_MESSAGES: Record<string, string> = {
  [API_ERROR_CODES.NETWORK_ERROR]: 'Unable to connect. Please check your internet connection.',
  [API_ERROR_CODES.UNAUTHORIZED]: 'Your session has expired. Please log in again.',
  [API_ERROR_CODES.FORBIDDEN]: 'You do not have permission to view this content.',
  [API_ERROR_CODES.NOT_FOUND]: 'The requested information could not be found.',
  [API_ERROR_CODES.VALIDATION_ERROR]: 'Some information was invalid. Please check and try again.',
  [API_ERROR_CODES.SERVER_ERROR]: 'A server error occurred. Please try again later.',
  [API_ERROR_CODES.UNKNOWN_ERROR]: 'Something went wrong. Please try again.',
};

interface ErrorMessageProps {
  error: ApiError;
  className?: string;
}

export function ErrorMessage({ error, className = '' }: ErrorMessageProps) {
  const message = Object.hasOwn(ERROR_MESSAGES, error.errorCode)
    ? ERROR_MESSAGES[error.errorCode]
    : error.message;

  return (
    <div
      role="alert"
      className={`rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium ${className}`}
    >
      {message}
    </div>
  );
}
