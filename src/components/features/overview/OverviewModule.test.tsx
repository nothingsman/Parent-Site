import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

import { OverviewModule } from './OverviewModule';
import { LanguageProvider } from '@/lib/i18n';
import type { ChatThread } from '@/types/message';
import type { SectionTeacherAssignment } from '@/types/api';
import type { Child, NotificationEntry, TodaysHomeworkEntry } from '@/types';

const useTodaysHomeworkMock = vi.fn();
const useConfirmHomeworkMock = vi.fn();
const useBehaviourLogMock = vi.fn();
const useAnnouncementsMock = vi.fn();
const useQueryMock = vi.fn();
const mutateMock = vi.fn();

vi.mock('@/hooks', () => ({
  useTodaysHomework: (...args: unknown[]) => useTodaysHomeworkMock(...args),
  useConfirmHomework: (...args: unknown[]) => useConfirmHomeworkMock(...args),
  useBehaviourLog: (...args: unknown[]) => useBehaviourLogMock(...args),
  useAnnouncements: (...args: unknown[]) => useAnnouncementsMock(...args),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query'
  );
  return {
    ...actual,
    useQuery: (...args: unknown[]) => useQueryMock(...args),
  };
});

const child: Child = {
  id: 'student-1',
  branchId: 'branch-1',
  branchName: 'Main Branch',
  gradeId: 'grade-7',
  sectionId: 'section-1',
  name: 'Sara Bekele',
  initials: 'SB',
  grade: '7',
  section: 'A',
  overallAvg: 80,
  attendance: 95,
  assignmentsDue: 1,
  missingWork: 0,
  subjects: [],
  attendance_log: [],
  homework: [],
  assignments: [],
  messages: [],
  notifications: [],
  schedule: [],
};

const homeworkRows: TodaysHomeworkEntry[] = [
  {
    id: 'assessment-1',
    studentId: 'student-1',
    studentName: 'Sara Bekele',
    studentRollNo: '12',
    teacherName: 'Ms. Hana',
    title: 'Fractions Worksheet',
    description: 'Solve page 4',
    dueDate: '2026-05-30',
    subject: 'Mathematics',
    section: 'Grade 7 - A',
    branchId: 'branch-1',
    branchName: 'Main Branch',
    confirmed: false,
    homeworkConfirmation: null,
  },
  {
    id: 'assessment-2',
    studentId: 'student-1',
    studentName: 'Sara Bekele',
    studentRollNo: '12',
    teacherName: 'Mr. Daniel',
    title: 'Reading Notes',
    description: 'Read chapter 3',
    dueDate: '2026-05-30',
    subject: 'English',
    section: 'Grade 7 - A',
    branchId: 'branch-1',
    branchName: 'Main Branch',
    confirmed: true,
    homeworkConfirmation: {
      id: 'confirmation-1',
      is_confirmed: true,
      feedback: '',
      confirmed_at: '2026-05-30T10:00:00Z',
    },
  },
];

const teacherAssignments: SectionTeacherAssignment[] = [
  {
    id: 'assignment-1',
    section_name: 'Grade 7 - A',
    academic_year_name: '2026',
    subject_id: 'subject-1',
    subject_name: 'Mathematics',
    subject_code: 'MATH',
    grade_name: 'Grade 7',
    teacher_id: 'teacher-1',
    teacher_name: 'Ms. Hana',
    teacher_employee_id: 'EMP-1',
    teacher_specialization: 'Mathematics',
  },
];

const unreadThread: ChatThread = {
  id: 'thread-1',
  parent: 'parent-1',
  teacher: 'teacher-1',
  student: 'student-1',
  organization: 'org-1',
  branch: 'branch-1',
  unread_count: 2,
  last_read_at: null,
  latest_message: {
    id: 'message-1',
    thread: 'thread-1',
    sender: 'teacher-1',
    sender_id: 'teacher-1',
    text: 'Please review the fractions worksheet.',
    attachment: null,
    read_by_ids: [],
    created_at: '2026-06-01T08:00:00Z',
    updated_at: '2026-06-01T08:00:00Z',
  },
  created_at: '2026-06-01T07:00:00Z',
  updated_at: '2026-06-01T08:00:00Z',
};

const readThread: ChatThread = {
  ...unreadThread,
  id: 'thread-2',
  teacher: 'teacher-2',
  unread_count: 0,
  latest_message: {
    ...unreadThread.latest_message!,
    id: 'message-2',
    thread: 'thread-2',
    sender: 'teacher-2',
    sender_id: 'teacher-2',
    text: 'This one is already read.',
  },
  updated_at: '2026-06-01T09:00:00Z',
};

function renderOverview(props?: {
  notifications?: NotificationEntry[];
  onOpenMessageThread?: (threadId: string) => void;
}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <LanguageProvider>
        <OverviewModule
          child={child}
          setActiveModule={vi.fn()}
          onOpenMessageThread={props?.onOpenMessageThread}
          notifications={props?.notifications}
        />
      </LanguageProvider>
    );
  });

  return { container, root };
}

