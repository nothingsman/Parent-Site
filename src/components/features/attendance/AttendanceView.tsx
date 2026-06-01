import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react';

import { Student } from '@/types';
import type { AttendanceRecordEntry, AttendanceResponse } from '@/types/api';
import { useLogAbsence } from '@/hooks';
import { LogAbsenceModal } from './LogAbsenceModal';

export interface AttendanceViewProps {
  student: Student;
  attendance?: AttendanceResponse;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

interface CalendarDay {
  key: string;
  date: Date | null;
  type: string;
  record: AttendanceRecordEntry | null;
}

const EMPTY_RECORDS: AttendanceRecordEntry[] = [];

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameMonth(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

function getInitialMonth(records: AttendanceRecordEntry[]): Date {
  if (records.length === 0) {
    return startOfMonth(new Date());
  }
  const latest = [...records].sort((a, b) => b.date.localeCompare(a.date))[0];
  return startOfMonth(new Date(`${latest.date}T00:00:00`));
}

function buildCalendarDays(
  month: Date,
  records: AttendanceRecordEntry[],
): CalendarDay[] {
  const firstDay = startOfMonth(month);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth() + 1,
    0,
  ).getDate();
  const recordMap = new Map(records.map((record) => [record.date, record] as const));
  const days: CalendarDay[] = [];

  for (let index = 0; index < offset; index += 1) {
    days.push({
      key: `empty-${index}`,
      date: null,
      type: 'empty',
      record: null,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const currentDate = new Date(firstDay.getFullYear(), firstDay.getMonth(), day);
    const isoDate = formatIsoDate(currentDate);
    const record = recordMap.get(isoDate) ?? null;
    const weekday = currentDate.getDay();

    days.push({
      key: isoDate,
      date: currentDate,
      type: record?.status ?? (weekday === 0 || weekday === 6 ? 'no-school' : 'empty'),
      record,
    });
  }

  return days;
}

function getDayStatusLabel(record: AttendanceRecordEntry | null, type: string): string {
  if (!record) {
    if (type === 'no-school') {
      return 'No school scheduled.';
    }
    return 'No attendance record for this day.';
  }
  if (record.reason?.parent_confirmed) {
    return `${record.statusDisplay} — Parent reason confirmed.`;
  }
  if (record.needsReason) {
    return `${record.statusDisplay} — Parent confirmation required.`;
  }
  return `${record.statusDisplay} — Attendance recorded successfully.`;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  student,
  attendance,
  isLoading,
  isError,
  errorMessage,
}) => {
  const [activePolicyTab, setActivePolicyTab] = useState<'ytd' | 'term2'>('ytd');
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    getInitialMonth(attendance?.records ?? []),
  );
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [showLogAbsenceModal, setShowLogAbsenceModal] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string } | null>(null);

