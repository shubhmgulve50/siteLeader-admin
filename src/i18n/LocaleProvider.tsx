"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import mr from "./locales/mr.json";

export type Locale = "en" | "hi" | "mr";

type Dict = typeof en;

const DICTS: Record<Locale, Dict> = { en, hi, mr: mr as Dict };

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  available: { code: Locale; label: string }[];
}

const Ctx = createContext<LocaleCtx | null>(null);

const STORAGE_KEY = "siteLeader.locale";

function resolveKey(dict: Dict, key: string): string | undefined {
  const parts = key.split(".");
  let cursor: unknown = dict;
  for (const p of parts) {
    if (cursor && typeof cursor === "object" && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cursor === "string" ? cursor : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? `{{${k}}}`));
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && ["en", "hi", "mr"].includes(saved)) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const active = DICTS[locale];
      const resolved = resolveKey(active, key) ?? resolveKey(DICTS.en, key) ?? key;
      return interpolate(resolved, vars);
    },
    [locale]
  );

  const value = useMemo<LocaleCtx>(
    () => ({
      locale,
      setLocale,
      t,
      available: [
        { code: "en", label: "English" },
        { code: "hi", label: "हिन्दी" },
        { code: "mr", label: "मराठी" },
      ],
    }),
    [locale, setLocale, t]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fallback no-op when provider not mounted (e.g. print pages, SSR boundary)
    return {
      locale: "en",
      setLocale: () => {},
      t: (key: string) => {
        const resolved = resolveKey(en, key);
        return resolved ?? key;
      },
      available: [
        { code: "en", label: "English" },
        { code: "hi", label: "हिन्दी" },
        { code: "mr", label: "मराठी" },
      ],
    };
  }
  return ctx;
}

export function useT() {
  return useLocale().t;
}
