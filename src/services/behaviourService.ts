import { apiClient } from '@/lib/apiClient';
import { BEHAVIOUR_LOG_BY_CHILD_ID } from '@/lib/mockData';
import type { ApiError } from '@/types/api';
import type { BehaviourLogEntry, BehaviourSeverity } from '@/types/behaviour';

type BehaviourIncidentRecord = {
  id: string;
  date: string;
  type: string;
  severity: 'Good Day' | 'Warning' | 'Serious';
  reporter: string;
  subject?: string;
  detail?: string;
};

type BehaviourRemarkRecord = {
  id: string;
  name: string;
  subject: string;
  date: string;
  text: string;
};

type BehaviourApiResponse = {
  incidents?: BehaviourIncidentRecord[];
  remarks?: BehaviourRemarkRecord[];
};

function mapIncidentSeverity(value: BehaviourIncidentRecord['severity']): BehaviourSeverity {
  if (value === 'Good Day') return 'good';
  if (value === 'Serious') return 'serious';
  return 'warning';
}

function parseDisplayDate(value: string): string {
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString();
  }

  const withYear = new Date(`${value}, 2026`);
  if (!Number.isNaN(withYear.getTime())) {
    return withYear.toISOString();
  }

  return new Date('2026-01-01T00:00:00Z').toISOString();
}

export function mergeBehaviourLog(
  childId: string,
  incidents: BehaviourIncidentRecord[],
  remarks: BehaviourRemarkRecord[],
): BehaviourLogEntry[] {
  const mappedIncidents = incidents.map((incident) => ({
    id: incident.id,
    childId,
    type: 'incident' as const,
    title: incident.type,
    detail: incident.detail ?? incident.type,
    teacherName: incident.reporter,
    subject: incident.subject,
    severity: mapIncidentSeverity(incident.severity),
    recordedAt: parseDisplayDate(incident.date),
  }));

  const mappedRemarks = remarks.map((remark) => ({
    id: remark.id,
    childId,
    type: 'remark' as const,
    title: 'Teacher Remark',
    detail: remark.text,
    teacherName: remark.name,
    subject: remark.subject,
    severity: 'remark' as const,
    recordedAt: parseDisplayDate(remark.date),
  }));

  return [...mappedIncidents, ...mappedRemarks].sort(
    (left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
  );
}

export async function getBehaviourLog(childId: string): Promise<BehaviourLogEntry[]> {
  try {
    const response = await apiClient.get<BehaviourApiResponse>(`/api/students/${childId}/behaviour-log/`);
    return mergeBehaviourLog(childId, response.data.incidents ?? [], response.data.remarks ?? []);
  } catch (error) {
    const apiError = error as ApiError | undefined;
    if (!apiError || apiError.status === 404 || apiError.status === 0) {
      return [...(BEHAVIOUR_LOG_BY_CHILD_ID[childId] ?? [])].sort(
        (left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
      );
    }
    throw error;
  }
}
