import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../../src/lib/theme';
import { radius, spacing, typography } from '../../../src/theme/tokens';
import { useLocalOrders, useLocalDispatches, useLocalInventory } from '../../../src/hooks/useLocalData';
import { useSyncStatus } from '../../../src/hooks/useSyncStatus';
import { OrgHeader, KPICard } from '../../../src/components/ui';

export default function DistributorHome() {
  const syncStatus = useSyncStatus();
  const { data: orders = [], refetch: refetchOrders, isRefetching } = useLocalOrders();
  const { refetch: refetchDispatches } = useLocalDispatches();
  const { data: inventory = [], refetch: refetchInventory } = useLocalInventory();

  const incoming = (orders as any[]).filter((o) => ['Submitted', 'Pending_Approval'].includes(o.status));
  const pending = (orders as any[]).filter((o) => o.status === 'Approved');
  const delivered = (orders as any[]).filter((o) => o.status === 'Delivered');
  const lowStock = (inventory as any[]).filter((i) => i.stock <= (i.reservedStock || 0) + 10);

  const onRefresh = () => {
    refetchOrders();
    refetchDispatches();
    refetchInventory();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OrgHeader />

      {syncStatus.pendingCount > 0 && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncBannerText}>{syncStatus.pendingCount} action{syncStatus.pendingCount === 1 ? '' : 's'} {syncStatus.isSyncing ? 'syncing...' : 'queued'}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}>
        <View style={styles.statsGrid}>
          <KPICard icon="download" iconColor={colors.warning} iconBackground={colors.warningLight} value={incoming.length} label="Incoming Orders" onPress={() => router.push('/(distributor)/(tabs)/orders')} />
          <KPICard icon="time" value={pending.length} label="Pending Dispatch" onPress={() => router.push('/(distributor)/(tabs)/deliveries')} />
          <KPICard icon="checkmark-done" iconColor={colors.success} iconBackground={colors.successLight} value={delivered.length} label="Delivered" onPress={() => router.push('/(distributor)/(tabs)/orders')} />
          <KPICard icon="alert-circle" iconColor={colors.danger} iconBackground={colors.dangerLight} value={lowStock.length} label="Low Stock Items" onPress={() => router.push('/(distributor)/(tabs)/inventory')} />
        </View>

        <TouchableOpacity style={styles.paymentsCard} onPress={() => router.push('/(distributor)/payments')}>
          <View style={styles.paymentsIcon}><Ionicons name="wallet" size={20} color={colors.success} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentsTitle}>Payments</Text>
            <Text style={styles.paymentsSubtitle}>View pending & received payments, invoices</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  syncBanner: { backgroundColor: '#F59E0B', paddingVertical: spacing.sm, alignItems: 'center' },
  syncBannerText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  scroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.huge },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  paymentsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  paymentsIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.successLight, alignItems: 'center', justifyContent: 'center' },
  paymentsTitle: { ...typography.h3, color: colors.text },
  paymentsSubtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
