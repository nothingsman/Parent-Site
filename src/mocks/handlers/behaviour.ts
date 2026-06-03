import { http, HttpResponse } from 'msw';

import { BEHAVIOUR_LOG_BY_CHILD_ID } from '@/lib/mockData';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export const behaviourHandlers = [
  http.get(`${BASE}/api/students/:id/behaviour-log/`, ({ params }) => {
    const { id } = params as { id: string };
    const entries = BEHAVIOUR_LOG_BY_CHILD_ID[id] ?? [];

    return HttpResponse.json({
      incidents: entries
        .filter((entry) => entry.type === 'incident')
        .map((entry) => ({
          id: entry.id,
          date: entry.recordedAt,
          type: entry.title,
          severity:
            entry.severity === 'good'
              ? 'Good Day'
              : entry.severity === 'serious'
                ? 'Serious'
                : 'Warning',
          reporter: entry.teacherName,
          subject: entry.subject,
          detail: entry.detail,
        })),
      remarks: entries
        .filter((entry) => entry.type === 'remark')
        .map((entry) => ({
          id: entry.id,
          name: entry.teacherName,
          subject: entry.subject ?? '',
          date: entry.recordedAt,
          text: entry.detail,
        })),
    });
  }),
];
