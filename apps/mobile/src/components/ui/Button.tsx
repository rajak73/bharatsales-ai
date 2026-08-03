import { Text, StyleSheet, ActivityIndicator, Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { useOrgStore } from '../../store/orgStore';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Every screen previously wrote its own <TouchableOpacity> + inline
// StyleSheet for buttons with slightly different colors/radii — this is the
// single standardized primitive, with a subtle Reanimated press-scale
// (spec: "Button Ripple"/"Card Press" micro-interactions) instead of the
// default opacity-only feedback.
export function Button({ label, onPress, variant = 'primary', disabled, loading, icon, style, fullWidth = true }: ButtonProps) {
  const scale = useSharedValue(1);
  const orgPrimaryColor = useOrgStore((s) => s.primaryColor);
  const primary = orgPrimaryColor || colors.primary;

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isDisabled = disabled || loading;

  const variantStyle = {
    primary: { backgroundColor: isDisabled ? colors.border : primary },
    secondary: { backgroundColor: colors.primaryLight },
    danger: { backgroundColor: colors.dangerLight },
    ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  }[variant];

  const textColorStyle = {
    primary: { color: '#fff' },
    secondary: { color: primary },
    danger: { color: colors.danger },
    ghost: { color: colors.text },
  }[variant];

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutated via `.value` by design
      onPressIn={() => { scale.value = withTiming(0.97, { duration: 100 }); }}
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutated via `.value` by design
      onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
      style={[
        styles.base,
        variantStyle,
        fullWidth && { width: '100%' },
        isDisabled && variant !== 'primary' && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : primary} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, textColorStyle, icon ? { marginLeft: spacing.sm } : undefined]}>{label}</Text>
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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },
  label: { ...typography.h3 },
  disabled: { opacity: 0.5 },
});
