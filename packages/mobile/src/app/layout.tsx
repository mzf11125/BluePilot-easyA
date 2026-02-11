/**
 * App layout with safe area
 */

import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/contexts/ThemeContext";

export default function AppLayout() {
  const { theme } = useTheme();

  return (
    <SafeAreaProvider>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
    </SafeAreaProvider>
  );
}
