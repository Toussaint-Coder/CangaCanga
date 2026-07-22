import { useColorScheme } from "nativewind";

/**
 * Design tokens for CangaCanga. Keep in sync with tailwind.config.js / global.css.
 * No gradients anywhere — flat fills, soft shadows, generous radii.
 *
 * `className` tokens (bg-card, text-primary, …) are backed by CSS variables and
 * switch automatically. These JS palettes power icon colors and inline styles;
 * use the `useThemeColors()` hook so they follow the active theme.
 */
export const lightColors = {
  primary: "#111111",
  secondary: "#FFFFFF",
  accent: "#2563EB",
  background: "#F8F9FA",
  card: "#FFFFFF",
  border: "#ECECEC",
  muted: "#6B7280",
  mutedLight: "#9CA3AF",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#D97706",
  star: "#F59E0B",
} as const;

export type ThemeColors = Record<keyof typeof lightColors, string>;

export const darkColors: ThemeColors = {
  primary: "#F5F5F5",
  secondary: "#111111",
  accent: "#3B82F6",
  background: "#0B0B0C",
  card: "#18181B",
  border: "#27272A",
  muted: "#9CA3AF",
  mutedLight: "#71717A",
  success: "#22C55E",
  danger: "#F87171",
  warning: "#F59E0B",
  star: "#F59E0B",
} as const;

/** Static light palette (kept for backward compatibility / non-hook contexts). */
export const colors = lightColors;

/** Returns the JS color palette for the active color scheme. */
export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? darkColors : lightColors;
}

export const radius = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Soft, subtle elevation used across cards and sheets. */
export const shadow = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  floating: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export const fonts = {
  regular: "Lufga-Regular",
  medium: "Lufga-Medium",
  semibold: "Lufga-SemiBold",
  bold: "Lufga-Bold",
  extrabold: "Lufga-ExtraBold",
  light: "Lufga-Light",
} as const;
