import { useQuery } from '@tanstack/react-query';
import { getBehaviourLog } from '@/services/behaviourService';
import { queryKeys } from '@/lib/queryKeys';
import type { BehaviourLogEntry } from '@/types/behaviour';
import type { ApiError } from '@/types/api';

export function useBehaviourLog(childId: string) {
  return useQuery<BehaviourLogEntry[], ApiError>({
    queryKey: queryKeys.behaviourLog(childId),
    queryFn: () => getBehaviourLog(childId),
    enabled: Boolean(childId),
  });
}
