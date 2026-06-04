import { http, HttpResponse } from 'msw';
import { CHILDREN } from '@/lib/mockData';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Child } from '@/types/child';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export const childrenHandlers = [
  http.get(`${BASE}/api/parents/my-students/`, () => {
    const students = CHILDREN.map((child) => ({
      id: child.id,
      first_name: child.name.split(' ')[0] ?? child.name,
      last_name: child.name.split(' ').slice(1).join(' '),
      section_name: child.section,
      current_section: child.sectionId,
      grade_id: child.gradeId,
      grade_name: child.grade,
      branch: child.branchId,
      branch_name: child.branchName,
    }));

    return HttpResponse.json(students);
  }),

  // GET /api/children — list all children
  http.get(`${BASE}/api/children`, () => {
    const items = CHILDREN;
    const body: ApiResponse<PaginatedResponse<Child>> = {
      success: true,
      data: {
        items,
        page: 1,
        pageSize: 20,
        total: items.length,
      },
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),

  // GET /api/children/:childId — get a single child
  http.get(`${BASE}/api/children/:childId`, ({ params }) => {
    const { childId } = params as { childId: string };
    const child = CHILDREN.find((c) => c.id === childId);

    if (!child) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            errorCode: 'NOT_FOUND',
            message: `Child with id ${childId} not found`,
            details: { childId },
          },
        },
        { status: 404 },
      );
    }

    const body: ApiResponse<Child> = {
      success: true,
      data: child,
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),
];
