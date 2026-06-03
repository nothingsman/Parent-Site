import { apiClient } from '@/lib/apiClient';
import type { NotificationEntry } from '@/types/notification';

type NotificationListParams = {
  read?: boolean;
  page?: number;
  limit?: number;
};

type BackendNotification = {
  id: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
  notifiable: {
    type: string;
    id: string;
  };
};

type BackendNotificationPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendNotification[];
};

type NotificationCounterResponse = {
  unread_count: number;
};

function mapNotificationCategory(notification: BackendNotification): NotificationEntry['category'] {
  const category = notification.data?.category;
  if (typeof category === 'string' && category.length > 0) {
    return category;
  }
  if (notification.notifiable.type === 'chat_message') {
    return 'message';
  }
  if (notification.notifiable.type === 'student_insight') {
    return 'insight';
  }
  return 'announcement';
}

function mapNotificationType(notification: BackendNotification): NotificationEntry['type'] {
  const category = mapNotificationCategory(notification);
  if (notification.data?.is_urgent === true) {
    return 'urgent';
  }
  if (category === 'grade') {
    return 'success';
  }
  if (category === 'insight') {
    return notification.data?.risk_band === 'MEDIUM' ? 'urgent' : 'info';
  }
  if (category === 'attendance') {
    return notification.data?.status === 'ABSENT' ? 'urgent' : 'info';
  }
  return 'info';
}

function mapNotificationIcon(notification: BackendNotification): string {
  const category = mapNotificationCategory(notification);
  if (category === 'message') {
    return 'MessageCircle';
  }
  if (notification.data?.is_urgent === true) {
    return 'Star';
  }
  if (category === 'assignment') {
    return 'ClipboardList';
  }
  if (category === 'grade') {
    return 'Star';
  }
  if (category === 'insight') {
    return 'Info';
  }
  if (category === 'attendance') {
    return notification.data?.status === 'LATE' ? 'Clock' : 'CalendarX';
  }
  return 'Info';
}

function mapNotificationColor(notification: BackendNotification): string {
  const category = mapNotificationCategory(notification);
  if (notification.data?.is_urgent === true) {
    return 'red';
  }
  if (category === 'message') {
    return 'green';
  }
  if (category === 'assignment') {
    return 'amber';
  }
  if (category === 'grade') {
    return 'green';
  }
  if (category === 'insight') {
    return notification.data?.risk_band === 'MEDIUM' ? 'amber' : 'blue';
  }
  if (category === 'attendance') {
    return notification.data?.status === 'LATE' ? 'amber' : 'red';
  }
  return 'blue';
}

function mapNotification(notification: BackendNotification): NotificationEntry {
  const mapped: NotificationEntry = {
    id: notification.id,
    title: notification.title,
    type: mapNotificationType(notification),
    category: mapNotificationCategory(notification),
    time: notification.created_at,
    read: Boolean(notification.read_at),
    detail: notification.message,
    icon: mapNotificationIcon(notification),
    color: mapNotificationColor(notification),
  };
  if (typeof notification.data?.insight_id === 'string') {
    mapped.insightId = notification.data.insight_id;
  }
  if (typeof notification.data?.student_id === 'string') {
    mapped.studentId = notification.data.student_id;
  }
  if (typeof notification.data?.target_route === 'string') {
    mapped.targetRoute = notification.data.target_route;
  }
  if (typeof notification.data?.risk_band === 'string') {
    mapped.riskBand = notification.data.risk_band;
  }
  return mapped;
}

export async function getNotifications(
  childId: string,
  params?: NotificationListParams,
): Promise<NotificationEntry[]> {
  const queryParams: Record<string, string | number> = {};
  if (params?.read === true) {
    queryParams.type = 'read';
  } else if (params?.read === false) {
    queryParams.type = 'unread';
  }
  if (params?.page) {
    queryParams.page = params.page;
  }
  if (params?.limit) {
    queryParams.limit = params.limit;
  }

  const res = await apiClient.get<BackendNotificationPage>('/api/notifications/', {
    params: queryParams,
  });
  const notifications = res.data.results.map(mapNotification);
  if (!childId) {
    return notifications;
  }
  return notifications.filter(
    (notification) => !notification.studentId || notification.studentId === childId,
  );
}

export async function markNotificationRead(id: string): Promise<NotificationEntry> {
  const res = await apiClient.post<BackendNotification>(`/api/notifications/${id}/mark-as-read/`);
  return mapNotification(res.data);
}

export async function markAllNotificationsRead(): Promise<{ updatedCount: number }> {
  const res = await apiClient.post<{ updated_count: number }>('/api/notifications/mark-all-read/');
  return { updatedCount: res.data.updated_count };
}

export async function getNotificationCounter(): Promise<NotificationCounterResponse> {
  const res = await apiClient.get<NotificationCounterResponse>('/api/notifications/counter/');
  return res.data;
}
