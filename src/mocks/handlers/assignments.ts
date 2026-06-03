import { http, HttpResponse } from 'msw';
import { CHILDREN } from '@/lib/mockData';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { HomeworkEntry } from '@/types/assignment';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export const assignmentsHandlers = [
  http.get(`${BASE}/api/assessment-results/by-student/`, ({ request }) => {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student');
    const child = CHILDREN.find((c) => c.id === studentId);

    if (!child) {
      return HttpResponse.json(
        {
          detail: `Student with id ${studentId} not found`,
        },
        { status: 404 },
      );
    }

    const items = child.assignments.map((item, index) => ({
      id: item.id,
      assessment_id: `assessment-${item.id}`,
      assessment_title: item.title,
      assessment_description: item.description,
      assessment_due_date: item.dueDate || new Date().toISOString().slice(0, 10),
      subject_name: item.subject,
      section_name: child.section,
      submission_status:
        item.status === 'graded'
          ? 'GRADED'
          : item.status === 'submitted'
            ? 'SUBMITTED'
            : item.status === 'missing'
              ? 'MISSING'
              : 'PENDING',
      obtained_marks: item.score === null ? null : String(item.score),
      total_marks: String(item.maxScore),
      task_type: index % 2 === 0 ? 'ASSIGNMENT' : 'QUIZ',
      task_type_display: index % 2 === 0 ? 'Assignment' : 'Quiz',
      percentage: item.score === null ? null : Number(((item.score / item.maxScore) * 100).toFixed(1)),
      teacher_name: child.subjects.find((subject) => subject.name === item.subject)?.teacher ?? null,
    }));

    return HttpResponse.json(items);
  }),

  http.get(`${BASE}/api/assessments/`, ({ request }) => {
    const url = new URL(request.url);
    const branchId = url.searchParams.get('branch');
    const sectionId = url.searchParams.get('section');
    const child = CHILDREN.find((item) => item.branchId === branchId && item.sectionId === sectionId);

    const results = (child?.assignments ?? []).map((item, index) => ({
      id: `assessment-${item.id}`,
      title: item.title,
      description: item.description,
      due_date: item.dueDate || new Date().toISOString().slice(0, 10),
      total_marks: String(item.maxScore),
      subject_name: item.subject,
      section_name: child?.section ?? '',
      task_type: index % 2 === 0 ? 'ASSIGNMENT' : 'QUIZ',
      task_type_display: index % 2 === 0 ? 'Assignment' : 'Quiz',
    }));

    return HttpResponse.json({
      count: results.length,
      next: null,
      previous: null,
      results,
    });
  }),

  // GET /api/children/:id/homework
  http.get(`${BASE}/api/children/:id/homework`, ({ params }) => {
    const { id } = params as { id: string };
    const child = CHILDREN.find((c) => c.id === id);

    if (!child) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            errorCode: 'NOT_FOUND',
            message: `Child with id ${id} not found`,
            details: { childId: id },
          },
        },
        { status: 404 },
      );
    }

    const items: HomeworkEntry[] = child.homework;
    const body: ApiResponse<PaginatedResponse<HomeworkEntry>> = {
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

  http.get(`${BASE}/api/assessments/todays-homework/`, ({ request }) => {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student');
    const child = CHILDREN.find((c) => c.id === studentId);

    const results = (child?.homework ?? []).map((item) => ({
      id: `assessment-${item.id}`,
      student_id: child?.id ?? '',
      student_name: child?.name ?? '',
      student_roll_no: '',
      teacher_name: 'Ms. Hana',
      title: item.title,
      description: '',
      due_date: new Date().toISOString().slice(0, 10),
      subject_name: item.subject,
      section_name: child?.section ?? '',
      branch_id: child?.branchId ?? '',
      branch_name: child?.branchName ?? '',
      confirmed: item.status === 'completed',
      homework_confirmation: item.status === 'completed'
        ? {
            id: `confirmation-${item.id}`,
            is_confirmed: true,
            feedback: '',
            confirmed_at: new Date().toISOString(),
          }
        : null,
    }));

    return HttpResponse.json({
      count: results.length,
      next: null,
      previous: null,
      results,
    });
  }),

  http.post(`${BASE}/api/homework-confirmations/`, () =>
    HttpResponse.json({}, { status: 200 })
  ),
];
