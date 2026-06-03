import { http, HttpResponse } from 'msw';
import { CHILDREN } from '@/lib/mockData';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export const notificationsHandlers = [
  http.get(`${BASE}/api/notifications/`, () => {
    const items = CHILDREN.flatMap((child) =>
      child.notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.detail,
        data: {
          category: notification.category,
          is_urgent: notification.type === 'urgent',
          student_id: child.id,
        },
        read_at: notification.read ? notification.time : null,
        created_at: notification.time,
        notifiable: {
          type: notification.category === 'announcement' ? 'announcement' : 'chat_message',
          id: notification.id,
        },
      })),
    );

    return HttpResponse.json({
      count: items.length,
      next: null,
      previous: null,
      results: items,
    });
  }),

  http.post(`${BASE}/api/notifications/mark-all-read/`, () => {
    const updatedCount = CHILDREN.flatMap((child) => child.notifications).filter(
      (notification) => !notification.read,
    ).length;
    return HttpResponse.json({ updated_count: updatedCount });
  }),

  http.get(`${BASE}/api/notifications/counter/`, () => {
    const unreadCount = CHILDREN.flatMap((child) => child.notifications).filter(
      (notification) => !notification.read,
    ).length;
    return HttpResponse.json({ unread_count: unreadCount });
  }),

  http.post(`${BASE}/api/notifications/:id/mark-as-read/`, ({ params }) => {
    const { id } = params as { id: string };
    const child = CHILDREN.find((entry) =>
      entry.notifications.some((notification) => notification.id === id),
    );
    const notification = child?.notifications.find((entry) => entry.id === id);

    if (!child || !notification) {
      return HttpResponse.json({ detail: 'Not found.' }, { status: 404 });
    }

    return HttpResponse.json({
      id: notification.id,
      title: notification.title,
      message: notification.detail,
      data: {
        category: notification.category,
        is_urgent: notification.type === 'urgent',
        student_id: child.id,
      },
      read_at: new Date().toISOString(),
      created_at: notification.time,
      notifiable: {
        type: notification.category === 'announcement' ? 'announcement' : 'chat_message',
        id: notification.id,
      },
    });
  }),
];
