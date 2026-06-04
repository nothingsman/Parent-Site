import { useQuery } from '@tanstack/react-query';
import { getStudentAnalytics } from '@/services/studentAnalyticsService';
import { queryKeys } from '@/lib/queryKeys';
import type { ApiError, StudentAnalyticsResponse } from '@/types/api';

export function useStudentAnalytics(childId: string) {
  return useQuery<StudentAnalyticsResponse, ApiError>({
    queryKey: queryKeys.analytics(childId),
    queryFn: () => getStudentAnalytics(childId),
    enabled: Boolean(childId),
  });
}
