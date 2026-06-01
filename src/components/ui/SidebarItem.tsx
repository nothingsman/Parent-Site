import React from 'react';
import { motion } from 'motion/react';

export interface SidebarItemProps {
  icon: any;
  label: string;
  isActive?: boolean;
  count?: number;
  onClick: () => void;
  isCollapsed?: boolean;
}

export const SidebarItem = ({
  icon: Icon,
  label,
  isActive = false,
  count,
  onClick,
  isCollapsed = false,
}: SidebarItemProps) => {
  const visibleCount = typeof count === 'number' && count > 0 ? count : null;
  const highlightUnread = label === 'Messages' || label === 'Notifications';

  return (
    <motion.button
      whileHover={isCollapsed ? { scale: 1.05 } : { x: 4 }}
      onClick={onClick}
      className={`w-full flex items-center transition-colors duration-200 relative ${
        isCollapsed ? "justify-center p-3" : "justify-between px-4 py-3"
      } rounded-lg ${
        isActive
          ? "bg-[#3949AB] text-white shadow-lg shadow-blue-900/20"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
      }`}
      title={isCollapsed ? label : undefined}
    >
      <div
        className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}
      >
        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        {!isCollapsed && (
          <span className="text-sm font-medium tracking-tight">{label}</span>
        )}
      </div>
      {!isCollapsed && visibleCount !== null && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
            highlightUnread
              ? "bg-blue-600 text-white"
              : isActive
                ? "bg-white/20 text-white"
                : "bg-slate-200 text-slate-600"
          }`}
        >
          {visibleCount}
        </span>
      )}
      {isCollapsed && visibleCount !== null && (
        <span
          className={`absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
            highlightUnread ? "bg-blue-600" : "bg-red-500"
          }`}
        />
      )}
    </motion.button>
  );
};
