"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";
const THEMES: Theme[] = ["light", "dark", "system"];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme | undefined;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyClass(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
  themes = THEMES,
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  themes?: Theme[];
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme | undefined>(
    undefined,
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolve(defaultTheme),
  );

  useEffect(() => {
    let stored: Theme = defaultTheme;
    try {
      const raw = localStorage.getItem(storageKey);
      if (isTheme(raw)) stored = raw;
    } catch {
      // ignore
    }
    const sys = getSystemTheme();
    setThemeState(stored);
    setSystemTheme(sys);
    const next = resolve(stored);
    setResolvedTheme(next);
    applyClass(next);
  }, [defaultTheme, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const sys = getSystemTheme();
      setSystemTheme(sys);
      if (theme === "system") {
        setResolvedTheme(sys);
        applyClass(sys);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // ignore
      }
      const r = resolve(next);
      setResolvedTheme(r);
      applyClass(r);
    },
    [storageKey],
  );

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, resolvedTheme, systemTheme, themes }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;
  return {
    theme: "system",
    setTheme: () => {},
    resolvedTheme: "light",
    systemTheme: undefined,
    themes: THEMES,
  };
}
