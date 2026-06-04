import React, { useMemo, useState } from 'react';

import { Card } from '@/components/ui';
import { useAnnouncements } from '@/hooks';
import { useTranslation } from '@/lib/i18n';
import type { AnnouncementEntry, AnnouncementStatusFilter, Child } from '@/types';

export interface AnnouncementsModuleProps {
  child: Child;
}

function formatAnnouncementDate(
  announcement: AnnouncementEntry,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(announcement.effectiveDate));

  if (announcement.status === 'SCHEDULED' && announcement.scheduledAt) {
    return t('announcements.scheduledFor', { date: formatted });
  }

  return formatted;
}

function matchesStatusFilter(
  announcement: AnnouncementEntry,
  filter: AnnouncementStatusFilter
): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'URGENT') return announcement.isUrgent;
  return announcement.status === filter;
}

export const AnnouncementsModule = ({ child }: AnnouncementsModuleProps) => {
  const { t } = useTranslation();
  const { data: announcements = [], isLoading, isError, error } = useAnnouncements(child);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AnnouncementStatusFilter>('ALL');

  const filteredAnnouncements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return announcements.filter((announcement) => {
      if (!matchesStatusFilter(announcement, filter)) return false;
      if (!normalizedQuery) return true;
      return (
        announcement.subject.toLowerCase().includes(normalizedQuery) ||
        announcement.message.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [announcements, filter, query]);

  const filters: Array<{ id: AnnouncementStatusFilter; label: string }> = [
    { id: 'ALL', label: t('announcements.filters.all') },
    { id: 'URGENT', label: t('announcements.filters.urgent') },
    { id: 'SENT', label: t('announcements.filters.sent') },
    { id: 'SCHEDULED', label: t('announcements.filters.scheduled') },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('announcements.title')}</h2>
            <p className="text-sm text-slate-500">{t('announcements.subtitle')}</p>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('announcements.searchPlaceholder')}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#3949ab]"
          />
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {filters.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  filter === option.id
                    ? 'bg-[#3949ab] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading && (
        <Card className="p-5 text-sm font-medium text-slate-500">
          {t('announcements.loading')}
        </Card>
      )}
      {isError && (
        <Card className="p-5 text-sm font-medium text-red-600">
          {error?.message ?? t('announcements.error')}
        </Card>
      )}
      {!isLoading && !isError && filteredAnnouncements.length === 0 && (
        <Card className="p-5 text-sm font-medium text-slate-500">
          {t('announcements.empty')}
        </Card>
      )}

      <div className="space-y-3">
        {filteredAnnouncements.map((announcement) => (
          <Card key={announcement.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {announcement.subject}
                  </h3>
                  {announcement.isUrgent && (
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-rose-600">
                      {t('announcements.urgent')}
                    </span>
                  )}
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                    {announcement.status}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{announcement.message}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#3949ab]">
                {formatAnnouncementDate(announcement, t)}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
