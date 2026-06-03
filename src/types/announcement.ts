export type AnnouncementStatus = 'DRAFT' | 'SENT' | 'SCHEDULED';

export interface AnnouncementEntry {
  id: string;
  branchId: string;
  organizationId: string;
  subject: string;
  message: string;
  isUrgent: boolean;
  status: AnnouncementStatus;
  targetRoles: 'PARENTS' | 'TEACHERS' | 'BOTH';
  targetGrades: string[];
  targetSections: string[];
  scheduledAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  effectiveAt: string | null;
}
