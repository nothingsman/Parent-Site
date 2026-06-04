import { http, HttpResponse } from 'msw';
import { ANNOUNCEMENTS, BEHAVIOUR_LOGS, CHILDREN } from '@/lib/mockData';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

function mapNotifiableType(category: string): string {
  if (category === 'message') return 'chat_message';
  if (category === 'insight') return 'student_insight';
  return 'announcement';
}

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
          insight_id: notification.insightId,
          target_route: notification.targetRoute,
          risk_band: notification.riskBand,
        },
        read_at: notification.read ? notification.time : null,
        created_at: notification.time,
        notifiable: {
          type: mapNotifiableType(notification.category),
          id: notification.insightId ?? notification.id,
        },
      }))
    );

    return HttpResponse.json({
      count: items.length,
      next: null,
      previous: null,
      results: items,
    });
  }),

  http.get(`${BASE}/api/parents/my-students/:id/behaviour-log/`, ({ params }) => {
    const { id } = params as { id: string };
    const group = BEHAVIOUR_LOGS.find((entry) => entry.childId === id);
    if (!group) {
      return HttpResponse.json({ detail: 'Not found.' }, { status: 404 });
    }
    return HttpResponse.json(group.entries);
  }),

  http.post(`${BASE}/api/notifications/mark-all-read/`, () => {
    const updatedCount = CHILDREN.flatMap((child) => child.notifications).filter(
      (notification) => !notification.read
    ).length;
    return HttpResponse.json({ updated_count: updatedCount });
  }),

  http.get(`${BASE}/api/notifications/counter/`, () => {
    const unreadCount = CHILDREN.flatMap((child) => child.notifications).filter(
      (notification) => !notification.read
    ).length;
    return HttpResponse.json({ unread_count: unreadCount });
  }),

  http.post(`${BASE}/api/notifications/:id/mark-as-read/`, ({ params }) => {
    const { id } = params as { id: string };
    const child = CHILDREN.find((entry) =>
      entry.notifications.some((notification) => notification.id === id)
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
        insight_id: notification.insightId,
        target_route: notification.targetRoute,
        risk_band: notification.riskBand,
      },
      read_at: new Date().toISOString(),
      created_at: notification.time,
      notifiable: {
        type: mapNotifiableType(notification.category),
        id: notification.insightId ?? notification.id,
      },
    });
  }),

  http.get(`${BASE}/api/student-insights/:id/`, ({ params }) => {
    const { id } = params as { id: string };

    return HttpResponse.json({
      id,
      student: 'student-1',
      category: 'ACADEMICS',
      category_display: 'Academics',
      risk_band: 'LOW',
      risk_band_display: 'Low',
      title: 'Academic support update',
      message: 'Recent scores suggest extra support may help.',
      confidence_label: 'RULE_BASED',
      recommended_actions: [
        'Review the latest schoolwork together.',
        'Ask which topic felt difficult.',
      ],
      safety_status: 'APPROVED',
      safety_status_display: 'Approved',
      delivery_status: 'DELIVERED',
      created_at: new Date().toISOString(),
      delivered_at: new Date().toISOString(),
    });
  }),

  http.get(`${BASE}/api/announcements/`, () => HttpResponse.json(ANNOUNCEMENTS)),
];
