/**
 * Button component with multiple variants
 */

import React, { forwardRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  TouchableOpacityProps,
} from "react-native";
import { Colors, BorderRadius, Spacing, Typography } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "small" | "medium" | "large";

interface ButtonProps extends Omit<TouchableOpacityProps, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = forwardRef<TouchableOpacity, ButtonProps>(
  (
    {
      variant = "primary",
      size = "medium",
      loading = false,
      disabled = false,
      fullWidth = false,
      icon,
      iconPosition = "left",
      children,
      style,
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme();

    const getButtonStyle = (): ViewStyle => {
      const baseStyle: ViewStyle = {
        borderRadius: BorderRadius.button,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      };

      // Size styles
      const sizeStyles: Record<ButtonSize, ViewStyle> = {
        small: {
          height: Spacing.buttonHeightSmall,
          paddingHorizontal: Spacing.padding.md,
        },
        medium: {
          height: Spacing.buttonHeight,
          paddingHorizontal: Spacing.buttonPaddingHorizontal,
        },
        large: {
          height: 56,
          paddingHorizontal: Spacing.xl,
        },
      };

      // Variant styles
      const variantStyles: Record<ButtonVariant, ViewStyle> = {
        primary: {
          backgroundColor: colors.primary,
        },
        secondary: {
          backgroundColor: colors.secondary,
        },
        outline: {
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: colors.border,
        },
        ghost: {
          backgroundColor: "transparent",
        },
        danger: {
          backgroundColor: colors.error,
        },
      };

      return {
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? "100%" : "auto",
      };
    };

    const getTextStyle = (): TextStyle => {
      const baseStyle: TextStyle = {
        fontFamily: Typography.fontFamily.semibold,
        fontSize: size === "small" ? Typography.fontSize.sm : Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
      };

      const variantStyles: Record<ButtonVariant, TextStyle> = {
        primary: {
          color: "#FFFFFF",
        },
        secondary: {
          color: "#FFFFFF",
        },
        outline: {
          color: colors.text,
        },
        ghost: {
          color: colors.primary,
        },
        danger: {
          color: "#FFFFFF",
        },
      };

      return { ...baseStyle, ...variantStyles[variant] };
    };

    const renderContent = () => {
      if (loading) {
        return (
          <>
            <ActivityIndicator
              size="small"
              color={variant === "outline" || variant === "ghost" ? colors.primary : "#FFFFFF"}
            />
          </>
        );
      }

      return (
        <>
          {icon && iconPosition === "left" && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={getTextStyle()}>{children}</Text>
          {icon && iconPosition === "right" && <View style={styles.iconRight}>{icon}</View>}
        </>
      );
    };

    return (
      <TouchableOpacity
        ref={ref}
        style={[getButtonStyle(), style]}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

Button.displayName = "Button";
