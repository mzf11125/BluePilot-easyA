/**
 * Typography constants for BluePilot app
 */

export const Typography = {
  // Font families
  fontFamily: {
    regular: "Inter-Regular",
    medium: "Inter-Medium",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
    mono: "RobotoMono-Regular",
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },

  // Font weights
  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
} as const;

/**
 * Text style presets
 */
export const TextStyles = {
  // Display text
  displayLarge: {
    fontFamily: "Inter-Bold",
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontFamily: "Inter-Bold",
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  displaySmall: {
    fontFamily: "Inter-SemiBold",
    fontSize: 24,
    lineHeight: 32,
  },

  // Headlines
  headlineLarge: {
    fontFamily: "Inter-SemiBold",
    fontSize: 20,
    lineHeight: 28,
  },
  headlineMedium: {
    fontFamily: "Inter-SemiBold",
    fontSize: 18,
    lineHeight: 26,
  },
  headlineSmall: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    lineHeight: 24,
  },

  // Body text
  bodyLarge: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
    lineHeight: 18,
  },

  // Labels
  labelLarge: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: "Inter-Medium",
    fontSize: 12,
    lineHeight: 18,
  },
  labelSmall: {
    fontFamily: "Inter-Medium",
    fontSize: 10,
    lineHeight: 16,
  },

  // Monospace (for addresses, amounts)
  monoLarge: {
    fontFamily: "RobotoMono-Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  monoMedium: {
    fontFamily: "RobotoMono-Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  monoSmall: {
    fontFamily: "RobotoMono-Regular",
    fontSize: 12,
    lineHeight: 18,
  },
} as const;

/**
 * Type definitions for text styles
 */
export type TextStyle = keyof typeof TextStyles;
