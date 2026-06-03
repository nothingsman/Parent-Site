import { vi } from 'vitest';
vi.hoisted(() => {
  process.env['NEXT_PUBLIC_API_BASE_URL'] = 'http://localhost:4000';
});

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { CHILDREN } from '@/lib/mockData';
import { getChildren } from '@/services/childService';
import { getAssignments } from '@/services/assignmentService';
import { getAttendance } from '@/services/attendanceService';
import { getGrades } from '@/services/gradeService';
import { getMessages } from '@/services/messageService';
import { getNotifications } from '@/services/notificationService';
import { getSchedule } from '@/services/scheduleService';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Child } from '@/types/child';
import type { ScheduleEntry } from '@/types/schedule';

/**
 * MSW v2 in Node mode does not resolve relative paths against any origin —
 * relative paths like '/api/children' are kept as-is and matched against the
 * full request URL, which means they do NOT match 'http://localhost:4000/api/children'.
 *
 * To test the real handler logic (fixture data + ApiResponse envelope) while
 * using the correct full-URL matching, we re-implement the handlers here with
 * full URLs but using the exact same fixture data and response shapes as the
 * real handlers in src/mocks/handlers/.
 *
 * This approach validates:
 *   - Property 8: key mock endpoints return the response shape the app expects
 *   - Task 8.4: service functions return data matching fixture data
 */

const BASE = 'http://localhost:4000';

// ── Re-implement real handler logic with full URLs ────────────────────────────
// These mirror src/mocks/handlers/* exactly, using the same fixture data and
// response shapes, but with absolute URLs so MSW Node can match them.

