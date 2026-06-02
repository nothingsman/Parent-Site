import { apiClient } from '@/lib/apiClient';
import type { BranchIdentityResponse } from '@/types/api';

export async function getBranchIdentity(branchId: string): Promise<BranchIdentityResponse> {
  const res = await apiClient.get<BranchIdentityResponse>(`/api/branches/${branchId}/school-name/`);
  return res.data;
}

export async function resolveMediaUrl(mediaId: string): Promise<string | null> {
  try {
    const res = await apiClient.get<{ data: { download_url: string } }>(`/api/media/${mediaId}/url`);
    return res.data?.data?.download_url ?? null;
  } catch {
    return null;
  }
}
