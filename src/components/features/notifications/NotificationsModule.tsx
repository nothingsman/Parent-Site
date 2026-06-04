import React, { useMemo, useState } from 'react';
import {
  Star,
  ClipboardList,
  MessageCircle,
  Clock,
  CalendarX,
  Info,
  MoreVertical,
  X,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Card } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';
import { queryKeys } from '@/lib/queryKeys';
import { useTranslation } from '@/lib/i18n';
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationService';
import { getStudentInsight } from '@/services/studentInsightService';
import type { StudentInsightDetail } from '@/types/api';
import type { Child } from '@/types';
import type { NotificationEntry } from '@/types/notification';

export interface NotificationsModuleProps {
  child: Child;
}

const tabs = ['all', 'grades', 'assignments', 'messages', 'attendance', 'insights'];

export const NotificationsModule = ({ child }: NotificationsModuleProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [selectedInsight, setSelectedInsight] = useState<StudentInsightDetail | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const { data: notifications = [] } = useNotifications(child.id);

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications(child.id),
      });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications(child.id),
      });
    },
  });

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;

    const categoryMap: Record<string, string> = {
      grades: 'grade',
      assignments: 'assignment',
      messages: 'message',
      attendance: 'attendance',
      insights: 'insight',
    };

    return notifications.filter(
      (notification) => notification.category === categoryMap[filter]
    );
  }, [filter, notifications]);

  const tabLabels: Record<string, string> = {
    all: t('notifications.all'),
    grades: t('nav.grades'),
    assignments: t('nav.assignments'),
    messages: t('nav.messages'),
    attendance: t('nav.attendance'),
    insights: 'Insights',
  };

  const openInsight = async (notification: NotificationEntry) => {
    if (!notification.insightId) return;

    setInsightLoading(true);
    try {
      const detail = await getStudentInsight(notification.insightId);
      setSelectedInsight(detail);
      if (!notification.read) {
        markOneMutation.mutate(notification.id);
      }
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2 mb-2">
        <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-100 w-full overflow-x-auto no-scrollbar whitespace-nowrap sm:w-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                filter === tab
                  ? 'bg-[#3949ab] text-white shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
        <button
          onClick={() => markAllMutation.mutate()}
          className="text-xs font-bold text-blue-600 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors shrink-0 max-w-max self-end sm:self-auto"
        >
          {t('notifications.markAllRead')}
        </button>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {filteredNotifications.map((notification) => {
          const IconComp =
            {
              Star,
              ClipboardList,
              MessageCircle,
              Clock,
              CalendarX,
            }[
              notification.icon as
                | 'Star'
                | 'ClipboardList'
                | 'MessageCircle'
                | 'Clock'
                | 'CalendarX'
            ] || Info;
          const colorClasses = {
            green: 'bg-emerald-50 text-emerald-600',
            blue: 'bg-blue-50 text-blue-600',
            amber: 'bg-amber-50 text-amber-600',
            red: 'bg-red-50 text-red-600',
          }[notification.color as 'green' | 'blue' | 'amber' | 'red'] ?? 'bg-slate-100 text-slate-600';

          return (
            <div key={notification.id}>
              <Card
                onClick={() => {
                  if (notification.category === 'insight' && notification.insightId) {
                    void openInsight(notification);
                    return;
                  }
                  if (!notification.read) {
                    markOneMutation.mutate(notification.id);
                  }
                }}
                className={`flex items-center gap-3 sm:gap-4 transition-all hover:border-slate-200 p-3 sm:p-4 ${
                  !notification.read ? 'border-l-4 !border-l-blue-600' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${colorClasses}`}
                >
                  <IconComp size={16} className="sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-800">
                    {notification.title}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-400">
                    {notification.detail}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-600 shrink-0" />
                )}
                <button
                  type="button"
                  onClick={(event) => event.stopPropagation()}
                  className="p-2 text-slate-300 hover:text-slate-400"
                >
                  <MoreVertical size={16} />
                </button>
              </Card>
            </div>
          );
        })}
      </div>

      {(selectedInsight || insightLoading) && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Automated Guidance
                </p>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedInsight?.title ?? 'Loading insight'}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close insight details"
                onClick={() => setSelectedInsight(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {insightLoading ? (
                <p className="text-sm text-slate-500">Loading automated guidance...</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                      {selectedInsight?.category_display}
                    </span>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                      {selectedInsight?.risk_band_display}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      Why this alert was generated
                    </h4>
                    <p className="text-sm leading-6 text-slate-600">
                      {selectedInsight?.message}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">Recommended actions</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                      {selectedInsight?.recommended_actions.map((action) => (
                        <li key={action} className="rounded-2xl bg-slate-50 px-3 py-2">
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                    This is automated guidance based on recent school records. It is not a final academic judgment. Contact the teacher for full context.
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedInsight(null)}
                      className="rounded-xl bg-[#3949ab] px-4 py-2 text-sm font-bold text-white shadow-sm"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
