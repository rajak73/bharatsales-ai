import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { TargetsService } from '@bharatsales/api-client';
import { colors, formatCurrency, isToday } from '../../../src/lib/theme';
import { radius, spacing, typography } from '../../../src/theme/tokens';
import { useCurrentAttendanceSession, useAttendanceActions } from '../../../src/hooks/useAttendance';
import { useLocalOutlets, useLocalBeatSchedules, useLocalOrders } from '../../../src/hooks/useLocalData';
import { useSyncStatus } from '../../../src/hooks/useSyncStatus';
import { OrgHeader, KPICard, EmptyState } from '../../../src/components/ui';

export default function RepHome() {
  const { data: session } = useCurrentAttendanceSession();
  const { endDay } = useAttendanceActions();
  const syncStatus = useSyncStatus();
  const { data: outlets = [], refetch: refetchOutlets } = useLocalOutlets();
  const { data: beatSchedules = [], refetch: refetchBeats } = useLocalBeatSchedules();
  const { data: orders = [] } = useLocalOrders();
  const [attendanceBusy, setAttendanceBusy] = useState(false);

  const { data: targets, refetch: refetchTargets, isRefetching } = useQuery({
    queryKey: ['targets', 'mine'],
    queryFn: () => TargetsService.getTargets(),
  });

  const myTarget = useMemo(() => {
    if (!targets) return null;
    return (targets as any[]).find((t) => t.entityType === 'User' && t.period === 'Daily') || null;
  }, [targets]);

  const targetPercentage = myTarget?.targetValue ? Math.round(((myTarget.actualValue || 0) / myTarget.targetValue) * 100) : 0;

  const todayBeat = beatSchedules.find((s: any) => isToday(s.date)) ?? beatSchedules[0];
  let beatOutlets: any[] = [];
  if (todayBeat && todayBeat.beat && typeof todayBeat.beat !== 'string') {
    const routeOutletIds = ((todayBeat.beat as any).outlets || []).map((o: any) => o._id || o.id || o);
    beatOutlets = outlets.filter((o: any) => routeOutletIds.includes(o.id));
  }
  const beatPreview = beatOutlets.slice(0, 3);

  const todaysOrders = (orders as any[]).filter((o) => isToday(o.createdAt));

  const onRefresh = () => {
    refetchOutlets();
    refetchBeats();
    refetchTargets();
  };

  const handleAttendanceQuickAction = async () => {
    setAttendanceBusy(true);
    try {
      if (session) {
        await endDay();
      } else {
        // Quick-action Check In skips the selfie capture (kept mandatory on
        // the dedicated Attendance screen); route there instead so the
        // photo requirement isn't silently bypassed.
        router.push('/(rep)/attendance');
        return;
      }
    } catch (err) {
      console.error('[Home] attendance quick action failed', err);
    } finally {
      setAttendanceBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OrgHeader />

      {syncStatus.isSyncing && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncBannerText}>Syncing {syncStatus.pendingCount} offline action{syncStatus.pendingCount === 1 ? '' : 's'}...</Text>
        </View>
      )}
      {!syncStatus.isSyncing && syncStatus.pendingCount > 0 && (
        <View style={[styles.syncBanner, { backgroundColor: colors.warning }]}>
          <Text style={styles.syncBannerText}>{syncStatus.pendingCount} action{syncStatus.pendingCount === 1 ? '' : 's'} queued, waiting for connection</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}>
        {!session && (
          <View style={styles.warningBanner}>
            <Ionicons name="alert-circle" size={18} color="#B45309" />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.warningTitle}>You are Off Duty</Text>
              <Text style={styles.warningText}>Check in to start visiting outlets today.</Text>
              <TouchableOpacity style={styles.warningButton} onPress={() => router.push('/(rep)/attendance')}>
                <Text style={styles.warningButtonText}>Check In</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Today's KPIs */}
        <View style={styles.kpiGrid}>
          <KPICard
            icon={session ? 'checkmark-done-circle' : 'time-outline'}
            iconColor={session ? colors.success : colors.warning}
            iconBackground={session ? colors.successLight : colors.warningLight}
            value={session ? 'On Duty' : 'Off Duty'}
            label="Attendance"
            onPress={() => router.push('/(rep)/attendance')}
          />
          <KPICard
            icon="cube"
            value={todaysOrders.length}
            label="Today's Orders"
            onPress={() => router.push('/(rep)/(tabs)/orders')}
          />
          <KPICard
            icon="storefront"
            value={beatOutlets.length}
            label="Beat Outlets Today"
            onPress={() => router.push('/(rep)/(tabs)/beat')}
          />
          <KPICard
            icon="trending-up"
            iconColor={colors.success}
            iconBackground={colors.successLight}
            value={`${targetPercentage}%`}
            label="Target Achieved"
            onPress={() => router.push('/(rep)/target')}
          />
        </View>

        {/* Target Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today&apos;s Target Progress</Text>
          {!myTarget ? (
            <EmptyState icon="flag-outline" title="No target assigned" message="Please check with your manager." />
          ) : (
            <TouchableOpacity onPress={() => router.push('/(rep)/target')}>
              <View style={styles.targetRow}>
                <View>
                  <Text style={styles.targetLabel}>Goal</Text>
                  <Text style={styles.targetValue}>{formatCurrency(myTarget.targetValue)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.targetLabel}>Achieved</Text>
                  <Text style={styles.targetValue}>{formatCurrency(myTarget.actualValue)}</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(100, targetPercentage)}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{targetPercentage}% complete</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Today&apos;s Beat preview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Beat</Text>
          <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push('/(rep)/(tabs)/beat')}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {!session ? null : beatPreview.length === 0 ? (
          <EmptyState icon="navigate-outline" title="No beat assigned for today" />
        ) : (
          beatPreview.map((outlet: any) => (
            <View key={outlet.id} style={styles.outletCard}>
              <View style={styles.outletIcon}><Ionicons name="storefront" size={18} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.outletName} numberOfLines={1}>{outlet.name}</Text>
                <Text style={styles.outletAddress} numberOfLines={1}>{outlet.location?.address || 'Unknown'}</Text>
              </View>
              <TouchableOpacity style={styles.visitBtn} onPress={() => router.push({ pathname: '/(rep)/outlet/[id]', params: { id: outlet.id } })}>
                <Text style={styles.visitBtnText}>Visit</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickAction} onPress={handleAttendanceQuickAction} disabled={attendanceBusy}>
            {attendanceBusy ? <ActivityIndicator color={colors.primary} /> : (
              <>
                <Ionicons name={session ? 'log-out' : 'log-in'} size={22} color={session ? colors.danger : colors.primary} />
                <Text style={styles.quickActionText}>{session ? 'Check Out' : 'Check In'}</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(rep)/(tabs)/beat')}>
            <Ionicons name="navigate" size={22} color={colors.primary} />
            <Text style={styles.quickActionText}>Start Beat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(rep)/catalog')}>
            <Ionicons name="cart" size={22} color={colors.primary} />
            <Text style={styles.quickActionText}>Book Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(rep)/(tabs)/beat')}>
            <Ionicons name="map" size={22} color={colors.primary} />
            <Text style={styles.quickActionText}>Today&apos;s Route</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(rep)/reports')}>
            <Ionicons name="bar-chart" size={22} color={colors.primary} />
            <Text style={styles.quickActionText}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(rep)/report-issue')}>
            <Ionicons name="warning" size={22} color={colors.danger} />
            <Text style={styles.quickActionText}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  syncBanner: { backgroundColor: '#3B82F6', paddingVertical: spacing.sm, alignItems: 'center' },
  syncBannerText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  scroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.huge },
  warningBanner: { flexDirection: 'row', backgroundColor: colors.warningLight, borderWidth: 1, borderColor: '#FDE68A', borderRadius: radius.lg, padding: spacing.lg },
  warningTitle: { fontWeight: '700', color: '#92400E', marginBottom: spacing.xs },
  warningText: { color: '#92400E', fontSize: 12, marginBottom: spacing.sm },
  warningButton: { backgroundColor: '#D97706', borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, alignSelf: 'flex-start' },
  warningButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  cardTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  targetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  targetLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  targetValue: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 2 },
  progressBar: { height: 10, backgroundColor: colors.bg, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },
  progressLabel: { fontSize: 11, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'right' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.h1, fontSize: 17, color: colors.text },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  outletCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  outletIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  outletName: { fontWeight: '700', color: colors.text, fontSize: 13 },
  outletAddress: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  visitBtn: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.sm },
  visitBtnText: { color: colors.primary, fontWeight: '700', fontSize: 11 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickAction: { flexBasis: '30%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.lg, alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  quickActionText: { fontSize: 11, fontWeight: '700', color: colors.text, textAlign: 'center' },
});
