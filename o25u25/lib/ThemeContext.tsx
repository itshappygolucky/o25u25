import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "night" | "dark";

export const THEME_STORAGE_KEY = "@o25u25/theme";

export const themes = {
  light: {
    background: "#ffffff",
    surface: "#f5f5f5",
    text: "#1a1a1a",
    textMuted: "#666666",
    icon: "#333333",
  },
  night: {
    background: "#0a1628",
    surface: "#132337",
    text: "#e8edf4",
    textMuted: "#8ba3c7",
    icon: "#b8c9e0",
  },
  dark: {
    background: "#111111",
    surface: "#1a1a1a",
    text: "#f0f0f0",
    textMuted: "#999999",
    icon: "#cccccc",
  },
} as const;

export type Theme = (typeof themes)[ThemeMode];

type ThemeContextValue = {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("night");

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved && (saved === "light" || saved === "night" || saved === "dark")) {
        setThemeModeState(saved);
      }
    });
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  const theme = themes[themeMode];

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
