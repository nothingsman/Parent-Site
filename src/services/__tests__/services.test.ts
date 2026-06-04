import { vi } from 'vitest';
// Set env var before any module that reads config is imported
vi.hoisted(() => {
  process.env['NEXT_PUBLIC_API_BASE_URL'] = 'http://localhost:4000';
});

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { ApiError, API_ERROR_CODES } from '@/types/api';
import type { Child } from '@/types';
import { getChildren, getChild } from '../childService';
import { confirmHomework, getAssignments, getTodaysHomework } from '../assignmentService';
import { getAttendance, logAbsence } from '../attendanceService';
import { getGrades } from '../gradeService';
import { getMessages, sendMessage } from '../messageService';
import {
  getNotificationCounter,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../notificationService';
import { getSchedule } from '../scheduleService';
import { getCurrentCalendarDocument } from '../calendarService';
import { getMediaFile, uploadFileToMedia } from '../mediaService';
import { getStudentInsight } from '../studentInsightService';
import {
  login,
  requestOtp,
  requestInvitationOtp,
  verifyInvitationOtp,
  completeParentInvitation,
  ensureAccessToken,
  refreshToken,
  restoreSession,
  logout,
  getAccessToken,
} from '../authService';
import { getUserMe, getParentMe, getMyStudents } from '../parentService';

const BASE = 'http://localhost:4000';

// ── MSW server ────────────────────────────────────────────────────────────────
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── childService ──────────────────────────────────────────────────────────────
describe('childService', () => {
  it('getChildren calls parent students endpoint and returns mapped children', async () => {
    const mockChildren = [{
      id: 'STU-001',
      first_name: 'Test',
      last_name: 'Child',
      grade_name: '6',
      section_name: 'A',
      current_section: 'section-1',
      branch: 'branch-1',
      branch_name: 'Main Branch',
    }];
    server.use(
      http.get(`${BASE}/api/parents/my-students/`, () => HttpResponse.json(mockChildren)),
      http.get(`${BASE}/api/attendance-summaries/`, () => HttpResponse.json([]))
    );
    const result = await getChildren();
    expect(result[0]?.id).toEqual('STU-001');
    expect(result[0]?.sectionId).toEqual('section-1');
  });

  it('getChild returns mapped child by id from parent students endpoint', async () => {
    server.use(
      http.get(`${BASE}/api/parents/my-students/`, () => HttpResponse.json([{
        id: 'STU-001',
        first_name: 'Test',
        last_name: 'Child',
        grade_name: '6',
        section_name: 'A',
        current_section: 'section-1',
        branch: 'branch-1',
        branch_name: 'Main Branch',
      }])),
      http.get(`${BASE}/api/attendance-summaries/`, () => HttpResponse.json([]))
    );
    const result = await getChild('STU-001');
    expect(result.id).toEqual('STU-001');
    expect(result.sectionId).toEqual('section-1');
  });

  it('getChildren propagates ApiError on failure', async () => {
    server.use(
      http.get(`${BASE}/api/parents/my-students/`, () =>
        HttpResponse.json({ error: { errorCode: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 })
      )
    );
    await expect(getChildren()).rejects.toBeInstanceOf(ApiError);
  });
});

// ── assignmentService ─────────────────────────────────────────────────────────
describe('assignmentService', () => {
  const child: Child = {
    id: 'STU-001',
    branchId: 'branch-1',
    branchName: 'Main Branch',
    sectionId: 'section-1',
    name: 'Test Child',
    initials: 'TC',
    grade: '6',
    section: 'A',
    overallAvg: 0,
    attendance: 0,
    assignmentsDue: 0,
    missingWork: 0,
    subjects: [],
    attendance_log: [],
    homework: [],
    assignments: [],
    messages: [],
    notifications: [],
    schedule: [],
  };

  it('getAssignments maps assessment result rows into task entries', async () => {
    const mockItems = [{
      id: 'result-1',
      assessment_id: 'assessment-1',
      assessment_title: 'Test Assignment',
      assessment_description: 'Finish the worksheet',
      assessment_due_date: '2026-05-30',
      subject_name: 'Math',
      section_name: 'A',
      submission_status: 'PENDING',
      obtained_marks: null,
      total_marks: '20',
      task_type: 'ASSIGNMENT',
      task_type_display: 'Assignment',
    }];
    server.use(
      http.get(`${BASE}/api/assessment-results/by-student/`, () =>
        HttpResponse.json(mockItems)
      ),
      http.get(`${BASE}/api/assessments/`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [{
            id: 'assessment-1',
            title: 'Test Assignment',
            description: 'Finish the worksheet',
            due_date: '2026-05-30',
            total_marks: '20',
            subject_name: 'Math',
            section_name: 'A',
            task_type: 'ASSIGNMENT',
            task_type_display: 'Assignment',
          }],
        })
      )
    );
    const result = await getAssignments(child);
    expect(result).toEqual([{
      id: 'result-1',
      assessmentId: 'assessment-1',
      title: 'Test Assignment',
      description: 'Finish the worksheet',
      dueDate: '2026-05-30',
      section: 'A',
      subject: 'Math',
      subjectColor: '#3949ab',
      type: 'Assignment',
      taskType: 'assignment',
      taskTypeDisplay: 'Assignment',
      status: 'due',
      score: null,
      maxScore: 20,
    }]);
  });

  it('getAssignments synthesizes assessment-only rows and prefers result rows on duplicates', async () => {
    server.use(
      http.get(`${BASE}/api/assessment-results/by-student/`, () =>
        HttpResponse.json([
          {
            id: 'result-1',
            assessment_id: 'assessment-1',
            assessment_title: 'Result-backed Assignment',
            assessment_description: 'From results',
            assessment_due_date: '2026-05-30',
            subject_name: 'Math',
            section_name: 'A',
            submission_status: 'SUBMITTED',
            obtained_marks: null,
            total_marks: '20',
            task_type: 'ASSIGNMENT',
            task_type_display: 'Assignment',
          },
        ])
      ),
      http.get(`${BASE}/api/assessments/`, () =>
        HttpResponse.json({
          count: 2,
          next: null,
          previous: null,
          results: [
            {
              id: 'assessment-1',
              title: 'Should Be Ignored',
              description: 'Duplicate assessment row',
              due_date: '2026-05-30',
              total_marks: '20',
              subject_name: 'Math',
              section_name: 'A',
              task_type: 'ASSIGNMENT',
              task_type_display: 'Assignment',
            },
            {
              id: 'assessment-2',
              title: 'Assessment-only Task',
              description: 'Needs synthesis',
              due_date: '2026-05-31',
              total_marks: '10',
              subject_name: 'Science',
              section_name: 'A',
              task_type: 'QUIZ',
              task_type_display: 'Quiz',
            },
          ],
        })
      )
    );

    const result = await getAssignments(child);

    expect(result).toEqual([
      {
        id: 'assessment-2',
        assessmentId: 'assessment-2',
        title: 'Assessment-only Task',
        description: 'Needs synthesis',
        dueDate: '2026-05-31',
        section: 'A',
        subject: 'Science',
        subjectColor: '#3949ab',
        type: 'Quiz',
        taskType: 'quiz',
        taskTypeDisplay: 'Quiz',
        status: 'due',
        score: null,
        maxScore: 10,
      },
      {
        id: 'result-1',
        assessmentId: 'assessment-1',
        title: 'Result-backed Assignment',
        description: 'From results',
        dueDate: '2026-05-30',
        section: 'A',
        subject: 'Math',
        subjectColor: '#3949ab',
        type: 'Assignment',
        taskType: 'assignment',
        taskTypeDisplay: 'Assignment',
        status: 'submitted',
        score: null,
        maxScore: 20,
      },
    ]);
  });

  it('getAssignments skips assessments endpoint when section id is missing', async () => {
    server.use(
      http.get(`${BASE}/api/assessment-results/by-student/`, () => HttpResponse.json([])),
      http.get(`${BASE}/api/assessments/`, () => {
        throw new Error('assessments endpoint should not be called');
      }),
    );

    const result = await getAssignments({ ...child, sectionId: null });
    expect(result).toEqual([]);
  });

  it('getTodaysHomework normalizes DRF paginated rows', async () => {
    server.use(
      http.get(`${BASE}/api/assessments/todays-homework/`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 'assessment-1',
              student_id: 'STU-001',
              student_name: 'Test Child',
              student_roll_no: '12',
              teacher_name: 'Ms. Hana',
              title: 'Fractions Worksheet',
              description: 'Do the exercises',
              due_date: '2026-05-30',
              subject_name: 'Math',
              section_name: 'A',
              branch_id: 'branch-1',
              branch_name: 'Main Branch',
              confirmed: false,
              homework_confirmation: null,
            },
          ],
        })
      )
    );

    const result = await getTodaysHomework('STU-001');
    expect(result).toEqual([
      {
        id: 'assessment-1',
        studentId: 'STU-001',
        studentName: 'Test Child',
        studentRollNo: '12',
        teacherName: 'Ms. Hana',
        title: 'Fractions Worksheet',
        description: 'Do the exercises',
        dueDate: '2026-05-30',
        subject: 'Math',
        section: 'A',
        branchId: 'branch-1',
        branchName: 'Main Branch',
        confirmed: false,
        homeworkConfirmation: null,
      },
    ]);
  });

  it('confirmHomework posts the expected payload', async () => {
    const capture = vi.fn();
    server.use(
      http.post(`${BASE}/api/homework-confirmations/`, async ({ request }) => {
        capture(await request.json());
        return HttpResponse.json({}, { status: 200 });
      })
    );

    await confirmHomework({
      assessment: 'assessment-1',
      student: 'STU-001',
      is_confirmed: true,
    });

    expect(capture).toHaveBeenCalledWith({
      assessment: 'assessment-1',
      student: 'STU-001',
      is_confirmed: true,
    });
  });
});

