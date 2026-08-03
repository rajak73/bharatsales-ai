import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { colors, formatCurrency } from '../../src/lib/theme';
import { useLocalProducts } from '../../src/hooks/useLocalData';
import { useCartStore } from '../../src/store/cartStore';
import { useIsOnline } from '../../src/hooks/useIsOnline';
import { EmptyState, ErrorState, SkeletonList } from '../../src/components/ui';

export default function CatalogScreen() {
  const { data: products = [], isLoading, isError, refetch } = useLocalProducts();
  const isOnline = useIsOnline();
  const cart = useCartStore((s) => s.cart);
  const addToCart = useCartStore((s) => s.addToCart);
  const [search, setSearch] = useState('');

  const filtered = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const getQtyInCart = (productId: string) => cart.find((i) => i.product.id === productId)?.quantity || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catalog</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/(rep)/cart')}>
          <Ionicons name="cart" size={20} color={colors.primary} />
          {totalItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Search products & SKUs..." value={search} onChangeText={setSearch} />
      </View>

      {isLoading ? (
        <View style={styles.grid}><SkeletonList count={6} /></View>
      ) : isError ? (
        <View style={styles.grid}><ErrorState offline={!isOnline} onRetry={() => refetch()} /></View>
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: 12 }}
        ListEmptyComponent={
          <EmptyState icon="cart-outline" title="No products found" message="Your local database has not synced the catalog yet." />
        }
        renderItem={({ item }: any) => {
          const qty = getQtyInCart(item.id);
          return (
            <View style={styles.productCard}>
              <Text style={styles.productSku}>{item.sku}</Text>
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.productMeta}>{item.category} • {item.brand}</Text>
              <View style={styles.productFooter}>
                <View>
                  <Text style={styles.mrp}>{formatCurrency(item.pricing.mrp)}</Text>
                  <Text style={styles.price}>{formatCurrency(item.pricing.basePrice)}</Text>
                </View>
                <TouchableOpacity style={[styles.addButton, qty > 0 && styles.addButtonActive]} onPress={() => addToCart(item)}>
                  {qty > 0 && <Text style={styles.addButtonQty}>{qty}</Text>}
                  <Ionicons name="add" size={16} color={qty > 0 ? colors.success : '#fff'} />
                </TouchableOpacity>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  cartButton: { backgroundColor: colors.primaryLight, padding: 8, borderRadius: 20 },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: colors.danger, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14 },
  grid: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  emptyCard: { flex: 1, alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 32, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { fontWeight: '700', color: colors.text, marginTop: 8 },
  emptyText: { color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  productCard: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border },
  productSku: { fontSize: 10, color: colors.textMuted, fontWeight: '600', marginBottom: 4 },
  productName: { fontSize: 13, fontWeight: '700', color: colors.text, lineHeight: 17 },
  productMeta: { fontSize: 11, color: colors.textMuted, marginTop: 6, marginBottom: 10 },
  productFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  mrp: { fontSize: 11, color: colors.textMuted, textDecorationLine: 'line-through' },
  price: { fontSize: 14, fontWeight: '800', color: colors.text },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 10, padding: 6, gap: 2 },
  addButtonActive: { backgroundColor: colors.successLight },
  addButtonQty: { fontSize: 11, fontWeight: '800', color: colors.success, marginLeft: 2 },
});
