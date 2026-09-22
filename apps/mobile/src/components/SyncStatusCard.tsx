import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography, formatDateTime } from '../lib/theme';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useSessionStore, userIdOf } from '../store/sessionStore';
import { SyncEngine, refreshSyncStatus } from '../sync/syncEngine';
import { getFailed, retryFailed, discardFailed, type FailedQueueItem } from '../db/syncQueue';
import type { SyncAction } from '../db/client';
import { Card, Button } from './ui';

const ACTION_LABELS: Record<SyncAction, string> = {
  CREATE_ORDER: 'Order',
  UPDATE_OUTLET: 'Outlet update',
  CREATE_PAYMENT: 'Payment collection',
  CREATE_LOCATION_PING: 'Location ping',
  CREATE_VISIT: 'Visit check-in',
  UPDATE_VISIT: 'Visit check-out',
  CLOCK_IN: 'Start day',
  CLOCK_OUT: 'End day',
  APPROVE_ORDER: 'Order approval',
  REJECT_ORDER: 'Order rejection',
  DISPATCH_ORDER: 'Order dispatch',
  CONFIRM_DELIVERY: 'Delivery confirmation',
};

function describeItem(item: FailedQueueItem): string {
  const p = item.payload || {};
  const ref = p.orderNumber || p.receiptNumber || '';
  return ref ? `${ACTION_LABELS[item.action] ?? item.action} ${ref}` : ACTION_LABELS[item.action] ?? item.action;
}

// Sync status + "Force Sync" + the list of items the server permanently
// rejected (or that exhausted their retries), each with Retry/Discard.
export function SyncStatusCard() {
  const user = useSessionStore((s) => s.user);
  const userId = userIdOf(user);
  const syncStatus = useSyncStatus();
  const queryClient = useQueryClient();
  const [forcingSync, setForcingSync] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Under the ['local'] prefix so SyncEngine's post-sync invalidation
  // refreshes it automatically.
  const { data: failed = [] } = useQuery({
    queryKey: ['local', 'syncQueue', 'failed', userId, syncStatus.failedCount],
    queryFn: () => getFailed(userId),
  });

  const refreshFailed = async () => {
    await refreshSyncStatus();
    await queryClient.invalidateQueries({ queryKey: ['local'] });
  };

  const handleForceSync = async () => {
    setForcingSync(true);
    try {
      if (user?.role === 'Sales Representative' || user?.role === 'Distributor') {
        await SyncEngine.pullSync(user.role);
      }
      await SyncEngine.triggerSync();
    } catch (err: any) {
      Alert.alert('Sync failed', err?.message || 'Could not sync right now. Please try again.');
    } finally {
      setForcingSync(false);
    }
  };

  const handleRetry = async (item: FailedQueueItem) => {
    setBusyId(item.id);
    try {
      await retryFailed(item.id, userId);
      await refreshFailed();
      await SyncEngine.triggerSync();
    } catch (err: any) {
      Alert.alert('Retry failed', err?.message || 'Could not retry this item.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDiscard = (item: FailedQueueItem) => {
    Alert.alert(
      'Discard this item?',
      item.foreign
        ? `${describeItem(item)} was saved on this device by another user. Discarding it deletes it permanently; it will never be sent to the server.`
        : `${describeItem(item)} will be permanently deleted from this device and never sent to the server.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            setBusyId(item.id);
            try {
              await discardFailed(item.id, userId);
              await refreshFailed();
            } catch (err: any) {
              Alert.alert('Discard failed', err?.message || 'Could not discard this item.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  const hasPending = syncStatus.pendingCount > 0;
  const hasFailed = failed.length > 0 || syncStatus.failedCount > 0;
  const icon = hasFailed ? 'alert-circle' : hasPending ? 'cloud-offline' : 'cloud-done';
  const iconColor = hasFailed ? colors.danger : hasPending ? colors.warning : colors.success;
  const text = syncStatus.isSyncing
    ? 'Syncing…'
    : hasPending
      ? `${syncStatus.pendingCount} item(s) waiting to sync.`
      : hasFailed
        ? 'Some items could not be synced.'
        : 'Everything is synced.';

  return (
    <Card>
      <View style={styles.syncRow}>
        <View style={[styles.syncIcon, { backgroundColor: hasFailed ? colors.dangerLight : hasPending ? colors.warningLight : colors.successLight }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.syncTitle}>Offline sync</Text>
          <Text style={styles.syncText} accessibilityLiveRegion="polite">{text}</Text>
        </View>
      </View>

      {failed.length > 0 && (
        <View style={styles.failedList}>
          <Text style={styles.failedTitle}>{failed.length} item(s) need attention</Text>
          {failed.map((item) => (
            <View key={item.id} style={styles.failedRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.failedName} numberOfLines={1}>{describeItem(item)}</Text>
                <Text style={styles.failedMeta} numberOfLines={2}>
                  {formatDateTime(item.createdAt)}
                  {item.foreign
                    ? ' · Belongs to another user. It will sync when they log in on this device.'
                    : item.error ? ` · ${item.error}` : ''}
                </Text>
              </View>
              {busyId === item.id ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <View style={styles.failedActions}>
                  {!item.foreign && (
                    <TouchableOpacity style={styles.retryBtn} onPress={() => handleRetry(item)} hitSlop={{ top: 4, bottom: 4 }} accessibilityRole="button" accessibilityLabel={`Retry sync of ${describeItem(item)}`}>
                      <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.discardBtn} onPress={() => handleDiscard(item)} hitSlop={{ top: 4, bottom: 4 }} accessibilityRole="button" accessibilityLabel={`Discard ${describeItem(item)}`}>
                    <Text style={styles.discardText}>Discard</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <Button
        label="Force Sync Now"
        onPress={handleForceSync}
        loading={forcingSync}
        variant="secondary"
        icon={<Ionicons name="refresh" size={16} color={colors.primary} />}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  syncIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  syncTitle: { ...typography.h3, color: colors.text },
  syncText: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  failedList: { marginBottom: spacing.md, gap: spacing.sm },
  failedTitle: { ...typography.caption, fontFamily: typography.h3.fontFamily, color: colors.danger },
  failedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.dangerLight },
  failedName: { ...typography.bodyMedium, fontFamily: typography.h3.fontFamily, color: colors.text },
  failedMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  failedActions: { flexDirection: 'row', gap: spacing.sm },
  retryBtn: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primaryBorder },
  retryText: { ...typography.caption, fontFamily: typography.h3.fontFamily, color: colors.primary },
  discardBtn: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.danger },
  discardText: { ...typography.caption, fontFamily: typography.h3.fontFamily, color: colors.danger },
});
