import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { TargetsService } from '@bharatsales/api-client';
import { colors, formatCurrency } from '../../src/lib/theme';
import { statusTone } from '../../src/lib/orderStatus';
import { spacing, typography } from '../../src/theme/tokens';
import { useSessionStore } from '../../src/store/sessionStore';
import { useIsOnline } from '../../src/hooks/useIsOnline';
import { ScreenHeader, EmptyState, ErrorState, SkeletonList, Card, StatusPill, ProgressBar } from '../../src/components/ui';

const PERIOD_ORDER = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'];

export default function TargetScreen() {
  const user = useSessionStore((s) => s.user);
  const isOnline = useIsOnline();
  const { data: targets = [], isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['targets', 'mine'],
    queryFn: () => TargetsService.getTargets(),
  });

  const myTargets = (targets as any[])
    .filter((t) => t.entityType === 'User' && t.entityId === user?.id)
    .sort((a, b) => PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="My Targets" />

      {isLoading ? (
        <View style={styles.scroll}><SkeletonList count={3} /></View>
      ) : isError ? (
        <View style={styles.scroll}><ErrorState offline={!isOnline} onRetry={() => refetch()} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
        >
          {myTargets.length === 0 ? (
            <EmptyState icon="flag-outline" title="No targets assigned yet" message="Your manager hasn't set targets for you. Pull down to refresh." />
          ) : (
            myTargets.map((t) => {
              const percentage = t.targetValue ? Math.round(((t.actualValue || 0) / t.targetValue) * 100) : 0;
              const remaining = Math.max(0, t.targetValue - (t.actualValue || 0));
              return (
                <Card key={t.id}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.periodLabel}>{t.period}</Text>
                    <StatusPill label={t.status} tone={statusTone(t.status)} />
                  </View>
                  <View style={styles.percentRow}>
                    <Text style={styles.percentValue}>{percentage}%</Text>
                    <Text style={styles.percentLabel}>achieved</Text>
                  </View>
                  <ProgressBar percent={percentage} height={10} accessibilityLabel={`${t.period} target progress`} />
                  <View style={styles.statsRow}>
                    <Stat label="Target" value={formatCurrency(t.targetValue)} />
                    <Stat label="Achieved" value={formatCurrency(t.actualValue)} color={colors.success} align="center" />
                    <Stat label="Remaining" value={formatCurrency(remaining)} align="right" />
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value, color, align = 'left' }: { label: string; value: string; color?: string; align?: 'left' | 'center' | 'right' }) {
  const alignItems = align === 'left' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end';
  return (
    <View style={{ flex: 1, alignItems }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : undefined]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  periodLabel: { ...typography.h2, color: colors.text },
  percentRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.sm },
  percentValue: { ...typography.display, color: colors.text },
  percentLabel: { ...typography.body, color: colors.textMuted },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, gap: spacing.sm },
  statLabel: { ...typography.caption, color: colors.textMuted },
  statValue: { ...typography.h3, color: colors.text, marginTop: 2 },
});
