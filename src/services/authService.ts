import { apiClient } from '@/lib/apiClient';
import { notifyUnauthorized } from '@/lib/apiClient';
import type {
  AuthResponse,
  CompleteInvitationRequest,
  InvitationOtpRequest,
  InvitationOtpVerifyRequest,
  JwtLoginResponse,
  OtpRequest,
  RefreshResponse,
  PasswordLoginRequest,
} from '@/types/api';

// In-memory access token (never persisted to localStorage)
let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isExpiredToken(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== 'number') return false;
  return exp * 1000 <= Date.now();
}

export async function login(credentials: PasswordLoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<JwtLoginResponse>('/auth/jwt/create/', credentials);
  accessToken = res.data.access;
  return {
    accessToken: res.data.access,
    expiresIn: 0,
    parentId: '',
    parentName: '',
  };
}

export async function requestOtp(phone_number: OtpRequest['phone_number']): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>(
    '/auth/otp/request/',
    { phone_number },
    { withCredentials: false }
  );
  return res.data;
}

export async function requestInvitationOtp(
  payload: InvitationOtpRequest,
): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>(
    '/api/parents/request-invitation-otp/',
    payload,
    { withCredentials: false }
  );
  return res.data;
}

export async function verifyInvitationOtp(
  payload: InvitationOtpVerifyRequest,
): Promise<{ message: string; invitation_verification_token: string }> {
  const res = await apiClient.post<{ message: string; invitation_verification_token: string }>(
    '/api/parents/verify-invitation-otp/',
    payload,
    { withCredentials: false }
  );
  return res.data;
}

export async function completeParentInvitation(payload: CompleteInvitationRequest): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>(
    '/api/parents/complete-invitation/',
    payload,
    { withCredentials: false }
  );
  return res.data;
}

export async function logout(queryClient?: import('@tanstack/react-query').QueryClient): Promise<void> {
  accessToken = null;
  refreshPromise = null;
  queryClient?.clear();
}

export async function refreshToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const res = await apiClient.post<RefreshResponse>('/auth/jwt/refresh/', {});
    accessToken = res.data.access;
    return accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function ensureAccessToken(forceRefresh = false): Promise<string | null> {
  const token = getAccessToken();
  if (!forceRefresh && token && !isExpiredToken(token)) {
    return token;
  }

  try {
    return await refreshToken();
  } catch {
    accessToken = null;
    notifyUnauthorized();
    return null;
  }
}

export async function restoreSession(): Promise<AuthResponse | null> {
  try {
    const newToken = await refreshToken();
    return {
      accessToken: newToken,
      expiresIn: 0,
      parentId: '',
      parentName: '',
    };
  } catch {
    return null;
  }
}
