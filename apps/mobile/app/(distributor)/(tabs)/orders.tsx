import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, formatCurrency, formatDate } from '../../../src/lib/theme';
import { spacing, typography } from '../../../src/theme/tokens';
import { useLocalOrders } from '../../../src/hooks/useLocalData';
import { useIsOnline } from '../../../src/hooks/useIsOnline';
import { statusTone, orderStatusLabel } from '../../../src/lib/orderStatus';
import { ScreenHeader, EmptyState, ErrorState, SkeletonList, StatusPill, ListItem, Chip, ChipRow } from '../../../src/components/ui';

type FilterKey = 'incoming' | 'pending' | 'delivered' | 'all';

const FILTERS: { key: FilterKey; label: string; statuses: string[] | null; empty: string }[] = [
  { key: 'incoming', label: 'Incoming', statuses: ['Submitted', 'Pending_Approval'], empty: 'No new orders waiting for review.' },
  { key: 'pending', label: 'To Dispatch', statuses: ['Approved'], empty: 'Accepted orders ready to dispatch will appear here.' },
  { key: 'delivered', label: 'Delivered', statuses: ['Delivered', 'Partial_Delivery'], empty: 'Completed deliveries will appear here.' },
  { key: 'all', label: 'All', statuses: null, empty: 'Orders from sales reps will appear here.' },
];

export default function DistributorOrdersScreen() {
  const { data: orders = [], refetch, isRefetching, isLoading, isError } = useLocalOrders();
  const isOnline = useIsOnline();
  const [filter, setFilter] = useState<FilterKey>('incoming');

  const activeFilter = FILTERS.find((f) => f.key === filter)!;
  const filtered = (orders as any[])
    .filter((o) => !activeFilter.statuses || activeFilter.statuses.includes(o.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const countFor = (f: (typeof FILTERS)[number]) => (orders as any[]).filter((o) => !f.statuses || f.statuses.includes(o.status)).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Orders" subtitle="Review, accept & dispatch" showBack={false} />

      <ChipRow>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} count={countFor(f)} selected={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ChipRow>

      {isLoading ? (
        <View style={styles.list}><SkeletonList count={5} /></View>
      ) : isError ? (
        <View style={styles.list}><ErrorState offline={!isOnline} onRetry={() => refetch()} /></View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={filtered}
          keyExtractor={(item: any) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders in this view" message={activeFilter.empty} />}
          renderItem={({ item }: any) => (
            <ListItem
              icon="receipt-outline"
              title={item.orderNumber || 'Order'}
              subtitle={formatDate(item.createdAt)}
              showChevron
              onPress={() => router.push({ pathname: '/(distributor)/order/[id]', params: { id: item.id } })}
              accessibilityLabel={`${item.orderNumber}, ${formatCurrency(item.totals?.grandTotal)}, ${orderStatusLabel(item.status)}. Opens order`}
              trailing={
                <View style={styles.trailing}>
                  <Text style={styles.amount}>{formatCurrency(item.totals?.grandTotal)}</Text>
                  <StatusPill label={orderStatusLabel(item.status)} tone={statusTone(item.status)} />
                </View>
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xxxl },
  trailing: { alignItems: 'flex-end', gap: spacing.xs },
  amount: { ...typography.h3, color: colors.text },
});
