import { useEffect, useMemo, useRef, useState } from 'react';
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
  const persistedIncoming = incoming.filter((message) => !message.id.startsWith('pending_'));
  const normalizedExisting = existing.filter((message) => {
    if (!message.id.startsWith('pending_')) return true;

    return !persistedIncoming.some((incomingMessage) => {
      const senderMismatch =
        Boolean(message.sender_id)
        && Boolean(incomingMessage.sender_id)
        && incomingMessage.sender_id !== message.sender_id;
      if (senderMismatch) {
        return false;
      }

      const sameText = (incomingMessage.text ?? '').trim() === (message.text ?? '').trim();
      const sameAttachment = incomingMessage.attachment === message.attachment;
      const createdDelta = Math.abs(
        new Date(incomingMessage.created_at).getTime() - new Date(message.created_at).getTime()
      );

      return sameText && sameAttachment && createdDelta < 30000;
    });
  });

  const byId = new Map<string, ChatMessage>();

  for (const message of normalizedExisting) {
    byId.set(message.id, message);
  }

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  const sortedMessages = [...byId.values()].sort(
    (left, right) =>
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  );

  return sortedMessages.filter((message, index, list) => {
    if (index === 0) return true;
    const previous = list[index - 1];
    const sameSender = previous.sender === message.sender;
    const sameText = (previous.text ?? '').trim() === (message.text ?? '').trim();
    const sameAttachment = previous.attachment === message.attachment;
    const createdDelta = Math.abs(
      new Date(message.created_at).getTime() - new Date(previous.created_at).getTime()
    );

    return !(sameSender && sameText && sameAttachment && createdDelta < 2000);
  });
}

const LIVE_REFRESH_MS = 2000;

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
  pendingStatusById: Record<string, 'sending' | 'sent'>;
}

export function useMessageThreads(child: Child): UseMessageThreadsReturn {
  const queryClient = useQueryClient();
  const pendingReadThreadRef = useRef<string | null>(null);
  const pendingMessageIdsRef = useRef<Set<string>>(new Set());
  const pendingClearTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    file: null,
    mediaId: null,
    progressLabel: null,
    error: null,
  });
  const [messageMap, setMessageMap] = useState<Record<string, ChatMessage[]>>({});
  const [attachmentMetaById, setAttachmentMetaById] = useState<Record<string, MediaFileResponse>>({});
  const [resolvedDraftKeys, setResolvedDraftKeys] = useState<Record<string, true>>({});
  const [pendingStatusById, setPendingStatusById] = useState<Record<string, 'sending' | 'sent'>>({});

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
    refetchInterval: LIVE_REFRESH_MS,
  });

  const childThreads = useMemo(
    () => chatThreads.filter((thread) => thread.student === child.id),
    [chatThreads, child.id]
  );
  const childThreadIds = useMemo(
    () => childThreads.map((thread) => thread.id),
    [childThreads]
  );

  useEffect(() => {
    return () => {
      pendingClearTimersRef.current.forEach((timer) => clearTimeout(timer));
      pendingClearTimersRef.current.clear();
    };
  }, []);

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

  const refreshThreadMessages = useMemo(
    () => async (threadId: string) => {
      const messages = await listThreadMessages(threadId);
      setMessageMap((current) => ({
        ...current,
        [threadId]: mergeMessages(current[threadId] ?? [], messages),
      }));
    },
    []
  );

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

  const activeThreadId = activeContact?.existingThreadId ?? null;
  const activeMessages = activeThreadId ? messageMap[activeThreadId] ?? [] : [];
  const activeThreadLoaded = activeThreadId ? activeThreadId in messageMap : false;
  const activeDraftResolved = activeContact ? activeContact.key in resolvedDraftKeys : false;
  const unreadTotal = useMemo(
    () => contacts.reduce((sum, contact) => sum + contact.unreadCount, 0),
    [contacts]
  );
  const messagesLoading = Boolean(
    activeContact &&
      ((activeThreadId && !activeThreadLoaded) ||
        (!activeThreadId && !activeDraftResolved))
  );

  useEffect(() => {
    if (!childThreadIds.length) return;
    let cancelled = false;

    const refreshMessages = () =>
      Promise.all(
        childThreadIds.map(async (threadId) => [threadId, await listThreadMessages(threadId)] as const)
      )
        .then((entries) => {
          if (cancelled) return;
          setMessageMap((current) => {
            const next = { ...current };
            for (const [threadId, messages] of entries) {
              next[threadId] = mergeMessages(current[threadId] ?? [], messages);
            }
            return next;
          });
        })
        .catch(() => undefined);

    refreshMessages().catch(() => undefined);
    const intervalId = window.setInterval(() => {
      refreshMessages().catch(() => undefined);
    }, LIVE_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [childThreadIds]);

  useEffect(() => {
    let cancelled = false;

    async function loadActiveConversation() {
      if (!activeContact) return;

      const existingThreadId = activeContact.existingThreadId;
      if (existingThreadId && activeThreadLoaded) return;

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

      if (!existingThreadId) {
        setActiveKey(response.thread.id);
      }
    }

    loadActiveConversation().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [
    activeContact?.key,
    activeContact?.teacherId,
    activeContact?.existingThreadId,
    activeDraftResolved,
    activeThreadLoaded,
    child.id,
    queryClient,
  ]);

  useEffect(() => {
    const currentUserId = userMe?.id ?? null;
    if (!activeThreadId || !currentUserId) {
      pendingReadThreadRef.current = null;
      return;
    }

    const hasUnreadIncoming = activeMessages.some(
      (message) =>
        message.sender !== 'parent' &&
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
              message.sender === 'parent' ||
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

      pendingMessageIdsRef.current.add(message.id);
      setPendingStatusById((current) => {
        const next = { ...current };
        next[message.id] = 'sent';
        return next;
      });
      await refreshThreadMessages(thread.id);

      const clearTimer = setTimeout(() => {
        pendingClearTimersRef.current.delete(message.id);
        setPendingStatusById((current) => {
          const next = { ...current };
          delete next[message.id];
          return next;
        });
      }, 2000);
      pendingClearTimersRef.current.set(message.id, clearTimer);

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

  function clearAttachment() {
    setUploadState({
      status: 'idle',
      file: null,
      mediaId: null,
      progressLabel: null,
      error: null,
    });
  }

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
    websocketState: activeThreadId ? 'connected' : 'idle',
    uploadState,
    searchTerm,
    setSearchTerm,
    setActiveKey,
    sendMessage,
    clearAttachment,
    attachmentMetaById,
    unreadTotal,
    pendingStatusById,
  };
}
