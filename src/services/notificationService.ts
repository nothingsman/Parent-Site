import { apiClient } from '@/lib/apiClient';
import type { NotificationEntry } from '@/types/notification';

type NotificationListParams = {
  read?: boolean;
  page?: number;
  limit?: number;
};

type BackendNotificationData = {
  category?: string;
  is_urgent?: boolean;
  student_id?: string;
  insight_id?: string;
  target_route?: string;
  risk_band?: string;
  status?: string;
};

type BackendNotification = {
  id: string;
  title: string;
  message: string;
  data: BackendNotificationData;
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

type MarkAllReadResponse = {
  updated_count: number;
};

type NotificationCounterResponse = {
  unread_count: number;
};

function normalizeNotificationCategory(
  value: string | undefined
): NotificationEntry['category'] | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === 'grades') return 'grade';
  if (normalized === 'assignments') return 'assignment';
  if (normalized === 'messages') return 'message';
  if (normalized === 'insights') return 'insight';
  return normalized;
}

export function mapNotificationCategory(
  notification: BackendNotification
): NotificationEntry['category'] {
  const explicit = normalizeNotificationCategory(notification.data?.category);
  if (explicit) {
    return explicit;
  }

  if (notification.notifiable.type === 'chat_message') {
    return 'message';
  }
  if (notification.notifiable.type === 'student_insight') {
    return 'insight';
  }
  return 'announcement';
}

export function mapNotificationType(
  notification: BackendNotification
): NotificationEntry['type'] {
  const category = mapNotificationCategory(notification);
  const riskBand = notification.data?.risk_band?.toUpperCase();
  const attendanceStatus = notification.data?.status?.toUpperCase();

  if (notification.data?.is_urgent) {
    return 'urgent';
  }
  if (category === 'grade') {
    return 'success';
  }
  if (category === 'insight' && riskBand === 'MEDIUM') {
    return 'urgent';
  }
  if (category === 'attendance' && attendanceStatus === 'ABSENT') {
    return 'urgent';
  }
  return 'info';
}

export function mapNotificationIcon(notification: BackendNotification): string {
  const category = mapNotificationCategory(notification);
  const attendanceStatus = notification.data?.status?.toUpperCase();

  if (category === 'assignment') return 'ClipboardList';
  if (category === 'grade') return 'Star';
  if (category === 'message') return 'MessageCircle';
  if (category === 'insight') return 'Info';
  if (category === 'attendance') {
    return attendanceStatus === 'LATE' ? 'Clock' : 'CalendarX';
  }
  if (notification.data?.is_urgent) return 'Star';
  return 'Info';
}

export function mapNotificationColor(notification: BackendNotification): string {
  const category = mapNotificationCategory(notification);
  const riskBand = notification.data?.risk_band?.toUpperCase();
  const attendanceStatus = notification.data?.status?.toUpperCase();

  if (notification.data?.is_urgent) return 'red';
  if (category === 'assignment') return 'amber';
  if (category === 'grade') return 'green';
  if (category === 'message') return 'green';
  if (category === 'insight') {
    return riskBand === 'MEDIUM' || riskBand === 'HIGH' ? 'amber' : 'blue';
  }
  if (category === 'attendance') {
    return attendanceStatus === 'LATE' ? 'amber' : 'red';
  }
  return 'blue';
}

function mapNotification(notification: BackendNotification): NotificationEntry {
  return {
    id: notification.id,
    title: notification.title,
    type: mapNotificationType(notification),
    category: mapNotificationCategory(notification),
    time: notification.created_at,
    read: Boolean(notification.read_at),
    detail: notification.message,
    icon: mapNotificationIcon(notification),
    color: mapNotificationColor(notification),
    insightId: notification.data?.insight_id,
    studentId: notification.data?.student_id,
    targetRoute: notification.data?.target_route,
    riskBand: notification.data?.risk_band,
  };
}

export async function getNotifications(
  childId: string,
  params?: NotificationListParams
): Promise<NotificationEntry[]> {
  const queryParams: Record<string, string | number | boolean> = {};
  if (typeof params?.read === 'boolean') {
    queryParams.read = params.read;
  }
  if (typeof params?.page === 'number') {
    queryParams.page = params.page;
  }
  if (typeof params?.limit === 'number') {
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
    (notification) =>
      !notification.studentId || notification.studentId === childId
  );
}

export async function markNotificationRead(
  id: string
): Promise<NotificationEntry> {
  const res = await apiClient.post<BackendNotification>(
    `/api/notifications/${id}/mark-as-read/`
  );
  return mapNotification(res.data);
}

export async function markAllNotificationsRead(): Promise<{
  updatedCount: number;
}> {
  const res = await apiClient.post<MarkAllReadResponse>(
    '/api/notifications/mark-all-read/'
  );
  return { updatedCount: res.data.updated_count };
}

export async function getNotificationCounter(): Promise<{
  unread_count: number;
}> {
  const res = await apiClient.get<NotificationCounterResponse>(
    '/api/notifications/counter/'
  );
  return res.data;
}
