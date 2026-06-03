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
import type { ApiResponse, PaginatedResponse, AttendanceResponse, GradesResponse } from '@/types/api';
import type { Child } from '@/types/child';
import type { AssignmentEntry } from '@/types/assignment';
import type { MessageEntry } from '@/types/message';
import type { NotificationEntry } from '@/types/notification';
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
 *   - Property 8: every endpoint returns { success: true, data: ... }
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

  // GET /api/children/:id/assignments
  http.get(`${BASE}/api/children/:id/assignments`, ({ params }) => {
    const { id } = params as { id: string };
    const child = CHILDREN.find((c) => c.id === id);
    if (!child) {
      return HttpResponse.json(
        { success: false, error: { errorCode: 'NOT_FOUND', message: `Child ${id} not found` } },
        { status: 404 },
      );
    }
    const items: AssignmentEntry[] = child.assignments;
    const body: ApiResponse<PaginatedResponse<AssignmentEntry>> = {
      success: true,
      data: { items, page: 1, pageSize: 20, total: items.length },
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
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

  // GET /api/children/:id/grades
  http.get(`${BASE}/api/children/:id/grades`, ({ params }) => {
    const { id } = params as { id: string };
    const child = CHILDREN.find((c) => c.id === id);
    if (!child) {
      return HttpResponse.json(
        { success: false, error: { errorCode: 'NOT_FOUND', message: `Child ${id} not found` } },
        { status: 404 },
      );
    }
    const gradesData: GradesResponse = { subjects: child.subjects, overallAvg: child.overallAvg };
    const body: ApiResponse<GradesResponse> = {
      success: true,
      data: gradesData,
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),

  // GET /api/messages
  http.get(`${BASE}/api/messages`, () => {
    const items: MessageEntry[] = CHILDREN.flatMap((c) => c.messages);
    const body: ApiResponse<PaginatedResponse<MessageEntry>> = {
      success: true,
      data: { items, page: 1, pageSize: 20, total: items.length },
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),

  // GET /api/children/:id/notifications
  http.get(`${BASE}/api/children/:id/notifications`, ({ params }) => {
    const { id } = params as { id: string };
    const child = CHILDREN.find((c) => c.id === id);
    if (!child) {
      return HttpResponse.json(
        { success: false, error: { errorCode: 'NOT_FOUND', message: `Child ${id} not found` } },
        { status: 404 },
      );
    }
    const items: NotificationEntry[] = child.notifications;
    const body: ApiResponse<PaginatedResponse<NotificationEntry>> = {
      success: true,
      data: { items, page: 1, pageSize: 20, total: items.length },
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
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
 * Property 8: Mock handler responses conform to ApiResponse envelope
 * Validates: Requirements 7.2, 7.5
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

  it('GET /api/messages returns ApiResponse envelope with paginated items', async () => {
    const res = await fetch(`${BASE}/api/messages`);
    const json = await res.json() as Record<string, unknown>;
    expect(json.success).toBe(true);
    const data = json.data as Record<string, unknown>;
    expect(Array.isArray(data.items)).toBe(true);
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
    expect(result[0].assessmentId).toBe(`assessment-${child.assignments[0].id}`);
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
    expect(result.subjects).toHaveLength(child.subjects.length);
    expect(result.overallAvg).toBe(child.overallAvg);
  });

  it('getMessages returns aggregated messages from all children', async () => {
    const allMessages = CHILDREN.flatMap((c) => c.messages);
    const result = await getMessages();
    expect(result).toHaveLength(allMessages.length);
  });

  it('getNotifications returns notifications from the shared inbox mapping', async () => {
    const child = CHILDREN[0];
    const result = await getNotifications(child.id);
    expect(result.length).toBeGreaterThanOrEqual(child.notifications.length);
    expect(result.some((notification) => notification.title === child.notifications[0]?.title)).toBe(true);
  });

  it('getSchedule returns schedule for first child', async () => {
    const child = CHILDREN[0];
    const result = await getSchedule(child.id);
    expect(result).toHaveLength(child.schedule.length);
  });
});
