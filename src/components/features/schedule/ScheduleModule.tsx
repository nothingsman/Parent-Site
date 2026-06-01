import React, { useState } from 'react';
import { MapPin, Info, Calendar } from 'lucide-react';

import { Card, SectionLabel } from '@/components/ui';
import { Child } from '@/types';

export interface ScheduleModuleProps {
  child: Child;
  dict?: any;
}

export const ScheduleModule = ({ child }: ScheduleModuleProps) => {
  const [activeDay, setActiveDay] = useState("Mon");
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar whitespace-nowrap">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className={`min-w-[64px] sm:min-w-[72px] py-2 px-2.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
              activeDay === d
                ? "bg-[#3949ab] text-white border-[#3949ab] shadow-lg shadow-blue-900/10"
                : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          {child.schedule.map((slot, i) => (
            <div key={i}>
              <Card className="flex gap-3 sm:gap-6 p-0 overflow-hidden items-stretch">
                <div className="w-16 sm:w-20 p-2.5 sm:p-4 flex flex-col justify-center items-center bg-slate-50 border-r border-slate-100">
                  <span className="text-xs sm:text-sm font-mono font-bold text-slate-400 bg-white px-1 sm:px-2 py-0.5 sm:py-1 rounded border border-slate-100 whitespace-nowrap">
                    {slot.time}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-300 mt-2">
                    45 MIN
                  </span>
                </div>
                <div
                  className={`w-1 rounded-full my-3 shrink-0 ${slot.subject === "Break" ? "bg-slate-200" : ""}`}
                  style={
                    slot.subject !== "Break"
                      ? { backgroundColor: slot.color }
                      : {}
                  }
                />
                <div className="flex-1 p-3 sm:p-4 flex items-center justify-between min-w-0">
                  <div className="min-w-0">
                    <h3
                      className={`text-sm sm:text-base font-bold truncate ${slot.subject === "Break" ? "text-slate-400 italic" : "text-slate-800"}`}
                    >
                      {slot.subject}
                    </h3>
                    {slot.teacher && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-slate-500">
                          {slot.teacher}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin size={10} />
                          {slot.room}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2 border border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                    <Info size={16} />
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <SectionLabel>Weekly Overview</SectionLabel>
            <div className="grid grid-cols-6 gap-1">
              <div className="aspect-square" />
              {days.map((d) => (
                <div
                  key={d}
                  className="aspect-square flex items-center justify-center text-xs font-black text-slate-300"
                >
                  {d[0]}
                </div>
              ))}

              {Array.from({ length: 6 }).map((_, r) => (
                <React.Fragment key={r}>
                  <div className="aspect-square flex items-center justify-center text-[10px] font-mono text-slate-300">
                    {r + 1}
                  </div>
                  {days.map((d) => (
                    <div
                      key={`${r}-${d}`}
                      className="aspect-square bg-slate-50 rounded flex items-center justify-center"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400/30" />
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center mt-4 italic">
              Full grid view for administrators only
            </p>
          </Card>

          <Card className="bg-[#3949ab] text-white border-none shadow-xl shadow-blue-900/20">
            <h4 className="text-sm font-bold mb-2">Academic Calendar</h4>
            <p className="text-xs opacity-80 mb-4">
              Upcoming school events for Grade {child.grade}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/10 p-2 rounded-lg">
                <div className="bg-white/20 p-2 rounded-md">
                  <Calendar size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold">Parents' Night</p>
                  <p className="text-xs opacity-70">Jun 15 · 6:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 p-2 rounded-lg">
                <div className="bg-white/20 p-2 rounded-md">
                  <Info size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold">End of Term Exam</p>
                  <p className="text-xs opacity-70">Starting Jun 22</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
