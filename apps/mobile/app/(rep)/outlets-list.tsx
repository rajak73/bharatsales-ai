import { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { colors, formatCurrency } from '../../src/lib/theme';
import { spacing } from '../../src/theme/tokens';
import { useLocalOutlets } from '../../src/hooks/useLocalData';
import { useIsOnline } from '../../src/hooks/useIsOnline';
import { EmptyState, ErrorState, SkeletonList, ScreenHeader, TextField, IconButton, ListItem, StatusPill } from '../../src/components/ui';

export default function OutletsListScreen() {
  const { data: outlets = [], refetch, isRefetching, isLoading, isError } = useLocalOutlets();
  const isOnline = useIsOnline();
  const [search, setSearch] = useState('');

  const filtered = outlets.filter((o: any) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.location?.address || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="All Outlets" subtitle={outlets.length > 0 ? `${outlets.length} outlets` : undefined} />

      <View style={styles.searchWrap}>
        <TextField
          icon="search"
          placeholder="Search by name or address"
          accessibilityLabel="Search outlets"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          returnKeyType="search"
          right={search ? <IconButton icon="close-circle" size={18} onPress={() => setSearch('')} accessibilityLabel="Clear search" /> : null}
        />
      </View>

      {isLoading ? (
        <View style={styles.list}><SkeletonList count={6} /></View>
      ) : isError ? (
        <View style={styles.list}><ErrorState offline={!isOnline} onRetry={() => refetch()} /></View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={filtered}
          keyExtractor={(item: any) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            search ? (
              <EmptyState icon="search-outline" title="No matching outlets" message={`Nothing matches "${search}".`} actionLabel="Clear Search" onAction={() => setSearch('')} />
            ) : (
              <EmptyState icon="storefront-outline" title="No outlets found" message="Pull down to refresh once you're online." />
            )
          }
          renderItem={({ item }: any) => {
            const due = Number(item.commercial?.outstandingBalance) || 0;
            return (
              <ListItem
                icon="storefront"
                title={item.name}
                subtitle={item.location?.address || 'Address not available'}
                showChevron
                onPress={() => router.push({ pathname: '/(rep)/outlet/[id]', params: { id: item.id } })}
                accessibilityLabel={`${item.name}${due > 0 ? `, ${formatCurrency(due)} due` : ''}. Opens visit`}
                trailing={due > 0 ? <StatusPill label={`${formatCurrency(due)} due`} tone="warning" /> : null}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
});
