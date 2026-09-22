import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, formatCurrency, formatDate } from '../../../src/lib/theme';
import { spacing, typography } from '../../../src/theme/tokens';
import { useLocalOrders, useLocalOutlets } from '../../../src/hooks/useLocalData';
import { useIsOnline } from '../../../src/hooks/useIsOnline';
import { useServerRefresh } from '../../../src/hooks/useServerRefresh';
import { statusTone, orderStatusLabel } from '../../../src/lib/orderStatus';
import { ScreenHeader, EmptyState, ErrorState, SkeletonList, StatusPill, ListItem } from '../../../src/components/ui';

export default function OrdersScreen() {
  const { data: orders = [], refetch, isLoading, isError } = useLocalOrders();
  // Pull-to-refresh re-downloads, so Dispatched / Delivered updates show up.
  const { refreshing, onRefresh } = useServerRefresh(refetch);
  const { data: outlets = [] } = useLocalOutlets();
  const isOnline = useIsOnline();

  const outletName = (outletId: string) => (outlets as any[]).find((o) => o.id === outletId)?.name || 'Unknown Outlet';
  const sorted = [...orders].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="My Orders"
        subtitle={sorted.length > 0 ? `${sorted.length} order${sorted.length === 1 ? '' : 's'} booked` : "Orders you've booked"}
        showBack={false}
        rightAction={{ icon: 'add-circle-outline', accessibilityLabel: 'Book a new order', onPress: () => router.push('/(rep)/catalog') }}
      />

      {isLoading ? (
        <View style={styles.list}><SkeletonList count={5} /></View>
      ) : isError ? (
        <View style={styles.list}><ErrorState offline={!isOnline} onRetry={() => refetch()} /></View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={sorted}
          keyExtractor={(item: any) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No orders yet"
              message="Orders you book from the catalog will show up here."
              actionLabel="Book an Order"
              onAction={() => router.push('/(rep)/catalog')}
            />
          }
          renderItem={({ item }: any) => (
            <ListItem
              icon="receipt-outline"
              title={outletName(item.outletId)}
              subtitle={item.orderNumber || 'Order'}
              meta={formatDate(item.createdAt)}
              accessibilityLabel={`${outletName(item.outletId)}, ${item.orderNumber}, ${formatCurrency(item.totals?.grandTotal)}, ${orderStatusLabel(item.status)}`}
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
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  trailing: { alignItems: 'flex-end', gap: spacing.xs },
  amount: { ...typography.h3, color: colors.text },
});