  const records = attendance?.records ?? EMPTY_RECORDS;
  const initialMonth = useMemo(() => getInitialMonth(records), [records]);
  const summary = attendance?.summary;
  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedDayKey) ?? null,
    [records, selectedDayKey],
  );
  const logAbsenceMutation = useLogAbsence(
    student.id ?? '',
    selectedRecord?.id ?? null,
    selectedRecord?.reason?.id ?? null,
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonth, records),
    [calendarMonth, records],
  );

  const currentTermAttendance = summary?.termAttendance ?? 0;
  const currentDaysPresent = summary?.daysPresent ?? 0;
  const currentTotalDays = summary?.totalDays ?? 0;
  const currentAbsences = summary?.absences ?? 0;
  const currentLates = summary?.lates ?? 0;
  const currentExcused = summary?.excused ?? 0;
  const pendingReasons = summary?.pendingReasons ?? 0;
  const policyStanding = summary?.policyStanding ?? 'On Track';

  const absenceLimit = activePolicyTab === 'ytd' ? 5 : 3;
  const totalThreshold = activePolicyTab === 'ytd' ? 10 : 6;
  const unexcusedAbsences = Math.min(summary?.unexcusedAbsences ?? 0, absenceLimit);
  const totalAbsenceUsage = Math.min(currentAbsences, totalThreshold);

  const name = student.name || 'Student';

  React.useEffect(() => {
    setCalendarMonth((currentMonth) => (
      isSameMonth(currentMonth, initialMonth) ? currentMonth : initialMonth
    ));
  }, [initialMonth]);

  if (isLoading) {
    return (
      <div className="attendance-module-container">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-500">
          Loading attendance...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="attendance-module-container">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
          {errorMessage ?? 'Failed to load attendance.'}
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-module-container">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            if (selectedRecord?.needsReason) {
              setShowLogAbsenceModal(true);
            }
          }}
          disabled={!selectedRecord?.needsReason}
          className="px-4 py-2 bg-[#3949AB] hover:bg-blue-900 disabled:bg-slate-200 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/10 cursor-pointer border-none"
        >
          {selectedRecord?.needsReason ? 'Add or Confirm Selected Reason' : 'Select a Day Requiring Reason'}
        </button>
      </div>

      <div className="attendance-stats-grid">
        <div className="attendance-stat-card blue">
          <div className="attendance-stat-label">Term Attendance</div>
          <div className="attendance-stat-value blue">{currentTermAttendance.toFixed(1)}%</div>
          <div className="attendance-stat-foot">
            {summary ? `${currentDaysPresent + currentExcused} of ${currentTotalDays} days counted` : 'No summary available'}
          </div>
        </div>

        <div className="attendance-stat-card navy">
          <div className="attendance-stat-label">Days Present</div>
          <div className="attendance-stat-value">{currentDaysPresent}</div>
          <div className="attendance-stat-foot">of {currentTotalDays} school days</div>
        </div>

        <div className="attendance-stat-card amber">
          <div className="attendance-stat-label">Absences / Lates</div>
          <div className="attendance-stat-value amber">
            {currentAbsences} <span className="text-slate-400 font-normal text-sm">/</span> {currentLates}
          </div>
          <div className="attendance-stat-foot flex gap-1.5 mt-0.5">
            <span className="attendance-pill attendance-pill-excused px-1.5 py-0.5 text-[10px] rounded-full">
              {currentExcused} Excused
            </span>
            <span className="attendance-pill attendance-pill-pending px-1.5 py-0.5 text-[10px] rounded-full">
              {pendingReasons} Pending
            </span>
          </div>
        </div>

        <div className="attendance-stat-card green">
          <div className="attendance-stat-label">Policy Standing</div>
          <div className="attendance-stat-value green text-lg mt-1 font-bold">{policyStanding}</div>
          <div className="attendance-stat-foot text-emerald-600 font-medium">
            ● {policyStanding === 'On Track' ? 'Active Compliance' : policyStanding === 'Watch' ? 'Monitor Attendance' : 'Needs Follow-up'}
          </div>
        </div>
      </div>

      <div className="attendance-two-col">
        <div className="attendance-card">
          <div className="attendance-card-header">
            <div>
              <div className="attendance-card-title">Policy Analytics</div>
              <div className="attendance-card-subtitle">Derived from live attendance totals</div>
            </div>

            <div className="attendance-tabs">
              <button
                onClick={() => setActivePolicyTab('ytd')}
                className={`attendance-tab-btn ${activePolicyTab === 'ytd' ? 'active' : ''}`}
              >
                YTD
              </button>
              <button
                onClick={() => setActivePolicyTab('term2')}
                className={`attendance-tab-btn ${activePolicyTab === 'term2' ? 'active' : ''}`}
              >
                Term 2
              </button>
            </div>
          </div>

          <div className="attendance-card-body">
            <div className="attendance-progress-item">
              <div className="attendance-progress-header">
                <span className="attendance-progress-label">Unexcused absence limit</span>
                <span className={`attendance-progress-count ${unexcusedAbsences >= absenceLimit ? 'warn' : 'safe'}`}>
                  {unexcusedAbsences} / {absenceLimit} used
                </span>
              </div>
              <div className="attendance-progress-track">
                <div
                  className="attendance-progress-fill orange"
                  style={{ width: `${Math.min((unexcusedAbsences / absenceLimit) * 100, 100)}%` }}
                />
              </div>
              <div className="attendance-progress-note">
                {Math.max(absenceLimit - unexcusedAbsences, 0)} remaining before review threshold
              </div>
            </div>

            <div className="attendance-progress-item mt-4">
              <div className="attendance-progress-header">
                <span className="attendance-progress-label">Total absence threshold</span>
                <span className={`attendance-progress-count ${totalAbsenceUsage >= totalThreshold ? 'warn' : 'safe'}`}>
                  {totalAbsenceUsage} / {totalThreshold} used
                </span>
              </div>
              <div className="attendance-progress-track">
                <div
                  className="attendance-progress-fill blue"
                  style={{ width: `${Math.min((totalAbsenceUsage / totalThreshold) * 100, 100)}%` }}
                />
              </div>
              <div className="attendance-progress-note">
                Attendance standing is currently {policyStanding.toLowerCase()}.
              </div>
            </div>
          </div>
        </div>

        <div className="attendance-card">
          <div className="attendance-card-header">
            <div>
              <div className="attendance-card-title font-bold text-slate-800">YTD Breakdown</div>
              <div className="attendance-card-subtitle font-bold text-slate-400">Summary statistics</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
              <Clock size={12} className="text-slate-400" />
              <span>{records[0] ? `Updated ${DATE_FORMATTER.format(new Date(`${records[0].date}T00:00:00`))}` : 'No records'}</span>
            </div>
          </div>

          <div className="attendance-card-body">
            <div className="attendance-ytd-grid">
              <div className="attendance-ytd-item transition-transform hover:scale-[1.02]">
                <div className="attendance-ytd-item-label">Days Present</div>
                <div className="attendance-ytd-item-value text-slate-800">{currentDaysPresent}</div>
                <div className="attendance-ytd-item-sub green">Active</div>
              </div>

              <div className="attendance-ytd-item transition-transform hover:scale-[1.02]">
                <div className="attendance-ytd-item-label">Days Absent</div>
                <div className="attendance-ytd-item-value text-red-600">{currentAbsences}</div>
                <div className="attendance-ytd-item-sub red">Tracked</div>
              </div>

              <div className="attendance-ytd-item transition-transform hover:scale-[1.02]">
                <div className="attendance-ytd-item-label">Days Late</div>
                <div className="attendance-ytd-item-value text-amber-600">{currentLates}</div>
                <div className="attendance-ytd-item-sub amber">Tardy class</div>
              </div>

              <div className="attendance-ytd-item transition-transform hover:scale-[1.02]">
                <div className="attendance-ytd-item-label">Excused</div>
                <div className="attendance-ytd-item-value text-emerald-600">{currentExcused}</div>
                <div className="attendance-ytd-item-sub green">Approved</div>
              </div>

              <div className="attendance-ytd-item transition-transform hover:scale-[1.02]">
                <div className="attendance-ytd-item-label">Pending Reasons</div>
                <div className="attendance-ytd-item-value text-rose-500">{pendingReasons}</div>
                <div className="attendance-ytd-item-sub red">Needs note</div>
              </div>

              <div className="attendance-ytd-item transition-transform hover:scale-[1.02]">
                <div className="attendance-ytd-item-label">Unexcused</div>
                <div className="attendance-ytd-item-value text-slate-800">{summary?.unexcusedAbsences ?? 0}</div>
                <div className="attendance-ytd-item-sub muted">Derived</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="attendance-card attendance-cal-card">
        <div className="attendance-cal-nav">
          <div>
            <div className="attendance-card-title">Calendar — {MONTH_FORMATTER.format(calendarMonth)}</div>
            <div className="attendance-card-subtitle">Programmatic view</div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCalendarMonth((current) => addMonths(current, -1))}
              className="attendance-cal-nav-btn border-none"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setCalendarMonth((current) => addMonths(current, 1))}
              className="attendance-cal-nav-btn border-none"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="attendance-cal-grid">
          <div className="attendance-cal-weekdays">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((weekday, index) => (
              <div key={`${weekday}-${index}`} className="attendance-cal-wday">{weekday}</div>
            ))}
          </div>

          <div className="attendance-cal-days">
            {calendarDays.map((day) => {
              const isSelected = selectedDayKey === day.record?.id;
              return (
                <div
                  key={day.key}
                  onClick={() => {
                    if (day.record) {
                      setSelectedDayKey(isSelected ? null : day.record.id);
                    }
                  }}
                  className={`attendance-cal-day ${day.type} ${day.record ? 'cursor-pointer hover:shadow-xs transition-transform' : ''} ${
                    isSelected ? 'ring-2 ring-blue-900 border-none' : ''
                  }`}
                >
                  <span className="attendance-cal-day-num">{day.date?.getDate() ?? ''}</span>
                  {day.record && (
                    <div className="attendance-status-dot" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {(selectedRecord || selectedDayKey === 'no-record') && selectedRecord && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4 mb-4 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-800">
                    {DATE_FORMATTER.format(new Date(`${selectedRecord.date}T00:00:00`))}
                  </p>
                  <p className="mt-0.5">{getDayStatusLabel(selectedRecord, selectedRecord.status)}</p>
                  {selectedRecord.remarks && (
                    <p className="mt-2 text-slate-500">Remarks: {selectedRecord.remarks}</p>
                  )}
                  {selectedRecord.reason && (
                    <p className="mt-1 text-slate-500">
                      Reason: {selectedRecord.reason.reason_category_display ?? selectedRecord.reason.reason_category}
                      {selectedRecord.reason.parent_confirmed ? ' (confirmed)' : ' (pending)'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDayKey(null)}
                  className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer font-bold text-sm ml-2.5"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="attendance-cal-legend">
          <div className="attendance-legend-item">
            <div className="attendance-legend-swatch present" />
            <span>Present</span>
          </div>
          <div className="attendance-legend-item">
            <div className="attendance-legend-swatch absent" />
            <span>Absent</span>
          </div>
          <div className="attendance-legend-item">
            <div className="attendance-legend-swatch late" />
            <span>Late</span>
          </div>
          <div className="attendance-legend-item">
            <div className="attendance-legend-swatch excused" />
            <span>Excused</span>
          </div>
          <div className="attendance-legend-item">
            <div className="attendance-legend-swatch no-school border border-slate-200" />
            <span>No record / weekend</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showLogAbsenceModal && selectedRecord?.needsReason && (
          <LogAbsenceModal
            studentName={name}
            attendanceDate={DATE_FORMATTER.format(new Date(`${selectedRecord.date}T00:00:00`))}
            statusLabel={selectedRecord.statusDisplay}
            initialReason={selectedRecord.reason?.reason_category}
            initialNote={selectedRecord.reason?.note}
            onClose={() => setShowLogAbsenceModal(false)}
            onSubmit={(data) => {
              setShowLogAbsenceModal(false);
              setToast({ show: true, message: `Attendance reason updated for ${DATE_FORMATTER.format(new Date(`${selectedRecord.date}T00:00:00`))}` });
              setTimeout(() => {
                setToast(null);
              }, 4000);
              logAbsenceMutation.mutate({
                date: selectedRecord.date,
                reason: data.reason,
                note: data.note,
              });
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 pointer-events-none"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Check size={14} strokeWidth={2.5} />
            </div>
            <div className="text-xs">
              <p className="font-bold text-white">Action Completed</p>
              <p className="text-[10px] text-slate-400">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceView;
