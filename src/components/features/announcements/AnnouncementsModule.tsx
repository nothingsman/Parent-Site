import React, { useMemo, useState } from 'react';
import { AlertCircle, CalendarClock, Megaphone, Search } from 'lucide-react';

import { Card, SectionLabel } from '@/components/ui';
import { useAnnouncements } from '@/hooks';
import type { Child } from '@/types/child';
import type { AnnouncementEntry } from '@/types/announcement';

export interface AnnouncementsModuleProps {
  child: Child;
  previewCount?: number;
  compact?: boolean;
}

function formatDate(value: string | null): string {
  if (!value) return 'Unknown date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function deliveryLabel(item: AnnouncementEntry): string {
  if (item.status === 'SCHEDULED' && item.scheduledAt) {
    return `Scheduled for ${formatDate(item.scheduledAt)}`;
  }
  if (item.status === 'SENT') {
    return `Sent ${formatDate(item.effectiveAt)}`;
  }
  return `Updated ${formatDate(item.effectiveAt)}`;
}

function filterAnnouncements(items: AnnouncementEntry[], filter: string, search: string): AnnouncementEntry[] {
  return items.filter((item) => {
    const matchesSearch = [item.subject, item.message]
      .some((value) => value.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'urgent') return item.isUrgent;
    return item.status === filter;
  });
}

export const AnnouncementsModule = ({
  child,
  previewCount,
  compact = false,
}: AnnouncementsModuleProps) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'urgent' | 'SENT' | 'SCHEDULED'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const {
    data: announcements = [],
    isLoading,
    isError,
    error,
  } = useAnnouncements(child);

  const filteredAnnouncements = useMemo(
    () => filterAnnouncements(announcements, statusFilter, searchTerm),
    [announcements, searchTerm, statusFilter],
  );

  const items = typeof previewCount === 'number'
    ? filteredAnnouncements.slice(0, previewCount)
    : filteredAnnouncements;

  return (
    <div className={compact ? '' : 'space-y-4 sm:space-y-6'}>
      {!compact && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Announcements</h1>
            <p className="text-sm text-slate-500">
              Branch announcements relevant to {child.name}
            </p>
          </div>
        </div>
      )}

      <Card className={compact ? 'shadow-none' : ''}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <SectionLabel>{compact ? 'Recent Announcements' : 'Parent Announcements'}</SectionLabel>
            <p className="-mt-1 text-[11px] text-slate-400">
              Sorted by effective date using scheduled, updated, then created timestamps.
            </p>
          </div>
        </div>

        {!compact && (
          <div className="mb-5 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search announcements"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#3949AB]/30 focus:bg-white focus:ring-4 focus:ring-[#3949AB]/5"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'urgent', 'SENT', 'SCHEDULED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest ${
                    statusFilter === filter
                      ? 'bg-[#3949AB] text-white'
                      : 'border border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'urgent' ? 'Urgent' : filter}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium text-slate-500">
            Loading announcements...
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error?.message ?? 'Failed to load announcements.'}
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-6 w-6 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No announcements match the current filters.</p>
          </div>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-slate-200"
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-2 ${item.isUrgent ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-[#3949AB]'}`}>
                    {item.status === 'SCHEDULED' ? <CalendarClock size={16} /> : <Megaphone size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{item.subject}</h4>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        item.isUrgent ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.isUrgent ? 'Urgent' : item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                    <p className="mt-2 text-[11px] font-medium text-slate-400">{deliveryLabel(item)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
