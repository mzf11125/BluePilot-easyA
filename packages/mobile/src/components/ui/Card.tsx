/**
 * Card component for displaying content in a contained area
 */

import React, { forwardRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacityProps,
  TouchableOpacity,
} from "react-native";
import { Colors, BorderRadius, Spacing, Shadow } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";

export type CardVariant = "elevated" | "outlined" | "flat";

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: keyof typeof Spacing.padding;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Card = forwardRef<View, CardProps>(
  (
    {
      children,
      variant = "elevated",
      padding = "md",
      style,
      onPress,
      disabled = false,
      fullWidth = false,
      ...pressabilityProps
    },
    ref
  ) => {
    const { colors } = useTheme();

    const getCardStyle = (): ViewStyle => {
      const baseStyle: ViewStyle = {
        borderRadius: BorderRadius.card,
        backgroundColor: colors.backgroundElevated,
        padding: Spacing.padding[padding],
        overflow: "hidden",
      };

      const variantStyles: Record<CardVariant, ViewStyle> = {
        elevated: {
          ...Shadow.md,
          backgroundColor: colors.backgroundElevated,
        },
        outlined: {
          borderWidth: 1,
          borderColor: colors.border,
        },
        flat: {
          backgroundColor: colors.backgroundSecondary,
        },
      };

      return {
        ...baseStyle,
        ...variantStyles[variant],
        width: fullWidth ? "100%" : "auto",
        opacity: disabled ? 0.5 : 1,
      };
    };

    if (onPress) {
      return (
        <TouchableOpacity
          ref={ref}
          style={[getCardStyle(), style]}
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.8}
          {...pressabilityProps}
        >
          {children}
        </TouchableOpacity>
      );
    }

    return (
      <View ref={ref} style={[getCardStyle(), style]}>
        {children}
      </View>
    );
  }
);

Card.displayName = "Card";

/**
 * CardSection component for grouping content within a card
 */
interface CardSectionProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardSection: React.FC<CardSectionProps> = ({ children, style }) => {
  return <View style={[styles.section, style]}>{children}</View>;
};

/**
 * CardHeader component
 */
interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action, style }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerContent}>
        {title && (
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        )}
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      {action && <View style={styles.headerAction}>{action}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginVertical: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerAction: {
    marginLeft: 12,
  },
  title: {
    fontFamily: "Inter-SemiBold",
    fontSize: 16,
    lineHeight: 24,
  },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
});
