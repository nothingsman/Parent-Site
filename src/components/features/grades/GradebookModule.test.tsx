import React from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';

import { GradebookModule } from './GradebookModule';
import { LanguageProvider } from '@/lib/i18n';
import type { AssignmentEntry, Child } from '@/types';

const useAssignmentsMock = vi.fn();

vi.mock('@/hooks', () => ({
  useAssignments: (...args: unknown[]) => useAssignmentsMock(...args),
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
  overallAvg: 0,
  attendance: 95,
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

const assignments: AssignmentEntry[] = [
  {
    id: 'result-1',
    assessmentId: 'assessment-1',
    title: 'Fractions Worksheet',
    description: 'Finish page 5',
    dueDate: '2026-05-30',
    section: 'A',
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
    title: 'Science Exam',
    description: 'Semester checkpoint',
    dueDate: '2026-05-31',
    section: 'A',
    subject: 'Science',
    subjectColor: '#059669',
    type: 'Exam',
    taskType: 'exam',
    taskTypeDisplay: 'Exam',
    status: 'graded',
    score: 45,
    maxScore: 50,
  },
];

function renderModule() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <LanguageProvider>
        <GradebookModule child={child} />
      </LanguageProvider>,
    );
  });

  return { container, root };
}

describe('GradebookModule', () => {
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
    expect(container?.textContent).toContain('Loading gradebook...');
    cleanup();
  });

  it('renders error state', () => {
    useAssignmentsMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: { message: 'Gradebook failed' },
    });

    ({ container, root } = renderModule());
    expect(container?.textContent).toContain('Gradebook failed');
    cleanup();
  });

  it('renders live assignments without synthetic exam rows', () => {
    useAssignmentsMock.mockReturnValue({
      data: assignments,
      isLoading: false,
      isError: false,
      error: null,
    });

    ({ container, root } = renderModule());
    expect(container?.textContent).toContain('Fractions Worksheet');
    expect(container?.textContent).toContain('Science Exam');
    expect(container?.textContent).not.toContain('Physics Semester Exam');
    expect(container?.textContent).not.toContain('Mathematics Mid-Term Exam');
    cleanup();
  });
});
