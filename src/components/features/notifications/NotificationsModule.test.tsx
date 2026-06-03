import React from "react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { LanguageProvider } from "@/lib/i18n";
import type { Child } from "@/types";
import { NotificationsModule } from "./NotificationsModule";

const useNotificationsMock = vi.fn();
const markNotificationReadMock = vi.fn();
const markAllNotificationsReadMock = vi.fn();
const getStudentInsightMock = vi.fn();

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: (...args: unknown[]) => useNotificationsMock(...args),
}));

vi.mock("@/services/notificationService", () => ({
  markNotificationRead: (...args: unknown[]) => markNotificationReadMock(...args),
  markAllNotificationsRead: (...args: unknown[]) => markAllNotificationsReadMock(...args),
}));

vi.mock("@/services/studentInsightService", () => ({
  getStudentInsight: (...args: unknown[]) => getStudentInsightMock(...args),
}));

const child: Child = {
  id: "child-a",
  branchId: "branch-1",
  branchName: "Main Branch",
  sectionId: "section-1",
  name: "Sara Bekele",
  initials: "SB",
  grade: "7",
  section: "A",
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
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const queryClient = new QueryClient();

  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <NotificationsModule child={child} />
        </LanguageProvider>
      </QueryClientProvider>,
    );
  });

  return { container, root };
}

describe("NotificationsModule", () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    useNotificationsMock.mockReset();
    markNotificationReadMock.mockReset();
    markAllNotificationsReadMock.mockReset();
    getStudentInsightMock.mockReset();
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

  it("opens the insight detail modal for an insight notification", async () => {
    useNotificationsMock.mockReturnValue({
      data: [
        {
          id: "notif-1",
          title: "Academic support update",
          type: "info",
          category: "insight",
          time: "2026-06-01T10:00:00Z",
          read: false,
          detail: "Recent scores suggest extra support may help.",
          icon: "Info",
          color: "blue",
          insightId: "insight-1",
          studentId: child.id,
          riskBand: "LOW",
        },
      ],
    });
    getStudentInsightMock.mockResolvedValue({
      id: "insight-1",
      student: child.id,
      category: "ACADEMICS",
      category_display: "Academics",
      risk_band: "LOW",
      risk_band_display: "Low",
      title: "Academic support update",
      message: "Recent scores suggest extra support may help.",
      confidence_label: "RULE_BASED",
      recommended_actions: [
        "Review the latest schoolwork together.",
        "Ask which topic felt difficult.",
        "Contact the teacher if help is needed.",
      ],
      safety_status: "APPROVED",
      safety_status_display: "Approved",
      delivery_status: "DELIVERED",
      created_at: "2026-06-01T10:00:00Z",
      delivered_at: "2026-06-01T10:00:01Z",
    });
    markNotificationReadMock.mockResolvedValue(undefined);
    markAllNotificationsReadMock.mockResolvedValue({ updatedCount: 0 });

    ({ container, root } = renderModule());

    const cards = Array.from(container?.querySelectorAll("div") ?? []);
    const card = cards.find((node) =>
      node.textContent?.includes("Academic support update"),
    );
    expect(card).toBeDefined();

    await act(async () => {
      card?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(getStudentInsightMock).toHaveBeenCalledWith("insight-1");
    expect(container?.textContent).toContain("Why this alert was generated");
    expect(container?.textContent).toContain("Recommended actions");
    cleanup();
  });
});

