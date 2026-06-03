export type BehaviourEntryType = 'incident' | 'remark';

export type BehaviourSeverity = 'good' | 'warning' | 'serious' | 'remark';

export interface BehaviourLogEntry {
  id: string;
  childId: string;
  type: BehaviourEntryType;
  title: string;
  detail: string;
  teacherName: string;
  subject?: string;
  severity: BehaviourSeverity;
  recordedAt: string;
}
