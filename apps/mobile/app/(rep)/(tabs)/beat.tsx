import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, isToday } from '../../../src/lib/theme';
import { radius, spacing, typography } from '../../../src/theme/tokens';
import { useCurrentAttendanceSession } from '../../../src/hooks/useAttendance';
import { useLocalOutlets, useLocalBeatSchedules } from '../../../src/hooks/useLocalData';
import { useIsOnline } from '../../../src/hooks/useIsOnline';
import { navigateToLocation } from '../../../src/lib/deepLinks';
import { ScreenHeader, EmptyState, ErrorState, SkeletonList, ListItem, IconButton, Banner, Button } from '../../../src/components/ui';

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
  const beatName = todayBeat?.beat && typeof todayBeat.beat !== 'string' ? (todayBeat.beat as any).name : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Today's Beat"
        subtitle={session && beatOutlets.length > 0 ? `${beatOutlets.length} outlet${beatOutlets.length === 1 ? '' : 's'}${beatName ? ` · ${beatName}` : ''}` : 'Retail shops on today’s route'}
        showBack={false}
        rightAction={{ icon: 'search', accessibilityLabel: 'Browse all outlets', onPress: () => router.push('/(rep)/outlets-list') }}
      />

      {isLoading ? (
        <View style={styles.list}><SkeletonList count={4} /></View>
      ) : isError ? (
        <View style={styles.list}><ErrorState offline={!isOnline} onRetry={onRefresh} /></View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={!session ? [] : beatOutlets}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={r1 || r2} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            !session ? (
              <Banner
                tone="warning"
                icon="time-outline"
                title="You're off duty"
                message="Start your day to view your beat and start visiting outlets."
                action={{ label: 'Start Day', onPress: () => router.push('/(rep)/attendance') }}
              />
            ) : (
              <EmptyState
                icon="navigate-outline"
                title="No beat assigned for today"
                message="You can still visit any outlet from the full list."
                actionLabel="Browse All Outlets"
                onAction={() => router.push('/(rep)/outlets-list')}
              />
            )
          }
          ListFooterComponent={
            session && beatOutlets.length > 0 ? (
              <Button
                label="Browse All Outlets"
                variant="ghost"
                onPress={() => router.push('/(rep)/outlets-list')}
                style={{ marginTop: spacing.lg }}
              />
            ) : null
          }
          renderItem={({ item, index }) => (
            <ListItem
              icon="storefront"
              title={item.name}
              subtitle={item.location?.address || 'Address not available'}
              onPress={() => router.push({ pathname: '/(rep)/outlet/[id]', params: { id: item.id } })}
              accessibilityLabel={`Stop ${index + 1}, ${item.name}. Opens visit`}
              trailing={
                <View style={styles.trailing}>
                  {item.location?.latitude && item.location?.longitude ? (
                    <IconButton
                      icon="navigate"
                      tone="primary"
                      size={18}
                      accessibilityLabel={`Navigate to ${item.name}`}
                      onPress={() => navigateToLocation(item.location.latitude, item.location.longitude, item.name)}
                    />
                  ) : null}
                  <View style={styles.visitPill}><Text style={styles.visitPillText}>Visit</Text></View>
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
  trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  visitPill: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radius.pill },
  visitPillText: { ...typography.caption, fontFamily: typography.h3.fontFamily, color: '#fff' },
});
