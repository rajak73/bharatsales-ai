import { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { colors, radius, spacing } from '../../theme/tokens';

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
}

// A single pulsing placeholder block. Screens compose these into
// skeleton "cards" shaped like their real content (see SkeletonList below)
// instead of a spinner — replaces the "blank screen while loading" gap
// found in every list screen during the pre-redesign audit.
export function SkeletonBox({ width = '100%', height = 16, style }: SkeletonBoxProps) {
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius.sm, backgroundColor: colors.skeletonBase }, animatedStyle, style]}
    />
  );
}

// A generic card-shaped skeleton (icon + two lines + trailing value) that
// matches the majority list-row shape used across Orders/Beat/Inventory/
// Deliveries screens.
export function SkeletonListItem() {
  return (
    <View style={styles.row}>
      <SkeletonBox width={40} height={40} style={{ borderRadius: radius.md }} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <SkeletonBox width="70%" height={14} />
        <SkeletonBox width="40%" height={11} />
      </View>
      <SkeletonBox width={50} height={20} />
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <SkeletonListItem />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
});
