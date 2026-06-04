import { apiClient } from '@/lib/apiClient';
import type { BehaviourLogEntry } from '@/types';

export async function getBehaviourLog(childId: string): Promise<BehaviourLogEntry[]> {
  const res = await apiClient.get<BehaviourLogEntry[]>(
    `/api/parents/my-students/${childId}/behaviour-log/`
  );
  return [...res.data].sort(
    (left, right) =>
      new Date(right.occurredAt ?? right.createdAt).getTime() -
      new Date(left.occurredAt ?? left.createdAt).getTime()
  );
}