// ── attendanceService ─────────────────────────────────────────────────────────
describe('attendanceService', () => {
  it('getAttendance calls attendance APIs and returns normalized response', async () => {
    const attendanceRows = [
      {
        id: 'attendance-1',
        date: '2026-05-30',
        status: 'ABSENT',
        status_display: 'Absent',
        remarks: 'Parent notified',
        needs_reason: true,
        student_name: 'Test Child',
        student_roll_no: '12',
        section_name: 'A',
        grade_name: '6',
        academic_year_name: '2025/2026',
        branch_name: 'Main Branch',
        recorded_by_name: 'Teacher One',
      },
    ];
    server.use(
      http.get(`${BASE}/api/attendance/by-student/`, () =>
        HttpResponse.json(attendanceRows)
      ),
      http.get(`${BASE}/api/attendance-summaries/`, () =>
        HttpResponse.json([
          {
            id: 'summary-1',
            student: 'STU-001',
            student_name: 'Test Child',
            academic_year: 'ay-1',
            academic_year_name: '2025/2026',
            total_present: 85,
            total_absent: 3,
            total_late: 2,
            total_excused: 1,
            total_school_days: 90,
            attendance_rate: 95,
            last_updated: '2026-05-30T00:00:00Z',
          },
        ])
      ),
      http.get(`${BASE}/api/attendance-reasons/`, () =>
        HttpResponse.json([
          {
            id: 'reason-1',
            attendance: 'attendance-1',
            reason_category: 'SICKNESS',
            reason_category_display: 'Sickness',
            note: 'Flu',
            parent_confirmed: false,
          },
        ])
      ),
    );
    const result = await getAttendance('STU-001');
    expect(result.summary.termAttendance).toEqual(95);
    expect(result.summary.daysPresent).toEqual(85);
    expect(result.summary.pendingReasons).toEqual(1);
    expect(result.records[0]?.reason?.note).toEqual('Flu');
  });

  it('logAbsence calls PATCH parent-update when reason exists and returns updated reason', async () => {
    const mockEntry = { id: 'reason-1', reason_category: 'SICKNESS', note: 'Flu', parent_confirmed: true };
    server.use(
      http.patch(`${BASE}/api/attendance-reasons/reason-1/parent-update/`, () =>
        HttpResponse.json(mockEntry)
      )
    );
    const result = await logAbsence(
      { attendanceId: 'attendance-1', reasonId: 'reason-1' },
      { reason: 'SICKNESS', note: 'Flu' },
    );
    expect(result).toEqual(mockEntry);
  });

  it('logAbsence calls POST parent-create when reason does not exist', async () => {
    const mockEntry = { id: 'reason-2', reason_category: 'EMERGENCY', note: 'Family issue', parent_confirmed: true };
    server.use(
      http.post(`${BASE}/api/attendance-reasons/parent-create/`, () =>
        HttpResponse.json(mockEntry)
      )
    );

    const result = await logAbsence(
      { attendanceId: 'attendance-2', reasonId: null },
      { reason: 'EMERGENCY', note: 'Family issue' },
    );

    expect(result).toEqual(mockEntry);
  });
});

