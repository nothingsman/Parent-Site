import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from './config';
import { ApiError, API_ERROR_CODES } from '@/types/api';

// Token accessors — implemented by authService, injected here to avoid circular deps
let getAccessToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};
let onServerError: (message: string) => void = () => {};

const PUBLIC_INVITATION_ENDPOINTS = [
  '/api/parents/request-invitation-otp/',
  '/api/parents/verify-invitation-otp/',
  '/api/parents/complete-invitation/',
] as const;

export function isPublicInvitationRequestUrl(requestUrl: string): boolean {
  return PUBLIC_INVITATION_ENDPOINTS.some((endpoint) => requestUrl.includes(endpoint));
}

export function configureApiClient(opts: {
  getAccessToken: () => string | null;
  onUnauthorized: () => void;
  onServerError: (message: string) => void;
}): void {
  getAccessToken = opts.getAccessToken;
  onUnauthorized = opts.onUnauthorized;
  onServerError = opts.onServerError;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // sends HttpOnly cookies for refresh token
});

// ── Request interceptor: attach Bearer token ──────────────────────────────────
apiClient.interceptors.request.use(
  (requestConfig: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error: unknown) => Promise.reject(error),
);

// ── Response interceptor: error normalization ─────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void): void {
  refreshSubscribers.push(cb);
}

function onRefreshSuccess(token: string): void {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url ?? '';
    const isRefreshRequest = requestUrl.includes('/auth/jwt/refresh/');
    const isPublicInvitationRequest = isPublicInvitationRequestUrl(requestUrl);

    // 401: try refresh once, then retry the original request.
    if (status === 401 && !originalRequest?._retry && !isPublicInvitationRequest) {
      // If refresh endpoint itself failed, we cannot recover: force unauthenticated flow.
      if (isRefreshRequest) {
        onUnauthorized();
        return Promise.reject(
          new ApiError(API_ERROR_CODES.UNAUTHORIZED, 'Session expired. Please log in again.', 401)
        );
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { refreshToken } = await import('@/services/authService');
        const newToken = await refreshToken();
        onRefreshSuccess(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        onUnauthorized();
        return Promise.reject(
          new ApiError(API_ERROR_CODES.UNAUTHORIZED, 'Session expired. Please log in again.', 401)
        );
      } finally {
        isRefreshing = false;
      }
    }

    // 5xx: show global toast
    if (status !== undefined && status >= 500) {
      onServerError('A server error occurred. Please try again later.');
    }

    // Network error (no response)
    if (!error.response) {
      return Promise.reject(
        new ApiError(API_ERROR_CODES.NETWORK_ERROR, 'Network error. Check your connection.', 0)
      );
    }

    // All other errors: normalize to ApiError
    const responseData = error.response.data as {
      error?: { errorCode?: string; message?: string; details?: Record<string, unknown> };
    } & Record<string, unknown>;
    const errorCode = responseData?.error?.errorCode ?? API_ERROR_CODES.UNKNOWN_ERROR;
    const message = responseData?.error?.message ?? error.message;
    const details = responseData?.error?.details
      ?? (responseData && typeof responseData === 'object' && !('error' in responseData)
        ? (responseData as Record<string, unknown>)
        : undefined);

    return Promise.reject(new ApiError(errorCode, message, status ?? 0, details));
  },
);
