import React from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';

import { AnnouncementsModule } from './AnnouncementsModule';
import { LanguageProvider } from '@/lib/i18n';
import type { Child } from '@/types';

const useAnnouncementsMock = vi.fn();

vi.mock('@/hooks', () => ({
  useAnnouncements: (...args: unknown[]) => useAnnouncementsMock(...args),
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

function renderModule() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <LanguageProvider>
        <AnnouncementsModule child={child} />
      </LanguageProvider>
    );
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
        {
          id: 'announcement-2',
          branchId: child.branchId,
          subject: 'Transport change',
          message: 'Pickup time changes this Thursday.',
          status: 'SCHEDULED',
          isUrgent: true,
          scheduledAt: '2026-06-06T06:30:00Z',
          createdAt: '2026-06-02T07:00:00Z',
          updatedAt: '2026-06-02T07:05:00Z',
          targetRoles: 'PARENTS',
          targetGrades: [],
          targetSections: [child.sectionId!],
          effectiveDate: '2026-06-06T06:30:00Z',
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

  it('filters by status and shows scheduled wording', () => {
    ({ container, root } = renderModule());

    expect(container?.textContent).toContain('Parent meeting this Friday');
    expect(container?.textContent).toContain('Transport change');
    expect(container?.textContent).toContain('Scheduled for');

    const scheduledButton = Array.from(container?.querySelectorAll('button') ?? []).find(
      (button) => button.textContent === 'Scheduled'
    );
    act(() => {
      scheduledButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container?.textContent).toContain('Transport change');
    expect(container?.textContent).not.toContain('Parent meeting this Friday');
    cleanup();
  });
});
