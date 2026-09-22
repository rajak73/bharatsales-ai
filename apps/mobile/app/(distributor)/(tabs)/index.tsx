import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, formatCurrency } from '../../../src/lib/theme';
import { radius, spacing, typography } from '../../../src/theme/tokens';
import { useLocalOrders, useLocalDispatches, useLocalInventory } from '../../../src/hooks/useLocalData';
import { SyncBanner } from '../../../src/components/SyncBanner';
import { OrgHeader, KPICard, Card, Button, Banner, SectionHeader, ListItem, StatusPill } from '../../../src/components/ui';
import { statusTone, orderStatusLabel } from '../../../src/lib/orderStatus';

export default function DistributorHome() {
  const { data: orders = [], refetch: refetchOrders, isRefetching } = useLocalOrders();
  const { refetch: refetchDispatches } = useLocalDispatches();
  const { data: inventory = [], refetch: refetchInventory } = useLocalInventory();

  const incoming = (orders as any[]).filter((o) => ['Submitted', 'Pending_Approval'].includes(o.status));
  const pending = (orders as any[]).filter((o) => o.status === 'Approved');
  const delivered = (orders as any[]).filter((o) => o.status === 'Delivered');
  const lowStock = (inventory as any[]).filter((i) => i.stock <= (i.reservedStock || 0) + 10);

  const latestIncoming = [...incoming]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const onRefresh = () => {
    refetchOrders();
    refetchDispatches();
    refetchInventory();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OrgHeader />
      <SyncBanner onPress={() => router.push('/(distributor)/(tabs)/profile')} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        {/* Primary action — orders waiting on this distributor */}
        {incoming.length > 0 ? (
          <Card style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.heroIcon}><Ionicons name="download" size={22} color={colors.warning} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>{incoming.length} order{incoming.length === 1 ? '' : 's'} waiting for you</Text>
                <Text style={styles.heroSubtitle}>Review and accept them so they can be dispatched on time.</Text>
              </View>
            </View>
            <Button
              label="Review Incoming Orders"
              onPress={() => router.push('/(distributor)/(tabs)/orders')}
              variant="accent"
              icon={<Ionicons name="arrow-forward-circle" size={20} color={colors.navy} />}
            />
          </Card>
        ) : (
          <Banner tone="success" icon="checkmark-done" title="You're all caught up" message="No incoming orders need your review right now." />
        )}

        <View style={styles.statsGrid}>
          <KPICard icon="download" iconColor={colors.warning} iconBackground={colors.warningLight} value={incoming.length} label="Incoming Orders" onPress={() => router.push('/(distributor)/(tabs)/orders')} />
          <KPICard icon="time" value={pending.length} label="Pending Dispatch" onPress={() => router.push('/(distributor)/(tabs)/deliveries')} />
          <KPICard icon="checkmark-done" iconColor={colors.success} iconBackground={colors.successLight} value={delivered.length} label="Delivered" onPress={() => router.push('/(distributor)/(tabs)/orders')} />
          <KPICard icon="alert-circle" iconColor={colors.danger} iconBackground={colors.dangerLight} value={lowStock.length} label="Low Stock Items" onPress={() => router.push('/(distributor)/(tabs)/inventory')} />
        </View>

        {latestIncoming.length > 0 && (
          <>
            <SectionHeader title="Latest incoming" actionLabel="View all" onAction={() => router.push('/(distributor)/(tabs)/orders')} />
            <View style={styles.list}>
              {latestIncoming.map((o: any) => (
                <ListItem
                  key={o.id}
                  icon="receipt-outline"
                  title={o.orderNumber || 'Order'}
                  subtitle={formatCurrency(o.totals?.grandTotal)}
                  showChevron
                  onPress={() => router.push({ pathname: '/(distributor)/order/[id]', params: { id: o.id } })}
                  trailing={<StatusPill label={orderStatusLabel(o.status)} tone={statusTone(o.status)} />}
                />
              ))}
            </View>
          </>
        )}

        <SectionHeader title="Finance" />
        <ListItem
          icon="wallet"
          iconColor={colors.success}
          iconBackground={colors.successLight}
          title="Payments"
          subtitle="Pending & received payments, invoices"
          showChevron
          onPress={() => router.push('/(distributor)/payments')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  heroCard: { gap: spacing.lg, borderColor: colors.warningBorder },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.warningLight, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { ...typography.h2, color: colors.text },
  heroSubtitle: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  list: { gap: spacing.sm },
});
