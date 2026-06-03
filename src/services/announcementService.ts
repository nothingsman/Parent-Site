import { apiClient } from '@/lib/apiClient';
import { ANNOUNCEMENTS_MOCK } from '@/lib/mockData';
import type { Child } from '@/types/child';
import type { AnnouncementEntry } from '@/types/announcement';
import type { AnnouncementApiRecord, AnnouncementTargetingCriteria } from '@/types/api';

function normalizeGradeValue(value: string): string {
  return value.toLowerCase().replace(/grade/gi, '').replace(/[^a-z0-9]+/g, '');
}

export function resolveEffectiveAnnouncementDate(record: {
  scheduled_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}): string | null {
  return record.scheduled_at ?? record.updated_at ?? record.created_at ?? null;
}

export function mapAnnouncementRecord(record: AnnouncementApiRecord): AnnouncementEntry {
  return {
    id: record.id,
    branchId: record.branch,
    organizationId: record.organization,
    subject: record.subject,
    message: record.message,
    isUrgent: record.is_urgent,
    status: record.status,
    targetRoles: record.target_roles,
    targetGrades: record.targeted_grades,
    targetSections: record.targeted_sections,
    scheduledAt: record.scheduled_at ?? null,
    createdAt: record.created_at ?? null,
    updatedAt: record.updated_at ?? null,
    effectiveAt: resolveEffectiveAnnouncementDate(record),
  };
}

export function filterAnnouncementsForChild(
  announcements: AnnouncementEntry[],
  child: Child,
  targetingCriteria: AnnouncementTargetingCriteria,
): AnnouncementEntry[] {
  const childGradeId = targetingCriteria.grades.find(
    (grade) => normalizeGradeValue(grade.name) === normalizeGradeValue(child.grade),
  )?.id;

  return announcements
    .filter((announcement) => announcement.status !== 'DRAFT')
    .filter((announcement) => announcement.targetRoles === 'PARENTS' || announcement.targetRoles === 'BOTH')
    .filter((announcement) => announcement.branchId === child.branchId)
    .filter((announcement) => {
      const hasGradeTargets = announcement.targetGrades.length > 0;
      const hasSectionTargets = announcement.targetSections.length > 0;
      if (!hasGradeTargets && !hasSectionTargets) {
        return true;
      }
      if (hasSectionTargets && child.sectionId && announcement.targetSections.includes(child.sectionId)) {
        return true;
      }
      if (hasGradeTargets && childGradeId && announcement.targetGrades.includes(childGradeId)) {
        return true;
      }
      return false;
    })
    .sort((left, right) => {
      const leftTs = left.effectiveAt ? new Date(left.effectiveAt).getTime() : 0;
      const rightTs = right.effectiveAt ? new Date(right.effectiveAt).getTime() : 0;
      return rightTs - leftTs;
    });
}

export async function getAnnouncements(child: Child): Promise<AnnouncementEntry[]> {
  try {
    const [announcementsRes, criteriaRes] = await Promise.all([
      apiClient.get<AnnouncementApiRecord[]>('/api/announcements/', {
        params: {
          branch: child.branchId,
          target_roles: 'PARENTS',
          ordering: '-created_at',
        },
      }),
      apiClient.get<AnnouncementTargetingCriteria>('/api/announcements/get_targeting_criteria/'),
    ]);

    const announcements = announcementsRes.data.map(mapAnnouncementRecord);
    return filterAnnouncementsForChild(announcements, child, criteriaRes.data);
  } catch {
    return ANNOUNCEMENTS_MOCK.filter((announcement) => announcement.branchId === child.branchId)
      .filter((announcement) => {
        const hasGradeTargets = announcement.targetGrades.length > 0;
        const hasSectionTargets = announcement.targetSections.length > 0;
        if (!hasGradeTargets && !hasSectionTargets) {
          return true;
        }
        if (hasSectionTargets && child.sectionId && announcement.targetSections.includes(child.sectionId)) {
          return true;
        }
        return hasGradeTargets && announcement.targetGrades.includes(`grade-${child.grade}`);
      })
      .sort((left, right) => {
        const leftTs = left.effectiveAt ? new Date(left.effectiveAt).getTime() : 0;
        const rightTs = right.effectiveAt ? new Date(right.effectiveAt).getTime() : 0;
        return rightTs - leftTs;
      });
  }
}
