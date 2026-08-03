import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export type PillTone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

const TONE_STYLES: Record<PillTone, { bg: string; text: string }> = {
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  danger: { bg: colors.dangerLight, text: colors.danger },
  neutral: { bg: '#F1F5F9', text: colors.textMuted },
  primary: { bg: colors.primaryLight, text: colors.primary },
};

// Order/dispatch/collection statuses across the app were each rendering
// their own inline color-lookup map — this centralizes the "pill" look and
// the (status string) -> tone mapping callers pass in explicitly.
export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: PillTone }) {
  const t = TONE_STYLES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, alignSelf: 'flex-start' },
  text: { ...typography.tiny, textTransform: 'uppercase' },
});
