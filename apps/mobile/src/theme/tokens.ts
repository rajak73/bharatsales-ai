import { Platform } from 'react-native';

// Flat palette — kept backward compatible with the original src/lib/theme.ts
// keys (screens built in earlier phases import `colors` from there; that
// file now just re-exports this one) plus a few additions needed for
// skeleton loaders and modal overlays.
export const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  success: '#16A34A',
  successLight: '#F0FDF4',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  overlay: 'rgba(15, 23, 42, 0.55)',
  skeletonBase: '#E2E8F0',
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
