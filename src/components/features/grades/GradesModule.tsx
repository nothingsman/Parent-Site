import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, MessageSquare } from 'lucide-react';

import { Card } from '@/components/ui';
import { useAssignments, useGrades } from '@/hooks';
import { AssignmentEntry, Child, Subject } from '@/types';
import { getGradeLetter, getGradeBg } from '@/lib/utils';

export interface GradesModuleProps {
  child: Child;
  setActiveModule?: (module: string) => void;
  dict?: any;
}

export const GradesModule = ({
  child,
  setActiveModule,
  dict,
}: GradesModuleProps) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const {
    data: grades,
    isLoading,
    isError,
    error,
  } = useGrades(child.id);
  const { data: assignments = [] } = useAssignments(child);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedSubject]);

  const subjects = grades?.subjects ?? [];

  const renderAssignmentStatus = (assignment: AssignmentEntry) => {
    if (assignment.status === "graded") {
      const scoreVal = assignment.score ?? 0;
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-[9px] font-black ${getGradeBg((scoreVal / assignment.maxScore) * 100)}`}
        >
          {getGradeLetter((scoreVal / assignment.maxScore) * 100)}{" "}
          • {((scoreVal / assignment.maxScore) * 100).toFixed(0)}%
        </span>
      );
    }
    if (assignment.status === "submitted") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-100/50">
          {dict?.grades?.pendingStatus ?? 'PENDING'}
        </span>
      );
    }
    if (assignment.status === "missing") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-50 text-rose-600 border border-rose-100/50">
          {dict?.grades?.missingStatus ?? 'MISSING'}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100/50">
        {dict?.grades?.upcomingStatus ?? 'UPCOMING'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-4 text-sm font-medium text-slate-500">
        {dict?.grades?.loading ?? 'Loading grades...'}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
        {error?.message ?? (dict?.grades?.failedToLoad ?? 'Failed to load grades.')}
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-6 text-center text-sm font-medium text-slate-500">
        {dict?.grades?.noRecords ?? 'No grade records are available for this student yet.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
        {subjects.map((sub) => {
          return (
            <div
              key={sub.name}
              className="animate-fade-in md:h-full cursor-pointer group"
              onClick={() => setSelectedSubject(sub)}
            >
              <Card className="p-3 sm:p-3.5 md:p-3 md:h-full md:flex md:flex-col md:justify-between transition-all duration-200 hover:shadow-md hover:border-slate-300 active:scale-[0.99] hover:bg-slate-50/20">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2/3 max-w-[8px] h-2 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color, width: "8px" }}
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm font-extrabold text-[#3949ab] truncate group-hover:text-blue-700 transition-colors">
                          {sub.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold truncate">
                          {sub.teacher || (dict?.grades?.teacherUnavailable ?? 'Teacher unavailable')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Performance Progress & Standing */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {dict?.grades?.currentStanding ?? 'Current Standing'}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider ${
                          sub.score >= 90
                            ? "text-emerald-600"
                            : sub.score >= 80
                              ? "text-blue-600"
                              : sub.score >= 70
                                ? "text-amber-600"
                                : "text-rose-600"
                        }`}
                      >
                        {sub.score >= 90
                          ? (dict?.grades?.academicExcellence ?? "Academic Excellence")
                          : sub.score >= 80
                            ? (dict?.grades?.strongProgress ?? "Strong Progress")
                            : sub.score >= 70
                              ? (dict?.grades?.satisfactory ?? "Satisfactory")
                              : (dict?.grades?.needsSupport ?? "Needs Support")}
                      </span>
                    </div>

                    {/* Interactive Visual Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${sub.score}%`,
                          backgroundColor: sub.color,
                        }}
                      />
                    </div>

                    {/* Small Metric Footer inside card */}
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: sub.color }}
                        />
                        {dict?.grades?.level ?? 'Level'}: {getGradeLetter(sub.score)} {dict?.app?.grade ?? 'Grade'}
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {sub.score}% {dict?.grades?.mark ?? 'Mark'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-50 shrink-0 flex items-center justify-between">
                  <span className="text-[9px] font-extrabold text-blue-600 group-hover:underline">
                    {dict?.grades?.viewDetails ?? 'View details →'}
                  </span>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedSubject &&
          (() => {
            const sub = selectedSubject;
            const subjectActivities = assignments.filter(
              (a) => a.subject === sub.name,
            );
            const gradedNews = subjectActivities.filter(
              (a) => a.status === "graded",
            );
            const submittedNews = subjectActivities.filter(
              (a) => a.status === "submitted",
            );
            const missingNews = subjectActivities.filter(
              (a) => a.status === "missing",
            );

            return (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedSubject(null)}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 pointer-events-auto"
                />

                {/* Drawer / Popup Panel */}
                <motion.div
                  initial={isMobile ? { y: "100%" } : { x: "100%" }}
                  animate={{ y: 0, x: 0 }}
                  exit={isMobile ? { y: "100%" } : { x: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 240 }}
                  className={
                    isMobile
                      ? "fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-2xl shadow-2xl z-50 flex flex-col overflow-hidden border-t border-slate-200"
                      : "fixed right-0 top-0 h-full w-[450px] max-w-full bg-white shadow-2xl z-50 flex flex-col border-l border-slate-100"
                  }
                >
                  {/* Close Button top-right */}
                  <button
                    onClick={() => setSelectedSubject(null)}
                    className="absolute top-4 right-4 z-50 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer border-none"
                    aria-label="Close details"
                  >
                    <X size={16} />
                  </button>

                  {/* Integrated Header Status Banner */}
                  <div className="p-5 text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative shrink-0 pt-10 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative z-10 flex-1 min-w-0 pr-8 sm:pr-0">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-xs">
                          {dict?.grades?.subjectOverview ?? 'Subject Overview'}
                        </span>
                        <h2 className="text-xl font-black tracking-tight leading-tight mt-1 text-[#3949ab] truncate">
                          {sub.name}
                        </h2>
                        <div className="flex items-center gap-1 mt-0.5 text-slate-500">
                          <User size={11} className="shrink-0" />
                          <p className="text-[11px] font-semibold truncate">
                            {dict?.grades?.teacher ?? 'Teacher'}: {sub.teacher || (dict?.grades?.teacherUnavailable ?? 'Teacher unavailable')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Compact integrated stats */}
                    <div className="grid grid-cols-2 gap-1.5 relative z-10 w-full sm:w-[200px] shrink-0">
                      <div className="bg-white border border-slate-100 rounded-lg px-2.5 py-1 text-center min-w-0 w-full shadow-2xs">
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                          {dict?.grades?.all ?? 'All'}
                        </div>
                        <div className="text-xs font-black text-[#3949ab]">
                          {subjectActivities.length}
                        </div>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-lg px-2.5 py-1 text-center min-w-0 w-full shadow-2xs">
                        <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider">
                          {dict?.grades?.graded ?? 'Graded'}
                        </div>
                        <div className="text-xs font-black text-emerald-600">
                          {gradedNews.length}
                        </div>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-lg px-2.5 py-1 text-center min-w-0 w-full shadow-2xs">
                        <div className="text-[8px] font-bold text-amber-500 uppercase tracking-wider">
                          {dict?.grades?.pending ?? 'Pending'}
                        </div>
                        <div className="text-xs font-black text-amber-600">
                          {submittedNews.length}
                        </div>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-lg px-2.5 py-1 text-center min-w-0 w-full shadow-2xs">
                        <div className="text-[8px] font-bold text-rose-500 uppercase tracking-wider">
                          {dict?.grades?.missing ?? 'Missing'}
                        </div>
                        <div className="text-xs font-black text-rose-600">
                          {missingNews.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable list of Assignments */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mb-2">
                      {dict?.grades?.assignmentsLog ?? 'Assignments & grading log'}
                    </div>
                    {subjectActivities.length > 0 ? (
                      <div className="space-y-2.5 pb-4">
                        {subjectActivities.map((act) => {
                          const statusBadge = renderAssignmentStatus(act);

                          return (
                            <div
                              key={act.id}
                              className="p-3 bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xs rounded-xl transition-all flex flex-col gap-2"
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="min-w-0">
                                  <h4 className="text-xs font-extrabold text-[#3949ab] leading-snug truncate">
                                    {act.title}
                                  </h4>
                                  <div className="flex items-center gap-1.5 mt-1 font-bold text-[10px] text-slate-400">
                                    <span className="uppercase text-slate-500 font-extrabold bg-slate-100 px-1.5 py-0.5 rounded-xs text-[9px]">
                                      {act.type}
                                    </span>
                                    <span>•</span>
                                    <span>{dict?.grades?.due ?? 'Due'}: {act.dueDate}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0 flex flex-col items-end">
                                  {statusBadge}
                                  {act.status === "graded" && (
                                    <div className="text-[10px] font-mono font-bold text-slate-500 mt-0.5">
                                      {act.score} / {act.maxScore}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {act.description && (
                                <p className="text-[10px] text-slate-500 italic bg-slate-50/50 p-2 rounded-lg border border-slate-100/40 leading-relaxed font-semibold">
                                  "{act.description}"
                                </p>
                              )}

                              {act.status === "graded" && (
                                <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-0.5">
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${((act.score ?? 0) / act.maxScore) * 100}%`,
                                      backgroundColor: sub.color,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200/60 p-4">
                        {dict?.grades?.noAssignments ?? 'No assignments or homework records for this subject yet.'}
                      </div>
                    )}
                  </div>

                  {/* Footer Message Teacher Action */}
                  {setActiveModule && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedSubject(null);
                          setActiveModule("Messages");
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#3949ab] hover:bg-[#12185c] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-blue-900/10 border-none"
                      >
                        <MessageSquare size={13} />
                        {(dict?.grades?.sendMessageTo ?? 'Send Message to ').replace('{teacher}', sub.teacher || (dict?.grades?.teacher ?? 'Teacher'))}
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            );
          })()}
      </AnimatePresence>
    </div>
  );
};
