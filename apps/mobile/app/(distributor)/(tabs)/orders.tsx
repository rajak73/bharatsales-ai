import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, formatCurrency } from '../../../src/lib/theme';
import { spacing, radius, typography } from '../../../src/theme/tokens';
import { useLocalOrders } from '../../../src/hooks/useLocalData';
import { useIsOnline } from '../../../src/hooks/useIsOnline';
import { ORDER_STATUS_TONE, orderStatusLabel } from '../../../src/lib/orderStatus';
import { ScreenHeader, EmptyState, ErrorState, SkeletonList, StatusPill } from '../../../src/components/ui';

type FilterKey = 'incoming' | 'pending' | 'delivered' | 'all';

const FILTERS: { key: FilterKey; label: string; statuses: string[] | null }[] = [
  { key: 'incoming', label: 'Incoming', statuses: ['Submitted', 'Pending_Approval'] },
  { key: 'pending', label: 'Pending Dispatch', statuses: ['Approved'] },
  { key: 'delivered', label: 'Delivered', statuses: ['Delivered', 'Partial_Delivery'] },
  { key: 'all', label: 'All', statuses: null },
];

export default function DistributorOrdersScreen() {
  const { data: orders = [], refetch, isRefetching, isLoading, isError } = useLocalOrders();
  const isOnline = useIsOnline();
  const [filter, setFilter] = useState<FilterKey>('incoming');

  const activeFilter = FILTERS.find((f) => f.key === filter)!;
  const filtered = (orders as any[])
    .filter((o) => !activeFilter.statuses || activeFilter.statuses.includes(o.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Order Management" showBack={false} />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f.key} style={[styles.filterChip, filter === f.key && styles.filterChipActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.list}><SkeletonList count={5} /></View>
      ) : isError ? (
        <View style={styles.list}><ErrorState offline={!isOnline} onRetry={() => refetch()} /></View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={filtered}
          keyExtractor={(item: any) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders in this view" />}
          renderItem={({ item }: any) => (
            <TouchableOpacity style={styles.orderCard} onPress={() => router.push({ pathname: '/(distributor)/order/[id]', params: { id: item.id } })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                <Text style={styles.orderAmount}>{formatCurrency(item.totals?.grandTotal)}</Text>
                <StatusPill label={orderStatusLabel(item.status)} tone={ORDER_STATUS_TONE[item.status] || 'neutral'} />
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  filterChipTextActive: { color: colors.primary },
  list: { padding: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.huge },
  orderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  orderNumber: { ...typography.h3, color: colors.text },
  orderDate: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  orderAmount: { ...typography.h3, color: colors.text },
});
