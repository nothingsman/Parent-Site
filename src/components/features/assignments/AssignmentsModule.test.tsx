import React from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';

import { AssignmentsModule } from './AssignmentsModule';
import type { Child, AssignmentEntry } from '@/types';

const useAssignmentsMock = vi.fn();

vi.mock('@/hooks', () => ({
  useAssignments: (...args: unknown[]) => useAssignmentsMock(...args),
}));

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

const assignments: AssignmentEntry[] = [
  {
    id: 'result-1',
    assessmentId: 'assessment-1',
    title: 'Fractions Worksheet',
    description: 'Finish page 5',
    dueDate: '2026-05-30',
    section: 'Grade 7 - A',
    subject: 'Mathematics',
    subjectColor: '#3949ab',
    type: 'Assignment',
    taskType: 'assignment',
    taskTypeDisplay: 'Assignment',
    status: 'due',
    score: null,
    maxScore: 20,
  },
  {
    id: 'result-2',
    assessmentId: 'assessment-2',
    title: 'Science Quiz',
    description: 'Chapter 3',
    dueDate: '2026-05-31',
    section: 'Grade 7 - A',
    subject: 'Science',
    subjectColor: '#3949ab',
    type: 'Quiz',
    taskType: 'quiz',
    taskTypeDisplay: 'Quiz',
    status: 'graded',
    score: 18,
    maxScore: 20,
  },
];

function renderModule() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<AssignmentsModule child={child} />);
  });

  return { container, root };
}

describe('AssignmentsModule', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    useAssignmentsMock.mockReset();
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
    useAssignmentsMock.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null,
    });

    ({ container, root } = renderModule());
    expect(container?.textContent).toContain('Loading tasks...');
    cleanup();
  });

  it('renders empty state', () => {
    useAssignmentsMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    ({ container, root } = renderModule());
    expect(container?.textContent).toContain('No tasks found for the selected filters.');
    cleanup();
  });

  it('renders live tasks and filters them', () => {
    useAssignmentsMock.mockReturnValue({
      data: assignments,
      isLoading: false,
      isError: false,
      error: null,
    });

    ({ container, root } = renderModule());
    expect(container?.textContent).toContain('Fractions Worksheet');
    expect(container?.textContent).toContain('Science Quiz');

    const gradedTab = Array.from(container?.querySelectorAll('button') ?? []).find(
      (button) => button.textContent === 'Graded',
    );

    act(() => {
      gradedTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container?.textContent).toContain('Science Quiz');
    expect(container?.textContent).not.toContain('Fractions Worksheet');
    cleanup();
  });

  it('filters by task type and subject', () => {
    useAssignmentsMock.mockReturnValue({
      data: assignments,
      isLoading: false,
      isError: false,
      error: null,
    });

    ({ container, root } = renderModule());

    const selects = Array.from(container?.querySelectorAll('select') ?? []);
    const typeSelect = selects[0];
    const subjectSelect = selects[1];

    act(() => {
      if (typeSelect) {
        (typeSelect as HTMLSelectElement).value = 'Quiz';
        typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    expect(container?.textContent).toContain('Science Quiz');
    expect(container?.textContent).not.toContain('Fractions Worksheet');

    act(() => {
      if (subjectSelect) {
        (subjectSelect as HTMLSelectElement).value = 'Mathematics';
        subjectSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    expect(container?.textContent).toContain('No tasks found for the selected filters.');
    cleanup();
  });

  it('opens task details modal on row click', () => {
    useAssignmentsMock.mockReturnValue({
      data: [assignments[0]],
      isLoading: false,
      isError: false,
      error: null,
    });

    ({ container, root } = renderModule());
    const card = container?.querySelector('.cursor-pointer');

    act(() => {
      card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container?.textContent).toContain('Task Details');
    expect(container?.textContent).toContain('Finish page 5');
    expect(container?.textContent).toContain('Due May');
    cleanup();
  });
});
