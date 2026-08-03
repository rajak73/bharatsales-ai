import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  offline?: boolean;
}

// New convention — no screen had a real error UI before this redesign
// (confirmed: useLocalData/useQuery results were only ever destructured for
// `data`, never `isError`). Distinguishes "you're offline" (informational,
// not really an error — data will arrive once reconnected) from a genuine
// fetch failure (shows Retry).
export function ErrorState({ message, onRetry, offline }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, offline && { backgroundColor: colors.warningLight }]}>
        <Ionicons name={offline ? 'cloud-offline' : 'alert-circle'} size={32} color={offline ? colors.warning : colors.danger} />
      </View>
      <Text style={styles.title}>{offline ? "You're offline" : 'Something went wrong'}</Text>
      <Text style={styles.message}>
        {message || (offline ? 'Showing the last synced data. It will refresh automatically once you reconnect.' : 'Please try again.')}
      </Text>
      {onRetry && !offline && (
        <Button label="Retry" onPress={onRetry} variant="secondary" fullWidth={false} style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xxl }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xxxl },
  iconWrap: { width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.dangerLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.text, textAlign: 'center' },
  message: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
});
