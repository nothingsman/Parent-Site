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
}: SidebarItemProps) => (
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
    {!isCollapsed && count !== undefined && (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
          isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
        }`}
      >
        {count < 10 ? `0${count}` : count}
      </span>
    )}
    {isCollapsed && count !== undefined && count > 0 && (
      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
    )}
  </motion.button>
);
