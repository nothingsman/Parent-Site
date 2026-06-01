import React, { useState } from 'react';
import { Star, ClipboardList, MessageCircle, Clock, CalendarX, Info, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui';
import { Child } from '@/types';

export interface NotificationsModuleProps {
  child: Child;
  dict?: any;
}

export const NotificationsModule = ({ child }: NotificationsModuleProps) => {
  const [filter, setFilter] = useState("All");
  const tabs = ["All", "Grades", "Assignments", "Messages", "Attendance"];

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
                  ? "bg-[#3949ab] text-white shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="text-xs font-bold text-blue-600 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors shrink-0 max-w-max self-end sm:self-auto">
          Mark all as read
        </button>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {child.notifications.map((n) => {
          const IconComp =
            { Star, ClipboardList, MessageCircle, Clock, CalendarX }[
              n.icon as
                | "Star"
                | "ClipboardList"
                | "MessageCircle"
                | "Clock"
                | "CalendarX"
            ] || Info;
          const colorClasses = {
            green: "bg-emerald-50 text-emerald-600",
            blue: "bg-blue-50 text-blue-600",
            amber: "bg-amber-50 text-amber-600",
            red: "bg-red-50 text-red-600",
          }[n.color as "green" | "blue" | "amber" | "red"];

          return (
            <div key={n.id}>
              <Card
                className={`flex items-center gap-3 sm:gap-4 transition-all hover:border-slate-200 p-3 sm:p-4 ${!n.read ? "border-l-4 !border-l-blue-600" : ""}`}
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${colorClasses}`}
                >
                  <IconComp size={16} className="sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-800">
                    {n.title}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-400">
                    {n.detail}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-600 shrink-0" />
                )}
                <button className="p-2 text-slate-300 hover:text-slate-400">
                  <MoreVertical size={16} />
                </button>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};
