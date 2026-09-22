import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow, spacing } from '../../theme/tokens';

// Sticky primary-action bar at the bottom of a stack screen (Place Order,
// Confirm Delivery, Accept/Reject). Laid out in normal flow after the
// scroll view — not absolutely positioned — so it never covers the last
// list item, and it pads for the gesture-nav / home-indicator inset.
export function BottomBar({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, shadow.lg, { paddingBottom: spacing.md + insets.bottom }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
});
