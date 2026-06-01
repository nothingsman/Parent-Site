import React from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import { MessagesModule } from './MessagesModule';
import type { Child } from '@/types';
import type { ChatMessage } from '@/types/message';

const useMessageThreadsMock = vi.fn();

vi.mock('@/hooks', () => ({
  useMessageThreads: (...args: unknown[]) => useMessageThreadsMock(...args),
}));

const childA: Child = {
  id: 'child-a',
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

const childB: Child = {
  ...childA,
  id: 'child-b',
  name: 'Noah Alemu',
  initials: 'NA',
  sectionId: 'section-2',
  grade: '8',
  section: 'B',
};

function makeMessage(id: string, senderId: string, text: string): ChatMessage {
  return {
    id,
    thread: `thread-${id}`,
    sender: senderId,
    sender_id: senderId,
    text,
    attachment: null,
    read_by_ids: [],
    created_at: '2026-06-01T08:00:00Z',
    updated_at: '2026-06-01T08:00:00Z',
  };
}

function makeContact(
  key: string,
  teacherName: string,
  subjectName: string,
  gradeLabel: string,
  updatedAt: string,
) {
  return {
    key,
    teacherId: `${key}-teacher`,
    teacherName,
    teacherInitials: teacherName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
    subjectName,
    gradeLabel,
    studentName: 'STUDENT',
    avatarBg: 'bg-[#3949AB]',
    existingThreadId: key.startsWith('draft:') ? null : key,
    unreadCount: 0,
    updatedAt,
    latestPreview: `${teacherName} preview`,
    latestMessageAt: updatedAt,
  };
}

const setActiveKeyMock = vi.fn();
const sendMessageMock = vi.fn();
const clearAttachmentMock = vi.fn();

const hookStateByChildId = new Map<string, ReturnType<typeof makeHookState>>();

function makeHookState(overrides: Partial<ReturnType<typeof baseHookState>> = {}) {
  return {
    ...baseHookState(),
    ...overrides,
  };
}

function baseHookState() {
  return {
    filteredContacts: [],
    activeKey: null as string | null,
    activeContact: null as ReturnType<typeof makeContact> | null,
    activeMessages: [] as ChatMessage[],
    currentUserId: 'parent-1',
    messagesLoading: false,
    threadsLoading: false,
    isSending: false,
    sendError: null as string | null,
    websocketState: 'connected' as const,
    uploadState: {
      status: 'idle' as const,
      file: null,
      mediaId: null,
      progressLabel: null,
      error: null,
    },
    searchTerm: '',
    setSearchTerm: vi.fn(),
    setActiveKey: setActiveKeyMock,
    sendMessage: sendMessageMock,
    clearAttachment: clearAttachmentMock,
    attachmentMetaById: {},
    unreadTotal: 0,
  };
}

useMessageThreadsMock.mockImplementation((child: Child) => {
  const state = hookStateByChildId.get(child.id);
  if (!state) {
    throw new Error(`Missing hook state for child ${child.id}`);
  }
  return state;
});

function renderMessagesModule(child: Child) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<MessagesModule child={child} />);
  });

  return {
    container,
    root,
    rerender(nextChild: Child) {
      act(() => {
        root.render(<MessagesModule child={nextChild} />);
      });
    },
  };
}