// ── gradeService ──────────────────────────────────────────────────────────────
describe('gradeService', () => {
  it('getGrades groups assessment results by subject and computes averages', async () => {
    const mockRows = [
      { subject_name: 'Math', percentage: 80, teacher_name: 'Ms. Hana' },
      { subject_name: 'Math', percentage: 90, teacher_name: 'Ms. Hana' },
      { subject_name: 'Science', percentage: 70, teacher_name: null },
    ];
    server.use(
      http.get(`${BASE}/api/assessment-results/by-student/`, () =>
        HttpResponse.json(mockRows)
      )
    );
    const result = await getGrades('STU-001');
    expect(result.overallAvg).toEqual(77.5);
    expect(result.subjects).toEqual([
      {
        name: 'Math',
        score: 85,
        color: expect.any(String),
        teacher: 'Ms. Hana',
      },
      {
        name: 'Science',
        score: 70,
        color: expect.any(String),
        teacher: '',
      },
    ]);
  });

  it('getGrades returns an empty response when no grade rows exist', async () => {
    server.use(
      http.get(`${BASE}/api/assessment-results/by-student/`, () =>
        HttpResponse.json([])
      )
    );

    await expect(getGrades('STU-001')).resolves.toEqual({
      subjects: [],
      overallAvg: 0,
    });
  });
});

