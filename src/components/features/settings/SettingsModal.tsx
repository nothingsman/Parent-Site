"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Type, Contrast, Moon, Settings, Globe } from "lucide-react";
import { useTranslation, type Locale, LOCALES } from "@/lib/i18n";

type FontSize = "small" | "medium" | "large";
type ContrastMode = "normal" | "high";
type ReducedMotion = "off" | "on";

interface Settings {
  fontSize: FontSize;
  contrastMode: ContrastMode;
  reducedMotion: ReducedMotion;
}

const STORAGE_KEY = "parent-portal-settings";

const FONT_SIZE_LABELS: Record<FontSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

const FONT_SIZE_VALUES: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "20px",
};

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Settings;
  } catch {}
  return { fontSize: "medium", contrastMode: "normal", reducedMotion: "off" };
}

function applySettings(settings: Settings) {
  const root = document.documentElement;
  root.style.fontSize = FONT_SIZE_VALUES[settings.fontSize];
  root.classList.toggle("high-contrast", settings.contrastMode === "high");
  root.classList.toggle("reduced-motion", settings.reducedMotion === "on");
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const { locale, setLocale, t } = useTranslation();

  useEffect(() => {
    if (open) {
      const current = loadSettings();
      setSettings(current);
    }
  }, [open]);

  useEffect(() => {
    applySettings(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const fontSizeLabels: Record<FontSize, string> = {
    small: t("settings.small") === "settings.small" ? "Small" : t("settings.small"),
    medium: t("settings.medium") === "settings.medium" ? "Medium" : t("settings.medium"),
    large: t("settings.large") === "settings.large" ? "Large" : t("settings.large"),
  };

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
          >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Settings size={18} className="text-slate-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{t("settings.accessibilityTitle")}</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-6">
                <SettingRow
                  icon={<Globe size={18} />}
                  label={t("settings.language")}
                  description={t("settings.languageDesc")}
                >
                  <div className="flex flex-wrap gap-1.5">
                    {LOCALES.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => setLocale(l.code)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          locale === l.code
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {l.nativeLabel}
                      </button>
                    ))}
                  </div>
                </SettingRow>

                <SettingRow
                  icon={<Type size={18} />}
                  label={t("settings.fontSize")}
                  description={t("settings.fontSizeDesc")}
                >
                  <div className="flex gap-1.5">
                    {(["small", "medium", "large"] as FontSize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => update("fontSize", size)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          settings.fontSize === size
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {fontSizeLabels[size]}
                      </button>
                    ))}
                  </div>
                </SettingRow>

                <SettingRow
                  icon={<Contrast size={18} />}
                  label={t("settings.highContrast")}
                  description={t("settings.highContrastDesc")}
                >
                  <ToggleButton
                    enabled={settings.contrastMode === "high"}
                    onToggle={() =>
                      update("contrastMode", settings.contrastMode === "high" ? "normal" : "high")
                    }
                  />
                </SettingRow>

                <SettingRow
                  icon={<Moon size={18} />}
                  label={t("settings.reducedMotion")}
                  description={t("settings.reducedMotionDesc")}
                >
                  <ToggleButton
                    enabled={settings.reducedMotion === "on"}
                    onToggle={() =>
                      update("reducedMotion", settings.reducedMotion === "on" ? "off" : "on")
                    }
                  />
                </SettingRow>
              </div>

              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                <p className="text-[10px] font-medium text-slate-400 text-center">
                  {t("settings.savedLocally")}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SettingRow({
  icon,
  label,
  description,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ToggleButton({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-[#1A237E]" : "bg-slate-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
