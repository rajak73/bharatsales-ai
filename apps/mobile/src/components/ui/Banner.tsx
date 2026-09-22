import { View, Text, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, touchTarget, typography } from '../../theme/tokens';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<BannerTone, { bg: string; border: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  info: { bg: colors.primaryLight, border: colors.primaryBorder, fg: colors.primaryDark, icon: 'information-circle' },
  success: { bg: colors.successLight, border: colors.successBorder, fg: colors.success, icon: 'checkmark-circle' },
  warning: { bg: colors.warningLight, border: colors.warningBorder, fg: colors.warningText, icon: 'alert-circle' },
  danger: { bg: colors.dangerLight, border: colors.dangerBorder, fg: colors.danger, icon: 'warning' },
};

interface BannerProps {
  tone?: BannerTone;
  title?: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}

// Inline, in-flow notice (form errors, geofence/credit warnings, "Off duty",
// success confirmations). Replaces the half-dozen ad-hoc warningBanner /
// errorBanner / <Text style={error}> blocks screens used to carry, and is
// announced to screen readers when it appears.
export function Banner({ tone = 'info', title, message, icon, action, style }: BannerProps) {
  const t = TONES[tone];
  return (
    <View
      style={[styles.container, { backgroundColor: t.bg, borderColor: t.border }, style]}
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={icon || t.icon} size={20} color={t.fg} style={styles.icon} />
      <View style={styles.body}>
        {title ? <Text style={[styles.title, { color: t.fg }]}>{title}</Text> : null}
        <Text style={[styles.message, { color: title ? colors.textSecondary : t.fg }]}>{message}</Text>
        {action ? (
          <Pressable
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            hitSlop={{ top: 8, bottom: 8 }}
            style={({ pressed }) => [styles.action, { borderColor: t.fg }, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.actionText, { color: t.fg }]}>{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  icon: { marginTop: 1 },
  body: { flex: 1 },
  title: { ...typography.h3 },
  message: { ...typography.body, marginTop: 2 },
  action: {
    alignSelf: 'flex-start', marginTop: spacing.md, minHeight: touchTarget - 8, justifyContent: 'center',
    paddingHorizontal: spacing.lg, borderRadius: radius.sm, borderWidth: 1.5,
  },
  actionText: { ...typography.bodyMedium, fontFamily: typography.h3.fontFamily },
});
