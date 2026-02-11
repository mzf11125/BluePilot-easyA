/**
 * Input component with various types
 */

import React, { forwardRef, useState } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from "react-native";
import { Colors, BorderRadius, Spacing, Typography } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";

export type InputVariant = "outlined" | "filled" | "flat";
export type InputSize = "small" | "medium" | "large";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: InputVariant;
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  fullWidth?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      variant = "outlined",
      size = "medium",
      leftIcon,
      rightIcon,
      onRightIconPress,
      fullWidth = false,
      style,
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const getInputStyle = (): ViewStyle => {
      const baseStyle: ViewStyle = {
        borderRadius: BorderRadius.input,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: variant === "outlined" ? 1.5 : 0,
      };

      const sizeStyles: Record<InputSize, ViewStyle> = {
        small: {
          height: 40,
          paddingHorizontal: 12,
        },
        medium: {
          height: Spacing.inputHeight,
          paddingHorizontal: Spacing.inputPaddingHorizontal,
        },
        large: {
          height: 56,
          paddingHorizontal: 16,
        },
      };

      const variantStyles: Record<InputVariant, ViewStyle> = {
        outlined: {
          borderColor: error
            ? colors.error
            : isFocused
            ? colors.primary
            : colors.border,
          backgroundColor: colors.background,
        },
        filled: {
          backgroundColor: colors.backgroundSecondary,
        },
        flat: {
          backgroundColor: "transparent",
          borderBottomWidth: 1,
          borderBottomColor: error
            ? colors.error
            : isFocused
            ? colors.primary
            : colors.border,
          borderRadius: 0,
        },
      };

      return {
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        width: fullWidth ? "100%" : "auto",
      };
    };

    const getTextStyle = (): TextStyle => {
      const baseStyle: TextStyle = {
        flex: 1,
        fontFamily: Typography.fontFamily.regular,
        fontSize: size === "small" ? Typography.fontSize.sm : Typography.fontSize.base,
        color: colors.text,
      };

      return baseStyle;
    };

    return (
      <View style={[fullWidth && { width: "100%" }, style]}>
        {label && (
          <Text style={[styles.label, { color: colors.text }]}>
            {label}
          </Text>
        )}
        <View style={getInputStyle()}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={getTextStyle()}
            placeholderTextColor={colors.textTertiary}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {rightIcon && (
            <TouchableOpacity
              style={styles.iconRight}
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>
        {error && (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        )}
        {helperText && !error && (
          <Text style={[styles.helper, { color: colors.textSecondary }]}>{helperText}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";

const styles = StyleSheet.create({
  label: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    marginBottom: 6,
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
  error: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
    marginTop: 4,
  },
  helper: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
    marginTop: 4,
  },
});
