import { colors, fontFamily } from './tokens';

// Shared by both (rep)/(tabs)/_layout.tsx and (distributor)/(tabs)/_layout.tsx
// — previously duplicated verbatim in both files.
export const tabBarScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
  tabBarLabelStyle: { fontSize: 11, fontFamily: fontFamily.semibold },
};
