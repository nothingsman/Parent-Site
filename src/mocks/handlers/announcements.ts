import { http, HttpResponse } from 'msw';

import { ANNOUNCEMENTS_MOCK } from '@/lib/mockData';
import type { AnnouncementApiRecord, AnnouncementTargetingCriteria } from '@/types/api';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

const TARGETING_CRITERIA: AnnouncementTargetingCriteria = {
  grades: [
    { id: 'grade-4', name: 'Grade 4', level: 4 },
    { id: 'grade-7', name: 'Grade 7', level: 7 },
    { id: 'grade-11', name: 'Grade 11', level: 11 },
  ],
  sections: [
    { id: 'section-1', name: 'A', grade_name: 'Grade 7' },
    { id: 'section-2', name: 'B', grade_name: 'Grade 4' },
    { id: 'section-3', name: 'A', grade_name: 'Grade 11' },
  ],
};

export const announcementsHandlers = [
  http.get(`${BASE}/api/announcements/get_targeting_criteria/`, () =>
    HttpResponse.json(TARGETING_CRITERIA),
  ),
  http.get(`${BASE}/api/announcements/`, ({ request }) => {
    const url = new URL(request.url);
    const branch = url.searchParams.get('branch');
    const targetRoles = url.searchParams.get('target_roles');

    const records: AnnouncementApiRecord[] = ANNOUNCEMENTS_MOCK
      .filter((item) => !branch || item.branchId === branch)
      .filter((item) => !targetRoles || item.targetRoles === targetRoles || item.targetRoles === 'BOTH')
      .map((item) => ({
        id: item.id,
        organization: item.organizationId,
        branch: item.branchId,
        subject: item.subject,
        message: item.message,
        scheduled_at: item.scheduledAt,
        is_urgent: item.isUrgent,
        status: item.status,
        target_roles: item.targetRoles,
        targeted_grades: item.targetGrades,
        targeted_sections: item.targetSections,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      }));

    return HttpResponse.json(records);
  }),
];
