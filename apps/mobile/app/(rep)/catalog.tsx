import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { colors, formatCurrency } from '../../src/lib/theme';
import { radius, spacing, typography, touchTarget } from '../../src/theme/tokens';
import { useLocalProducts } from '../../src/hooks/useLocalData';
import { useCartStore } from '../../src/store/cartStore';
import { useIsOnline } from '../../src/hooks/useIsOnline';
import { EmptyState, ErrorState, SkeletonList, ScreenHeader, TextField, IconButton, BottomBar, Button } from '../../src/components/ui';

export default function CatalogScreen() {
  const { data: products = [], isLoading, isError, refetch, isRefetching } = useLocalProducts();
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
      <ScreenHeader
        title="Catalog"
        subtitle={products.length > 0 ? `${products.length} products` : undefined}
        rightAction={{ icon: 'cart', accessibilityLabel: 'Open cart', badgeCount: totalItems, onPress: () => router.push('/(rep)/cart') }}
      />

      <View style={styles.searchWrap}>
        <TextField
          icon="search"
          placeholder="Search products or SKU"
          accessibilityLabel="Search products"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          returnKeyType="search"
          right={search ? <IconButton icon="close-circle" size={18} onPress={() => setSearch('')} accessibilityLabel="Clear search" /> : null}
        />
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
          columnWrapperStyle={{ gap: spacing.md }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onRefresh={() => refetch()}
          refreshing={isRefetching}
          ListEmptyComponent={
            search ? (
              <EmptyState icon="search-outline" title="No matching products" message={`Nothing matches "${search}".`} actionLabel="Clear Search" onAction={() => setSearch('')} />
            ) : (
              <EmptyState icon="cart-outline" title="No products found" message="Your local database has not synced the catalog yet. Pull down to refresh." />
            )
          }
          renderItem={({ item }: any) => {
            const qty = getQtyInCart(item.id);
            const hasDiscount = item.pricing?.mrp && item.pricing.mrp > item.pricing.basePrice;
            return (
              <View style={[styles.productCard, qty > 0 && styles.productCardInCart]}>
                <Text style={styles.productSku} numberOfLines={1}>{item.sku}</Text>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productMeta} numberOfLines={1}>{[item.category, item.brand].filter(Boolean).join(' · ')}</Text>
                <View style={styles.productFooter}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    {hasDiscount ? <Text style={styles.mrp}>MRP {formatCurrency(item.pricing.mrp)}</Text> : null}
                    <Text style={styles.price} numberOfLines={1}>{formatCurrency(item.pricing.basePrice)}</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.addButton, qty > 0 && styles.addButtonActive, pressed && { opacity: 0.8 }]}
                    onPress={() => addToCart(item)}
                    accessibilityRole="button"
                    accessibilityLabel={qty > 0 ? `Add one more ${item.name}, ${qty} in cart` : `Add ${item.name} to cart`}
                  >
                    {qty > 0 ? <Text style={styles.addButtonQty}>{qty}</Text> : null}
                    <Ionicons name="add" size={20} color={qty > 0 ? colors.success : '#fff'} />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      {totalItems > 0 && (
        <BottomBar>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerLabel}>{totalItems} item{totalItems === 1 ? '' : 's'} in cart</Text>
          </View>
          <Button
            label="Review Order"
            onPress={() => router.push('/(rep)/cart')}
            fullWidth={false}
            style={{ paddingHorizontal: spacing.xxl }}
            icon={<Ionicons name="cart" size={20} color="#fff" />}
          />
        </BottomBar>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  grid: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, gap: spacing.md },
  productCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  productCardInCart: { borderColor: colors.successBorder },
  productSku: { ...typography.tiny, color: colors.textMuted, marginBottom: spacing.xs },
  productName: { ...typography.h3, color: colors.text, minHeight: 40 },
  productMeta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md },
  productFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.sm },
  mrp: { ...typography.caption, color: colors.textMuted, textDecorationLine: 'line-through' },
  price: { ...typography.h2, color: colors.text },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2,
    minWidth: touchTarget, height: touchTarget, paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radius.md,
  },
  addButtonActive: { backgroundColor: colors.successLight, borderWidth: 1, borderColor: colors.successBorder },
  addButtonQty: { ...typography.h3, color: colors.success },
  footerLabel: { ...typography.h3, color: colors.text },
});
