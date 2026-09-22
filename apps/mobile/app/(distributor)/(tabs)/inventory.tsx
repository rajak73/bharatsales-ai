import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, formatDate, formatNumber } from '../../../src/lib/theme';
import { spacing, typography } from '../../../src/theme/tokens';
import { useLocalInventory } from '../../../src/hooks/useLocalData';
import { useIsOnline } from '../../../src/hooks/useIsOnline';
import { ScreenHeader, EmptyState, ErrorState, SkeletonList, TextField, IconButton, ListItem, StatusPill, Chip, ChipRow } from '../../../src/components/ui';

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
  const lowCount = (inventory as any[]).filter((i) => i.stock <= LOW_STOCK_THRESHOLD).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Inventory" subtitle={inventory.length > 0 ? `${inventory.length} SKUs · lowest stock first` : undefined} showBack={false} />

      <View style={styles.searchWrap}>
        <TextField
          icon="search"
          placeholder="Search products or SKU"
          accessibilityLabel="Search inventory"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          returnKeyType="search"
          right={search ? <IconButton icon="close-circle" size={18} onPress={() => setSearch('')} accessibilityLabel="Clear search" /> : null}
        />
      </View>

      <ChipRow>
        <Chip label="All items" selected={!lowStockOnly} onPress={() => setLowStockOnly(false)} count={inventory.length} />
        <Chip label="Low stock" icon="alert-circle" tone="danger" selected={lowStockOnly} onPress={() => setLowStockOnly(!lowStockOnly)} count={lowCount} />
      </ChipRow>

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
            <EmptyState
              icon="cube-outline"
              title={search || lowStockOnly ? 'No matching items' : 'No inventory items found'}
              message={search || lowStockOnly ? 'Try a different search or filter.' : 'Pull down to refresh once you’re online.'}
            />
          }
          renderItem={({ item }: any) => {
            const isLow = item.stock <= LOW_STOCK_THRESHOLD;
            return (
              <ListItem
                icon="cube-outline"
                iconColor={isLow ? colors.danger : colors.primary}
                iconBackground={isLow ? colors.dangerLight : colors.primaryLight}
                title={item.productName}
                subtitle={`${item.sku} · Batch ${item.batch}`}
                meta={item.expiry ? `Expires ${formatDate(item.expiry)}` : undefined}
                accessibilityLabel={`${item.productName}, ${item.stock} in stock${isLow ? ', low stock' : ''}`}
                trailing={
                  <View style={styles.trailing}>
                    <Text style={[styles.stockValue, isLow && { color: colors.danger }]}>{formatNumber(item.stock)}</Text>
                    {isLow ? <StatusPill label="Low" tone="danger" /> : <Text style={styles.stockLabel}>in stock</Text>}
                  </View>
                }
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
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xxxl },
  trailing: { alignItems: 'flex-end', gap: 2 },
  stockValue: { ...typography.h2, color: colors.text },
  stockLabel: { ...typography.caption, color: colors.textMuted },
});
