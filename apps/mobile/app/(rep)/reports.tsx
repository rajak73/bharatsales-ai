import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { PerformanceService } from '@bharatsales/api-client';
import { colors, formatCurrency } from '../../src/lib/theme';
import { useIsOnline } from '../../src/hooks/useIsOnline';
import { ScreenHeader, ErrorState, SkeletonList } from '../../src/components/ui';

export default function ReportsScreen() {
  const [date] = useState(new Date().toISOString().slice(0, 10));
  const isOnline = useIsOnline();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dsr', date],
    queryFn: () => PerformanceService.getDSR(date),
  });

  const metrics = data?.metrics || { totalVisits: 0, productiveVisits: 0, totalOrderValue: 0, totalCollections: 0, ordersCount: 0, totalDistanceKm: 0 };

  const rows = [
    { label: "Today's Sales", value: formatCurrency(metrics.totalOrderValue), icon: 'cash' as const },
    { label: 'Orders Booked', value: String(metrics.ordersCount || 0), icon: 'cube' as const },
    { label: 'Total Visits', value: String(metrics.totalVisits || 0), icon: 'walk' as const },
    { label: 'Productive Visits', value: String(metrics.productiveVisits || 0), icon: 'checkmark-circle' as const },
    { label: 'Collections', value: formatCurrency(metrics.totalCollections), icon: 'wallet' as const },
    { label: 'Distance Travelled', value: `${metrics.totalDistanceKm || 0} km`, icon: 'navigate' as const },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Today's Report" />

      {isLoading ? (
        <View style={styles.scroll}><SkeletonList count={6} /></View>
      ) : isError ? (
        <View style={styles.scroll}><ErrorState offline={!isOnline} onRetry={() => refetch()} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <View style={styles.rowIcon}><Ionicons name={row.icon} size={18} color={colors.primary} /></View>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
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
  scroll: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  rowValue: { fontSize: 14, fontWeight: '800', color: colors.text },
});
