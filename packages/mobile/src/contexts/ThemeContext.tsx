/**
 * Theme context for managing app theme (dark/light)
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { Colors } from "@/constants/colors";

type Theme = "dark" | "light";

interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  backgroundElevated: string;
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryDark: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

const darkColors: ThemeColors = {
  background: Colors.dark.bg,
  backgroundSecondary: Colors.dark.bgSecondary,
  backgroundElevated: Colors.dark.bgElevated,
  border: Colors.dark.border,
  text: Colors.dark.text,
  textSecondary: Colors.dark.textSecondary,
  textTertiary: Colors.dark.textTertiary,
  primary: Colors.primary[500],
  primaryDark: Colors.primary[700],
  secondary: Colors.secondary[500],
  success: Colors.semantic.success,
  warning: Colors.semantic.warning,
  error: Colors.semantic.error,
  info: Colors.semantic.info,
};

const lightColors: ThemeColors = {
  background: Colors.light.bg,
  backgroundSecondary: Colors.light.bgSecondary,
  backgroundElevated: Colors.light.bgElevated,
  border: Colors.light.border,
  text: Colors.light.text,
  textSecondary: Colors.light.textSecondary,
  textTertiary: Colors.light.textTertiary,
  primary: Colors.primary[500],
  primaryDark: Colors.primary[700],
  secondary: Colors.secondary[500],
  success: Colors.semantic.success,
  warning: Colors.semantic.warning,
  error: Colors.semantic.error,
  info: Colors.semantic.info,
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "dark",
}) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem("bluepilot_theme").then((savedTheme) => {
      if (savedTheme === "dark" || savedTheme === "light") {
        setThemeState(savedTheme);
      }
    });
  }, []);

  const colors = theme === "dark" ? darkColors : lightColors;

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    AsyncStorage.setItem("bluepilot_theme", newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

import AsyncStorage from "@react-native-async-storage/async-storage";