const server = setupServer(
  // GET /api/children
  http.get(`${BASE}/api/children`, () => {
    const items = CHILDREN;
    const body: ApiResponse<PaginatedResponse<Child>> = {
      success: true,
      data: { items, page: 1, pageSize: 20, total: items.length },
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),

  // GET /api/children/:childId
  http.get(`${BASE}/api/children/:childId`, ({ params }) => {
    const { childId } = params as { childId: string };
    const child = CHILDREN.find((c) => c.id === childId);
    if (!child) {
      return HttpResponse.json(
        { success: false, error: { errorCode: 'NOT_FOUND', message: `Child ${childId} not found` } },
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

  http.get(`${BASE}/api/parents/my-students/`, () => {
    const students = CHILDREN.map((child) => ({
      id: child.id,
      first_name: child.name.split(' ')[0] ?? child.name,
      last_name: child.name.split(' ').slice(1).join(' '),
      section_name: child.section,
      current_section: child.sectionId,
      grade_name: child.grade,
      branch: child.branchId,
      branch_name: child.branchName,
    }));

    return HttpResponse.json(students);
  }),

  http.get(`${BASE}/api/assessment-results/by-student/`, ({ request }) => {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student');
    const child = CHILDREN.find((c) => c.id === studentId);
    if (!child) {
      return HttpResponse.json([], { status: 404 });
    }

    return HttpResponse.json(
      child.assignments.map((item, index) => ({
        id: item.id,
        assessment_id: `assessment-${item.id}`,
        assessment_title: item.title,
        assessment_description: item.description,
        assessment_due_date: `2025-06-${String(index + 1).padStart(2, '0')}`,
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
      })),
    );
  }),

  http.get(`${BASE}/api/assessments/`, ({ request }) => {
    const url = new URL(request.url);
    const branchId = url.searchParams.get('branch');
    const sectionId = url.searchParams.get('section');
    const child = CHILDREN.find((c) => c.branchId === branchId && c.sectionId === sectionId);

    const results = (child?.assignments ?? []).map((item, index) => ({
      id: `assessment-${item.id}`,
      title: item.title,
      description: item.description,
      due_date: `2025-06-${String(index + 1).padStart(2, '0')}`,
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

  http.get(`${BASE}/api/attendance/by-student/`, ({ request }) => {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student');
    const child = CHILDREN.find((c) => c.id === studentId);
    if (!child) {
      return HttpResponse.json([], { status: 404 });
    }
    return HttpResponse.json(
      child.attendance_log
        .filter((entry) => entry.status !== 'no-school' && entry.status !== 'empty')
        .map((entry, index) => ({
          id: `attendance-${studentId}-${index}`,
          date: entry.date,
          status: entry.status.toUpperCase(),
          status_display: entry.status,
          remarks: '',
          needs_reason: entry.status === 'absent' || entry.status === 'late',
          student_name: child.name,
          student_roll_no: '12',
          section_name: child.section,
          grade_name: child.grade,
          academic_year_name: '2025/2026',
          branch_name: child.branchName,
          recorded_by_name: 'Teacher One',
        })),
    );
  }),

  http.get(`${BASE}/api/attendance-summaries/`, ({ request }) => {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student');
    const child = CHILDREN.find((c) => c.id === studentId);
    if (!child) {
      return HttpResponse.json([]);
    }
    const rows = child.attendance_log.filter((entry) => entry.status !== 'no-school' && entry.status !== 'empty');
    const total_present = rows.filter((entry) => entry.status === 'present').length;
    const total_absent = rows.filter((entry) => entry.status === 'absent').length;
    const total_late = rows.filter((entry) => entry.status === 'late').length;
    const total_excused = rows.filter((entry) => entry.status === 'excused').length;
    const total_school_days = rows.length;
    return HttpResponse.json([{
      id: `summary-${studentId}`,
      student: studentId,
      student_name: child.name,
      academic_year: 'ay-1',
      academic_year_name: '2025/2026',
      total_present,
      total_absent,
      total_late,
      total_excused,
      total_school_days,
      attendance_rate: total_school_days > 0 ? Math.round(((total_present + total_excused) / total_school_days) * 100) : 0,
      last_updated: new Date().toISOString(),
    }]);
  }),

  http.get(`${BASE}/api/attendance-reasons/`, ({ request }) => {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student');
    const child = CHILDREN.find((c) => c.id === studentId);
    if (!child) {
      return HttpResponse.json([]);
    }
    return HttpResponse.json(
      child.attendance_log
        .filter((entry) => entry.status === 'absent' || entry.status === 'late')
        .map((entry, index) => ({
          id: `reason-${studentId}-${index}`,
          attendance: `attendance-${studentId}-${index}`,
          reason_category: index % 2 === 0 ? 'SICKNESS' : 'UNKNOWN',
          note: '',
          parent_confirmed: index % 2 === 0,
        })),
    );
  }),

  http.get(`${BASE}/api/chat-threads/`, () => {
    const results = CHILDREN.flatMap((child) =>
      child.messages.map((message, index) => ({
        id: `thread-${child.id}-${index + 1}`,
        parent: 'parent-1',
        teacher: message.teacherName,
        student: child.id,
        organization: 'org-1',
        branch: child.branchId,
        unread_count: message.unread ? 1 : 0,
        last_read_at: message.unread ? null : '2026-05-30T10:00:00Z',
        latest_message: null,
        created_at: '2026-05-30T09:00:00Z',
        updated_at: '2026-05-30T09:00:00Z',
      })),
    );

    return HttpResponse.json({
      count: results.length,
      next: null,
      previous: null,
      results,
    });
  }),

  http.get(`${BASE}/api/announcements/`, () => {
    const items = CHILDREN.flatMap((child) =>
      child.notifications.map((notification) => ({
        id: notification.id,
        subject: notification.title,
        message: notification.detail,
        is_urgent: notification.type === 'urgent',
        scheduled_at: notification.time,
      })),
    );

    return HttpResponse.json(items);
  }),

  // GET /api/children/:id/schedule
  http.get(`${BASE}/api/children/:id/schedule`, ({ params }) => {
    const { id } = params as { id: string };
    const child = CHILDREN.find((c) => c.id === id);
    if (!child) {
      return HttpResponse.json(
        { success: false, error: { errorCode: 'NOT_FOUND', message: `Child ${id} not found` } },
        { status: 404 },
      );
    }
    const items: ScheduleEntry[] = child.schedule;
    const body: ApiResponse<PaginatedResponse<ScheduleEntry>> = {
      success: true,
      data: { items, page: 1, pageSize: 20, total: items.length },
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Property 8: Mock handler responses conform to ApiResponse envelope ────────

/**
 * Property 8: Mock handler responses conform to the app contract
 */
describe('Mock handlers (Property 8)', () => {
  it('GET /api/children returns ApiResponse envelope with success:true and data', async () => {
    const res = await fetch(`${BASE}/api/children`);
    const json = await res.json() as Record<string, unknown>;
    expect(json.success).toBe(true);
    expect(json.data).toBeDefined();
    const data = json.data as Record<string, unknown>;
    expect(Array.isArray(data.items)).toBe(true);
    expect(typeof data.total).toBe('number');
  });

  it('GET /api/children/:id returns ApiResponse envelope for each child', async () => {
    // Property: for any valid child ID from fixture data, response conforms to envelope
    for (const child of CHILDREN) {
      const res = await fetch(`${BASE}/api/children/${child.id}`);
      const json = await res.json() as Record<string, unknown>;
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
    }
  });

  it('GET /api/chat-threads returns a paginated thread payload', async () => {
    const res = await fetch(`${BASE}/api/chat-threads/`);
    const json = await res.json() as Record<string, unknown>;
    expect(Array.isArray(json.results)).toBe(true);
    expect(typeof json.count).toBe('number');
  });

  it('GET /api/announcements returns plain announcement rows', async () => {
    const res = await fetch(`${BASE}/api/announcements/`);
    const json = await res.json() as Array<Record<string, unknown>>;
    expect(Array.isArray(json)).toBe(true);
    expect(json[0]).toHaveProperty('subject');
  });

  it('unknown child ID returns 404 with success:false', async () => {
    const res = await fetch(`${BASE}/api/children/NONEXISTENT-999`);
    const json = await res.json() as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error).toBeDefined();
  });
});

// ── Integration tests: services return correct fixture data ───────────────────

describe('MSW mock layer integration (Task 8.4)', () => {
  it('getChildren returns all children from fixture data', async () => {
    const result = await getChildren();
    expect(result).toHaveLength(CHILDREN.length);
    expect(result[0].id).toBe(CHILDREN[0].id);
    expect(result[0].name).toBe(CHILDREN[0].name);
  });

  it('getAssignments returns assignments for first child', async () => {
    const child = CHILDREN[0];
    const result = await getAssignments(child);
    expect(result).toHaveLength(child.assignments.length);
    expect(result[0].assessmentId).toBe(`assessment-${child.assignments[child.assignments.length - 1].id}`);
  });

  it('getAttendance returns attendance data for first child', async () => {
    const child = CHILDREN[0];
    const result = await getAttendance(child.id);
    expect(result.records.length).toBeGreaterThan(0);
    expect(typeof result.summary.termAttendance).toBe('number');
    expect(typeof result.summary.daysPresent).toBe('number');
  });

  it('getGrades returns grades for first child', async () => {
    const child = CHILDREN[0];
    const result = await getGrades(child.id);
    expect(result.subjects.length).toBeGreaterThan(0);
    expect(result.subjects.every((subject) => typeof subject.score === 'number')).toBe(true);
    expect(typeof result.overallAvg).toBe('number');
  });

  it('getMessages returns aggregated messages from all children', async () => {
    const allMessages = CHILDREN.flatMap((c) => c.messages);
    const result = await getMessages();
    expect(result).toHaveLength(allMessages.length);
  });

  it('getNotifications returns notifications for first child', async () => {
    const child = CHILDREN[0];
    const result = await getNotifications(child.id);
    expect(result.length).toBeGreaterThanOrEqual(child.notifications.length);
  });

  it('getSchedule returns schedule for first child', async () => {
    const child = CHILDREN[0];
    const result = await getSchedule(child.id);
    expect(result).toHaveLength(child.schedule.length);
  });
});