// ── messageService ────────────────────────────────────────────────────────────
describe('messageService', () => {
  it('getMessages calls GET /api/chat-threads and maps thread entries', async () => {
    const mockItems = [{
      id: 'T-01',
      parent: 'parent-1',
      teacher: 'Mr. Test',
      student: 'STU-001',
      organization: 'org-1',
      branch: 'branch-1',
      unread_count: 2,
      last_read_at: null,
      latest_message: null,
      created_at: '2026-05-30T10:00:00Z',
      updated_at: '2026-05-30T10:00:00Z',
    }];
    server.use(
      http.get(`${BASE}/api/chat-threads/`, () =>
        HttpResponse.json({ count: 1, next: null, previous: null, results: mockItems })
      )
    );
    const result = await getMessages();
    expect(result).toEqual([{
      id: 'T-01',
      teacherName: 'Mr. Test',
      teacherInitials: 'TE',
      subject: 'Conversation',
      preview: '',
      time: '2026-05-30T10:00:00Z',
      unread: true,
    }]);
  });

  it('sendMessage calls POST /api/chat-threads/:threadId/messages and returns the message', async () => {
    const mockMsg = {
      id: 'msg-1',
      thread: 'T-01',
      sender: 'parent',
      sender_id: 'parent-1',
      text: 'Hello',
      attachment: null,
      read_by_ids: ['parent-1'],
      created_at: '2026-05-30T10:00:00Z',
      updated_at: '2026-05-30T10:00:00Z',
    };
    server.use(
      http.post(`${BASE}/api/chat-threads/T-01/messages/`, () =>
        HttpResponse.json(mockMsg, { status: 201 })
      )
    );
    const result = await sendMessage('T-01', { text: 'Hello' });
    expect(result).toEqual(mockMsg);
  });
});

