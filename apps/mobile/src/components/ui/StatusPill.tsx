import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export type PillTone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'info' | 'progress';

const TONE_STYLES: Record<PillTone, { bg: string; text: string }> = {
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  danger: { bg: colors.dangerLight, text: colors.danger },
  neutral: { bg: colors.neutralLight, text: colors.textSecondary },
  primary: { bg: colors.primaryLight, text: colors.primary },
  // Same as the web Badge: sky for scheduled/sent, violet for on-the-way.
  info: { bg: colors.infoLight, text: colors.info },
  progress: { bg: colors.progressLight, text: colors.progress },
};

// Order/dispatch/collection statuses across the app were each rendering
// their own inline color-lookup map — this centralizes the "pill" look and
// the (status string) -> tone mapping callers pass in explicitly.
export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: PillTone }) {
  const t = TONE_STYLES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]} accessible accessibilityLabel={`Status: ${label}`}>
      <View style={[styles.dot, { backgroundColor: t.text }]} />
      <Text style={[styles.text, { color: t.text }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { ...typography.caption, fontFamily: typography.h3.fontFamily, fontSize: 11, lineHeight: 15 },
});
