import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getBehaviourLog } from '@/services/behaviourService';
import type { ApiError } from '@/types/api';
import type { BehaviourLogEntry } from '@/types';

export function useBehaviourLog(childId: string) {
  return useQuery<BehaviourLogEntry[], ApiError>({
    queryKey: queryKeys.behaviourLog(childId),
    queryFn: () => getBehaviourLog(childId),
    enabled: Boolean(childId),
  });
}
