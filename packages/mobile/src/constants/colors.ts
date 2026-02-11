/**
 * Color constants for BluePilot app
 * Base brand colors for DeFi trading interface
 */

export const Colors = {
  // Primary brand colors (Base blue)
  primary: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },

  // Secondary brand colors
  secondary: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
    800: "#166534",
    900: "#14532D",
  },

  // Accent colors
  accent: {
    purple: "#8B5CF6",
    pink: "#EC4899",
    orange: "#F97316",
    cyan: "#06B6D4",
  },

  // Semantic colors
  semantic: {
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },

  // Neutral colors (dark theme)
  dark: {
    bg: "#0A0F1C",
    bgSecondary: "#111827",
    bgTertiary: "#1F2937",
    bgElevated: "#374151",
    border: "#374151",
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    textTertiary: "#6B7280",
  },

  // Neutral colors (light theme)
  light: {
    bg: "#FFFFFF",
    bgSecondary: "#F3F4F6",
    bgTertiary: "#E5E7EB",
    bgElevated: "#FFFFFF",
    border: "#E5E7EB",
    text: "#111827",
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",
  },

  // Trading specific colors
  trading: {
    profit: "#22C55E",
    loss: "#EF4444",
    neutral: "#6B7280",
    buy: "#22C55E",
    sell: "#EF4444",
  },

  // Token colors
  tokens: {
    eth: "#627EEA",
    usdc: "#2775CA",
    usdb: "#0E4F8E",
    dai: "#F4B731",
    wbtc: "#F7931A",
  },
} as const;

/**
 * Color aliases for easier usage
 */
export const Color = {
  primary: Colors.primary[500],
  primaryDark: Colors.primary[700],
  secondary: Colors.secondary[500],
  success: Colors.semantic.success,
  warning: Colors.semantic.warning,
  error: Colors.semantic.error,
  info: Colors.semantic.info,

  background: Colors.dark.bg,
  backgroundSecondary: Colors.dark.bgSecondary,
  backgroundElevated: Colors.dark.bgElevated,
  border: Colors.dark.border,

  text: Colors.dark.text,
  textSecondary: Colors.dark.textSecondary,
  textTertiary: Colors.dark.textTertiary,

  trading: {
    profit: Colors.trading.profit,
    loss: Colors.trading.loss,
    buy: Colors.trading.buy,
    sell: Colors.trading.sell,
  },
};

/**
 * Get color for token symbol
 */
export function getTokenColor(symbol: string): string {
  const normalized = symbol.toLowerCase();
  if (normalized in Colors.tokens) {
    return Colors.tokens[normalized as keyof typeof Colors.tokens];
  }
  // Generate a consistent color based on the symbol
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Get opacity variant of a color
 */
export function withOpacity(color: string, opacity: number): string {
  // Check if color is hex
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}
