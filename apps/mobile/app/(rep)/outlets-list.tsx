import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { colors } from '../../src/lib/theme';
import { useLocalOutlets } from '../../src/hooks/useLocalData';
import { useIsOnline } from '../../src/hooks/useIsOnline';
import { EmptyState, ErrorState, SkeletonList } from '../../src/components/ui';

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
      <Stack.Screen options={{ headerShown: true, title: 'All Outlets' }} />
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search outlets..."
          value={search}
          onChangeText={setSearch}
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
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState icon="storefront-outline" title="No outlets found" />}
          renderItem={({ item }: any) => (
            <TouchableOpacity
              style={styles.outletCard}
              onPress={() => router.push({ pathname: '/(rep)/outlet/[id]', params: { id: item.id } })}
            >
              <View style={styles.outletIcon}>
                <Ionicons name="storefront" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.outletName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.outletAddress} numberOfLines={1}>{item.location?.address || 'Unknown'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, margin: 16, marginBottom: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  outletCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  outletIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  outletName: { fontWeight: '700', color: colors.text, fontSize: 14 },
  outletAddress: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
