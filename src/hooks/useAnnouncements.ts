import { useQuery } from '@tanstack/react-query';
import { getAnnouncements } from '@/services/announcementService';
import { queryKeys } from '@/lib/queryKeys';
import type { Child } from '@/types/child';
import type { AnnouncementEntry } from '@/types/announcement';
import type { ApiError } from '@/types/api';

export function useAnnouncements(child: Child | null | undefined) {
  return useQuery<AnnouncementEntry[], ApiError>({
    queryKey: queryKeys.announcements(child?.id ?? ''),
    queryFn: () => getAnnouncements(child as Child),
    enabled: Boolean(child?.id),
  });
}
