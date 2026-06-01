// Centralized helpers for the forgot-password / reset-password flow.

function extractStatus(err: unknown): number | null {
  if (err && typeof err === 'object') {
    const asAny = err as Record<string, unknown>;
    if (typeof asAny.status === 'number') return asAny.status;
    if (err instanceof Error && 'status' in err) {
      const st = (err as unknown as { status: number }).status;
      if (typeof st === 'number') return st;
    }
  }

  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return 0;
  }

  return null;
}

function extractMessage(err: unknown): string | null {
  if (!err) return null;
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || null;
  if (typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
  }
  return null;
}

function looksTechnical(msg: string): boolean {
  const patterns = [
    /^Unexpected token/i,
    /^JSON\.parse/i,
    /^Cannot read/i,
    /is not defined/i,
    /networkerror/i,
    /failed to fetch/i,
    /load failed/i,
    /ECONN/i,
    /ETIMEDOUT/i,
    /EAI_AGAIN/i,
    /AxiosError/i,
    /status code \d+/i,
  ];
  return patterns.some((p) => p.test(msg));
}

/** Formats an error from the forgot-password / reset-password flow. */
export function formatAuthError(err: unknown): string {
  const status = extractStatus(err);
  const msg = extractMessage(err)?.toLowerCase() ?? '';

  if (status === 0 || /network|failed to fetch|load failed/i.test(msg)) {
    return 'Unable to reach the server. Check your internet connection and try again.';
  }

  if (status === 400) {
    if (/not found/i.test(msg) || /no active account/i.test(msg)) {
      return 'Account not found with that email address.';
    }
    if (/already in use/i.test(msg)) {
      return 'This email is already associated with an account.';
    }
    return msg || 'Invalid request. Please check your input and try again.';
  }

  if (status === 401) {
    return 'Invalid or expired reset link. Please request a new password reset.';
  }

  if (status === 404) {
    return 'Account not found with that email address.';
  }

  if (status === 429) {
    return 'Too many requests. Please wait a moment before trying again.';
  }

  if (status !== null && status >= 500) {
    return "Something went wrong on our end. Please try again later.";
  }

  const clean = extractMessage(err);
  if (clean && !looksTechnical(clean)) {
    return clean;
  }

  return 'Something unexpected happened. Please try again.';
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character.' };
  }
  return { valid: true };
}
