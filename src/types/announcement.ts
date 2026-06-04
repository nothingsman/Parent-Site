export type AnnouncementStatus = 'DRAFT' | 'SENT' | 'SCHEDULED' | string;

export type AnnouncementStatusFilter = 'ALL' | 'URGENT' | 'SENT' | 'SCHEDULED';

export interface AnnouncementEntry {
  id: string;
  branchId: string;
  subject: string;
  message: string;
  status: AnnouncementStatus;
  isUrgent: boolean;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  targetRoles: string;
  targetGrades: string[];
  targetSections: string[];
  effectiveDate: string;
}
