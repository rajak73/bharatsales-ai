import { Pressable, View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, touchTarget, typography } from '../../theme/tokens';

type Tone = 'plain' | 'primary' | 'onBrand' | 'danger';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  // Required: an icon-only control has no visible text for screen readers.
  accessibilityLabel: string;
  tone?: Tone;
  size?: number;
  badgeCount?: number;
  showDot?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<Tone, { bg: string; fg: string; pressed: string }> = {
  plain: { bg: 'transparent', fg: colors.text, pressed: colors.neutralLight },
  primary: { bg: colors.primaryLight, fg: colors.primary, pressed: colors.primaryBorder },
  onBrand: { bg: 'rgba(255,255,255,0.16)', fg: '#fff', pressed: 'rgba(255,255,255,0.28)' },
  danger: { bg: colors.dangerLight, fg: colors.danger, pressed: colors.dangerBorder },
};

// The one icon-only tappable in the app — always a 48x48 target (the visual
// circle may be smaller) and always labelled for TalkBack/VoiceOver.
export function IconButton({ icon, onPress, accessibilityLabel, tone = 'plain', size = 20, badgeCount, showDot, disabled, style }: IconButtonProps) {
  const t = TONES[tone];
  const badge = badgeCount && badgeCount > 0 ? (badgeCount > 99 ? '99+' : String(badgeCount)) : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${accessibilityLabel}, ${badge}` : accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.base, { backgroundColor: pressed ? t.pressed : t.bg }, disabled && styles.disabled, style]}
    >
      <Ionicons name={icon} size={size} color={t.fg} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : showDot ? (
        <View style={[styles.dot, tone === 'onBrand' && styles.dotOnBrand]} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { width: touchTarget, height: touchTarget, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.4 },
  badge: {
    position: 'absolute', top: 4, right: 2, minWidth: 18, height: 18, paddingHorizontal: 4,
    borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  badgeText: { ...typography.tiny, color: '#fff' },
  dot: { position: 'absolute', top: 11, right: 12, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.danger, borderWidth: 1.5, borderColor: '#fff' },
  dotOnBrand: { borderColor: 'transparent' },
});
