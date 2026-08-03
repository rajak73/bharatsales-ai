import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { TargetsService } from '@bharatsales/api-client';
import { colors, formatCurrency } from '../../src/lib/theme';
import { useSessionStore } from '../../src/store/sessionStore';
import { useIsOnline } from '../../src/hooks/useIsOnline';
import { ScreenHeader, EmptyState, ErrorState, SkeletonList } from '../../src/components/ui';

const PERIOD_ORDER = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'];

export default function TargetScreen() {
  const user = useSessionStore((s) => s.user);
  const isOnline = useIsOnline();
  const { data: targets = [], isLoading, isError, refetch } = useQuery({
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
      ) : myTargets.length === 0 ? (
        <View style={styles.scroll}><EmptyState icon="flag-outline" title="No targets assigned yet" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {myTargets.map((t) => {
            const percentage = t.targetValue ? Math.round(((t.actualValue || 0) / t.targetValue) * 100) : 0;
            const remaining = Math.max(0, t.targetValue - (t.actualValue || 0));
            return (
              <View key={t.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.periodLabel}>{t.period}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: percentage >= 100 ? colors.successLight : percentage >= 60 ? colors.warningLight : colors.dangerLight }]}>
                    <Text style={[styles.statusText, { color: percentage >= 100 ? colors.success : percentage >= 60 ? colors.warning : colors.danger }]}>{t.status}</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, percentage)}%` }]} />
                </View>
                <View style={styles.statsRow}>
                  <View>
                    <Text style={styles.statLabel}>Target</Text>
                    <Text style={styles.statValue}>{formatCurrency(t.targetValue)}</Text>
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Achieved</Text>
                    <Text style={[styles.statValue, { color: colors.success }]}>{formatCurrency(t.actualValue)}</Text>
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Remaining</Text>
                    <Text style={styles.statValue}>{formatCurrency(remaining)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  periodLabel: { fontWeight: '800', color: colors.text, fontSize: 15 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  progressBar: { height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 2 },
});
