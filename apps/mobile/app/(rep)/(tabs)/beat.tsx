import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, isToday } from '../../../src/lib/theme';
import { radius, spacing, typography } from '../../../src/theme/tokens';
import { useCurrentAttendanceSession } from '../../../src/hooks/useAttendance';
import { useLocalOutlets, useLocalBeatSchedules } from '../../../src/hooks/useLocalData';
import { useIsOnline } from '../../../src/hooks/useIsOnline';
import { navigateToLocation } from '../../../src/lib/deepLinks';
import { ScreenHeader, EmptyState, ErrorState, SkeletonList } from '../../../src/components/ui';

export default function BeatScreen() {
  const { data: session } = useCurrentAttendanceSession();
  const isOnline = useIsOnline();
  const { data: outlets = [], refetch: refetchOutlets, isRefetching: r1, isLoading: l1, isError: e1 } = useLocalOutlets();
  const { data: beatSchedules = [], refetch: refetchBeats, isRefetching: r2, isLoading: l2, isError: e2 } = useLocalBeatSchedules();

  const todayBeat = beatSchedules.find((s: any) => isToday(s.date)) ?? beatSchedules[0];
  let beatOutlets: any[] = [];
  if (todayBeat && todayBeat.beat && typeof todayBeat.beat !== 'string') {
    const routeOutletIds = ((todayBeat.beat as any).outlets || []).map((o: any) => o._id || o.id || o);
    beatOutlets = outlets.filter((o: any) => routeOutletIds.includes(o.id));
  }

  const onRefresh = () => {
    refetchOutlets();
    refetchBeats();
  };

  const isLoading = l1 || l2;
  const isError = e1 || e2;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Today's Beat" subtitle="Retail shops on today's route" showBack={false} />

      {isLoading ? (
        <View style={styles.list}><SkeletonList count={4} /></View>
      ) : isError ? (
        <View style={styles.list}><ErrorState offline={!isOnline} onRetry={onRefresh} /></View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={!session ? [] : beatOutlets}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={r1 || r2} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <TouchableOpacity style={styles.browseAllButton} onPress={() => router.push('/(rep)/outlets-list')}>
              <Text style={styles.browseAllText}>Browse All Outlets</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            !session ? (
              <View style={styles.warningBanner}>
                <Ionicons name="alert-circle" size={18} color="#B45309" />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.warningTitle}>You are Off Duty</Text>
                  <Text style={styles.warningText}>Check in from Home to view your beat and start visiting outlets.</Text>
                </View>
              </View>
            ) : (
              <EmptyState icon="navigate-outline" title="No beat assigned for today" />
            )
          }
          renderItem={({ item }) => (
            <View style={styles.outletCard}>
              <View style={styles.outletIcon}>
                <Ionicons name="storefront" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.outletName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.outletAddress} numberOfLines={1}>{item.location?.address || 'Unknown'}</Text>
              </View>
              {item.location?.latitude && item.location?.longitude && (
                <TouchableOpacity
                  style={styles.navigateButton}
                  onPress={() => navigateToLocation(item.location.latitude, item.location.longitude, item.name)}
                >
                  <Ionicons name="navigate" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.visitButton}
                onPress={() => router.push({ pathname: '/(rep)/outlet/[id]', params: { id: item.id } })}
              >
                <Text style={styles.visitButtonText}>Visit</Text>
              </TouchableOpacity>
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
  browseAllButton: { backgroundColor: colors.primaryLight, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  browseAllText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  warningBanner: { flexDirection: 'row', backgroundColor: colors.warningLight, borderWidth: 1, borderColor: '#FDE68A', borderRadius: radius.lg, padding: spacing.lg },
  warningTitle: { fontWeight: '700', color: '#92400E', marginBottom: 2 },
  warningText: { color: '#92400E', fontSize: 12 },
  outletCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  outletIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  outletName: { ...typography.h3, color: colors.text },
  outletAddress: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  navigateButton: { backgroundColor: colors.primaryLight, padding: spacing.sm, borderRadius: radius.md, marginRight: spacing.sm },
  visitButton: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  visitButtonText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
});
