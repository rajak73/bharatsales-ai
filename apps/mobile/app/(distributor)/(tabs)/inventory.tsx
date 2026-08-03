import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../src/lib/theme';
import { useLocalInventory } from '../../../src/hooks/useLocalData';
import { useIsOnline } from '../../../src/hooks/useIsOnline';
import { ScreenHeader, EmptyState, ErrorState, SkeletonList } from '../../../src/components/ui';

const LOW_STOCK_THRESHOLD = 10;

export default function InventoryScreen() {
  const { data: inventory = [], refetch, isRefetching, isLoading, isError } = useLocalInventory();
  const isOnline = useIsOnline();
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const filtered = (inventory as any[])
    .filter((i) => i.productName?.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase()))
    .filter((i) => !lowStockOnly || i.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Inventory" showBack={false} />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Search products or SKU..." value={search} onChangeText={setSearch} />
      </View>

      <TouchableOpacity style={[styles.toggleChip, lowStockOnly && styles.toggleChipActive]} onPress={() => setLowStockOnly(!lowStockOnly)}>
        <Ionicons name="alert-circle" size={14} color={lowStockOnly ? colors.danger : colors.textMuted} />
        <Text style={[styles.toggleChipText, lowStockOnly && { color: colors.danger }]}>Low Stock Only</Text>
      </TouchableOpacity>

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
          ListEmptyComponent={<EmptyState icon="cube-outline" title="No inventory items found" />}
          renderItem={({ item }: any) => {
            const isLow = item.stock <= LOW_STOCK_THRESHOLD;
            return (
              <View style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                  <Text style={styles.itemMeta}>{item.sku} • Batch {item.batch}</Text>
                  {item.expiry && <Text style={styles.itemMeta}>Expires {new Date(item.expiry).toLocaleDateString()}</Text>}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.stockValue, isLow && { color: colors.danger }]}>{item.stock}</Text>
                  <Text style={styles.stockLabel}>in stock</Text>
                  {isLow && (
                    <View style={styles.lowStockBadge}>
                      <Text style={styles.lowStockText}>Low Stock</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, margin: 16, marginBottom: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14 },
  toggleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  toggleChipActive: { backgroundColor: colors.dangerLight, borderColor: colors.danger },
  toggleChipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  emptyCard: { backgroundColor: colors.card, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emptyText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  itemCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  itemName: { fontWeight: '700', color: colors.text, fontSize: 14 },
  itemMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  stockValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  stockLabel: { fontSize: 10, color: colors.textMuted },
  lowStockBadge: { backgroundColor: colors.dangerLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  lowStockText: { color: colors.danger, fontSize: 9, fontWeight: '800' },
});
