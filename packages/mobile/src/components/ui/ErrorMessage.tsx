/**
 * Error message component
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Spacing, BorderRadius } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: "inline" | "card" | "banner";
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  onDismiss,
  variant = "card",
}) => {
  const { colors } = useTheme();

  const getContainerStyle = () => {
    const baseStyle = {
      backgroundColor: `${colors.error}10`,
      borderWidth: 1,
      borderColor: `${colors.error}40`,
      borderRadius: BorderRadius.md,
    };

    switch (variant) {
      case "inline":
        return {
          ...baseStyle,
          paddingVertical: 8,
          paddingHorizontal: 12,
        };
      case "banner":
        return {
          ...baseStyle,
          paddingVertical: 12,
          paddingHorizontal: 16,
          margin: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        };
      default:
        return {
          ...baseStyle,
          padding: Spacing.md,
        };
    }
  };

  return (
    <View style={[styles.container, getContainerStyle()]}>
      <View style={styles.content}>
        <Text style={[styles.message, { color: colors.error }]}>{message}</Text>
        {(onRetry || onDismiss) && (
          <View style={styles.actions}>
            {onRetry && (
              <TouchableOpacity onPress={onRetry}>
                <Text style={[styles.action, { color: colors.error }]}>Retry</Text>
              </TouchableOpacity>
            )}
            {onDismiss && (
              <TouchableOpacity onPress={onDismiss}>
                <Text style={[styles.action, { color: colors.textSecondary }]}>Dismiss</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  content: {
    flexDirection: "column",
  },
  message: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    marginTop: 8,
    gap: 16,
  },
  action: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
});
