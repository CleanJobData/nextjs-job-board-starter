"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import { THEME_STORAGE_KEY, type ThemeMode } from "./storage";

export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  /** Stored preference (system follows OS). */
  mode: ThemeMode;
  /** What the UI should render as (after resolving system). */
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggleResolved: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

function persistMode(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

function resolve(mode: ThemeMode, prefersDark: boolean): ResolvedTheme {
  if (mode === "dark" || mode === "light") return mode;
  return prefersDark ? "dark" : "light";
}

function applyResolved(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [prefersDark, setPrefersDark] = useState(false);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(mq.matches);
    try {
      if (localStorage.getItem(THEME_STORAGE_KEY) === null) {
        localStorage.setItem(THEME_STORAGE_KEY, "system");
      }
    } catch {
      /* ignore */
    }
    setModeState(readMode());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setPrefersDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [ready]);

  const resolved = resolve(mode, prefersDark);

  useLayoutEffect(() => {
    if (!ready) return;
    applyResolved(resolved);
  }, [ready, resolved]);

  const setMode = useCallback((next: ThemeMode) => {
    persistMode(next);
    setModeState(next);
  }, []);

  /** Flip light ↔ dark and persist as an explicit choice (no longer “system”). */
  const toggleResolved = useCallback(() => {
    if (!ready) return;
    const next: ThemeMode = resolved === "dark" ? "light" : "dark";
    persistMode(next);
    setModeState(next);
    applyResolved(next === "dark" ? "dark" : "light");
  }, [ready, resolved]);

  const value = useMemo(
    () => ({ mode, resolved, setMode, toggleResolved }),
    [mode, resolved, setMode, toggleResolved]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

export type { ThemeMode } from "./storage";
