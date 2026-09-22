import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { PerformanceService } from '@bharatsales/api-client';
import { colors, formatCurrency, formatDate, formatNumber } from '../../src/lib/theme';
import { radius, spacing, typography } from '../../src/theme/tokens';
import { useIsOnline } from '../../src/hooks/useIsOnline';
import { ScreenHeader, ErrorState, SkeletonList, Card, SectionHeader } from '../../src/components/ui';

export default function ReportsScreen() {
  const [date] = useState(new Date().toISOString().slice(0, 10));
  const isOnline = useIsOnline();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['dsr', date],
    queryFn: () => PerformanceService.getDSR(date),
  });

  const metrics = data?.metrics || { totalVisits: 0, productiveVisits: 0, totalOrderValue: 0, totalCollections: 0, ordersCount: 0, totalDistanceKm: 0 };

  const rows = [
    { label: 'Orders Booked', value: formatNumber(metrics.ordersCount || 0), icon: 'receipt' as const },
    { label: 'Total Visits', value: formatNumber(metrics.totalVisits || 0), icon: 'walk' as const },
    { label: 'Productive Visits', value: formatNumber(metrics.productiveVisits || 0), icon: 'checkmark-circle' as const },
    { label: 'Distance Travelled', value: `${metrics.totalDistanceKm || 0} km`, icon: 'navigate' as const },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Today's Report" subtitle={formatDate(date)} />

      {isLoading ? (
        <View style={styles.scroll}><SkeletonList count={6} /></View>
      ) : isError ? (
        <View style={styles.scroll}><ErrorState offline={!isOnline} onRetry={() => refetch()} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
        >
          <View style={styles.moneyRow}>
            <Card style={[styles.moneyCard, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}>
              <Ionicons name="cash" size={20} color={colors.primary} />
              <Text style={styles.moneyLabel}>Today&apos;s Sales</Text>
              <Text style={styles.moneyValue} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(metrics.totalOrderValue)}</Text>
            </Card>
            <Card style={[styles.moneyCard, { backgroundColor: colors.successLight, borderColor: colors.successBorder }]}>
              <Ionicons name="wallet" size={20} color={colors.success} />
              <Text style={styles.moneyLabel}>Collections</Text>
              <Text style={styles.moneyValue} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(metrics.totalCollections)}</Text>
            </Card>
          </View>

          <SectionHeader title="Activity" />
          <Card padding={0}>
            {rows.map((row, idx) => (
              <View key={row.label} style={[styles.row, idx > 0 && styles.rowBorder]} accessible accessibilityLabel={`${row.label}: ${row.value}`}>
                <View style={styles.rowIcon}><Ionicons name={row.icon} size={18} color={colors.primary} /></View>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))}
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  moneyRow: { flexDirection: 'row', gap: spacing.md },
  moneyCard: { flex: 1, gap: spacing.xs },
  moneyLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  moneyValue: { ...typography.h1, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 60 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  rowLabel: { ...typography.bodyMedium, flex: 1, color: colors.text },
  rowValue: { ...typography.h3, color: colors.text },
});