// ── notificationService ───────────────────────────────────────────────────────
describe('notificationService', () => {
  it('getNotifications calls GET /api/notifications, maps payloads, and filters by child id', async () => {
    const mockItems = {
      count: 3,
      next: null,
      previous: null,
      results: [
        {
          id: 'N1',
          title: 'Test Notification',
          message: 'Please review the latest update.',
          data: {
            category: 'assignment',
            is_urgent: false,
            student_id: 'STU-001',
          },
          read_at: null,
          created_at: '2026-05-30T10:00:00Z',
          notifiable: {
            type: 'announcement',
            id: 'N1',
          },
        },
        {
          id: 'N2',
          title: 'Insight',
          message: 'Needs support.',
          data: {
            risk_band: 'MEDIUM',
            student_id: 'STU-001',
            insight_id: 'insight-1',
          },
          read_at: '2026-05-30T10:02:00Z',
          created_at: '2026-05-30T10:01:00Z',
          notifiable: {
            type: 'student_insight',
            id: 'insight-1',
          },
        },
        {
          id: 'N3',
          title: 'Other child',
          message: 'Should be excluded.',
          data: {
            category: 'grade',
            student_id: 'STU-999',
          },
          read_at: null,
          created_at: '2026-05-30T10:05:00Z',
          notifiable: {
            type: 'announcement',
            id: 'N3',
          },
        },
      ],
    };
    server.use(
      http.get(`${BASE}/api/notifications/`, () =>
        HttpResponse.json(mockItems)
      )
    );
    const result = await getNotifications('STU-001');
    expect(result).toEqual([
      {
        id: 'N1',
        title: 'Test Notification',
        type: 'info',
        category: 'assignment',
        time: '2026-05-30T10:00:00Z',
        read: false,
        detail: 'Please review the latest update.',
        icon: 'ClipboardList',
        color: 'amber',
        insightId: undefined,
        studentId: 'STU-001',
        targetRoute: undefined,
        riskBand: undefined,
      },
      {
        id: 'N2',
        title: 'Insight',
        type: 'urgent',
        category: 'insight',
        time: '2026-05-30T10:01:00Z',
        read: true,
        detail: 'Needs support.',
        icon: 'Info',
        color: 'amber',
        insightId: 'insight-1',
        studentId: 'STU-001',
        targetRoute: undefined,
        riskBand: 'MEDIUM',
      },
    ]);
  });

  it('markNotificationRead posts to mark-as-read and maps the response', async () => {
    server.use(
      http.post(`${BASE}/api/notifications/N1/mark-as-read/`, () =>
        HttpResponse.json({
          id: 'N1',
          title: 'Message from teacher',
          message: 'Please call back.',
          data: {
            category: 'message',
            student_id: 'STU-001',
          },
          read_at: '2026-05-30T10:03:00Z',
          created_at: '2026-05-30T10:00:00Z',
          notifiable: {
            type: 'chat_message',
            id: 'chat-1',
          },
        })
      )
    );

    const result = await markNotificationRead('N1');
    expect(result).toMatchObject({
      id: 'N1',
      category: 'message',
      read: true,
      icon: 'MessageCircle',
      color: 'green',
    });
  });

  it('markAllNotificationsRead posts and returns updatedCount', async () => {
    server.use(
      http.post(`${BASE}/api/notifications/mark-all-read/`, () =>
        HttpResponse.json({ updated_count: 4 })
      )
    );

    await expect(markAllNotificationsRead()).resolves.toEqual({
      updatedCount: 4,
    });
  });

  it('getNotificationCounter calls GET /api/notifications/counter', async () => {
    server.use(
      http.get(`${BASE}/api/notifications/counter/`, () =>
        HttpResponse.json({ unread_count: 7 })
      )
    );

    await expect(getNotificationCounter()).resolves.toEqual({
      unread_count: 7,
    });
  });
});

describe('studentInsightService', () => {
  it('getStudentInsight fetches full insight details', async () => {
    server.use(
      http.get(`${BASE}/api/student-insights/insight-1/`, () =>
        HttpResponse.json({
          id: 'insight-1',
          student: 'STU-001',
          category: 'ACADEMICS',
          category_display: 'Academics',
          risk_band: 'LOW',
          risk_band_display: 'Low',
          title: 'Academic support update',
          message: 'Recent scores suggest extra support may help.',
          confidence_label: 'RULE_BASED',
          recommended_actions: ['Review homework together'],
          safety_status: 'APPROVED',
          safety_status_display: 'Approved',
          delivery_status: 'DELIVERED',
          created_at: '2026-05-30T10:00:00Z',
          delivered_at: '2026-05-30T10:01:00Z',
        })
      )
    );

    await expect(getStudentInsight('insight-1')).resolves.toEqual({
      id: 'insight-1',
      student: 'STU-001',
      category: 'ACADEMICS',
      category_display: 'Academics',
      risk_band: 'LOW',
      risk_band_display: 'Low',
      title: 'Academic support update',
      message: 'Recent scores suggest extra support may help.',
      confidence_label: 'RULE_BASED',
      recommended_actions: ['Review homework together'],
      safety_status: 'APPROVED',
      safety_status_display: 'Approved',
      delivery_status: 'DELIVERED',
      created_at: '2026-05-30T10:00:00Z',
      delivered_at: '2026-05-30T10:01:00Z',
    });
  });
});

// ── scheduleService ───────────────────────────────────────────────────────────
describe('scheduleService', () => {
  it('getSchedule calls GET /api/children/:id/schedule and returns items', async () => {
    const mockItems = [{ id: 'S1', subject: 'Math' }];
    server.use(
      http.get(`${BASE}/api/children/STU-001/schedule`, () =>
        HttpResponse.json({ success: true, data: { items: mockItems, page: 1, pageSize: 20, total: 1 } })
      )
    );
    const result = await getSchedule('STU-001');
    expect(result).toEqual(mockItems);
  });
});

