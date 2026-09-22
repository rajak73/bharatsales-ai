import { View, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, shadow, spacing } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: 'sm' | 'md' | 'lg' | 'none';
  padding?: keyof typeof spacing | 0;
  // When set, the whole card becomes one tappable target (with pressed
  // feedback) — used for list rows that open a detail screen.
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Card({ children, style, elevation = 'sm', padding = 'lg', onPress, accessibilityLabel, accessibilityHint }: CardProps) {
  const baseStyle = [
    styles.base,
    { padding: padding === 0 ? 0 : spacing[padding] },
    elevation !== 'none' && (shadow as any)[elevation],
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [...baseStyle, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[...baseStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.bg },
});
