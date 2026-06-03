import React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnnouncementsModule } from './AnnouncementsModule';
import type { Child } from '@/types';

const useAnnouncementsMock = vi.fn();

vi.mock('@/hooks', () => ({
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

function renderAnnouncements() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<AnnouncementsModule child={child} />);
  });

  return { container, root };
}

describe('AnnouncementsModule', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    useAnnouncementsMock.mockReset();
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
        {
          id: 'ann-2',
          branchId: 'branch-1',
          organizationId: 'org-1',
          subject: 'Section A Materials Check',
          message: 'Send geometry sets by Friday.',
          isUrgent: false,
          status: 'SCHEDULED',
          targetRoles: 'PARENTS',
          targetGrades: [],
          targetSections: ['section-1'],
          scheduledAt: '2026-06-05T06:00:00Z',
          createdAt: '2026-06-01T10:00:00Z',
          updatedAt: '2026-06-01T10:00:00Z',
          effectiveAt: '2026-06-05T06:00:00Z',
        },
      ],
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

  it('renders and filters announcements by status', () => {
    ({ container, root } = renderAnnouncements());
    expect(container?.textContent).toContain('Whole-Branch Safety Reminder');
    expect(container?.textContent).toContain('Section A Materials Check');

    const scheduledFilter = Array.from(container?.querySelectorAll('button') ?? []).find(
      (button) => button.textContent === 'SCHEDULED',
    );

    act(() => {
      scheduledFilter?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container?.textContent).not.toContain('Whole-Branch Safety Reminder');
    expect(container?.textContent).toContain('Section A Materials Check');
    cleanup();
  });
});