describe('calendarService', () => {
  it('getCurrentCalendarDocument resolves calendar metadata and media download url', async () => {
    server.use(
      http.get(`${BASE}/api/calendar-documents/current/`, () =>
        HttpResponse.json({
          id: 'calendar-1',
          organization: 'org-1',
          branch: 'branch-1',
          academic_year: null,
          media_file: 'media-1',
          file_name: 'academic-calendar.pdf',
          created_at: '2026-05-30T10:29:12.191063Z',
          updated_at: '2026-05-30T13:17:05.788647Z',
        })
      ),
      http.get(`${BASE}/api/media/media-1`, () =>
        HttpResponse.json({
          data: {
            id: 'media-1',
            key: 'media/key',
            bucket: 'bucket',
            file_name: 'academic-calendar.pdf',
            content_type: 'application/pdf',
            size: 100,
            etag: 'etag',
            status: 'UPLOADED',
            uploaded_by: 'user-1',
            created_at: '2026-05-30T10:29:12.191063Z',
            updated_at: '2026-05-30T13:17:05.788647Z',
            download_url: 'https://example.com/calendar.pdf',
          },
        })
      )
    );

    const result = await getCurrentCalendarDocument({
      organization: 'org-1',
      branch: 'branch-1',
    });

    expect(result).toEqual({
      id: 'calendar-1',
      organizationId: 'org-1',
      branchId: 'branch-1',
      academicYearId: null,
      mediaFileId: 'media-1',
      fileName: 'academic-calendar.pdf',
      downloadUrl: 'https://example.com/calendar.pdf',
    });
  });
});

describe('mediaService', () => {
  it('uploadFileToMedia follows the multipart media workflow and preserves ETags', async () => {
    const partNumberRequests: number[] = [];

    server.use(
      http.post(`${BASE}/api/media/upload`, async () =>
        HttpResponse.json({
          data: {
            id: 'media-1',
            key: 'media/user/media-1/attachment.bin',
            upload_id: 'upload-1',
            expires_in: 900,
          },
        })
      ),
      http.post(`${BASE}/api/media/media-1/multipart/part-url`, async ({ request }) => {
        const body = await request.json() as { part_number: number; upload_id: string };
        partNumberRequests.push(body.part_number);
        return HttpResponse.json({
          data: {
            presigned_url: `https://uploads.example.com/media-1/part-${body.part_number}`,
            expires_in: 900,
          },
        });
      }),
      http.put('https://uploads.example.com/media-1/part-1', async () => {
        return new HttpResponse(null, {
          status: 200,
          headers: { ETag: '"etag-part-1"' },
        });
      }),
      http.put('https://uploads.example.com/media-1/part-2', async () => {
        return new HttpResponse(null, {
          status: 200,
          headers: { ETag: '"etag-part-2"' },
        });
      }),
      http.post(`${BASE}/api/media/media-1/multipart/complete`, async ({ request }) => {
        const body = await request.json() as {
          upload_id: string;
          parts: Array<{ part_number: number; etag: string }>;
        };

        expect(body.upload_id).toBe('upload-1');
        expect(body.parts).toEqual([
          { part_number: 1, etag: '"etag-part-1"' },
          { part_number: 2, etag: '"etag-part-2"' },
        ]);

        return HttpResponse.json({
          data: {
            id: 'media-1',
            status: 'uploaded',
            etag: '"etag-part-2"',
            size: 6291457,
          },
        });
      })
    );

    const file = new File(
      [new Uint8Array(5 * 1024 * 1024), new Uint8Array(1)],
      'attachment.bin',
      { type: 'application/octet-stream' }
    );

    await expect(uploadFileToMedia(file)).resolves.toBe('media-1');
    expect(partNumberRequests).toEqual([1, 2]);
  });

  it('aborts the multipart upload when a part upload fails', async () => {
    let abortCalled = false;

    server.use(
      http.post(`${BASE}/api/media/upload`, async () =>
        HttpResponse.json({
          data: {
            id: 'media-2',
            key: 'media/user/media-2/failure.bin',
            upload_id: 'upload-2',
            expires_in: 900,
          },
        })
      ),
      http.post(`${BASE}/api/media/media-2/multipart/part-url`, async () =>
        HttpResponse.json({
          data: {
            presigned_url: 'https://uploads.example.com/media-2/part-1',
            expires_in: 900,
          },
        })
      ),
      http.put('https://uploads.example.com/media-2/part-1', async () =>
        new HttpResponse(null, { status: 500 })
      ),
      http.post(`${BASE}/api/media/media-2/multipart/abort`, async ({ request }) => {
        const body = await request.json() as { upload_id: string };
        expect(body.upload_id).toBe('upload-2');
        abortCalled = true;
        return HttpResponse.json({
          data: null,
          message: 'Multipart upload aborted',
        });
      })
    );

    const file = new File([new Uint8Array(1)], 'failure.bin', {
      type: 'application/octet-stream',
    });

    await expect(uploadFileToMedia(file)).rejects.toThrow('Failed to upload attachment.');
    expect(abortCalled).toBe(true);
  });

  it('getMediaFile fetches a fresh download URL when metadata omits it', async () => {
    server.use(
      http.get(`${BASE}/api/media/media-3`, async () =>
        HttpResponse.json({
          data: {
            id: 'media-3',
            key: 'media/key',
            bucket: 'bucket',
            file_name: 'chat-attachment.pdf',
            content_type: 'application/pdf',
            size: 100,
            etag: '"etag"',
            status: 'uploaded',
            uploaded_by: 'user-1',
            created_at: '2026-06-01T08:00:00Z',
            updated_at: '2026-06-01T08:00:00Z',
            download_url: null,
          },
        })
      ),
      http.get(`${BASE}/api/media/media-3/url`, async () =>
        HttpResponse.json({
          data: {
            download_url: 'https://example.com/chat-attachment.pdf',
          },
        })
      )
    );

    await expect(getMediaFile('media-3')).resolves.toMatchObject({
      id: 'media-3',
      download_url: 'https://example.com/chat-attachment.pdf',
    });
  });
});

