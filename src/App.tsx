/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useChildren } from "@/hooks";
import { useBranchIdentity } from "@/hooks/useBranchIdentity";
import { getParentMe } from "@/services/parentService";
import { listChatThreads } from "@/services/messageService";
import { queryKeys } from "@/lib/queryKeys";
import {
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  BookOpen,
  Bell,
  Calendar,
  ChevronDown,
  UserCheck,
  GraduationCap,
  MessageSquare,
  Menu,
  X,
  LayoutGrid,
  ArrowUpRight,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { SidebarItem, ErrorBoundary } from "@/components/ui";
import { OverviewModule } from "@/components/features/overview";
import { GradesModule, GradebookModule } from "@/components/features/grades";
import { AttendanceModule } from "@/components/features/attendance";
import { AssignmentsModule } from "@/components/features/assignments";
import { MessagesModule } from "@/components/features/messages";
import { NotificationsModule } from "@/components/features/notifications";
import { ScheduleModule } from "@/components/features/schedule";
import { AnalyticsModule } from "@/components/features/analytics";
import { PlannerModule } from "@/components/features/planner";
import { Child } from "@/types";
import { ParentMeResponse } from "@/types/api";

export function getParentDisplayName(parentProfile?: ParentMeResponse): string {
  const fullName = parentProfile?.user_details?.name?.trim();
  if (fullName) {
    return fullName;
  }

  const phoneNumber = parentProfile?.user_details?.phone_number?.trim();
  if (phoneNumber) {
    return phoneNumber;
  }

  return "Parent";
}

export default function App() {
  const { data: children = [], isLoading, isError, error } = useChildren();
  const { data: parentProfile } = useQuery({
    queryKey: ["parent", "me"],
    queryFn: getParentMe,
  });
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [activeModule, setActiveModule] = useState("Dashboard");
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeMessageThread, setActiveMessageThread] = useState(0);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);
  const [plannerTab, setPlannerTab] = useState<"weekly" | "academic">("weekly");


  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const child = children[selectedChildIndex];
  const { data: branchIdentity } = useBranchIdentity(child?.branchId);
  const { data: chatThreads = [] } = useQuery({
    queryKey: queryKeys.chatThreads(),
    queryFn: listChatThreads,
    enabled: Boolean(child?.id),
  });
  const schoolName = branchIdentity?.school_name ?? "School";
  const branchName = branchIdentity?.branch_name ?? child?.branchName ?? "";
  const parentName = getParentDisplayName(parentProfile);
  const parentInitials = parentName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "PA";

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#3949AB] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-sm text-red-500 font-medium">{error?.message ?? 'Failed to load data'}</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">No linked students yet</h1>
          <p className="mt-3 text-sm text-slate-600 font-medium">
            Your account is active, but there are no students connected to it right now.
            Please contact the school admin to link your children to this parent account.
          </p>
        </div>
      </div>
    );
  }

  const badges = {
    Messages: chatThreads
      .filter((thread) => thread.student === child.id)
      .reduce((sum, thread) => sum + thread.unread_count, 0),
    Notifications: child.notifications.filter((n) => !n.read).length,
    Assignments: child.assignments.filter((a) => a.status === "due").length,
  };

  const openPlanner = (tab: "weekly" | "academic") => {
    setPlannerTab(tab);
    setIsPlannerModalOpen(true);
  };

  const renderModule = () => {
    switch (activeModule) {
      case "Dashboard": return <OverviewModule child={child} setActiveModule={setActiveModule} onOpenPlanner={openPlanner} />;
      case "Grades": return <GradesModule child={child} setActiveModule={setActiveModule} />;
      case "Attendance": return <AttendanceModule child={child} />;
      case "Assignments": return <AssignmentsModule child={child} />;
      case "Gradebook": return <GradebookModule child={child} />;
      case "Analytics": return <AnalyticsModule child={child} />;
      case "Messages": return <MessagesModule child={child} activeThread={activeMessageThread} setActiveThread={setActiveMessageThread} />;
      case "Notifications": return <NotificationsModule child={child} />;
      case "Schedule": return <ScheduleModule child={child} />;
      default: return <OverviewModule child={child} setActiveModule={setActiveModule} onOpenPlanner={openPlanner} />;
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", module: "Dashboard" },
    { icon: UserCheck, label: "Attendance", module: "Attendance" },
    { icon: GraduationCap, label: "Grades", module: "Grades" },
    { icon: ClipboardList, label: "Assignments", module: "Assignments", badge: badges.Assignments },
    { icon: BookOpen, label: "Gradebook", module: "Gradebook" },
    { icon: BarChart3, label: "Analytics", module: "Analytics" },
    { icon: MessageSquare, label: "Messages", module: "Messages", badge: badges.Messages },
    { icon: Bell, label: "Notifications", module: "Notifications", badge: badges.Notifications },
  ];

  const avatarColors = ["bg-[#3949ab]", "bg-[#128267]", "bg-[#c85a23]"];

  return (
    <ErrorBoundary>
    <div className="h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      {/* MOBILE LAYOUT */}
      <div className="block md:hidden h-full flex flex-col overflow-hidden relative">
        <div className="sticky top-0 bg-white border-b border-slate-100 z-30 shrink-0 select-none">
          <div className="h-14 flex items-center justify-between px-4">
            <button onClick={() => setIsChildModalOpen(true)} className="flex items-center gap-2 bg-[#f0f4ff] rounded-full px-3 py-1.5 max-w-[210px] cursor-pointer min-h-[38px] border-none">
              <div className="w-5 h-5 rounded-full bg-[#3949AB] text-white flex items-center justify-center font-bold text-[9px] shrink-0">{child.initials}</div>
              <span className="text-xs font-bold text-[#3949AB] truncate">{child.name}</span>
              <ChevronDown size={12} className="text-[#3949AB] shrink-0" />
            </button>
            <button onClick={() => { setActiveModule("Notifications"); setShowMoreSheet(false); }} className="w-11 h-11 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-500 relative cursor-pointer border-none bg-transparent">
              <Bell size={20} />
              {badges.Notifications > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />}
            </button>
          </div>
          <div className="px-4 pb-3 pt-1 border-t border-slate-50 bg-white">
            <h2 className="text-sm font-semibold text-slate-800">Good morning, {parentName} 👋</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{child.name} · Grade {child.grade} · Sec {child.section}</p>
          </div>
        </div>

        <div className={activeModule === "Messages" ? "flex-1 flex flex-col overflow-hidden bg-white animate-fade-in pb-16" : "flex-1 overflow-y-auto px-4 pt-4 pb-24 custom-scrollbar bg-slate-50 animate-fade-in"}>
          {["Messages", "Analytics"].includes(activeModule) ? renderModule() : <div className="max-w-md mx-auto">{renderModule()}</div>}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40 select-none pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5 h-16 pt-1">
            {[
              { icon: LayoutDashboard, label: "Home", module: "Dashboard" },
              { icon: UserCheck, label: "Attendance", module: "Attendance" },
              { icon: ClipboardList, label: "Tasks", module: "Assignments", badge: badges.Assignments },
              { icon: MessageSquare, label: "Messages", module: "Messages", badge: badges.Messages },
            ].map(({ icon: Icon, label, module, badge }) => (
              <button key={module} onClick={() => { setActiveModule(module); setShowMoreSheet(false); }} className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors min-h-[44px] border-none bg-transparent ${activeModule === module ? "text-[#3949AB]" : "text-slate-400"}`}>
                <div className="relative">
                  <Icon size={20} strokeWidth={activeModule === module ? 2.5 : 2} />
                  {badge !== undefined && badge > 0 && <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-black text-[8px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white">{badge}</span>}
                </div>
                <span className="text-[10px] font-bold">{label}</span>
              </button>
            ))}
            <button onClick={() => setShowMoreSheet(true)} className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors relative min-h-[44px] border-none bg-transparent ${["Grades","Gradebook","Schedule","Notifications","Analytics"].includes(activeModule) ? "text-[#3949AB]" : "text-slate-400"}`}>
              <div className="relative"><Menu size={20} />{badges.Notifications > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 w-2 h-2 rounded-full ring-2 ring-white" />}</div>
              <span className="text-[10px] font-bold">More</span>
            </button>
          </div>
        </div>

        {/* More Sheet */}
        <AnimatePresence>
          {showMoreSheet && (
            <div className="fixed inset-0 z-50 md:hidden">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMoreSheet(false)} className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 250 }} className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl pb-[calc(2rem+env(safe-area-inset-bottom))] border-t border-slate-100 p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#3949AB]">More Applications</h3>
                  <button onClick={() => setShowMoreSheet(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border-none">✕</button>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { icon: GraduationCap, label: "Grades", module: "Grades" },
                    { icon: BookOpen, label: "Gradebook", module: "Gradebook" },
                    { icon: Calendar, label: "Schedule", module: "Schedule" },
                    { icon: Bell, label: "Notifs", module: "Notifications", badge: badges.Notifications },
                    { icon: BarChart3, label: "Analytics", module: "Analytics" },
                  ].map(({ icon: Icon, label, module, badge }) => (
                    <button key={module} onClick={() => { setActiveModule(module); setShowMoreSheet(false); }} className="flex flex-col items-center gap-2 cursor-pointer group min-h-[60px] border-none bg-transparent">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative ${activeModule === module ? "bg-[#3949AB] text-white shadow-lg" : "bg-slate-50 text-slate-600 group-hover:bg-slate-100"}`}>
                        <Icon size={22} />
                        {badge !== undefined && badge > 0 && <span className="absolute top-0 right-0 bg-rose-500 text-white font-black text-[8px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white">{badge}</span>}
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex h-full w-full overflow-hidden">
        <aside className={`relative flex flex-col transition-all duration-300 ${isSidebarCollapsed ? "w-20" : "w-64"} h-full bg-white border-r border-slate-100 shrink-0`}>
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-3 top-8 z-40 w-6 h-6 rounded-full bg-white border border-slate-200/85 shadow-md flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer" type="button">
            {isSidebarCollapsed ? <ChevronRight size={12} strokeWidth={2.5} /> : <ChevronLeft size={12} strokeWidth={2.5} />}
          </button>

          <div className={`py-5 border-b border-slate-50 ${isSidebarCollapsed ? "px-4 flex justify-center" : "px-6"}`}>
            {!isSidebarCollapsed && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Parent Mode</p>}
            <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-2.5"}`}>
              <div className="w-8 h-8 rounded-lg bg-[#3949AB] flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-900/20"><GraduationCap size={20} /></div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="text-[11px] font-black text-slate-900 uppercase leading-tight tracking-tight truncate">
                    {schoolName}
                  </h1>
                  {branchName && (
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 truncate mt-1">
                      {branchName}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div onClick={() => setIsChildModalOpen(true)} className={`cursor-pointer hover:bg-slate-100 transition-colors bg-slate-50 border border-slate-100 ${isSidebarCollapsed ? "mx-3 my-4 p-2.5 rounded-full flex justify-center" : "mx-4 my-4 p-3 rounded-xl"}`}>
            {isSidebarCollapsed ? (
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold shrink-0">{child.initials}</div>
            ) : (
              <>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">Viewing child</p>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold shrink-0">{child.initials}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-bold text-slate-900 truncate leading-tight">{child.name}</h4>
                    <p className="text-[9px] text-slate-400">Grade {child.grade} · Sec {child.section}</p>
                  </div>
                  <ChevronDown size={12} className="text-slate-400 shrink-0" />
                </div>
              </>
            )}
          </div>

          <nav className={`flex-1 flex flex-col gap-1 overflow-y-auto ${isSidebarCollapsed ? "px-2 py-4 items-center" : "px-4 py-4"}`}>
            {navItems.map(({ icon, label, module, badge }) => (
              <SidebarItem key={module} icon={icon} label={label} isActive={activeModule === module} count={badge} isCollapsed={isSidebarCollapsed} onClick={() => setActiveModule(module)} />
            ))}
          </nav>

          <div className={`border-t border-slate-50 ${isSidebarCollapsed ? "p-3 flex justify-center" : "p-4"}`}>
            <div className={`flex items-center bg-slate-50/50 rounded-xl ${isSidebarCollapsed ? "p-1 justify-center" : "gap-3 p-2"}`}>
              <div className="w-10 h-10 rounded-full bg-[#3949AB] flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white shrink-0">{parentInitials}</div>
              {!isSidebarCollapsed && <div><p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{parentName}</p><p className="text-[10px] font-medium text-slate-400">Parent Account</p></div>}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden relative">
          <div className={activeModule === "Messages" ? "flex-1 flex flex-col overflow-hidden relative w-full h-full" : "flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"}>
            {activeModule === "Messages" ? renderModule() : <div className="max-w-7xl mx-auto pb-12">{renderModule()}</div>}
          </div>
        </main>
      </div>

      {/* Child Selector Modal */}
      <AnimatePresence>
        {isChildModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsChildModalOpen(false)} />
            <motion.div initial={{ scale: 0.94, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} transition={{ type: "spring", duration: 0.35 }} className="w-full max-w-md bg-white rounded-3xl shadow-2xl relative z-60 overflow-visible border border-slate-100/80 flex flex-col">
              <div className="pt-6 px-6 pb-4 flex items-start justify-between">
                <div><h3 className="text-xl font-bold tracking-tight text-slate-900">Switch child</h3><p className="text-sm font-medium text-slate-500 mt-0.5">Bekele family · {children.length} children enrolled</p></div>
                <button onClick={() => setIsChildModalOpen(false)} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-500 flex items-center justify-center transition-all cursor-pointer border-none"><X size={16} strokeWidth={2.5} /></button>
              </div>
              <div className="bg-[#faf8f5] hover:bg-[#faf5ec] border-y border-stone-100/70 py-4 px-6 flex items-center justify-between cursor-pointer transition-colors group select-none" onClick={() => { setToastMessage("Consolidated Family View: Loading assignments, scores, and calendars for all children."); setIsChildModalOpen(false); }}>
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-white border border-dashed border-slate-300 flex items-center justify-center shrink-0 shadow-xs"><LayoutGrid size={18} className="text-slate-500" /></div>
                  <div className="min-w-0"><span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">View all children together <ArrowUpRight size={14} className="text-[#3949ab] shrink-0" /></span><p className="text-xs text-slate-500 font-medium mt-0.5">See combined assignments, scores & alerts</p></div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
              </div>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-b-3xl">
                {children.map((c: Child, i: number) => (
                  <div key={c.id} onClick={() => { setSelectedChildIndex(i); setIsChildModalOpen(false); }} className={`flex items-start gap-4 py-4 px-6 cursor-pointer transition-all select-none group relative ${selectedChildIndex === i ? "bg-[#f3f5ff]" : "bg-white hover:bg-slate-50/60"}`}>
                    <div className={`w-12 h-12 rounded-full ${avatarColors[i]} text-white flex items-center justify-center font-bold text-sm tracking-wide shrink-0 shadow-xs ring-2 ring-white`}>{c.initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{c.name}</h4>
                        {selectedChildIndex === i ? <span className="text-[11px] font-bold text-[#3949ab] shrink-0">Viewing</span> : <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">Grade {c.grade}{c.section} · {c.subjects.map((s) => s.name).join(", ")}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20">
                <button onClick={() => setIsChildModalOpen(false)} className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-600 cursor-pointer"><ArrowDown size={15} strokeWidth={2.5} /></button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Planner Modal */}
      <PlannerModule
        isOpen={isPlannerModalOpen}
        onClose={() => setIsPlannerModalOpen(false)}
        initialTab={plannerTab}
        studentName={child.name}
        studentGrade={child.grade}
        studentSec={child.section}
        organizationId={
          parentProfile?.student_details.find((student) => student.id === child.id)?.organization
          ?? parentProfile?.organization_ids[0]
        }
        branchId={child.branchId}
      />

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ y: 40, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.97 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-100 bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white text-xs font-semibold px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 max-w-[90vw] md:max-w-md select-none">
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  );
}
