import React from 'react';
import { AlertTriangle, CheckCircle2, MessageSquareText, ShieldAlert } from 'lucide-react';

import { Card, SectionLabel } from '@/components/ui';
import { useBehaviourLog } from '@/hooks';
import type { Child } from '@/types/child';
import type { BehaviourLogEntry } from '@/types/behaviour';

export interface BehaviourModuleProps {
  child: Child;
  previewCount?: number;
  compact?: boolean;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function getSeverityBadge(entry: BehaviourLogEntry) {
  if (entry.type === 'remark') {
    return { label: 'Remark', className: 'bg-sky-50 text-sky-700 border-sky-100' };
  }
  if (entry.severity === 'good') {
    return { label: 'Good', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  }
  if (entry.severity === 'serious') {
    return { label: 'Serious', className: 'bg-rose-50 text-rose-700 border-rose-100' };
  }
  return { label: 'Warning', className: 'bg-amber-50 text-amber-700 border-amber-100' };
}

function getEntryIcon(entry: BehaviourLogEntry) {
  if (entry.type === 'remark') return MessageSquareText;
  if (entry.severity === 'good') return CheckCircle2;
  if (entry.severity === 'serious') return ShieldAlert;
  return AlertTriangle;
}

export const BehaviourModule = ({
  child,
  previewCount,
  compact = false,
}: BehaviourModuleProps) => {
  const {
    data: behaviourLog = [],
    isLoading,
    isError,
    error,
  } = useBehaviourLog(child.id);

  const items = typeof previewCount === 'number'
    ? behaviourLog.slice(0, previewCount)
    : behaviourLog;

  return (
    <Card className={compact ? 'shadow-none' : ''}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <SectionLabel>Behaviour Log</SectionLabel>
          <p className="-mt-1 text-[11px] text-slate-400">
            Conduct incidents and teacher remarks for {child.name}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium text-slate-500">
          Loading behavioural updates...
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error?.message ?? 'Failed to load behavioural log.'}
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium text-slate-500">
          No behavioural entries available for this student.
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="space-y-3">
          {items.map((entry) => {
            const badge = getSeverityBadge(entry);
            const Icon = getEntryIcon(entry);

            return (
              <div
                key={entry.id}
                className="rounded-2xl border border-slate-100 bg-white px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-slate-50 p-2 text-slate-600">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {entry.title}
                      </h4>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{entry.detail}</p>
                    <p className="mt-2 text-[11px] font-medium text-slate-400">
                      {entry.teacherName}
                      {entry.subject ? ` • ${entry.subject}` : ''}
                      {` • ${formatDate(entry.recordedAt)}`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
