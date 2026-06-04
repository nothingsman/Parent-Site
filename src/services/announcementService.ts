import { apiClient } from '@/lib/apiClient';
import type { AnnouncementEntry, Child } from '@/types';

type BackendAnnouncement = {
  id: string;
  branch: string;
  subject: string;
  message: string;
  scheduled_at: string | null;
  is_urgent: boolean;
  status: string;
  target_roles: string;
  targeted_grades: string[];
  targeted_sections: string[];
  created_at: string;
  updated_at: string;
};

type AnnouncementListResponse =
  | BackendAnnouncement[]
  | {
      results?: BackendAnnouncement[];
    };

export function getAnnouncementEffectiveDate(entry: {
  scheduled_at: string | null;
  updated_at: string;
  created_at: string;
}): string {
  return entry.scheduled_at || entry.updated_at || entry.created_at;
}

export function mapAnnouncement(entry: BackendAnnouncement): AnnouncementEntry {
  return {
    id: entry.id,
    branchId: entry.branch,
    subject: entry.subject,
    message: entry.message,
    status: entry.status,
    isUrgent: entry.is_urgent,
    scheduledAt: entry.scheduled_at,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
    targetRoles: entry.target_roles,
    targetGrades: entry.targeted_grades ?? [],
    targetSections: entry.targeted_sections ?? [],
    effectiveDate: getAnnouncementEffectiveDate(entry),
  };
}

export function isAnnouncementRelevantToChild(
  announcement: AnnouncementEntry,
  child: Pick<Child, 'branchId' | 'gradeId' | 'sectionId'>
): boolean {
  if (announcement.branchId !== child.branchId) {
    return false;
  }
  if (announcement.status === 'DRAFT') {
    return false;
  }

  const hasGradeTargets = announcement.targetGrades.length > 0;
  const hasSectionTargets = announcement.targetSections.length > 0;
  if (!hasGradeTargets && !hasSectionTargets) {
    return true;
  }

  const gradeMatches = Boolean(child.gradeId) && announcement.targetGrades.includes(child.gradeId);
  const sectionMatches = Boolean(child.sectionId) && announcement.targetSections.includes(child.sectionId);
  return gradeMatches || sectionMatches;
}

export async function getAnnouncements(child: Child): Promise<AnnouncementEntry[]> {
  const res = await apiClient.get<AnnouncementListResponse>('/api/announcements/', {
    params: { target_roles: 'PARENTS' },
  });
  const items = Array.isArray(res.data) ? res.data : res.data.results ?? [];

  return items
    .map(mapAnnouncement)
    .filter((entry) => isAnnouncementRelevantToChild(entry, child))
    .sort(
      (left, right) =>
        new Date(right.effectiveDate).getTime() - new Date(left.effectiveDate).getTime()
    );
}
