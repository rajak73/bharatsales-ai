import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../../src/lib/theme';
import { spacing, radius, typography } from '../../../src/theme/tokens';
import { useLocalDispatches } from '../../../src/hooks/useLocalData';
import { useIsOnline } from '../../../src/hooks/useIsOnline';
import type { PillTone } from '../../../src/components/ui/StatusPill';
import { ScreenHeader, EmptyState, ErrorState, SkeletonList, StatusPill, Button } from '../../../src/components/ui';

const STATUS_TONE: Record<string, PillTone> = {
  Pending: 'warning',
  'In Transit': 'primary',
  Delivered: 'success',
  Partial_Delivery: 'success',
  Damaged_Delivery: 'danger',
  Short_Delivery: 'danger',
  Refused: 'danger',
  Return_Initiated: 'neutral',
  Cancelled: 'neutral',
};

export default function DeliveriesScreen() {
  const { data: dispatches = [], refetch, isRefetching, isLoading, isError } = useLocalDispatches();
  const isOnline = useIsOnline();
  const active = (dispatches as any[]).filter((d) => !['Delivered', 'Cancelled', 'Refused'].includes(d.status));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Deliveries" subtitle="Assigned deliveries & tracking" showBack={false} />

      {isLoading ? (
        <View style={styles.list}><SkeletonList count={4} /></View>
      ) : isError ? (
        <View style={styles.list}><ErrorState offline={!isOnline} onRetry={() => refetch()} /></View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={active}
          keyExtractor={(item: any) => item.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={<EmptyState icon="car-outline" title="No active deliveries" />}
          renderItem={({ item }: any) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.vehicleText}>{item.vehicle} • {item.driver}</Text>
                <StatusPill label={(item.status || '').replace(/_/g, ' ')} tone={STATUS_TONE[item.status] || 'neutral'} />
              </View>
              {item.expectedDelivery && (
                <Text style={styles.expectedText}>Expected: {new Date(item.expectedDelivery).toLocaleDateString()}</Text>
              )}
              <Button
                label="Confirm Delivery"
                onPress={() => router.push({ pathname: '/(distributor)/delivery/[id]', params: { id: item.id } })}
                variant="secondary"
                icon={<Ionicons name="checkmark-done" size={16} color={colors.primary} />}
                style={{ marginTop: spacing.md }}
              />
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
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleText: { ...typography.h3, color: colors.text },
  expectedText: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
});
