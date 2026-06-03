import { http, HttpResponse } from 'msw';
import { CHILDREN } from '@/lib/mockData';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

function buildThreads() {
  return CHILDREN.flatMap((child) =>
    child.messages.map((message, index) => ({
      id: `thread-${child.id}-${index + 1}`,
      parent: 'parent-1',
      teacher: message.teacherName,
      student: child.id,
      organization: 'org-1',
      branch: child.branchId,
      unread_count: message.unread ? 1 : 0,
      last_read_at: message.unread ? null : '2026-05-30T10:00:00Z',
      latest_message: {
        id: `message-${message.id}`,
        thread: `thread-${child.id}-${index + 1}`,
        sender: 'teacher',
        sender_id: `teacher-${index + 1}`,
        text: message.preview,
        attachment: null,
        read_by_ids: message.unread ? [] : ['parent-1'],
        created_at: '2026-05-30T09:00:00Z',
        updated_at: '2026-05-30T09:00:00Z',
      },
      created_at: '2026-05-30T09:00:00Z',
      updated_at: '2026-05-30T09:00:00Z',
    })),
  );
}

export const messagesHandlers = [
  http.get(`${BASE}/api/chat-threads/`, () => {
    const results = buildThreads();
    return HttpResponse.json({
      count: results.length,
      next: null,
      previous: null,
      results,
    });
  }),

  http.post(`${BASE}/api/chat-threads/:threadId/messages/`, async ({ params, request }) => {
    const body = (await request.json()) as { text?: string; attachment?: string };
    const { threadId } = params as { threadId: string };

    return HttpResponse.json({
      id: `reply-${threadId}`,
      thread: threadId,
      sender: 'parent',
      sender_id: 'parent-1',
      text: body.text ?? '',
      attachment: body.attachment ?? null,
      read_by_ids: ['parent-1'],
      created_at: '2026-05-30T11:00:00Z',
      updated_at: '2026-05-30T11:00:00Z',
    });
  }),
];
