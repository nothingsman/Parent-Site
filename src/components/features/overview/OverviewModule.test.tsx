import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { OverviewModule } from './OverviewModule';
import type { OverviewModuleProps } from './OverviewModule';
import type { Child, TodaysHomeworkEntry } from '@/types';
import type { ChatThread } from '@/types/message';
import type { SectionTeacherAssignment } from '@/types/api';

const useTodaysHomeworkMock = vi.fn();
const useConfirmHomeworkMock = vi.fn();
const useQueryMock = vi.fn();
const mutateMock = vi.fn();

vi.mock('@/hooks', () => ({
  useTodaysHomework: (...args: unknown[]) => useTodaysHomeworkMock(...args),
  useConfirmHomework: (...args: unknown[]) => useConfirmHomeworkMock(...args),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

const child: Child = {
  id: 'student-1',
  branchId: 'branch-1',
  branchName: 'Main Branch',
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

function renderOverview(props: Partial<OverviewModuleProps> = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <OverviewModule
        child={child}
        setActiveModule={vi.fn()}
        onOpenMessageThread={vi.fn()}
        {...props}
      />,
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
    useQueryMock.mockReset();
    useConfirmHomeworkMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      variables: undefined,
    });
    useQueryMock.mockImplementation(({ queryKey }: { queryKey: readonly unknown[] }) => {
      if (queryKey[0] === 'teacher-assignments') {
        return {
          data: [],
          isLoading: false,
        };
      }
      if (queryKey[0] === 'chat') {
        return {
          data: [],
          isLoading: false,
        };
      }
      return {
        data: undefined,
        isLoading: false,
      };
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

  it('renders loading state', () => {
    useTodaysHomeworkMock.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null,
    });

    ({ container, root } = renderOverview());
    expect(container?.textContent).toContain("Loading today's homework...");
    cleanup();
  });

  it('renders empty state', () => {
    useTodaysHomeworkMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    ({ container, root } = renderOverview());
    expect(container?.textContent).toContain('No homework due today.');
    cleanup();
  });

  it('renders live homework rows and disables confirmed rows', () => {
    useTodaysHomeworkMock.mockReturnValue({
      data: homeworkRows,
      isLoading: false,
      isError: false,
      error: null,
    });

    ({ container, root } = renderOverview());
    expect(container?.textContent).toContain('Fractions Worksheet');
    expect(container?.textContent).toContain('Reading Notes');

    const buttons = container?.querySelectorAll('button');
    const confirmButton = Array.from(buttons ?? []).find((button) =>
      button.textContent?.includes('Confirm'),
    );
    const confirmedButton = Array.from(buttons ?? []).find((button) =>
      button.textContent === 'Confirmed',
    );

    expect(confirmButton?.hasAttribute('disabled')).toBe(false);
    expect(confirmedButton?.hasAttribute('disabled')).toBe(true);
    cleanup();
  });

  it('clicking a homework row opens the details modal', () => {
    useTodaysHomeworkMock.mockReturnValue({
      data: [homeworkRows[0]],
      isLoading: false,
      isError: false,
      error: null,
    });

    ({ container, root } = renderOverview());
    const row = container?.querySelector('[role="button"]');

    act(() => {
      row?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container?.textContent).toContain('Homework Details');
    expect(container?.textContent).toContain('Sara Bekele');
    expect(container?.textContent).toContain('Solve page 4');
    cleanup();
  });

  it('shows fallback text when homework description is blank', () => {
    useTodaysHomeworkMock.mockReturnValue({
      data: [
        {
          ...homeworkRows[0],
          description: '   ',
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    });

    ({ container, root } = renderOverview());
    const row = container?.querySelector('[role="button"]');

    act(() => {
      row?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container?.textContent).toContain('No description provided.');
    cleanup();
  });

  it('clicking confirm triggers mutation with the homework assessment and student ids', () => {
    useTodaysHomeworkMock.mockReturnValue({
      data: [homeworkRows[0]],
      isLoading: false,
      isError: false,
      error: null,
    });

    ({ container, root } = renderOverview());
    const button = Array.from(container?.querySelectorAll('button') ?? []).find(
      (entry) => entry.textContent === 'Confirm',
    );

    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mutateMock).toHaveBeenCalledWith({
      assessment: 'assessment-1',
      student: 'student-1',
      is_confirmed: true,
    });
    cleanup();
  });

  it('clicking confirm does not open the details modal', () => {
    useTodaysHomeworkMock.mockReturnValue({
      data: [homeworkRows[0]],
      isLoading: false,
      isError: false,
      error: null,
    });

    ({ container, root } = renderOverview());
    const button = Array.from(container?.querySelectorAll('button') ?? []).find(
      (entry) => entry.textContent === 'Confirm',
    );

    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container?.textContent).not.toContain('Homework Details');
    cleanup();
  });

  it('renders live teacher message previews in the overview card', () => {
    useTodaysHomeworkMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });
    useQueryMock.mockImplementation(({ queryKey }: { queryKey: readonly unknown[] }) => {
      if (queryKey[0] === 'teacher-assignments') {
        return {
          data: teacherAssignments,
          isLoading: false,
        };
      }
      if (queryKey[0] === 'chat') {
        return {
          data: [unreadThread, readThread],
          isLoading: false,
        };
      }
      return {
        data: undefined,
        isLoading: false,
      };
    });

    ({ container, root } = renderOverview());

    expect(container?.textContent).toContain('Messages from Teachers');
    expect(container?.textContent).toContain('Ms. Hana');
    expect(container?.textContent).toContain('Mathematics');
    expect(container?.textContent).toContain('Please review the fractions worksheet.');
    expect(container?.textContent).not.toContain('This one is already read.');
    cleanup();
  });

  it('clicking an unread teacher preview opens the selected thread', () => {
    const onOpenMessageThread = vi.fn();
    useTodaysHomeworkMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });
    useQueryMock.mockImplementation(({ queryKey }: { queryKey: readonly unknown[] }) => {
      if (queryKey[0] === 'teacher-assignments') {
        return {
          data: teacherAssignments,
          isLoading: false,
        };
      }
      if (queryKey[0] === 'chat') {
        return {
          data: [unreadThread],
          isLoading: false,
        };
      }
      return {
        data: undefined,
        isLoading: false,
      };
    });

    ({ container, root } = renderOverview({ onOpenMessageThread }));

    const previewButton = Array.from(container?.querySelectorAll('button') ?? []).find(
      (button) => button.textContent?.includes('Please review the fractions worksheet.'),
    );

    act(() => {
      previewButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onOpenMessageThread).toHaveBeenCalledWith('thread-1');
    cleanup();
  });
});
