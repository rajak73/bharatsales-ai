import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, formatDate } from '../../../src/lib/theme';
import { spacing, radius, typography } from '../../../src/theme/tokens';
import { useLocalDispatches } from '../../../src/hooks/useLocalData';
import { useIsOnline } from '../../../src/hooks/useIsOnline';
import { useServerRefresh } from '../../../src/hooks/useServerRefresh';
import { statusTone } from '../../../src/lib/orderStatus';
import { ScreenHeader, EmptyState, ErrorState, SkeletonList, StatusPill, Button, Card } from '../../../src/components/ui';

export default function DeliveriesScreen() {
  const { data: dispatches = [], refetch, isLoading, isError } = useLocalDispatches();
  const { refreshing, onRefresh } = useServerRefresh(refetch);
  const isOnline = useIsOnline();
  // Only deliveries the server will still let you confirm (DispatchService
  // accepts Pending / In Transit); e.g. a Partial_Delivery is already done.
  const active = (dispatches as any[]).filter((d) => ['Pending', 'In Transit'].includes(d.status));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Deliveries"
        subtitle={active.length > 0 ? `${active.length} active deliver${active.length === 1 ? 'y' : 'ies'}` : 'Assigned deliveries & tracking'}
        showBack={false}
      />

      {isLoading ? (
        <View style={styles.list}><SkeletonList count={4} /></View>
      ) : isError ? (
        <View style={styles.list}><ErrorState offline={!isOnline} onRetry={() => refetch()} /></View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={active}
          keyExtractor={(item: any) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={<EmptyState icon="car-outline" title="No active deliveries" message="Orders you dispatch will show up here until they're delivered." />}
          renderItem={({ item }: any) => (
            <Card>
              <View style={styles.cardHeader}>
                <View style={styles.vehicleIcon}><Ionicons name="car" size={20} color={colors.primary} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.vehicleText} numberOfLines={1}>{item.vehicle || 'Vehicle not set'}</Text>
                  <Text style={styles.driverText} numberOfLines={1}>{item.driver ? `Driver: ${item.driver}` : 'Driver not assigned'}</Text>
                </View>
                <StatusPill label={(item.status || '').replace(/_/g, ' ')} tone={statusTone(item.status)} />
              </View>
              {item.expectedDelivery && (
                <View style={styles.expectedRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.expectedText}>Expected {formatDate(item.expectedDelivery)}</Text>
                </View>
              )}
              <Button
                label="Confirm Delivery"
                onPress={() => router.push({ pathname: '/(distributor)/delivery/[id]', params: { id: item.id } })}
                icon={<Ionicons name="checkmark-done" size={20} color="#fff" />}
                style={{ marginTop: spacing.lg }}
              />
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  vehicleIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  vehicleText: { ...typography.h3, color: colors.text },
  driverText: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  expectedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, marginTop: spacing.md },
  expectedText: { ...typography.body, color: colors.textSecondary },
});
