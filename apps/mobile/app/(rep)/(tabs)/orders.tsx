import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, formatCurrency } from '../../../src/lib/theme';
import { spacing, radius, typography } from '../../../src/theme/tokens';
import { useLocalOrders, useLocalOutlets } from '../../../src/hooks/useLocalData';
import { useIsOnline } from '../../../src/hooks/useIsOnline';
import { ORDER_STATUS_TONE, orderStatusLabel } from '../../../src/lib/orderStatus';
import { ScreenHeader, EmptyState, ErrorState, SkeletonList, StatusPill } from '../../../src/components/ui';

export default function OrdersScreen() {
  const { data: orders = [], refetch, isRefetching, isLoading, isError } = useLocalOrders();
  const { data: outlets = [] } = useLocalOutlets();
  const isOnline = useIsOnline();

  const outletName = (outletId: string) => (outlets as any[]).find((o) => o.id === outletId)?.name || 'Unknown Outlet';
  const sorted = [...orders].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="My Orders" subtitle="Orders you've booked" showBack={false} />

      {isLoading ? (
        <View style={styles.list}><SkeletonList count={5} /></View>
      ) : isError ? (
        <View style={styles.list}><ErrorState offline={!isOnline} onRetry={() => refetch()} /></View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={sorted}
          keyExtractor={(item: any) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState icon="cube-outline" title="No orders yet" message="Orders you book from the catalog will show up here." />}
          renderItem={({ item }: any) => (
            <View style={styles.orderCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.outletName} numberOfLines={1}>{outletName(item.outletId)}</Text>
                <Text style={styles.orderMeta}>{item.orderNumber}</Text>
                <Text style={styles.orderMeta}>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                <Text style={styles.orderAmount}>{formatCurrency(item.totals?.grandTotal)}</Text>
                <StatusPill label={orderStatusLabel(item.status)} tone={ORDER_STATUS_TONE[item.status] || 'neutral'} />
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, paddingBottom: spacing.huge },
  orderCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  outletName: { ...typography.h3, color: colors.text },
  orderMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  orderAmount: { ...typography.h3, color: colors.text },
});
