import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getParentMe, getUserMe } from '@/services/parentService';
import { getSectionTeacherAssignments } from '@/services/teacherService';
import {
  createChatThread,
  listChatThreads,
  listThreadMessages,
  markThreadRead,
  resolveChatThread,
  sendChatMessage,
} from '@/services/messageService';
import { getMediaFile, uploadFileToMedia } from '@/services/mediaService';
import { ensureAccessToken } from '@/services/authService';
import { queryKeys } from '@/lib/queryKeys';
import type { MediaFileResponse } from '@/types/api';
import type { Child } from '@/types';
import type {
  ChatMessage,
  ChatThread,
  DraftChatContact,
  UploadState,
} from '@/types/message';

const avatarColors = ['bg-[#3949AB]', 'bg-[#128267]', 'bg-[#c85a23]', 'bg-[#0f766e]'];

function toInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function buildWebsocketUrl(threadId: string, token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL as string;
  const url = new URL(baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `/ws/chat/threads/${threadId}/`;
  url.search = `token=${encodeURIComponent(token)}`;
  return url.toString();
}

function formatError(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

function normalizeAttachmentError(message: string): string {
  if (message.includes('not finished uploading')) {
    return 'Attachment is still uploading. Please wait and try again.';
  }
  if (message.includes('does not belong to the current user')) {
    return 'That attachment is not owned by your account.';
  }
  if (message.includes('Invalid') || message.includes('invalid')) {
    return 'Attachment reference is invalid or expired.';
  }
  return message;
}

function mergeMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[]
): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();

  for (const message of existing) {
    byId.set(message.id, message);
  }

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return [...byId.values()].sort(
    (left, right) =>
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  );
}

export interface MessageContact extends DraftChatContact {
  unreadCount: number;
  updatedAt: string | null;
  latestPreview: string;
  latestMessageAt: string | null;
}

export interface UseMessageThreadsReturn {
  contacts: MessageContact[];
  filteredContacts: MessageContact[];
  activeKey: string | null;
  activeContact: MessageContact | null;
  activeThreadId: string | null;
  activeMessages: ChatMessage[];
  currentUserId: string | null;
  messagesLoading: boolean;
  threadsLoading: boolean;
  isSending: boolean;
  sendError: string | null;
  websocketState: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  uploadState: UploadState;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  setActiveKey: (key: string) => void;
  sendMessage: (params: { text: string; file?: File | null }) => Promise<boolean>;
  clearAttachment: () => void;
  attachmentMetaById: Record<string, MediaFileResponse>;
  unreadTotal: number;
}

export interface UseMessageThreadsOptions {
  externalThreadId?: string | null;
}