// ── authService ───────────────────────────────────────────────────────────────
describe('authService', () => {
  it('login stores access token and returns mapped AuthResponse', async () => {
    server.use(
      http.post(`${BASE}/auth/jwt/create/`, () =>
        HttpResponse.json({ access: 'tok123', refresh: 'ref123' })
      )
    );
    const result = await login({ phone_number: '+251900000000', password: 'secure-password' });
    expect(result.accessToken).toEqual('tok123');
    expect(getAccessToken()).toBe('tok123');
  });

  it('requestOtp calls otp request endpoint', async () => {
    server.use(http.post(`${BASE}/auth/otp/request/`, () => HttpResponse.json({ message: 'OTP sent successfully.' })));
    const result = await requestOtp('+251900000000');
    expect(result.message).toContain('OTP sent');
  });

  it('requestInvitationOtp calls invitation otp endpoint', async () => {
    server.use(http.post(`${BASE}/api/parents/request-invitation-otp/`, () => HttpResponse.json({ message: 'OTP sent successfully.' })));
    const result = await requestInvitationOtp({ uid: 'u', token: 't' });
    expect(result.message).toContain('OTP sent');
  });

  it('verifyInvitationOtp calls invitation verify endpoint', async () => {
    server.use(http.post(`${BASE}/api/parents/verify-invitation-otp/`, () => HttpResponse.json({
      message: 'OTP verified successfully.',
      invitation_verification_token: 'verify-token',
    })));
    const result = await verifyInvitationOtp({ uid: 'u', token: 't', otp_code: '123456' });
    expect(result.invitation_verification_token).toEqual('verify-token');
  });

  it('completeParentInvitation calls complete endpoint', async () => {
    server.use(http.post(`${BASE}/api/parents/complete-invitation/`, () => HttpResponse.json({ message: 'Password set and parent account activated successfully.' })));
    const result = await completeParentInvitation({
      uid: 'u',
      token: 't',
      new_password: 'new-secure-password',
      invitation_verification_token: 'verify-token',
    });
    expect(result.message).toContain('Password set');
  });

  it('refreshToken updates access token', async () => {
    server.use(http.post(`${BASE}/auth/jwt/refresh/`, () => HttpResponse.json({ access: 'tok-refreshed' })));
    const token = await refreshToken();
    expect(token).toEqual('tok-refreshed');
    expect(getAccessToken()).toEqual('tok-refreshed');
  });

  it('ensureAccessToken returns the current unexpired token', async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 60 * 60;
    const payload = btoa(JSON.stringify({ exp: futureExp })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    const tokenValue = `header.${payload}.signature`;

    server.use(
      http.post(`${BASE}/auth/jwt/create/`, () =>
        HttpResponse.json({ access: tokenValue, refresh: 'ref123' })
      )
    );

    await login({ phone_number: '+251900000000', password: 'secure-password' });
    await expect(ensureAccessToken()).resolves.toBe(tokenValue);
  });

  it('ensureAccessToken refreshes an expired token', async () => {
    const expiredExp = Math.floor(Date.now() / 1000) - 60;
    const expiredPayload = btoa(JSON.stringify({ exp: expiredExp })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    const expiredToken = `header.${expiredPayload}.signature`;

    server.use(
      http.post(`${BASE}/auth/jwt/create/`, () =>
        HttpResponse.json({ access: expiredToken, refresh: 'ref123' })
      ),
      http.post(`${BASE}/auth/jwt/refresh/`, () =>
        HttpResponse.json({ access: 'tok-refreshed' })
      )
    );

    await login({ phone_number: '+251900000000', password: 'secure-password' });
    await expect(ensureAccessToken()).resolves.toBe('tok-refreshed');
    expect(getAccessToken()).toBe('tok-refreshed');
  });

  it('logout clears access token and calls queryClient.clear()', async () => {
    const mockQueryClient = { clear: vi.fn() };
    let logoutCalls = 0;
    server.use(
      http.post(`${BASE}/auth/logout/`, () => {
        logoutCalls += 1;
        return HttpResponse.json({}, { status: 204 });
      })
    );

    await logout(mockQueryClient as never);

    expect(getAccessToken()).toBeNull();
    expect(mockQueryClient.clear).toHaveBeenCalledOnce();
    expect(logoutCalls).toBe(1);
  });

  it('restoreSession returns null after explicit logout without refreshing', async () => {
    let refreshCalls = 0;
    server.use(
      http.post(`${BASE}/auth/logout/`, () => HttpResponse.json({}, { status: 204 })),
      http.post(`${BASE}/auth/jwt/refresh/`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ access: 'tok-refreshed' });
      })
    );

    await logout();
    await expect(restoreSession()).resolves.toBeNull();
    expect(refreshCalls).toBe(0);
  });

  it('failed service call propagates ApiError', async () => {
    server.use(
      http.get(`${BASE}/api/children`, () =>
        HttpResponse.json(
          { success: false, error: { errorCode: 'NOT_FOUND', message: 'Not found' } },
          { status: 404 }
        )
      )
    );
    await expect(getChildren()).rejects.toBeInstanceOf(ApiError);
  });
});

