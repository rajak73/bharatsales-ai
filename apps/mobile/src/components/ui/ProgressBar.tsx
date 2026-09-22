import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../../theme/tokens';

interface ProgressBarProps {
  // 0-100+; values above 100 render as full.
  percent: number;
  color?: string;
  height?: number;
  accessibilityLabel?: string;
}

// Colour follows achievement by default: under 60% brand blue, 60-99%
// amber, 100%+ green — the same thresholds the Targets screen already used
// for its status badge.
export function progressColor(percent: number): string {
  if (percent >= 100) return colors.success;
  if (percent >= 60) return colors.warning;
  return colors.primary;
}

export function ProgressBar({ percent, color, height = 8, accessibilityLabel }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
    >
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: color || progressColor(percent), borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.neutralLight, overflow: 'hidden', borderRadius: radius.pill },
  fill: { height: '100%' },
});
