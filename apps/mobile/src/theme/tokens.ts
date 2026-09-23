import { Platform } from 'react-native';

// Flat palette — kept backward compatible with the original src/lib/theme.ts
// keys (screens built in earlier phases import `colors` from there; that
// file now just re-exports this one) plus a few additions needed for
// skeleton loaders and modal overlays.
export const colors = {
  // "Navy + Saffron" theme (shared with client + apps/field-pwa).
  primary: '#1B4FD8',
  primaryDark: '#163FAE',
  primaryLight: '#DFE8FF',
  navy: '#0B1F44',
  navyLight: '#16336B',
  navyDark: '#071530',
  onNavy: '#C7D2E8',
  accent: '#FF8A1F',
  accentDark: '#E9760C',
  accentLight: '#FFF1E3',
  bg: '#F4F6FB',
  card: '#FFFFFF',
  border: '#E3E8F2',
  text: '#0F172A',
  textMuted: '#5B6478',
  textSecondary: '#475569',
  success: '#16A34A',
  successLight: '#F0FDF4',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  warningBorder: '#FDE68A',
  warningText: '#92400E',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  dangerBorder: '#FECACA',
  successBorder: '#BBF7D0',
  primaryBorder: '#B9CBFA',
  // Status tones shared with the web StatusPill (info = sky, progress = violet).
  info: '#075985',
  infoLight: '#F0F9FF',
  progress: '#6D28D9',
  progressLight: '#F5F3FF',
  neutralLight: '#F1F5F9',
  overlay: 'rgba(11, 31, 68, 0.55)',
  skeletonBase: '#E3E8F2',
  skeletonHighlight: '#F1F5F9',
};

// 8-point grid — every screen's padding/gap/margin should resolve to one of
// these instead of an arbitrary pixel value.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

// Minimum tappable size for anything interactive (Material/Apple HIG
// guidance) — field reps use the app one-handed, often while walking.
export const touchTarget = 48;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

// iOS reads shadow*/ Android reads elevation — spread whichever preset
// matches the desired depth onto a View's style.
export const shadow = {
  sm: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
    android: { elevation: 1 },
    default: {},
  }),
  md: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 3 },
    default: {},
  }),
  lg: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
    android: { elevation: 8 },
    default: {},
  }),
};

// Font family names match exactly what useFonts({ Inter_400Regular, ... })
// registers (see app/_layout.tsx) — falls back to the RN system font until
// fonts finish loading, since RN silently ignores an unregistered
// fontFamily rather than crashing.
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

export const typography = {
  display: { fontFamily: fontFamily.extrabold, fontSize: 28, lineHeight: 34 },
  h1: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 28 },
  h2: { fontFamily: fontFamily.bold, fontSize: 18, lineHeight: 24 },
  h3: { fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
  tiny: { fontFamily: fontFamily.semibold, fontSize: 10, lineHeight: 14 },
};

export const FONTS_TO_LOAD = {
  Inter_400Regular: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
  Inter_500Medium: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
  Inter_600SemiBold: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
  Inter_700Bold: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
  Inter_800ExtraBold: require('@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf'),
};
