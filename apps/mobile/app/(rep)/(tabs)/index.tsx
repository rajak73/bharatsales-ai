import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { TargetsService } from '@bharatsales/api-client';
import { pickCurrentTarget } from '../../../src/lib/targets';
import { useSessionStore } from '../../../src/store/sessionStore';
import { colors, formatCurrency, isToday } from '../../../src/lib/theme';
import { radius, spacing, typography } from '../../../src/theme/tokens';
import { useCurrentAttendanceSession, useAttendanceActions } from '../../../src/hooks/useAttendance';
import { useLocalOutlets, useLocalBeatSchedules, useLocalOrders } from '../../../src/hooks/useLocalData';
import { SyncBanner } from '../../../src/components/SyncBanner';
import { OrgHeader, KPICard, EmptyState, Card, Button, Banner, SectionHeader, ListItem, ProgressBar } from '../../../src/components/ui';

type QuickAction = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; color?: string; onPress: () => void };

export default function RepHome() {
  const { data: session } = useCurrentAttendanceSession();
  const { endDay } = useAttendanceActions();
  const user = useSessionStore((st) => st.user);
  const { data: outlets = [], refetch: refetchOutlets } = useLocalOutlets();
  const { data: beatSchedules = [], refetch: refetchBeats } = useLocalBeatSchedules();
  const { data: orders = [] } = useLocalOrders();
  const [attendanceBusy, setAttendanceBusy] = useState(false);

  const { data: targets, refetch: refetchTargets, isRefetching } = useQuery({
    queryKey: ['targets', 'mine'],
    queryFn: () => TargetsService.getTargets(),
  });

  // The shortest-period target running today (a Daily one if the manager set
  // one, otherwise e.g. the Monthly target) — reps usually only get Monthly.
  const myTarget = useMemo(() => pickCurrentTarget(targets as any[] | undefined, user?.id), [targets, user?.id]);

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

  const quickActions: QuickAction[] = [
    { key: 'book', label: 'Book Order', icon: 'cart', onPress: () => router.push('/(rep)/catalog') },
    { key: 'beat', label: 'Start Beat', icon: 'navigate', onPress: () => router.push('/(rep)/(tabs)/beat') },
    { key: 'outlets', label: 'All Outlets', icon: 'storefront', onPress: () => router.push('/(rep)/outlets-list') },
    { key: 'reports', label: 'Reports', icon: 'bar-chart', onPress: () => router.push('/(rep)/reports') },
    { key: 'issue', label: 'Report Issue', icon: 'help-buoy', color: colors.danger, onPress: () => router.push('/(rep)/report-issue') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OrgHeader />
      <SyncBanner onPress={() => router.push('/(rep)/(tabs)/profile')} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        {/* Primary action — what the rep should do next */}
        {!session ? (
          <Banner
            tone="warning"
            icon="time-outline"
            title="You're off duty"
            message="Start your day with a selfie check-in to unlock outlet visits and order booking."
            action={{ label: 'Start Day', onPress: () => router.push('/(rep)/attendance') }}
          />
        ) : (
          <Card style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.heroIcon}><Ionicons name="navigate" size={22} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Today&apos;s beat</Text>
                <Text style={styles.heroSubtitle}>
                  {beatOutlets.length > 0 ? `${beatOutlets.length} outlet${beatOutlets.length === 1 ? '' : 's'} on your route` : 'No route assigned — browse all outlets'}
                </Text>
              </View>
            </View>
            <Button
              label={beatOutlets.length > 0 ? 'Continue Beat' : 'Browse Outlets'}
              onPress={() => router.push(beatOutlets.length > 0 ? '/(rep)/(tabs)/beat' : '/(rep)/outlets-list')}
              variant="accent"
              icon={<Ionicons name="arrow-forward-circle" size={20} color={colors.navy} />}
            />
          </Card>
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
            icon="receipt"
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
        <SectionHeader title={myTarget && myTarget.period !== 'Daily' ? `${myTarget.period} Target` : "Today's Target"} actionLabel={myTarget ? 'Details' : undefined} onAction={() => router.push('/(rep)/target')} />
        {!myTarget ? (
          <EmptyState icon="flag-outline" title="No target assigned" message="Please check with your manager." />
        ) : (
          <Card onPress={() => router.push('/(rep)/target')} accessibilityLabel={`${myTarget.period || "Today's"} target ${formatCurrency(myTarget.targetValue)}, achieved ${formatCurrency(myTarget.actualValue)}, ${targetPercentage} percent`}>
            <View style={styles.targetRow}>
              <View>
                <Text style={styles.targetLabel}>Achieved</Text>
                <Text style={styles.targetValue}>{formatCurrency(myTarget.actualValue)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.targetLabel}>Goal</Text>
                <Text style={[styles.targetValue, { color: colors.textSecondary }]}>{formatCurrency(myTarget.targetValue)}</Text>
              </View>
            </View>
            <ProgressBar percent={targetPercentage} height={10} />
            <Text style={styles.progressLabel}>{targetPercentage}% complete</Text>
          </Card>
        )}

        {/* Today's Beat preview */}
        {session ? (
          <>
            <SectionHeader title="Next on your beat" actionLabel="View all" onAction={() => router.push('/(rep)/(tabs)/beat')} />
            {beatPreview.length === 0 ? (
              <EmptyState icon="navigate-outline" title="No beat assigned for today" />
            ) : (
              <View style={styles.list}>
                {beatPreview.map((outlet: any) => (
                  <ListItem
                    key={outlet.id}
                    icon="storefront"
                    title={outlet.name}
                    subtitle={outlet.location?.address || 'Address not available'}
                    onPress={() => router.push({ pathname: '/(rep)/outlet/[id]', params: { id: outlet.id } })}
                    accessibilityLabel={`Visit ${outlet.name}`}
                    trailing={<View style={styles.visitPill}><Text style={styles.visitPillText}>Visit</Text></View>}
                  />
                ))}
              </View>
            )}
          </>
        ) : null}

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickActionsGrid}>
          <Pressable
            style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
            onPress={handleAttendanceQuickAction}
            disabled={attendanceBusy}
            accessibilityRole="button"
            accessibilityLabel={session ? 'Check out and end day' : 'Check in'}
            accessibilityState={{ busy: attendanceBusy }}
          >
            {attendanceBusy ? <ActivityIndicator color={colors.primary} /> : (
              <>
                <View style={[styles.quickIcon, { backgroundColor: session ? colors.dangerLight : colors.primaryLight }]}>
                  <Ionicons name={session ? 'log-out' : 'log-in'} size={20} color={session ? colors.danger : colors.primary} />
                </View>
                <Text style={styles.quickActionText}>{session ? 'Check Out' : 'Check In'}</Text>
              </>
            )}
          </Pressable>
          {quickActions.map((a) => (
            <Pressable
              key={a.key}
              style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
              onPress={a.onPress}
              accessibilityRole="button"
              accessibilityLabel={a.label}
            >
              <View style={[styles.quickIcon, { backgroundColor: a.color === colors.danger ? colors.dangerLight : colors.primaryLight }]}>
                <Ionicons name={a.icon} size={20} color={a.color || colors.primary} />
              </View>
              <Text style={styles.quickActionText} numberOfLines={1}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  heroCard: { gap: spacing.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { ...typography.h2, color: colors.text },
  heroSubtitle: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  targetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  targetLabel: { ...typography.caption, color: colors.textMuted },
  targetValue: { ...typography.h1, color: colors.text, marginTop: 2 },
  progressLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'right' },
  list: { gap: spacing.sm },
  visitPill: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radius.pill },
  visitPillText: { ...typography.caption, fontFamily: typography.h3.fontFamily, color: colors.primary },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickAction: {
    flexBasis: '30%', flexGrow: 1, minHeight: 92, backgroundColor: colors.card, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.xs,
    gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  quickActionPressed: { backgroundColor: colors.bg },
  quickIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  quickActionText: { ...typography.caption, fontFamily: typography.h3.fontFamily, color: colors.text, textAlign: 'center' },
});