export function useMessageThreads(
  child: Child,
  options: UseMessageThreadsOptions = {}
): UseMessageThreadsReturn {
  const { externalThreadId = null } = options;
  const queryClient = useQueryClient();
  const reconnectTimerRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const pendingReadThreadRef = useRef<string | null>(null);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [websocketState, setWebsocketState] = useState<
    'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  >('idle');
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    file: null,
    mediaId: null,
    progressLabel: null,
    error: null,
  });
  const [messageMap, setMessageMap] = useState<Record<string, ChatMessage[]>>({});
  const [hydratedThreadUpdatedAt, setHydratedThreadUpdatedAt] = useState<Record<string, string>>({});
  const [attachmentMetaById, setAttachmentMetaById] = useState<Record<string, MediaFileResponse>>({});
  const [resolvedDraftKeys, setResolvedDraftKeys] = useState<Record<string, true>>({});

  const { data: parentMe } = useQuery({
    queryKey: queryKeys.parentMe(),
    queryFn: getParentMe,
  });

  const { data: userMe } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: getUserMe,
  });

  const { data: teacherAssignments = [] } = useQuery({
    queryKey: ['teacher-assignments', 'section', child.sectionId],
    queryFn: () => getSectionTeacherAssignments(child.sectionId as string),
    enabled: Boolean(child.sectionId),
  });

  const {
    data: chatThreads = [],
    isLoading: threadsLoading,
  } = useQuery({
    queryKey: queryKeys.chatThreads(),
    queryFn: listChatThreads,
  });

  const childThreads = useMemo(
    () => chatThreads.filter((thread) => thread.student === child.id),
    [chatThreads, child.id]
  );

  useEffect(() => {
    currentUserIdRef.current = userMe?.id ?? null;
  }, [userMe?.id]);

  const contacts = useMemo<MessageContact[]>(() => {
    const threadByTeacherId = new Map(childThreads.map((thread) => [thread.teacher, thread]));
    const baseContacts = teacherAssignments.map((assignment, index) => {
      const thread = threadByTeacherId.get(assignment.teacher_id) ?? null;
      const messages = thread ? messageMap[thread.id] : undefined;
      const latest = messages?.[messages.length - 1] ?? thread?.latest_message ?? null;

      return {
        key: thread?.id ?? `draft:${assignment.teacher_id}:${child.id}`,
        teacherId: assignment.teacher_id,
        teacherName: assignment.teacher_name,
        teacherInitials: toInitials(assignment.teacher_name),
        subjectName: assignment.subject_name,
        gradeLabel: assignment.section_name || assignment.grade_name,
        studentName: child.name.toUpperCase(),
        avatarBg: avatarColors[index % avatarColors.length],
        existingThreadId: thread?.id ?? null,
        unreadCount: thread?.unread_count ?? 0,
        updatedAt: thread?.updated_at ?? latest?.created_at ?? null,
        latestPreview:
          latest?.text?.trim() ||
          (latest?.attachment ? 'Attachment shared' : 'No messages yet'),
        latestMessageAt: latest?.created_at ?? null,
      };
    });

    const orphanThreads = childThreads
      .filter((thread) => !teacherAssignments.some((assignment) => assignment.teacher_id === thread.teacher))
      .map((thread, index) => {
        const messages = messageMap[thread.id];
        const latest = messages?.[messages.length - 1] ?? thread.latest_message ?? null;
        return {
          key: thread.id,
          teacherId: thread.teacher,
          teacherName: 'Teacher',
          teacherInitials: 'TE',
          subjectName: 'Conversation',
          gradeLabel: child.section,
          studentName: child.name.toUpperCase(),
          avatarBg: avatarColors[index % avatarColors.length],
          existingThreadId: thread.id,
          unreadCount: thread.unread_count,
          updatedAt: thread.updated_at,
          latestPreview:
            latest?.text?.trim() ||
            (latest?.attachment ? 'Attachment shared' : 'No messages yet'),
          latestMessageAt: latest?.created_at ?? null,
        };
      });

    return [...baseContacts, ...orphanThreads].sort((left, right) => {
      const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
      const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
      return rightTime - leftTime;
    });
  }, [child.name, child.section, child.id, childThreads, teacherAssignments, messageMap]);

  useEffect(() => {
    if (!contacts.length) {
      setActiveKey(null);
      return;
    }
    setActiveKey((current) => {
      if (current && contacts.some((contact) => contact.key === current)) {
        return current;
      }
      return contacts[0].key;
    });
  }, [contacts]);

  useEffect(() => {
    if (!externalThreadId) return;

    const matchedContact = contacts.find(
      (contact) =>
        contact.key === externalThreadId ||
        contact.existingThreadId === externalThreadId
    );

    if (!matchedContact || matchedContact.key === activeKey) return;
    setActiveKey(matchedContact.key);
  }, [activeKey, contacts, externalThreadId]);

  useEffect(() => {
    const attachmentIds = new Set<string>();
    Object.values(messageMap).forEach((messages) => {
      messages.forEach((message) => {
        if (message.attachment && !attachmentMetaById[message.attachment]) {
          attachmentIds.add(message.attachment);
        }
      });
    });

    if (!attachmentIds.size) return;
    let cancelled = false;

    Promise.all(
      [...attachmentIds].map(async (attachmentId) => [attachmentId, await getMediaFile(attachmentId)] as const)
    )
      .then((entries) => {
        if (cancelled) return;
        setAttachmentMetaById((current) => {
          const next = { ...current };
          for (const [attachmentId, file] of entries) {
            next[attachmentId] = file;
          }
          return next;
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [messageMap, attachmentMetaById]);

  const filteredContacts = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return contacts;
    return contacts.filter((contact) =>
      [contact.teacherName, contact.subjectName, contact.studentName]
        .some((value) => value.toLowerCase().includes(needle))
    );
  }, [contacts, searchTerm]);

  const activeContact = useMemo(
    () => contacts.find((contact) => contact.key === activeKey) ?? contacts[0] ?? null,
    [contacts, activeKey]
  );
  const activeThread = useMemo(
    () => chatThreads.find((thread) => thread.id === activeContact?.existingThreadId) ?? null,
    [activeContact?.existingThreadId, chatThreads]
  );

  const activeThreadId = activeContact?.existingThreadId ?? null;
  const activeMessages = activeThreadId ? messageMap[activeThreadId] ?? [] : [];
  const unreadTotal = useMemo(
    () => contacts.reduce((sum, contact) => sum + contact.unreadCount, 0),
    [contacts]
  );
  const messagesLoading = Boolean(
    activeContact &&
      ((activeThreadId && !(activeThreadId in messageMap)) ||
        (!activeThreadId && !resolvedDraftKeys[activeContact.key]))
  );

  useEffect(() => {
    let cancelled = false;

    async function loadActiveConversation() {
      if (!activeContact) return;

      const existingThreadId = activeContact.existingThreadId;
      if (existingThreadId) {
        const expectedUpdatedAt = activeThread?.updated_at ?? null;
        const hydratedUpdatedAt = hydratedThreadUpdatedAt[existingThreadId] ?? null;
        const needsRefresh =
          !(existingThreadId in messageMap) ||
          (expectedUpdatedAt !== null && hydratedUpdatedAt !== expectedUpdatedAt);

        if (!needsRefresh) return;

        const messages = await listThreadMessages(existingThreadId);
        if (cancelled) return;

        setMessageMap((current) => ({
          ...current,
          [existingThreadId]: mergeMessages(current[existingThreadId] ?? [], messages),
        }));
        setHydratedThreadUpdatedAt((current) => ({
          ...current,
          [existingThreadId]:
            expectedUpdatedAt ??
            messages[messages.length - 1]?.created_at ??
            hydratedUpdatedAt ??
            '',
        }));
        return;
      }

      if (activeContact.key in resolvedDraftKeys) return;

      const response = await resolveChatThread({
        studentId: child.id,
        teacherId: activeContact.teacherId,
      });

      if (cancelled) return;

      if (!response.thread) {
        if (existingThreadId) {
          setMessageMap((current) =>
            existingThreadId in current ? current : { ...current, [existingThreadId]: [] }
          );
        } else {
          setResolvedDraftKeys((current) =>
            activeContact.key in current ? current : { ...current, [activeContact.key]: true }
          );
        }
        return;
      }

      setResolvedDraftKeys((current) => {
        if (!(activeContact.key in current)) return current;
        const next = { ...current };
        delete next[activeContact.key];
        return next;
      });
      queryClient.setQueryData<ChatThread[]>(queryKeys.chatThreads(), (current = []) => {
        const withoutResolved = current.filter((thread) => thread.id !== response.thread!.id);
        return [response.thread!, ...withoutResolved];
      });
      setMessageMap((current) => ({
        ...current,
        [response.thread!.id]: mergeMessages(
          current[response.thread!.id] ?? [],
          response.messages
        ),
      }));
      setHydratedThreadUpdatedAt((current) => ({
        ...current,
        [response.thread!.id]:
          response.thread!.updated_at ||
          response.messages[response.messages.length - 1]?.created_at ||
          '',
      }));

      if (!existingThreadId) {
        setActiveKey(response.thread.id);
      }
    }

    loadActiveConversation().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [activeContact, activeThread?.updated_at, child.id, hydratedThreadUpdatedAt, messageMap, queryClient, resolvedDraftKeys]);

  useEffect(() => {
    const currentUserId = userMe?.id ?? null;
    if (!activeThreadId || !currentUserId) {
      pendingReadThreadRef.current = null;
      return;
    }

    const hasUnreadIncoming = activeMessages.some(
      (message) =>
        message.sender_id !== currentUserId &&
        !message.read_by_ids.includes(currentUserId)
    );
    if (!hasUnreadIncoming || pendingReadThreadRef.current === activeThreadId) return;

    pendingReadThreadRef.current = activeThreadId;
    markThreadRead(activeThreadId)
      .then(() => {
        setMessageMap((current) => ({
          ...current,
          [activeThreadId]: (current[activeThreadId] ?? []).map((message) => {
            if (
              message.sender_id === currentUserId ||
              message.read_by_ids.includes(currentUserId)
            ) {
              return message;
            }
            return {
              ...message,
              read_by_ids: [...message.read_by_ids, currentUserId],
            };
          }),
        }));
        queryClient.setQueryData<ChatThread[]>(
          queryKeys.chatThreads(),
          (current = []) =>
            current.map((thread) =>
              thread.id === activeThreadId
                ? {
                    ...thread,
                    unread_count: 0,
                    last_read_at: new Date().toISOString(),
                  }
                : thread
            )
        );
      })
      .catch(() => undefined)
      .finally(() => {
        pendingReadThreadRef.current = null;
      });
  }, [activeMessages, activeThreadId, queryClient, userMe?.id]);

  useEffect(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (!activeThreadId) {
      setWebsocketState((current) => current === 'idle' ? current : 'idle');
      return;
    }

    let reconnectAttempts = 0;
    let disposed = false;
    let shouldForceRefresh = false;

    const connect = async () => {
      if (disposed) return;
      const nextState = reconnectAttempts === 0 ? 'connecting' : 'reconnecting';
      setWebsocketState((current) => current === nextState ? current : nextState);
      const token = await ensureAccessToken(shouldForceRefresh);
      shouldForceRefresh = false;
      if (disposed) return;
      if (!token) {
        setWebsocketState((current) => current === 'disconnected' ? current : 'disconnected');
        return;
      }

      const socket = new WebSocket(buildWebsocketUrl(activeThreadId, token));
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempts = 0;
        setWebsocketState((current) => current === 'connected' ? current : 'connected');
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as
            | { event: 'message.created'; thread_id: string; message: ChatMessage }
            | { event: 'message.read'; thread_id: string; reader_id: string; count: number };

          if (payload.event === 'message.created') {
            setMessageMap((current) => {
              const existing = current[payload.thread_id] ?? [];
              const nextMessages = mergeMessages(existing, [payload.message]);
              if (nextMessages.length === existing.length) return current;
              return {
                ...current,
                [payload.thread_id]: nextMessages,
              };
            });
            setHydratedThreadUpdatedAt((current) => ({
              ...current,
              [payload.thread_id]: payload.message.created_at,
            }));
            queryClient.setQueryData<ChatThread[]>(
              queryKeys.chatThreads(),
              (current = []) =>
                current.map((thread) => {
                  if (thread.id !== payload.thread_id) return thread;
                  const isOwnMessage = payload.message.sender_id === currentUserIdRef.current;
                  return {
                    ...thread,
                    updated_at: payload.message.created_at,
                    latest_message: payload.message,
                    unread_count:
                      thread.id === activeThreadId || isOwnMessage
                        ? thread.unread_count
                        : thread.unread_count + 1,
                  };
                })
            );
          }

          if (payload.event === 'message.read') {
            setMessageMap((current) => {
              const threadMessages = current[payload.thread_id] ?? [];
              return {
                ...current,
                [payload.thread_id]: threadMessages.map((message) => {
                  if (message.sender_id !== currentUserIdRef.current) {
                    return message;
                  }
                  if (message.read_by_ids.includes(payload.reader_id)) {
                    return message;
                  }
                  return {
                    ...message,
                    read_by_ids: [...message.read_by_ids, payload.reader_id],
                  };
                }),
              };
            });
          }
        } catch {
          // Ignore malformed payloads.
        }
      };

      socket.onclose = (event) => {
        if (disposed) return;
        setWebsocketState((current) => current === 'disconnected' ? current : 'disconnected');
        shouldForceRefresh = event.code === 4403;
        reconnectAttempts += 1;
        const delay = Math.min(1000 * 2 ** (reconnectAttempts - 1), 10000);
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect().catch(() => {
      if (!disposed) {
        setWebsocketState((current) => current === 'disconnected' ? current : 'disconnected');
      }
    });

    return () => {
      disposed = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [activeThreadId, queryClient]);

  async function ensureThread(contact: MessageContact): Promise<ChatThread> {
    if (contact.existingThreadId) {
      const existing = chatThreads.find((thread) => thread.id === contact.existingThreadId);
      if (existing) return existing;
    }

    const thread = await createChatThread({
      parent: parentMe!.id,
      teacher: contact.teacherId,
      student: child.id,
    });

    queryClient.setQueryData<ChatThread[]>(
      queryKeys.chatThreads(),
      (current = []) => {
        const withoutDuplicate = current.filter((item) => item.id !== thread.id);
        return [thread, ...withoutDuplicate];
      }
    );
    setActiveKey(thread.id);
    return thread;
  }

  async function sendMessage(params: { text: string; file?: File | null }) {
    if (!activeContact || !parentMe) {
      setSendError('Unable to determine the active conversation.');
      return false;
    }

    const trimmedText = params.text.trim();
    if (!trimmedText && !params.file && !uploadState.mediaId) {
      setSendError('Type a message or attach a file.');
      return false;
    }

    setSendError(null);
    setIsSending(true);

    try {
      let attachmentId = uploadState.mediaId;

      if (params.file) {
        setUploadState({
          status: 'uploading',
          file: params.file,
          mediaId: null,
          progressLabel: 'Uploading attachment...',
          error: null,
        });
        attachmentId = await uploadFileToMedia(params.file);
        setUploadState({
          status: 'uploaded',
          file: params.file,
          mediaId: attachmentId,
          progressLabel: 'Attachment uploaded',
          error: null,
        });
      }

      const thread = await ensureThread(activeContact);
      const message = await sendChatMessage(thread.id, {
        text: trimmedText || undefined,
        attachment: attachmentId || undefined,
      });

      setMessageMap((current) => ({
        ...current,
        [thread.id]: mergeMessages(current[thread.id] ?? [], [message]),
      }));
      setHydratedThreadUpdatedAt((current) => ({
        ...current,
        [thread.id]: message.created_at,
      }));

      queryClient.setQueryData<ChatThread[]>(
        queryKeys.chatThreads(),
        (current = []) =>
          current.map((item) =>
            item.id === thread.id
              ? {
                  ...item,
                  updated_at: message.created_at,
                  unread_count: 0,
                  latest_message: message,
                }
              : item
          )
      );

      if (attachmentId) {
        const file = await getMediaFile(attachmentId);
        setAttachmentMetaById((current) => ({ ...current, [attachmentId!]: file }));
      }

      setUploadState({
        status: 'idle',
        file: null,
        mediaId: null,
        progressLabel: null,
        error: null,
      });
      return true;
    } catch (error) {
      const message = normalizeAttachmentError(
        formatError(error, 'Failed to send your message.')
      );
      setSendError(message);
      setUploadState((current) => ({
        ...current,
        status: current.file ? 'error' : current.status,
        error: message,
        progressLabel: null,
      }));
    } finally {
      setIsSending(false);
    }
    return false;
  }

  const clearAttachment = useCallback(() => {
    setUploadState({
      status: 'idle',
      file: null,
      mediaId: null,
      progressLabel: null,
      error: null,
    });
  }, []);

  return {
    contacts,
    filteredContacts,
    activeKey,
    activeContact,
    activeThreadId,
    activeMessages,
    currentUserId: userMe?.id ?? null,
    messagesLoading,
    threadsLoading,
    isSending,
    sendError,
    websocketState,
    uploadState,
    searchTerm,
    setSearchTerm,
    setActiveKey,
    sendMessage,
    clearAttachment,
    attachmentMetaById,
    unreadTotal,
  };
}
