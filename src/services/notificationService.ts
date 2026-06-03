import { apiClient } from '@/lib/apiClient';
import type { PaginatedResponse } from '@/types/api';
import type { NotificationEntry } from '@/types/notification';

export async function getNotifications(
  childId: string,
  _params?: { read?: boolean; page?: number; pageSize?: number }
): Promise<NotificationEntry[]> {
  const res = await apiClient.get<PaginatedResponse<NotificationEntry>>(
    `/api/children/${childId}/notifications`,
  );
  return res.data.items;
}
