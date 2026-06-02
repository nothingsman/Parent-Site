import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, X } from 'lucide-react';

import { Card } from '@/components/ui';
import { useAssignments } from '@/hooks';
import { AssignmentEntry, Child } from '@/types';
import { getSubjectInitials, getGradeLetter, getGradeBg } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export interface GradebookModuleProps {
  child: Child;
}

export const GradebookModule = ({ child }: GradebookModuleProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedTask, setSelectedTask] = useState<AssignmentEntry | null>(null);
  const { data: assignments = [], isLoading, isError, error } = useAssignments(child);
  const { t } = useTranslation();

  const tasks = useMemo(() => {
    return assignments.map((assignment) => ({
      ...assignment,
      dueDate: assignment.dueDate || "—",
      type: assignment.taskTypeDisplay || assignment.type || t("gradebook.assignment"),
    }));
  }, [assignments]);

  const subjects = useMemo(() => {
    return ["All", ...Array.from(new Set(tasks.map((t) => t.subject)))];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSubject =
        subjectFilter === "All" || t.subject === subjectFilter;
      const matchType = typeFilter === "All" || t.type === typeFilter;
      return matchSearch && matchSubject && matchType;
    });
  }, [tasks, searchTerm, subjectFilter, typeFilter]);

  // Calculations for Summary
  const totalTasks = tasks.length;
  const gradedTasks = tasks.filter((t) => t.status === "graded").length;
  const missingTasks = tasks.filter((t) => t.status === "missing").length;
  const averagePercentage = useMemo(() => {
    const graded = tasks.filter(
      (t) => t.status === "graded" && t.score !== null,
    );
    if (graded.length === 0) return 0;
    const totalPercent = graded.reduce(
      (sum, t) => sum + ((t.score ?? 0) / t.maxScore) * 100,
      0,
    );
    return Math.round(totalPercent / graded.length);
  }, [tasks]);

  const getScoreCell = (
    score: number | null,
    maxScore: number,
    status: string,
  ) => {
    if (score === null || status === "missing") {
      return (
        <div className="text-center font-bold text-slate-350">
          <div>—</div>
          <div className="text-[10px] text-slate-405 mt-0.5 font-semibold">
            / {maxScore}
          </div>
        </div>
      );
    }
    const percent = (score / maxScore) * 100;
    let colorClass = "text-slate-800";
    if (percent >= 90) colorClass = "text-emerald-600";
    else if (percent >= 75) colorClass = "text-blue-500";
    else if (percent >= 55) colorClass = "text-amber-500";
    else colorClass = "text-rose-500";

    return (
      <div className="text-center font-bold">
        <div className={`text-base font-black ${colorClass}`}>{score}</div>
        <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">
          / {maxScore}
        </div>
      </div>
    );
  };

  const getPercentageCell = (
    score: number | null,
    maxScore: number,
    status: string,
  ) => {
    if (score === null || status === "missing") {
      return (
        <div className="text-center">
          <div className="text-slate-350 font-bold text-sm">—</div>
          <div className="w-12 h-[2px] bg-slate-100 rounded-full mx-auto mt-2" />
        </div>
      );
    }
    const percent = (score / maxScore) * 100;
    let colorClass = "text-slate-800";
    let barColor = "bg-slate-300";
    if (percent >= 90) {
      colorClass = "text-emerald-500";
      barColor = "bg-emerald-500";
    } else if (percent >= 75) {
      colorClass = "text-blue-600";
      barColor = "bg-blue-600";
    } else if (percent >= 55) {
      colorClass = "text-amber-500";
      barColor = "bg-amber-500";
    } else {
      colorClass = "text-rose-500";
      barColor = "bg-rose-500";
    }

    return (
      <div className="text-center">
        <div className={`text-sm font-black ${colorClass}`}>
          {percent.toFixed(0)}%
        </div>
        <div className={`w-12 h-[3px] ${barColor} rounded-full mx-auto mt-2`} />
      </div>
    );
  };

  const getGradeCell = (
    score: number | null,
    maxScore: number,
    status: string,
  ) => {
    if (score === null || status === "missing") {
      return (
        <div className="text-center text-slate-350 font-bold text-xs">—</div>
      );
    }
    const percent = (score / maxScore) * 100;
    let bgClass = "bg-slate-50 text-slate-500 border-slate-100";
    let text = "F";
    if (percent >= 90) {
      bgClass = "bg-[#eefcf4] text-[#2ebd6e] border border-[#2ebd6e]/10";
      text = "A";
    } else if (percent >= 80) {
      bgClass = "bg-[#e6f7ff] text-[#1890ff] border border-[#1890ff]/10";
      text = "B";
    } else if (percent >= 70) {
      bgClass = "bg-[#fff7e6] text-[#fa8c16] border border-[#fa8c16]/10";
      text = "C";
    } else if (percent >= 60) {
      bgClass = "bg-[#fff1f0] text-[#ff4d4f] border border-[#ff4d4f]/10";
      text = "D";
    } else {
      bgClass = "bg-[#fff1f0] text-[#f5222d] border border-[#f5222d]/20";
      text = "F";
    }

    return (
      <div
        className={`${bgClass} font-black text-xs h-6 w-6 rounded-md flex items-center justify-center mx-auto shadow-2xs`}
      >
        {text}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const norm = status.toLowerCase();
    if (norm === "graded" || norm === "submitted") {
      return (
        <div className="text-right">
          <span className="bg-[#eefcf4] text-[#2ebd6e] border border-[#2ebd6e]/15 rounded-full px-3 py-1 font-bold text-[10px] leading-none tracking-tight inline-block shadow-2xs uppercase">
            {t("gradebook.submitted")}
          </span>
        </div>
      );
    }
    if (norm === "missing") {
      return (
        <div className="text-right">
          <span className="bg-[#fff1f0] text-rose-500 border border-rose-250/50 rounded-full px-3 py-1 font-bold text-[10px] leading-none tracking-tight inline-block shadow-2xs uppercase">
            {t("gradebook.missing")}
          </span>
        </div>
      );
    }
    return (
      <div className="text-right">
          <span className="bg-[#e6f7ff] text-[#1890ff] border border-[#1890ff]/20 rounded-full px-3 py-1 font-bold text-[10px] leading-none tracking-tight inline-block shadow-2xs uppercase">
            {t("gradebook.upcoming")}
          </span>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Quick Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <div>
          <span className="text-[10px] font-black tracking-widest text-[#3949ab] uppercase bg-[#3949ab]/10 px-2.5 py-1 rounded-md">
            {t("gradebook.studentGradebook")}
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-3">
            {t("gradebook.academicPerformance", { name: child.name })}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {t("gradebook.classbookView")}
          </p>
        </div>

        {/* Dynamic Metric Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0 sm:min-w-[450px]">
          <div className="bg-slate-50 border border-slate-100/75 rounded-xl p-3 text-center">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
              {t("gradebook.totalTasks")}
            </div>
            <div className="text-lg font-black text-slate-800 mt-1">
              {totalTasks}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100/75 rounded-xl p-3 text-center">
            <div className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
              {t("gradebook.graded")}
            </div>
            <div className="text-lg font-black text-emerald-600 mt-1">
              {gradedTasks}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100/75 rounded-xl p-3 text-center">
            <div className="text-[9px] font-black uppercase tracking-wider text-rose-600">
              {t("gradebook.missing")}
            </div>
            <div className="text-lg font-black text-rose-600 mt-1">
              {missingTasks}
            </div>
          </div>
          <div className="bg-[#3949AB]/5 border border-[#3949AB]/10 rounded-xl p-3 text-center">
            <div className="text-[9px] font-black text-[#3949AB] uppercase tracking-wider font-extrabold">
              {t("gradebook.average")}
            </div>
            <div className="text-lg font-black text-[#3949AB] mt-1">
              {averagePercentage}%
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-slate-100 bg-white p-4 text-sm font-medium text-slate-500">
          {t("gradebook.loading")}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error?.message ?? t("gradebook.failedToLoad")}
        </div>
      )}

      {/* Action and Filtering Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-405"
          />
          <input
            type="text"
            placeholder={t("gradebook.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl text-xs sm:text-sm font-semibold transition-all focus:ring-0 outline-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          {/* Subject Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-400 shrink-0">
              {t("gradebook.subjectFilter")}:
            </span>
            <div className="relative flex-1">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-slate-50 border border-slate-100 hover:border-slate-200 text-xs sm:text-sm font-bold text-slate-600 pl-4 pr-9 py-2 rounded-xl outline-none cursor-pointer transition-all border-none"
              >
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Type Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-400 shrink-0">
              {t("gradebook.typeFilter")}:
            </span>
            <div className="relative flex-1">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-slate-50 border border-slate-100 hover:border-slate-200 text-xs sm:text-sm font-bold text-slate-600 pl-4 pr-9 py-2 rounded-xl outline-none cursor-pointer transition-all border-none"
              >
                <option value="All">{t("gradebook.allTypes")}</option>
                <option value="Assignment">{t("gradebook.assignments")}</option>
                <option value="Quiz">{t("gradebook.quizzes")}</option>
                <option value="Exam">{t("gradebook.exams")}</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gradebook Adaptable responsive layout */}
      {!isLoading && !isError && (
      <div className="bg-transparent md:bg-white md:border md:border-slate-100 rounded-2xl md:shadow-sm md:overflow-hidden">
        {/* MOBILE VIEW (Stack of beautifully spaced mobile-first cards) */}
        <div className="space-y-3.5 md:hidden">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const subInitials = getSubjectInitials(task.subject);

              let statusLabel = task.status;
              let statusBgClass =
                "bg-[#e5fcf4] text-[#2ebd6e] border border-[#2ebd6e]/15";

              if (
                task.status.toLowerCase() === "graded" ||
                task.status.toLowerCase() === "submitted"
              ) {
                statusLabel = t("gradebook.submitted");
                statusBgClass =
                  "bg-[#eefcf4] text-[#2ebd6e] border border-[#2ebd6e]/15";
              } else if (task.status.toLowerCase() === "missing") {
                statusLabel = t("gradebook.missing");
                statusBgClass =
                  "bg-[#fff1f0] text-rose-500 border border-rose-250/50";
              } else {
                statusLabel = t("gradebook.upcoming");
                statusBgClass =
                  "bg-[#e6f7ff] text-[#1890ff] border border-[#1890ff]/20";
              }

              return (
                <div
                  key={task.id}
                  className="bg-white border border-slate-100/80 rounded-2xl p-4.5 shadow-2xs space-y-3.5 font-sans"
                >
                  {/* Top line: Initials badge & info, status badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs tracking-wider shrink-0 opacity-90"
                        style={{
                          backgroundColor: `${task.subjectColor}15`,
                          color: task.subjectColor,
                          border: `1.5px solid ${task.subjectColor}33`,
                        }}
                      >
                        {subInitials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-tight truncate">
                          {task.title}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-405 font-mono tracking-tight mt-0.5 font-bold">
                          {task.id} &nbsp;•&nbsp; {task.subject}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-xl px-2.5 py-0.5 font-bold text-[9px] tracking-tight shrink-0 uppercase ${statusBgClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {/* Clean Simple button to view grade details */}
                  <button
                    type="button"
                    onClick={() => setSelectedTask(task)}
                    className="w-full py-2.5 bg-[#3949ab]/5 hover:bg-[#3949ab]/10 active:bg-[#3949ab]/15 text-[#3949ab] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 border border-[#3949ab]/10 cursor-pointer select-none active:scale-98"
                  >
                    {t("gradebook.viewDetails")}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-slate-105 rounded-2xl py-12 text-center text-slate-400 text-xs italic p-4">
              {t("gradebook.noResults")}
            </div>
          )}
        </div>

        {/* DESKTOP VIEW (Pristine grid table, shown only on larger screens) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[650px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-400 text-left">
                <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider">
                  {t("gradebook.task")}
                </th>
                <th className="py-4 px-6 text-center text-[11px] font-black uppercase tracking-wider w-24">
                  {t("gradebook.score")}
                </th>
                <th className="py-4 px-6 text-center text-[11px] font-black uppercase tracking-wider w-28">
                  {t("gradebook.percentage")}
                </th>
                <th className="py-4 px-6 text-center text-[11px] font-black uppercase tracking-wider w-20">
                  {t("gradebook.grade")}
                </th>
                <th className="py-4 px-6 text-right text-[11px] font-black uppercase tracking-wider w-28">
                  {t("gradebook.status")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const subInitials = getSubjectInitials(task.subject);

                  return (
                    <tr
                      key={task.id}
                      className="group hover:bg-slate-50/40 transition-all duration-200"
                    >
                      <td className="py-4 px-6 flex items-center gap-4">
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center font-black text-[13px] tracking-wider transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: `${task.subjectColor}15`,
                            color: task.subjectColor,
                            border: `1.5px solid ${task.subjectColor}33`,
                          }}
                        >
                          {subInitials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-tight truncate">
                            {task.title}
                          </h4>
                          <p className="text-[10px] sm:text-[11px] text-slate-405 font-mono tracking-tight mt-0.5 font-bold">
                            {task.id} &nbsp;•&nbsp; {task.subject}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {getScoreCell(task.score, task.maxScore, task.status)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {getPercentageCell(task.score, task.maxScore, task.status)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {getGradeCell(task.score, task.maxScore, task.status)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {getStatusBadge(task.status)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 text-xs italic bg-slate-50/30 p-4">
                    {t("gradebook.noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Modal overlay for detailed task grade */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              className="bg-white border border-slate-100 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden relative z-10 p-6 space-y-5"
            >
              {/* Top Header Row with Close Button */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider bg-indigo-50 border border-indigo-100 rounded-md px-2 py-0.5">
                    {selectedTask.type} {t("gradebook.details")}
                  </span>
                  <h3 className="text-base font-black text-slate-800 mt-2.5 leading-tight">
                    {selectedTask.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold mt-1">
                    {selectedTask.id} • {selectedTask.subject}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="p-1 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors border-none"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Decorative separator */}
              <div className="border-t border-dashed border-slate-200" />

              {/* Task info statistics */}
              <div className="space-y-4">
                {/* Result Statistics */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Score */}
                  <div className="bg-slate-50 border border-slate-100/70 rounded-2xl p-3 text-center">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      {t("gradebook.score")}
                    </span>
                    <div className="mt-1 text-slate-800 font-bold">
                      {selectedTask.score !== null &&
                      selectedTask.status !== "missing" ? (
                        <div className="leading-tight">
                          <span className="text-lg font-black block">
                            {selectedTask.score}
                          </span>
                          <span className="text-[9px] text-slate-405 font-bold font-mono">
                            / {selectedTask.maxScore}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-black text-slate-350 block">
                          —
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Percentage */}
                  <div className="bg-slate-50 border border-slate-100/70 rounded-2xl p-3 text-center flex flex-col justify-center items-center">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                      {t("gradebook.percent")}
                    </span>
                    <div>
                      {selectedTask.score !== null &&
                      selectedTask.status !== "missing" ? (
                        <span
                          className={`text-base font-black ${
                            (selectedTask.score / selectedTask.maxScore) *
                              100 >=
                            90
                              ? "text-emerald-500"
                              : (selectedTask.score / selectedTask.maxScore) *
                                    100 >=
                                  75
                                ? "text-blue-600"
                                : (selectedTask.score / selectedTask.maxScore) *
                                      100 >=
                                    55
                                  ? "text-amber-500"
                                  : "text-rose-500"
                          }`}
                        >
                          {(
                            (selectedTask.score / selectedTask.maxScore) *
                            100
                          ).toFixed(0)}
                          %
                        </span>
                      ) : (
                        <span className="text-base font-black text-slate-350">
                          —
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Letter Grade */}
                  <div className="bg-slate-50 border border-slate-100/70 rounded-2xl p-3 text-center flex flex-col justify-center items-center">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                      {t("gradebook.grade")}
                    </span>
                    <div className="h-7 w-7 flex items-center justify-center">
                      {getGradeCell(
                        selectedTask.score,
                        selectedTask.maxScore,
                        selectedTask.status,
                      )}
                    </div>
                  </div>
                </div>

                {/* Status List Details */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100/60 p-4 space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400">
                      {t("gradebook.submissionStatus")}
                    </span>
                    <div>
                      {selectedTask.status.toLowerCase() === "graded" ||
                      selectedTask.status.toLowerCase() === "submitted" ? (
                        <span className="bg-[#eefcf4] text-[#2ebd6e] border border-[#2ebd6e]/15 rounded-full px-2.5 py-0.5 font-bold text-[10px] tracking-tight">
                          {t("gradebook.submitted")}
                        </span>
                      ) : selectedTask.status.toLowerCase() === "missing" ? (
                        <span className="bg-[#fff1f0] text-rose-500 border border-rose-250/50 rounded-full px-2.5 py-0.5 font-bold text-[10px] tracking-tight">
                          {t("gradebook.missing")}
                        </span>
                      ) : (
                        <span className="bg-[#e6f7ff] text-[#1890ff] border border-[#1890ff]/20 rounded-full px-2.5 py-0.5 font-bold text-[10px] tracking-tight">
                          {t("gradebook.upcoming")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400">{t("gradebook.dueDate")}</span>
                    <span className="font-black text-slate-700 font-mono text-[11px] bg-white border border-slate-105 rounded-md px-2 py-0.5 shadow-2xs">
                      {selectedTask.dueDate || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Dialog button at the bottom */}
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="w-full py-2.5 bg-[#3949ab] hover:bg-[#3949ab]/90 text-white text-xs font-black rounded-xl shadow-xs hover:shadow-sm transition-all text-center cursor-pointer uppercase tracking-wider border-none"
              >
                {t("gradebook.closeDetails")}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
