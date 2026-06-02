"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import en from "@/locales/en.json";
import am from "@/locales/am.json";
import om from "@/locales/om.json";
import ti from "@/locales/ti.json";

export type Locale = "en" | "am" | "om" | "ti";

export const LOCALES: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "am", label: "Amharic", nativeLabel: "\u12a0\u12cd\u1295\u1293\u1275" },
  { code: "om", label: "Oromo", nativeLabel: "Oromoo" },
  { code: "ti", label: "Tigrinya", nativeLabel: "\u1275\u130d\u122a\u1293\u1275" },
];

const TRANSLATIONS: Record<Locale, Record<string, unknown>> = { en, am, om, ti };

const STORAGE_KEY = "parent-portal-locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === "en" || stored === "am" || stored === "om" || stored === "ti")) {
      return stored;
    }
  } catch {}
  return "en";
}

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in params ? String(params[key]) : `{${key}}`
  );
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = getNestedValue(TRANSLATIONS[locale], key)
        ?? getNestedValue(TRANSLATIONS.en, key)
        ?? key;
      return params ? interpolate(value, params) : value;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within a LanguageProvider");
  return ctx;
}
