import React from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { LanguageProvider } from '@/lib/i18n';
import type { Child } from '@/types';
import { NotificationsModule } from './NotificationsModule';

const useNotificationsMock = vi.fn();
const markNotificationReadMock = vi.fn();
const markAllNotificationsReadMock = vi.fn();
const getStudentInsightMock = vi.fn();
const invalidateQueriesMock = vi.fn();

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: (...args: unknown[]) => useNotificationsMock(...args),
}));

vi.mock('@/services/notificationService', () => ({
  markNotificationRead: (...args: unknown[]) => markNotificationReadMock(...args),
  markAllNotificationsRead: (...args: unknown[]) => markAllNotificationsReadMock(...args),
}));

vi.mock('@/services/studentInsightService', () => ({
  getStudentInsight: (...args: unknown[]) => getStudentInsightMock(...args),
}));

const child: Child = {
  id: 'child-a',
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
  const queryClient = new QueryClient();
  queryClient.invalidateQueries = invalidateQueriesMock;

  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <NotificationsModule child={child} />
        </LanguageProvider>
      </QueryClientProvider>
    );
  });

  return { container, root };
}

describe('NotificationsModule', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    useNotificationsMock.mockReset();
    markNotificationReadMock.mockReset();
    markAllNotificationsReadMock.mockReset();
    getStudentInsightMock.mockReset();
    invalidateQueriesMock.mockReset();

    useNotificationsMock.mockReturnValue({
      data: [
        {
          id: 'notif-grade',
          title: 'New grade posted',
          type: 'success',
          category: 'grade',
          time: '2026-06-01T10:00:00Z',
          read: false,
          detail: 'Math score available.',
          icon: 'Star',
          color: 'green',
        },
        {
          id: 'notif-insight',
          title: 'Academic support update',
          type: 'info',
          category: 'insight',
          time: '2026-06-01T10:00:00Z',
          read: false,
          detail: 'Recent scores suggest extra support may help.',
          icon: 'Info',
          color: 'blue',
          insightId: 'insight-1',
          studentId: child.id,
          riskBand: 'LOW',
        },
      ],
    });
    markNotificationReadMock.mockResolvedValue(undefined);
    markAllNotificationsReadMock.mockResolvedValue({ updatedCount: 2 });
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

  it('filters notifications by tab', () => {
    ({ container, root } = renderModule());

    const insightsTab = Array.from(container?.querySelectorAll('button') ?? []).find(
      (button) => button.textContent === 'Insights'
    );

    act(() => {
      insightsTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container?.textContent).toContain('Academic support update');
    expect(container?.textContent).not.toContain('New grade posted');
    cleanup();
  });

  it('mark all as read triggers mutation and cache invalidation', async () => {
    ({ container, root } = renderModule());

    const markAllButton = Array.from(container?.querySelectorAll('button') ?? []).find(
      (button) => button.textContent === 'Mark all as read'
    );

    await act(async () => {
      markAllButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(markAllNotificationsReadMock).toHaveBeenCalled();
    expect(invalidateQueriesMock).toHaveBeenCalled();
    cleanup();
  });

  it('clicking an unread non-insight notification marks it as read', async () => {
    ({ container, root } = renderModule());

    const gradeCard = Array.from(container?.querySelectorAll('div') ?? []).find(
      (node) => node.textContent?.includes('New grade posted')
    );

    await act(async () => {
      gradeCard?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(markNotificationReadMock).toHaveBeenCalledWith('notif-grade');
    cleanup();
  });

  it('clicking an insight notification opens loading state then detail modal', async () => {
    getStudentInsightMock.mockResolvedValue({
      id: 'insight-1',
      student: child.id,
      category: 'ACADEMICS',
      category_display: 'Academics',
      risk_band: 'LOW',
      risk_band_display: 'Low',
      title: 'Academic support update',
      message: 'Recent scores suggest extra support may help.',
      confidence_label: 'RULE_BASED',
      recommended_actions: [
        'Review the latest schoolwork together.',
        'Contact the teacher if help is needed.',
      ],
      safety_status: 'APPROVED',
      safety_status_display: 'Approved',
      delivery_status: 'DELIVERED',
      created_at: '2026-06-01T10:00:00Z',
      delivered_at: '2026-06-01T10:00:01Z',
    });

    ({ container, root } = renderModule());

    const insightCard = Array.from(container?.querySelectorAll('div') ?? []).find(
      (node) => node.textContent?.includes('Academic support update')
    );

    await act(async () => {
      insightCard?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(getStudentInsightMock).toHaveBeenCalledWith('insight-1');
    expect(markNotificationReadMock).toHaveBeenCalledWith('notif-insight');
    expect(container?.textContent).toContain('Why this alert was generated');
    expect(container?.textContent).toContain('Recommended actions');
    cleanup();
  });
});
