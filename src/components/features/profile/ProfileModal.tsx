"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Phone, Briefcase, MapPin, User, Shield } from "lucide-react";
import { ParentMeResponse } from "@/types/api";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: ParentMeResponse | null;
  parentName: string;
  parentInitials: string;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-slate-900 mt-0.5">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function ProfileModal({ open, onClose, profile, parentName, parentInitials }: ProfileModalProps) {
  const userDetails = profile?.user_details;
  const orgs = profile?.organization_details ?? [];
  const students = profile?.student_details ?? [];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#1A237E] text-white flex items-center justify-center font-bold text-sm">
                    {parentInitials}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Profile</h2>
                    <p className="text-xs text-slate-500">{parentName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <div className="space-y-4">
                  <InfoRow icon={<User size={16} />} label="Full Name" value={userDetails?.name} />
                  <InfoRow icon={<Mail size={16} />} label="Email" value={userDetails?.email} />
                  <InfoRow icon={<Phone size={16} />} label="Phone" value={userDetails?.phone_number} />
                  {profile?.occupation && (
                    <InfoRow icon={<Briefcase size={16} />} label="Occupation" value={profile.occupation} />
                  )}
                  {profile?.work_address && (
                    <InfoRow icon={<MapPin size={16} />} label="Work Address" value={profile.work_address} />
                  )}
                </div>

                {orgs.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield size={14} className="text-slate-400" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Organizations</p>
                    </div>
                    <div className="space-y-2">
                      {orgs.map((org) => (
                        <div key={org.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-sm font-semibold text-slate-900">{org.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 capitalize">{org.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {students.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={14} className="text-slate-400" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Linked Children</p>
                    </div>
                    <div className="space-y-2">
                      {students.map((s) => (
                        <div key={s.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{s.first_name} {s.last_name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Roll No: {s.roll_no}</p>
                          </div>
                          {s.is_primary_contact && (
                            <span className="text-[10px] font-bold text-[#1A237E] bg-[#E8EAF6] px-2 py-0.5 rounded-full">Primary</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
