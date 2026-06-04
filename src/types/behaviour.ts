export interface BehaviourLogEntry {
  id: string;
  type: 'incident' | 'remark';
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  teacherName: string;
  source: string;
  occurredAt: string | null;
  createdAt: string;
}
