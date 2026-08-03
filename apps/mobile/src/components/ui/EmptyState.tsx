import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { Button } from './Button';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// Generalizes the "bordered card, muted icon + muted text" convention that
// several screens already used ad hoc (e.g. orders.tsx's ListEmptyComponent)
// into one shared component, now with an optional primary action per spec
// ("every empty page should have an illustration, message, and action").
export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={32} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="secondary" fullWidth={false} style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xxl }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xxxl },
  iconWrap: { width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.text, textAlign: 'center' },
  message: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
});
