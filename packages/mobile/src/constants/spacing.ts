/**
 * Spacing constants for BluePilot app
 */

export const Spacing = {
  // Base spacing unit (4px)
  unit: 4,

  // Spacing scale
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
  "4xl": 96,

  // Component-specific spacing
  padding: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },

  margin: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },

  // Layout spacing
  screenPaddingHorizontal: 16,
  screenPaddingVertical: 16,

  // Tab bar
  tabBarHeight: 64,
  tabBarPadding: 8,

  // Header
  headerHeight: 56,
  headerPadding: 16,

  // Card
  cardPadding: 16,
  cardGap: 12,

  // Button
  buttonPaddingHorizontal: 24,
  buttonPaddingVertical: 14,
  buttonHeight: 48,
  buttonHeightSmall: 36,

  // Input
  inputPaddingHorizontal: 16,
  inputPaddingVertical: 12,
  inputHeight: 48,

  // List items
  listItemHeight: 56,
  listItemPadding: 16,

  // Avatar
  avatarSize: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  },

  // Icon
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },
} as const;

/**
 * Border radius constants
 */
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,

  // Component-specific
  button: 12,
  card: 16,
  input: 12,
  modal: 24,
  pill: 9999,
} as const;

/**
 * Shadow constants
 */
export const Shadow = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

/**
 * Z-index layers
 */
export const ZIndex = {
  background: -1,
  base: 0,
  overlay: 10,
  modal: 100,
  popover: 200,
  toast: 300,
  tooltip: 400,
} as const;
