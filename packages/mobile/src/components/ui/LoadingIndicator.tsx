/**
 * Loading indicator component
 */

import React from "react";
import { ActivityIndicator, View, StyleSheet, Text } from "react-native";
import { Colors } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";

interface LoadingIndicatorProps {
  size?: "small" | "large" | number;
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = "large",
  color,
  text,
  fullScreen = false,
}) => {
  const { colors } = useTheme();
  const indicatorColor = color || colors.primary;

  const content = (
    <>
      <ActivityIndicator size={size} color={indicatorColor} />
      {text && <Text style={[styles.text, { color: colors.textSecondary }]}>{text}</Text>}
    </>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        {content}
      </View>
    );
  }

  return <View style={styles.container}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
});