describe('parentService', () => {
  it('getUserMe calls /api/users/me/', async () => {
    server.use(http.get(`${BASE}/api/users/me/`, () => HttpResponse.json({ id: 'u1', name: 'Parent User', phone_number: '+251900000000' })));
    const result = await getUserMe();
    expect(result.id).toEqual('u1');
  });

  it('getParentMe calls /api/parents/me/', async () => {
    server.use(
      http.get(`${BASE}/api/parents/me/`, () =>
        HttpResponse.json({
          id: 'p1',
          user: 'u1',
          organizations: ['org-1'],
          branches: ['branch-1'],
          secondary_phone_number: '',
          occupation: '',
          work_address: '',
          relationship_notes: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          is_active: true,
          created_at: '2026-05-30T10:29:12.191063Z',
          updated_at: '2026-05-30T13:17:05.788647Z',
          organization_ids: ['org-1'],
          branch_ids: ['branch-1'],
          user_details: {
            id: 'u1',
            name: 'Parent User',
            father_name: 'Father',
            grandfather_name: 'Grandfather',
            email: null,
            phone_number: '+251900000000',
            address: '',
            role: 'PARENT',
            verified_at: '2026-05-30T13:17:05.782531Z',
            created_at: '2026-05-30T10:29:12.167382Z',
            updated_at: '2026-05-30T13:17:05.782681Z',
          },
          organization_details: [
            { id: 'org-1', name: 'Adis', status: 'ACTIVE' },
          ],
          branch_details: [
            {
              id: 'branch-1',
              name: 'Tulu branch',
              organization: 'org-1',
              status: 'ACTIVE',
            },
          ],
          student_details: [
            {
              id: 'student-1',
              first_name: 'Abel',
              last_name: 'Ayele',
              roll_no: '01',
              branch: 'branch-1',
              organization: 'org-1',
              relationship_type: 'FATHER',
              is_primary_contact: true,
            },
          ],
        })
      )
    );
    const result = await getParentMe();
    expect(result.id).toEqual('p1');
    expect(result.user_details.name).toEqual('Parent User');
  });

  it('getMyStudents calls /api/parents/my-students/', async () => {
    server.use(http.get(`${BASE}/api/parents/my-students/`, () => HttpResponse.json([{
      id: 's1',
      first_name: 'A',
      last_name: 'B',
      section_name: 'A',
      current_section: 'section-1',
      grade_name: '6',
      branch: 'branch-1',
      branch_name: 'Main Branch',
    }])));
    const result = await getMyStudents();
    expect(result[0]?.id).toEqual('s1');
    expect(result[0]?.current_section).toEqual('section-1');
  });
});
