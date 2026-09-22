import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../theme/tokens';

interface SuccessStateProps {
  title: string;
  message?: string;
  // e.g. "Saved on this device — will sync automatically"
  note?: string;
}

// Full-screen confirmation shown briefly after an order / payment / delivery
// / ticket is saved, before the screen navigates back on its own.
export function SuccessState({ title, message, note }: SuccessStateProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.iconWrap} accessibilityElementsHidden importantForAccessibility="no">
        <Ionicons name="checkmark-circle" size={64} color={colors.success} />
      </View>
      <Text style={styles.title} accessibilityRole="header" accessibilityLiveRegion="assertive">{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {note ? (
        <View style={styles.note}>
          <Ionicons name="cloud-upload-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.noteText}>{note}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, backgroundColor: colors.bg },
  iconWrap: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.successLight, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h1, color: colors.text, marginTop: spacing.xl, textAlign: 'center' },
  message: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, maxWidth: 320 },
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, backgroundColor: colors.card, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  noteText: { ...typography.caption, color: colors.textSecondary },
});
