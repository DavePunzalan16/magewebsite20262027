"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { themes, getThemeById, DEFAULT_THEME_ID, type Theme } from "@/lib/themes/config";

interface ThemeContextValue {
  currentTheme: Theme;
  themeId: string;
  setTheme: (id: string) => void;
  allThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  // Core variables used by Tailwind via @theme inline → var(--xxx)
  root.style.setProperty("--primary", theme.colors.primary);
  root.style.setProperty("--background", theme.colors.background);
  root.style.setProperty("--card", theme.colors.surface);
  root.style.setProperty("--popover", theme.colors.surface);
  root.style.setProperty("--secondary", theme.colors.surface);
  root.style.setProperty("--muted", theme.colors.surface);
  root.style.setProperty("--muted-foreground", theme.colors.offwhite);
  root.style.setProperty("--accent", theme.colors.accent);
  root.style.setProperty("--ring", theme.colors.primary);
  root.style.setProperty("--border", theme.colors.darkGray);
  root.style.setProperty("--input", theme.colors.surface);
  root.style.setProperty("--sidebar", theme.colors.surface);
  root.style.setProperty("--sidebar-primary", theme.colors.primary);
  root.style.setProperty("--sidebar-border", theme.colors.darkGray);
  root.style.setProperty("--sidebar-ring", theme.colors.primary);
  // Direct Tailwind token overrides
  root.style.setProperty("--color-primary", theme.colors.primary);
  root.style.setProperty("--color-background", theme.colors.background);
  root.style.setProperty("--color-surface", theme.colors.surface);
  root.style.setProperty("--color-offwhite", theme.colors.offwhite);
  root.style.setProperty("--color-dark-gray", theme.colors.darkGray);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("mage-theme");
    if (saved && themes.some((t) => t.id === saved)) {
      setThemeId(saved);
      applyTheme(getThemeById(saved));
    }
  }, []);

  const setTheme = useCallback((id: string) => {
    const theme = getThemeById(id);
    setThemeId(id);
    applyTheme(theme);
    localStorage.setItem("mage-theme", id);
  }, []);

  const currentTheme = useMemo(() => getThemeById(themeId), [themeId]);

  return (
    <ThemeContext.Provider value={{ currentTheme, themeId, setTheme, allThemes: themes }}>
      {children}
    </ThemeContext.Provider>
  );
}
