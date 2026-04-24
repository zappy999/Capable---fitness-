// Design tokens — mirrors the Capable design bundle (styles.css :root).
// Dark-only for now; accent is user-configurable via settings.

export const COLORS = {
  bg: '#0D0D0D',
  surface: '#1A1A1A',
  surface2: '#222222',
  border: '#242424',
  borderSoft: '#2D2D2D',
  text: '#FAFAFA',
  muted: '#A1A1AA',
  subtle: '#71717A',
  faint: '#52525B',
  ghost: '#3F3F46',
  onAccent: '#0A0A0A',
} as const;

export const MUSCLE_HEX = {
  Chest: '#F87171',
  Back: '#60A5FA',
  Shoulders: '#F97316',
  Triceps: '#A78BFA',
  Biceps: '#FBBF24',
  Legs: '#34D399',
  Glutes: '#EC4899',
  Calves: '#8B5CF6',
  Core: '#10B981',
} as const;

export type MuscleName = keyof typeof MUSCLE_HEX;

export const muscleColor = (name?: string | null): string =>
  (name && (MUSCLE_HEX as Record<string, string>)[name]) || COLORS.faint;

// hex -> rgba with a given alpha
export const accentAlpha = (hex: string, alpha: number): string => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h, 16);
  if (Number.isNaN(n)) return `rgba(34,197,94,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

// Shared card style — use inside style={cardStyle}.
export const cardStyle = {
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 24,
  padding: 20,
};

export const cardSmStyle = {
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 16,
  padding: 14,
};

export const statCellStyle = {
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 16,
  padding: 12,
  flex: 1,
  minWidth: 0,
};

// Monospace for numbers — keeps weights/reps tabular.
import { Platform } from 'react-native';
export const MONO = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
}) as string;
