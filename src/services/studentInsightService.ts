import { apiClient } from '@/lib/apiClient';
import type { StudentInsightDetail } from '@/types/api';

export async function getStudentInsight(
  id: string
): Promise<StudentInsightDetail> {
  const res = await apiClient.get<StudentInsightDetail>(
    `/api/student-insights/${id}/`
  );
  return res.data;
}