describe('OverviewModule', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mutateMock.mockReset();
    useTodaysHomeworkMock.mockReset();
    useConfirmHomeworkMock.mockReset();
    useBehaviourLogMock.mockReset();
    useAnnouncementsMock.mockReset();
    useQueryMock.mockReset();
    useConfirmHomeworkMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      variables: undefined,
    });
    useTodaysHomeworkMock.mockReturnValue({
      data: homeworkRows,
      isLoading: false,
      isError: false,
      error: null,
    });
    useBehaviourLogMock.mockReturnValue({
      data: [
        {
          id: 'behaviour-2',
          type: 'remark',
          title: 'Improved participation',
          description: 'Asked thoughtful questions in class.',
          severity: 'LOW',
          teacherName: 'Ms. Hana',
          source: 'Teacher Remark',
          occurredAt: '2026-06-02T08:00:00Z',
          createdAt: '2026-06-02T08:10:00Z',
        },
        {
          id: 'behaviour-1',
          type: 'incident',
          title: 'Classroom disruption',
          description: 'Interrupted classmates during group work.',
          severity: 'HIGH',
          teacherName: 'Mr. Daniel',
          source: 'Teacher Incident',
          occurredAt: '2026-06-01T08:00:00Z',
          createdAt: '2026-06-01T08:10:00Z',
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    });
    useAnnouncementsMock.mockReturnValue({
      data: [
        {
          id: 'announcement-1',
          branchId: child.branchId,
          subject: 'Parent meeting this Friday',
          message: 'Please attend the branch hall at 3:00 PM.',
          status: 'SENT',
          isUrgent: false,
          scheduledAt: null,
          createdAt: '2026-06-01T09:00:00Z',
          updatedAt: '2026-06-01T09:15:00Z',
          targetRoles: 'PARENTS',
          targetGrades: [child.gradeId!],
          targetSections: [],
          effectiveDate: '2026-06-01T09:15:00Z',
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    });
    useQueryMock.mockImplementation(({ queryKey }: { queryKey: readonly unknown[] }) => {
      if (queryKey[0] === 'teacher-assignments') {
        return { data: teacherAssignments, isLoading: false };
      }
      if (queryKey[0] === 'chat') {
        return { data: [], isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });
  });

  function cleanup() {
    if (root && container) {
      act(() => {
        root?.unmount();
      });
      container.remove();
    }
    root = null;
    container = null;
  }

  it('renders unread teacher message previews with teacher, subject, and latest text', () => {
    useQueryMock.mockImplementation(({ queryKey }: { queryKey: readonly unknown[] }) => {
      if (queryKey[0] === 'teacher-assignments') {
        return { data: teacherAssignments, isLoading: false };
      }
      if (queryKey[0] === 'chat') {
        return { data: [unreadThread], isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });

    ({ container, root } = renderOverview());

    expect(container?.textContent).toContain('Ms. Hana');
    expect(container?.textContent).toContain('Mathematics');
    expect(container?.textContent).toContain('Please review the fractions worksheet.');
    cleanup();
  });

  it('renders behaviour log and recent announcements previews', () => {
    ({ container, root } = renderOverview());

    expect(container?.textContent).toContain('Behaviour Log');
    expect(container?.textContent).toContain('Improved participation');
    expect(container?.textContent).toContain('Classroom disruption');
    expect(container?.textContent).toContain('Recent Announcements');
    expect(container?.textContent).toContain('Parent meeting this Friday');
    cleanup();
  });

  it('excludes already-read threads from unread teacher previews', () => {
    useQueryMock.mockImplementation(({ queryKey }: { queryKey: readonly unknown[] }) => {
      if (queryKey[0] === 'teacher-assignments') {
        return { data: teacherAssignments, isLoading: false };
      }
      if (queryKey[0] === 'chat') {
        return { data: [unreadThread, readThread], isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });

    ({ container, root } = renderOverview());

    expect(container?.textContent).toContain('Ms. Hana');
    expect(container?.textContent).not.toContain('This one is already read.');
    cleanup();
  });

  it('clicking a preview calls onOpenMessageThread with the thread id', () => {
    const onOpenMessageThread = vi.fn();
    useQueryMock.mockImplementation(({ queryKey }: { queryKey: readonly unknown[] }) => {
      if (queryKey[0] === 'teacher-assignments') {
        return { data: teacherAssignments, isLoading: false };
      }
      if (queryKey[0] === 'chat') {
        return { data: [unreadThread], isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });

    ({ container, root } = renderOverview({ onOpenMessageThread }));

    const preview = Array.from(container?.querySelectorAll('[role="button"]') ?? []).find(
      (node) => node.textContent?.includes('Please review the fractions worksheet.')
    );

    act(() => {
      preview?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onOpenMessageThread).toHaveBeenCalledWith('thread-1');
    cleanup();
  });

  it('keeps existing homework behavior intact', () => {
    ({ container, root } = renderOverview());

    expect(container?.textContent).toContain('Fractions Worksheet');

    const confirmButton = Array.from(container?.querySelectorAll('button') ?? []).find(
      (button) => button.textContent === 'Confirm'
    );

    act(() => {
      confirmButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mutateMock).toHaveBeenCalledWith({
      assessment: 'assessment-1',
      student: 'student-1',
      is_confirmed: true,
    });
    cleanup();
  });
});