describe('MessagesModule', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    useMessageThreadsMock.mockClear();
    setActiveKeyMock.mockReset();
    sendMessageMock.mockReset();
    clearAttachmentMock.mockReset();
    hookStateByChildId.clear();
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

  it('selects a teacher conversation by stable key when clicked', () => {
    const teacherA = makeContact('thread-1', 'Ms. Hana', 'Mathematics', 'Grade 7 - A', '2026-06-01T08:00:00Z');
    const teacherB = makeContact('thread-2', 'Mr. Daniel', 'English', 'Grade 7 - A', '2026-06-01T09:00:00Z');
    hookStateByChildId.set(childA.id, makeHookState({
      filteredContacts: [teacherA, teacherB],
      activeKey: teacherA.key,
      activeContact: teacherA,
      activeMessages: [makeMessage('1', 'parent-1', 'Hello')],
    }));

    ({ container, root } = renderMessagesModule(childA));

    const buttons = Array.from(container?.querySelectorAll('button') ?? []);
    const teacherButton = buttons.find((button) => button.textContent?.includes('Mr. Daniel'));
    expect(teacherButton).toBeDefined();

    act(() => {
      teacherButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(setActiveKeyMock).toHaveBeenCalledWith('thread-2');
    cleanup();
  });

  it('keeps the selected conversation stable when contacts reorder', () => {
    const teacherA = makeContact('thread-1', 'Ms. Hana', 'Mathematics', 'Grade 7 - A', '2026-06-01T08:00:00Z');
    const teacherB = makeContact('thread-2', 'Mr. Daniel', 'English', 'Grade 7 - A', '2026-06-01T09:00:00Z');
    hookStateByChildId.set(childA.id, makeHookState({
      filteredContacts: [teacherA, teacherB],
      activeKey: teacherB.key,
      activeContact: teacherB,
      activeMessages: [makeMessage('2', 'thread-2-teacher', 'Latest from Daniel')],
    }));

    ({ container, root } = renderMessagesModule(childA));
    expect(container?.querySelector('h3')?.textContent).toBe('Mr. Daniel');

    hookStateByChildId.set(childA.id, makeHookState({
      filteredContacts: [teacherB, teacherA],
      activeKey: teacherB.key,
      activeContact: teacherB,
      activeMessages: [makeMessage('2', 'thread-2-teacher', 'Latest from Daniel')],
    }));

    act(() => {
      root?.render(<MessagesModule child={childA} />);
    });

    expect(container?.querySelector('h3')?.textContent).toBe('Mr. Daniel');
    cleanup();
  });

  it('resets local compose and mobile state when the child changes', () => {
    const teacherA = makeContact('thread-1', 'Ms. Hana', 'Mathematics', 'Grade 7 - A', '2026-06-01T08:00:00Z');
    const teacherB = makeContact('thread-3', 'Mr. Samuel', 'Biology', 'Grade 8 - B', '2026-06-01T10:00:00Z');
    hookStateByChildId.set(childA.id, makeHookState({
      filteredContacts: [teacherA],
      activeKey: teacherA.key,
      activeContact: teacherA,
      activeMessages: [makeMessage('1', 'parent-1', 'Draft message')],
    }));
    hookStateByChildId.set(childB.id, makeHookState({
      filteredContacts: [teacherB],
      activeKey: teacherB.key,
      activeContact: teacherB,
      activeMessages: [makeMessage('3', 'thread-3-teacher', 'Welcome')],
    }));

    const rendered = renderMessagesModule(childA);
    container = rendered.container;
    root = rendered.root;

    const buttons = Array.from(container?.querySelectorAll('button') ?? []);
    const teacherButton = buttons.find((button) => button.textContent?.includes('Ms. Hana'));
    act(() => {
      teacherButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const textarea = container?.querySelector('textarea') as HTMLTextAreaElement | null;
    expect(textarea).not.toBeNull();
    act(() => {
      textarea!.value = 'Typing for child A';
      textarea!.dispatchEvent(new Event('input', { bubbles: true }));
      textarea!.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const fileInput = container?.querySelector('input[type="file"]') as HTMLInputElement | null;
    const file = new File(['hello'], 'attachment.txt', { type: 'text/plain' });
    act(() => {
      Object.defineProperty(fileInput, 'files', {
        configurable: true,
        value: [file],
      });
      fileInput?.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(container?.textContent).toContain('attachment.txt');

    rendered.rerender(childB);

    const panels = container?.querySelectorAll(':scope > div');
    expect(panels?.[0]?.className).toContain('flex');
    expect((container?.querySelector('textarea') as HTMLTextAreaElement | null)?.value).toBe('');
    expect(container?.textContent).not.toContain('attachment.txt');
    expect(container?.querySelector('h3')?.textContent).toBe('Mr. Samuel');
    expect(clearAttachmentMock).toHaveBeenCalled();
    cleanup();
  });
});
