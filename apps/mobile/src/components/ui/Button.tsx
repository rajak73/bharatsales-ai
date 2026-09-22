import { Text, StyleSheet, ActivityIndicator, Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, radius, spacing, touchTarget, typography } from '../../theme/tokens';
import { useOrgStore } from '../../store/orgStore';

// danger = soft red (secondary destructive, e.g. Log Out); destructive =
// solid red (confirming an irreversible action, e.g. Confirm Reject).
// accent = saffron with a navy label, the web's `variant="accent"`: reserved
// for the ONE most important call to action on a screen.
type Variant = 'primary' | 'secondary' | 'danger' | 'destructive' | 'ghost' | 'accent';
type Size = 'md' | 'sm';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Every screen previously wrote its own <TouchableOpacity> + inline
// StyleSheet for buttons with slightly different colors/radii — this is the
// single standardized primitive, with a subtle Reanimated press-scale
// (spec: "Button Ripple"/"Card Press" micro-interactions) instead of the
// default opacity-only feedback. Both sizes keep a 48dp minimum touch target.
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  icon,
  style,
  fullWidth = true,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const orgPrimaryColor = useOrgStore((s) => s.primaryColor);
  const primary = orgPrimaryColor || colors.primary;

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isDisabled = disabled || loading;

  const variantStyle = {
    primary: { backgroundColor: isDisabled && !loading ? colors.border : primary },
    secondary: { backgroundColor: colors.primaryLight },
    danger: { backgroundColor: colors.dangerLight },
    destructive: { backgroundColor: isDisabled && !loading ? colors.border : colors.danger },
    ghost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    accent: { backgroundColor: isDisabled && !loading ? colors.border : colors.accent },
  }[variant];

  const textColorStyle = {
    primary: { color: isDisabled && !loading ? colors.textMuted : '#fff' },
    secondary: { color: primary },
    danger: { color: colors.danger },
    destructive: { color: isDisabled && !loading ? colors.textMuted : '#fff' },
    ghost: { color: colors.text },
    accent: { color: isDisabled && !loading ? colors.textMuted : colors.navy },
  }[variant];

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutated via `.value` by design
      onPressIn={() => { scale.value = withTiming(0.97, { duration: 100 }); }}
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutated via `.value` by design
      onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
      style={[
        styles.base,
        size === 'sm' && styles.small,
        variantStyle,
        fullWidth && { width: '100%' },
        isDisabled && variant !== 'primary' && variant !== 'destructive' && variant !== 'accent' && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'destructive' ? '#fff' : variant === 'accent' ? colors.navy : variant === 'danger' ? colors.danger : primary} />
      ) : (
        <>
          {icon}
          <Text
            style={[size === 'sm' ? styles.labelSmall : styles.label, textColorStyle, icon ? { marginLeft: spacing.sm } : undefined]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },
  small: { minHeight: touchTarget, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  label: { ...typography.h3 },
  labelSmall: { ...typography.bodyMedium, fontFamily: typography.h3.fontFamily },
  disabled: { opacity: 0.5 },
});
