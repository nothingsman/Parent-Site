import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getAnnouncements } from '@/services/announcementService';
import type { AnnouncementEntry, Child } from '@/types';
import type { ApiError } from '@/types/api';

export function useAnnouncements(child: Child | null | undefined) {
  return useQuery<AnnouncementEntry[], ApiError>({
    queryKey: queryKeys.announcements(child?.id ?? ''),
    queryFn: () => getAnnouncements(child as Child),
    enabled: Boolean(child?.id),
  });
}
