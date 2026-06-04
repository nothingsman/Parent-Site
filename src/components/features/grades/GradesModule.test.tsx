import React from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';

import { GradesModule } from './GradesModule';
import type { AssignmentEntry, Child, Subject } from '@/types';

const useGradesMock = vi.fn();
const useAssignmentsMock = vi.fn();

vi.mock('@/hooks', () => ({
  useGrades: (...args: unknown[]) => useGradesMock(...args),
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

const subjects: Subject[] = [
  { name: 'Mathematics', score: 84, color: '#3949ab', teacher: 'Mr. Tesfaye' },
  { name: 'Science', score: 76, color: '#059669', teacher: '' },
];

const assignments: AssignmentEntry[] = [
  {
    id: 'result-1',
    assessmentId: 'assessment-1',
    title: 'Fractions Quiz',
    description: 'Chapter 5 review',
    dueDate: '2026-05-30',
    section: 'A',
    subject: 'Mathematics',
    subjectColor: '#3949ab',
    type: 'Quiz',
    taskType: 'quiz',
    taskTypeDisplay: 'Quiz',
    status: 'graded',
    score: 17,
    maxScore: 20,
  },
  {
    id: 'result-2',
    assessmentId: 'assessment-2',
    title: 'Lab Sheet',
    description: 'Finish the worksheet',
    dueDate: '2026-05-31',
    section: 'A',
    subject: 'Mathematics',
    subjectColor: '#3949ab',
    type: 'Assignment',
    taskType: 'assignment',
    taskTypeDisplay: 'Assignment',
    status: 'submitted',
    score: null,
    maxScore: 10,
  },
];

function renderModule() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<GradesModule child={child} setActiveModule={vi.fn()} />);
  });

  return { container, root };
}

describe('GradesModule', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    useGradesMock.mockReset();
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
    useGradesMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    useAssignmentsMock.mockReturnValue({ data: [] });

    ({ container, root } = renderModule());
    expect(container?.textContent).toContain('Loading grades...');
    cleanup();
  });

  it('renders error state', () => {
    useGradesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { message: 'Network down' },
    });
    useAssignmentsMock.mockReturnValue({ data: [] });

    ({ container, root } = renderModule());
    expect(container?.textContent).toContain('Network down');
    cleanup();
  });

  it('renders empty state', () => {
    useGradesMock.mockReturnValue({
      data: { subjects: [], overallAvg: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });
    useAssignmentsMock.mockReturnValue({ data: [] });

    ({ container, root } = renderModule());
    expect(container?.textContent).toContain('No grade records are available for this student yet.');
    cleanup();
  });

  it('renders live subjects and subject drawer details', () => {
    useGradesMock.mockReturnValue({
      data: { subjects, overallAvg: 80 },
      isLoading: false,
      isError: false,
      error: null,
    });
    useAssignmentsMock.mockReturnValue({ data: assignments });

    ({ container, root } = renderModule());
    expect(container?.textContent).toContain('Mathematics');
    expect(container?.textContent).toContain('Science');
    expect(container?.textContent).toContain('Teacher unavailable');

    const cards = Array.from(container?.querySelectorAll('.group') ?? []);
    const mathCard = cards.find((item) => item.textContent?.includes('Mathematics'));

    act(() => {
      mathCard?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container?.textContent).toContain('Assignments & grading log');
    expect(container?.textContent).toContain('Fractions Quiz');
    expect(container?.textContent).toContain('Lab Sheet');
    expect(container?.textContent).toContain('Teacher: Mr. Tesfaye');
    cleanup();
  });
});
