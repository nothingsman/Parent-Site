/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useChildren } from "@/hooks";
import { useBranchIdentity } from "@/hooks/useBranchIdentity";
import { getParentMe } from "@/services/parentService";
import { listChatThreads } from "@/services/messageService";
import { resolveMediaUrl } from "@/services/branchService";
import { logout } from "@/services/authService";
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
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { SidebarItem, ErrorBoundary } from "@/components/ui";
import ProfileModal from "@/components/features/profile/ProfileModal";
import SettingsModal from "@/components/features/settings/SettingsModal";
import { useTranslation } from "@/lib/i18n";
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { data: children = [], isLoading, isError, error } = useChildren();
  const { data: parentProfile } = useQuery({
    queryKey: ["parent", "me"],
    queryFn: getParentMe,
  });
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [activeModule, setActiveModule] = useState("Dashboard");
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);
  const [plannerTab, setPlannerTab] = useState<"weekly" | "academic">("weekly");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  const handleLogout = async () => {
    await logout(queryClient);
    router.replace("/login");
  };

  const child = children[selectedChildIndex];
  const { data: branchIdentity } = useBranchIdentity(child?.branchId);

  useEffect(() => {
    if (!branchIdentity?.logo) {
      setLogoUrl(null);
      return;
    }
    resolveMediaUrl(branchIdentity.logo).then(setLogoUrl);
  }, [branchIdentity?.logo]);
  const { data: chatThreads = [] } = useQuery({
    queryKey: queryKeys.chatThreads(),
    queryFn: listChatThreads,
    enabled: Boolean(child?.id),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
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
          <p className="text-sm text-slate-500 font-medium">{t("app.loading")}</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-sm text-red-500 font-medium">{error?.message ?? t("app.failedToLoad")}</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t("app.noStudentsTitle")}</h1>
          <p className="mt-3 text-sm text-slate-600 font-medium">
            {t("app.noStudentsDesc")}
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
      case "Messages": return <MessagesModule child={child} />;
      case "Notifications": return <NotificationsModule child={child} />;
      case "Schedule": return <ScheduleModule child={child} />;
      default: return <OverviewModule child={child} setActiveModule={setActiveModule} onOpenPlanner={openPlanner} />;
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: t("nav.dashboard"), module: "Dashboard" },
    { icon: UserCheck, label: t("nav.attendance"), module: "Attendance" },
    { icon: GraduationCap, label: t("nav.grades"), module: "Grades" },
    { icon: ClipboardList, label: t("nav.assignments"), module: "Assignments", badge: badges.Assignments },
    { icon: BookOpen, label: t("nav.gradebook"), module: "Gradebook" },
    { icon: BarChart3, label: t("nav.analytics"), module: "Analytics" },
    { icon: MessageSquare, label: t("nav.messages"), module: "Messages", badge: badges.Messages },
    { icon: Bell, label: t("nav.notifications"), module: "Notifications", badge: badges.Notifications },
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
            <h2 className="text-sm font-semibold text-slate-800">{t("app.goodMorning", { parentName })}</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{child.name} · {t("app.grade")} {child.grade} · {t("app.sec")} {child.section}</p>
          </div>
        </div>

        <div className={activeModule === "Messages" ? "flex-1 flex flex-col overflow-hidden bg-white animate-fade-in pb-16" : "flex-1 overflow-y-auto px-4 pt-4 pb-24 custom-scrollbar bg-slate-50 animate-fade-in"}>
          {["Messages", "Analytics"].includes(activeModule) ? renderModule() : <div className="max-w-md mx-auto">{renderModule()}</div>}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40 select-none pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5 h-16 pt-1">
            {[
              { icon: LayoutDashboard, label: t("nav.home"), module: "Dashboard" },
              { icon: UserCheck, label: t("nav.attendance"), module: "Attendance" },
              { icon: ClipboardList, label: t("nav.tasks"), module: "Assignments", badge: badges.Assignments },
              { icon: MessageSquare, label: t("nav.messages"), module: "Messages", badge: badges.Messages },
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
              <span className="text-[10px] font-bold">{t("app.more")}</span>
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
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#3949AB]">{t("app.moreApplications")}</h3>
                  <button onClick={() => setShowMoreSheet(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border-none">✕</button>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { icon: GraduationCap, label: t("nav.grades"), module: "Grades" },
                    { icon: BookOpen, label: t("nav.gradebook"), module: "Gradebook" },
                    { icon: Calendar, label: t("nav.schedule"), module: "Schedule" },
                    { icon: Bell, label: t("nav.notifications"), module: "Notifications", badge: badges.Notifications },
                    { icon: BarChart3, label: t("nav.analytics"), module: "Analytics" },
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
                <div className="border-t border-slate-100 pt-4 space-y-1">
                  <button onClick={() => { setShowMoreSheet(false); setIsProfileOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 cursor-pointer border-none bg-transparent text-left">
                    <div className="w-9 h-9 rounded-full bg-[#3949AB] flex items-center justify-center text-white font-bold text-xs">{parentInitials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{parentName}</p>
                      <p className="text-[10px] font-medium text-slate-400">{t("app.parentAccount")}</p>
                    </div>
                    <User size={16} className="text-slate-400 shrink-0" />
                  </button>
                  <button onClick={() => { setShowMoreSheet(false); setIsSettingsOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 cursor-pointer border-none bg-transparent text-left">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500"><Settings size={16} /></div>
                    <span className="text-sm font-semibold text-slate-700">{t("profile.settings")}</span>
                  </button>
                  <button onClick={() => { setShowMoreSheet(false); handleLogout(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-50 cursor-pointer border-none bg-transparent text-left">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500"><LogOut size={16} /></div>
                    <span className="text-sm font-semibold text-rose-600">{t("profile.logout")}</span>
                  </button>
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

          <div className={`border-b border-slate-100 bg-linear-to-b from-white to-slate-50/30 ${isSidebarCollapsed ? "px-4 pt-5 pb-4 flex justify-center" : "px-4 sm:px-5 pt-5 sm:pt-7 pb-4"}`}>
            <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={schoolName || "School logo"}
                  className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-100 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-linear-to-br from-[#1A237E] to-[#3949AB] rounded-xl flex items-center justify-center shadow-md shadow-blue-900/15 shrink-0 ring-1 ring-white/20">
                  <GraduationCap className="text-white" size={18} strokeWidth={2.5} />
                </div>
              )}
              {!isSidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <h2 className="text-[12px] font-black uppercase tracking-tight text-slate-800 truncate leading-tight">
                    {schoolName || "School"}
                  </h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {t("analytics.academicPortal")}
                  </p>
                  {branchName && (
                    <p className="text-[9px] font-semibold text-slate-500 truncate">
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
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">{t("app.viewingChild")}</p>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold shrink-0">{child.initials}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-bold text-slate-900 truncate leading-tight">{child.name}</h4>
                    <p className="text-[9px] text-slate-400">{t("app.grade")} {child.grade} · {t("app.sec")} {child.section}</p>
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

          <div className={`border-t border-slate-50 ${isSidebarCollapsed ? "p-3 flex justify-center" : "p-4"}`} ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className={`w-full flex items-center bg-slate-50/50 rounded-xl hover:bg-slate-50 transition cursor-pointer border-none ${isSidebarCollapsed ? "p-1 justify-center" : "gap-3 p-2"}`}
            >
              <div className="w-10 h-10 rounded-full bg-[#3949AB] flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white shrink-0">{parentInitials}</div>
              {!isSidebarCollapsed && (
                <>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{parentName}</p>
                    <p className="text-[10px] font-medium text-slate-400">{t("app.parentAccount")}</p>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </>
              )}
            </button>
            {isProfileMenuOpen && (
              <div className={`mt-2 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden ${isSidebarCollapsed ? "absolute bottom-16 left-3 right-3" : ""}`}>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsProfileOpen(true);
                  }}
                  className="w-full px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-none bg-transparent text-left"
                >
                  <User size={14} /> {t("profile.viewProfile")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="w-full px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-none bg-transparent text-left"
                >
                  <Settings size={14} /> {t("profile.settings")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-none bg-transparent text-left"
                >
                  <LogOut size={14} /> {t("profile.logout")}
                </button>
              </div>
            )}
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
                <div><h3 className="text-xl font-bold tracking-tight text-slate-900">{t("app.switchChild")}</h3><p className="text-sm font-medium text-slate-500 mt-0.5">{t("app.family")} · {children.length} {t("app.childrenEnrolled")}</p></div>
                <button onClick={() => setIsChildModalOpen(false)} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-500 flex items-center justify-center transition-all cursor-pointer border-none"><X size={16} strokeWidth={2.5} /></button>
              </div>
              <div className="bg-[#faf8f5] hover:bg-[#faf5ec] border-y border-stone-100/70 py-4 px-6 flex items-center justify-between cursor-pointer transition-colors group select-none" onClick={() => { setToastMessage(t("app.consolidatedMsg")); setIsChildModalOpen(false); }}>
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-white border border-dashed border-slate-300 flex items-center justify-center shrink-0 shadow-xs"><LayoutGrid size={18} className="text-slate-500" /></div>
                  <div className="min-w-0"><span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">{t("app.viewAllChildren")} <ArrowUpRight size={14} className="text-[#3949ab] shrink-0" /></span><p className="text-xs text-slate-500 font-medium mt-0.5">{t("app.seeCombined")}</p></div>
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
                        {selectedChildIndex === i ? <span className="text-[11px] font-bold text-[#3949ab] shrink-0">{t("app.viewing")}</span> : <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{t("app.grade")} {c.grade}{c.section} · {c.subjects.map((s) => s.name).join(", ")}</p>
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

      {/* Profile Modal */}
      <ProfileModal
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={parentProfile ?? null}
        parentName={parentName}
        parentInitials={parentInitials}
      />

      {/* Settings Modal */}
      <SettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
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
