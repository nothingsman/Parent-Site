import React, { useMemo, useState } from 'react';
import { BookOpen, Calendar, X } from 'lucide-react';

import { Badge, Card } from '@/components/ui';
import { useAssignments } from '@/hooks';
import type { Child } from '@/types';
import type { AssignmentEntry } from '@/types/assignment';
import { getGradeBg, getGradeLetter } from '@/lib/utils';

export interface AssignmentsModuleProps {
  child: Child;
  dict?: any;
}

interface AssignmentFilters {
  status: string;
  taskType: string;
  subject: string;
}

const STATUS_TABS = ['All', 'Due', 'Graded'] as const;

export function filterAssignments(
  assignments: AssignmentEntry[],
  filters: string | AssignmentFilters,
): AssignmentEntry[] {
  if (typeof filters === 'string') {
    if (filters === 'All') return assignments;
    return assignments.filter((assignment) =>
      assignment.status.toLowerCase() === filters.toLowerCase(),
    );
  }

  return assignments.filter((assignment) => {
    const statusMatches =
      filters.status === 'All' ||
      assignment.status.toLowerCase() === filters.status.toLowerCase();
    const typeMatches =
      filters.taskType === 'All Types' || assignment.taskTypeDisplay === filters.taskType;
    const subjectMatches =
      filters.subject === 'All Subjects' || assignment.subject === filters.subject;

    return statusMatches && typeMatches && subjectMatches;
  });
}

function formatDueDate(value: string) {
  if (!value) return 'No due date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function getStatusVariant(status: AssignmentEntry['status']) {
  if (status === 'graded') return 'emerald';
  if (status === 'due') return 'blue';
  if (status === 'submitted') return 'amber';
  return 'red';
}

export const AssignmentsModule = ({ child }: AssignmentsModuleProps) => {
  const [status, setStatus] = useState('All');
  const [taskType, setTaskType] = useState('All Types');
  const [subject, setSubject] = useState('All Subjects');
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentEntry | null>(null);
  const { data: assignments = [], isLoading, isError, error } = useAssignments(child);

  const taskTypeOptions = useMemo(
    () => ['All Types', ...Array.from(new Set(assignments.map((item) => item.taskTypeDisplay).filter(Boolean)))],
    [assignments],
  );

  const subjectOptions = useMemo(
    () => ['All Subjects', ...Array.from(new Set(assignments.map((item) => item.subject).filter(Boolean)))],
    [assignments],
  );

  const filteredAssignments = useMemo(
    () => filterAssignments(assignments, { status, taskType, subject }),
    [assignments, status, taskType, subject],
  );

  return (
    <>
      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-3 sm:p-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatus(tab)}
                className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all sm:text-xs ${
                  status === tab
                    ? 'bg-[#3949ab] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Task Type
              </span>
              <select
                value={taskType}
                onChange={(event) => setTaskType(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#3949ab] focus:bg-white"
              >
                {taskTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Subject
              </span>
              <select
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#3949ab] focus:bg-white"
              >
                {subjectOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {isLoading && (
          <div className="rounded-xl border border-slate-100 bg-white p-4 text-sm font-medium text-slate-500">
            Loading tasks...
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error?.message ?? 'Failed to load tasks.'}
          </div>
        )}

        {!isLoading && !isError && filteredAssignments.length === 0 && (
          <div className="rounded-xl border border-slate-100 bg-white p-4 text-sm font-medium text-slate-500">
            No tasks found for the selected filters.
          </div>
        )}

        <div className="space-y-2.5">
          {!isLoading && !isError && filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="animate-fade-in">
              <button
                type="button"
                onClick={() => setSelectedAssignment(assignment)}
                className="w-full cursor-pointer border-none bg-transparent p-0 text-left"
              >
                <Card
                  className="border-l-4 p-3 sm:p-3.5 !rounded-l-none"
                  style={{ borderLeftColor: assignment.subjectColor }}
                >
                  <div className="mb-1.5 flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      <Badge variant="blue">{assignment.subject}</Badge>
                      {assignment.taskTypeDisplay && (
                        <Badge variant="slate">{assignment.taskTypeDisplay}</Badge>
                      )}
                    </div>
                    <Badge variant={getStatusVariant(assignment.status)}>
                      {assignment.status.toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="mb-0.5 text-xs font-bold text-slate-800 sm:text-sm">
                    {assignment.title}
                  </h3>
                  <p className="mb-2.5 line-clamp-2 text-[10px] text-slate-505 sm:text-xs">
                    {assignment.description || 'No description provided.'}
                  </p>
                  <div className="flex flex-col gap-2 border-t border-slate-50 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:pt-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Calendar size={11} className="text-slate-300" />
                      <span>Due: {formatDueDate(assignment.dueDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <BookOpen size={11} className="text-slate-300" />
                      <span>{assignment.section}</span>
                    </div>
                    {assignment.score !== null && assignment.maxScore > 0 && (
                      <div className="flex items-center gap-2 sm:ml-auto sm:gap-3">
                        <div className="hidden h-1 w-16 overflow-hidden rounded-full bg-slate-100 sm:block">
                          <div
                            className="h-full bg-[#3949ab]"
                            style={{
                              width: `${(assignment.score / assignment.maxScore) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="whitespace-nowrap text-[10px] font-mono font-bold text-slate-700 sm:text-xs">
                          {assignment.score} / {assignment.maxScore}{' '}
                          <span
                            className={`ml-1 rounded px-1 py-0 text-[9px] ${getGradeBg((assignment.score / assignment.maxScore) * 100)}`}
                          >
                            {getGradeLetter((assignment.score / assignment.maxScore) * 100)}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedAssignment && (
        <div className="fixed inset-0 z-[220] flex items-end justify-center bg-slate-900/45 backdrop-blur-xs sm:items-center">
          <button
            type="button"
            aria-label="Close task details"
            onClick={() => setSelectedAssignment(null)}
            className="absolute inset-0 cursor-default"
          />
          <div className="relative z-10 max-h-[92vh] w-full overflow-hidden rounded-t-[1.75rem] border border-slate-200/80 bg-slate-50 shadow-2xl sm:max-h-[88vh] sm:max-w-lg sm:rounded-3xl">
            <div className="border-b border-slate-200/70 bg-white px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700">
                    Task Details
                  </span>
                  <h3 className="mt-3 text-base font-black leading-tight text-slate-900 sm:text-lg">
                    {selectedAssignment.title}
                  </h3>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500 sm:text-xs">
                    {selectedAssignment.subject}
                    {selectedAssignment.taskTypeDisplay ? ` • ${selectedAssignment.taskTypeDisplay}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="cursor-pointer rounded-xl border-none bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-center justify-between gap-3">
                <Badge variant={getStatusVariant(selectedAssignment.status)}>
                  {selectedAssignment.status.toUpperCase()}
                </Badge>
                <p className="text-[11px] font-semibold text-slate-400">
                  Due {formatDueDate(selectedAssignment.dueDate)}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/70 bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Subject
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {selectedAssignment.subject}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Section
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {selectedAssignment.section}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Description
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {selectedAssignment.description || 'No description provided.'}
                </p>
              </div>

              {selectedAssignment.score !== null && (
                <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Score
                  </p>
                  <p className="mt-3 text-lg font-bold text-slate-900">
                    {selectedAssignment.score} / {selectedAssignment.maxScore}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-slate-200/70 bg-white px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="cursor-pointer rounded-xl border-none bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
