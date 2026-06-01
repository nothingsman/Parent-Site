type ErrorEntry = {
  field?: string | null;
  detail?: string;
};

function getErrorEntries(error: unknown): ErrorEntry[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const details = (error as { details?: unknown }).details;
  if (typeof details !== 'object' || details === null) {
    return [];
  }

  const entries = (details as { errors?: unknown }).errors;
  return Array.isArray(entries) ? (entries as ErrorEntry[]) : [];
}

export function getApiFieldError(error: unknown, field: string): string | null {
  const entry = getErrorEntries(error).find((item) => item.field === field);
  return typeof entry?.detail === 'string' ? entry.detail : null;
}

export function getApiFormError(error: unknown): string | null {
  const entry = getErrorEntries(error).find((item) => item.field == null);
  return typeof entry?.detail === 'string' ? entry.detail : null;
}
