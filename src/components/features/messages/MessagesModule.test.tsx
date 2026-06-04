import React from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';

import { MessagesModule } from './MessagesModule';
import type { Child } from '@/types';
import type { ChatMessage } from '@/types/message';
import { LanguageProvider } from '@/lib/i18n';

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

function makeMessage(
  id: string,
  senderId: string,
  text: string,
  createdAt = '2026-06-01T08:00:00Z'
): ChatMessage {
  return {
    id,
    thread: 'thread-1',
    sender: senderId,
    sender_id: senderId,
    text,
    attachment: null,
    read_by_ids: [],
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function makeContact(
  key: string,
  teacherName: string,
  subjectName: string,
  gradeLabel: string,
  updatedAt: string
) {
  return {
    key,
    teacherId: `${key}-teacher`,
    teacherName,
    teacherInitials: teacherName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
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

HTMLElement.prototype.scrollIntoView = vi.fn();

function makeHookState(
  overrides: Partial<ReturnType<typeof baseHookState>> = {}
) {
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

function renderMessagesModule(child: Child, externalThreadId?: string | null) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <LanguageProvider>
        <MessagesModule child={child} externalThreadId={externalThreadId} />
      </LanguageProvider>
    );
  });

  return {
    container,
    root,
    rerender(nextChild: Child, nextExternalThreadId?: string | null) {
      act(() => {
        root.render(
          <LanguageProvider>
            <MessagesModule
              child={nextChild}
              externalThreadId={nextExternalThreadId}
            />
          </LanguageProvider>
        );
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

  it('forwards externalThreadId into useMessageThreads', () => {
    const teacher = makeContact(
      'thread-1',
      'Ms. Hana',
      'Mathematics',
      'Grade 7 - A',
      '2026-06-01T08:00:00Z'
    );
    hookStateByChildId.set(
      childA.id,
      makeHookState({
        filteredContacts: [teacher],
        activeKey: teacher.key,
        activeContact: teacher,
      })
    );

    ({ container, root } = renderMessagesModule(childA, 'thread-1'));

    expect(useMessageThreadsMock).toHaveBeenCalledWith(childA, {
      externalThreadId: 'thread-1',
    });
    cleanup();
  });

  it('keeps the selected conversation stable when contacts reorder', () => {
    const teacherA = makeContact('thread-1', 'Ms. Hana', 'Mathematics', 'Grade 7 - A', '2026-06-01T08:00:00Z');
    const teacherB = makeContact('thread-2', 'Mr. Daniel', 'English', 'Grade 7 - A', '2026-06-01T09:00:00Z');
    hookStateByChildId.set(
      childA.id,
      makeHookState({
        filteredContacts: [teacherA, teacherB],
        activeKey: teacherB.key,
        activeContact: teacherB,
        activeMessages: [makeMessage('2', 'thread-2-teacher', 'Latest from Daniel')],
      })
    );

    ({ container, root } = renderMessagesModule(childA));
    expect(container?.querySelector('h3')?.textContent).toBe('Mr. Daniel');

    hookStateByChildId.set(
      childA.id,
      makeHookState({
        filteredContacts: [teacherB, teacherA],
        activeKey: teacherB.key,
        activeContact: teacherB,
        activeMessages: [makeMessage('2', 'thread-2-teacher', 'Latest from Daniel')],
      })
    );

    act(() => {
      root?.render(
        <LanguageProvider>
          <MessagesModule child={childA} />
        </LanguageProvider>
      );
    });

    expect(container?.querySelector('h3')?.textContent).toBe('Mr. Daniel');
    cleanup();
  });

  it('resets local compose and mobile state when the child changes', () => {
    const teacherA = makeContact('thread-1', 'Ms. Hana', 'Mathematics', 'Grade 7 - A', '2026-06-01T08:00:00Z');
    const teacherB = makeContact('thread-3', 'Mr. Samuel', 'Biology', 'Grade 8 - B', '2026-06-01T10:00:00Z');
    hookStateByChildId.set(
      childA.id,
      makeHookState({
        filteredContacts: [teacherA],
        activeKey: teacherA.key,
        activeContact: teacherA,
        activeMessages: [makeMessage('1', 'parent-1', 'Draft message')],
      })
    );
    hookStateByChildId.set(
      childB.id,
      makeHookState({
        filteredContacts: [teacherB],
        activeKey: teacherB.key,
        activeContact: teacherB,
        activeMessages: [makeMessage('3', 'thread-3-teacher', 'Welcome')],
      })
    );

    const rendered = renderMessagesModule(childA);
    container = rendered.container;
    root = rendered.root;

    const teacherButton = Array.from(container?.querySelectorAll('button') ?? []).find(
      (button) => button.textContent?.includes('Ms. Hana')
    );
    act(() => {
      teacherButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const textarea = container?.querySelector('textarea') as HTMLTextAreaElement | null;
    act(() => {
      textarea!.value = 'Typing for child A';
      textarea!.dispatchEvent(new Event('input', { bubbles: true }));
      textarea!.dispatchEvent(new Event('change', { bubbles: true }));
    });

    rendered.rerender(childB);

    expect((container?.querySelector('textarea') as HTMLTextAreaElement | null)?.value).toBe('');
    expect(container?.querySelector('h3')?.textContent).toBe('Mr. Samuel');
    expect(clearAttachmentMock).toHaveBeenCalled();
    cleanup();
  });

  it('renders date separators and clustered incoming teacher messages', () => {
    const teacherA = makeContact('thread-1', 'Ms. Hana', 'Mathematics', 'Grade 7 - A', '2026-06-02T10:00:00Z');
    hookStateByChildId.set(
      childA.id,
      makeHookState({
        filteredContacts: [teacherA],
        activeKey: teacherA.key,
        activeContact: teacherA,
        activeMessages: [
          makeMessage('1', 'teacher-1', 'First teacher message', '2026-06-01T08:00:00Z'),
          makeMessage('2', 'teacher-1', 'Second teacher message', '2026-06-01T08:03:00Z'),
          makeMessage('3', 'parent-1', 'Parent reply', '2026-06-02T09:00:00Z'),
        ],
      })
    );

    ({ container, root } = renderMessagesModule(childA));

    expect(container?.textContent).toContain('Sunday, Jun 1');
    expect(container?.textContent).toContain('Monday, Jun 2');
    expect(container?.textContent).toContain('First teacher message');
    expect(container?.textContent).toContain('Second teacher message');

    const avatarInitials = Array.from(container?.querySelectorAll('div') ?? []).filter(
      (node) => node.textContent === 'MH'
    );
    expect(avatarInitials.length).toBe(1);
    cleanup();
  });
});
