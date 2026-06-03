import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { OverviewModule } from './OverviewModule';
import type { Child, TodaysHomeworkEntry } from '@/types';

const useTodaysHomeworkMock = vi.fn();
const useConfirmHomeworkMock = vi.fn();
const useBehaviourLogMock = vi.fn();
const useAnnouncementsMock = vi.fn();
const mutateMock = vi.fn();

vi.mock('@/hooks', () => ({
  useTodaysHomework: (...args: unknown[]) => useTodaysHomeworkMock(...args),
  useConfirmHomework: (...args: unknown[]) => useConfirmHomeworkMock(...args),
  useBehaviourLog: (...args: unknown[]) => useBehaviourLogMock(...args),
  useAnnouncements: (...args: unknown[]) => useAnnouncementsMock(...args),
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

function renderOverview() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <OverviewModule
        child={child}
        setActiveModule={vi.fn()}
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
    useBehaviourLogMock.mockReset();
    useAnnouncementsMock.mockReset();
    useConfirmHomeworkMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      variables: undefined,
    });
    useBehaviourLogMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });
    useAnnouncementsMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
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

  it('renders behaviour log above schedules and planners', () => {
    useTodaysHomeworkMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });
    useBehaviourLogMock.mockReturnValue({
      data: [
        {
          id: 'beh-1',
          childId: 'student-1',
          type: 'incident',
          title: 'Late Assignment Submission',
          detail: 'Submitted after the class deadline.',
          teacherName: 'Abebe T.',
          subject: 'Mathematics',
          severity: 'warning',
          recordedAt: '2026-05-12T08:00:00Z',
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    });

    ({ container, root } = renderOverview());
    const text = container?.textContent ?? '';
    expect(text.indexOf('Behaviour Log')).toBeGreaterThan(-1);
    expect(text.indexOf('Schedules & Planners')).toBeGreaterThan(-1);
    expect(text.indexOf('Behaviour Log')).toBeLessThan(text.indexOf('Schedules & Planners'));
    cleanup();
  });

  it('renders announcement preview rows', () => {
    useTodaysHomeworkMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });
    useAnnouncementsMock.mockReturnValue({
      data: [
        {
          id: 'ann-1',
          branchId: 'branch-1',
          organizationId: 'org-1',
          subject: 'Whole-Branch Safety Reminder',
          message: 'Review revised pick-up timing.',
          isUrgent: true,
          status: 'SENT',
          targetRoles: 'PARENTS',
          targetGrades: [],
          targetSections: [],
          scheduledAt: null,
          createdAt: '2026-05-27T08:00:00Z',
          updatedAt: '2026-05-27T08:00:00Z',
          effectiveAt: '2026-05-27T08:00:00Z',
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    });

    ({ container, root } = renderOverview());
    expect(container?.textContent).toContain('Recent Announcements');
    expect(container?.textContent).toContain('Whole-Branch Safety Reminder');
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
});
