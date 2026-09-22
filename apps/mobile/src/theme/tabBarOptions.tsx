import type { ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily } from './tokens';

// Shared by both (rep)/(tabs)/_layout.tsx and (distributor)/(tabs)/_layout.tsx.
// React Navigation's default bar is a fixed 49dp tall, which clips the
// descenders of the Inter labels — so the height is set explicitly here,
// with the device's bottom safe-area inset added on top so labels never sit
// under the Android gesture bar / iOS home indicator.
const TAB_BAR_CONTENT_HEIGHT = 62;

export function useTabBarScreenOptions() {
  const insets = useSafeAreaInsets();
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarStyle: {
      backgroundColor: colors.card,
      borderTopColor: colors.border,
      height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
      paddingTop: 4,
      paddingBottom: 4 + insets.bottom,
    },
    tabBarLabelStyle: { fontSize: 11, lineHeight: 14, fontFamily: fontFamily.semibold },
    tabBarHideOnKeyboard: true,
  };
}

type IconName = keyof typeof Ionicons.glyphMap;

// Filled glyph when the tab is active, outline otherwise — the same
// convention for every tab in both role apps.
export function tabIcon(filled: IconName, outline: IconName) {
  function TabIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <Ionicons name={focused ? filled : outline} size={size} color={color as string} />;
  }
  return TabIcon;
}
