import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, touchTarget, typography } from '../theme/tokens';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useIsOnline } from '../hooks/useIsOnline';

interface SyncBannerProps {
  // Where "review" goes — both roles keep the full SyncStatusCard (force
  // sync, retry/discard failed items) on their Profile tab.
  onPress?: () => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Always-visible connectivity + offline-queue status strip for the Home
// dashboards. Read-only: it only reflects useIsOnline()/useSyncStatus() —
// all actual syncing stays in SyncEngine.
export function SyncBanner({ onPress }: SyncBannerProps) {
  const isOnline = useIsOnline();
  const { isSyncing, pendingCount, failedCount } = useSyncStatus();

  let tone: { bg: string; fg: string };
  let icon: keyof typeof Ionicons.glyphMap;
  let text: string;
  let showSpinner = false;

  if (!isOnline) {
    tone = { bg: colors.warningLight, fg: colors.warningText };
    icon = 'cloud-offline';
    text = pendingCount > 0
      ? `Offline · ${plural(pendingCount, 'change')} saved on this phone, will sync when back online`
      : "Offline · you can keep working, we'll sync when you're back online";
  } else if (failedCount > 0) {
    tone = { bg: colors.dangerLight, fg: colors.danger };
    icon = 'alert-circle';
    text = `${plural(failedCount, 'item')} couldn't sync · tap to review`;
  } else if (isSyncing) {
    tone = { bg: colors.primaryLight, fg: colors.primaryDark };
    icon = 'sync';
    showSpinner = true;
    text = pendingCount > 0 ? `Syncing ${plural(pendingCount, 'change')}…` : 'Syncing…';
  } else if (pendingCount > 0) {
    tone = { bg: colors.warningLight, fg: colors.warningText };
    icon = 'time-outline';
    text = `${plural(pendingCount, 'change')} waiting to sync`;
  } else {
    tone = { bg: colors.successLight, fg: colors.success };
    icon = 'cloud-done';
    text = 'Online · all changes synced';
  }

  const content = (
    <>
      {showSpinner ? <ActivityIndicator size="small" color={tone.fg} /> : <Ionicons name={icon} size={16} color={tone.fg} />}
      <Text style={[styles.text, { color: tone.fg }]} numberOfLines={2}>{text}</Text>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={tone.fg} /> : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.strip, { backgroundColor: tone.bg }]} accessibilityLiveRegion="polite" accessible accessibilityLabel={text}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityHint="Opens sync details on your profile"
      accessibilityLiveRegion="polite"
      style={({ pressed }) => [styles.strip, { backgroundColor: tone.bg }, pressed && { opacity: 0.8 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, minHeight: touchTarget },
  text: { ...typography.caption, flex: 1 },
});
