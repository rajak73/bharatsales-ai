import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { colors, formatCurrency } from '../../src/lib/theme';
import { useCartStore } from '../../src/store/cartStore';
import { useLocalOutlets, useLocalDistributors, useLocalSchemes } from '../../src/hooks/useLocalData';
import { useSessionStore } from '../../src/store/sessionStore';
import { calculateOrder } from '../../src/features/rep/orderCalc';
import { enqueue } from '../../src/db/syncQueue';
import { EmptyState, Button } from '../../src/components/ui';

function uuid(): string {
  // Cheap RFC4122-ish v4 generator — no crypto.randomUUID in the RN JS
  // engine by default, and we don't need cryptographic strength here, just
  // a unique idempotency/order key.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function CartScreen() {
  const { cart, outletId, updateQuantity, clearCart } = useCartStore();
  const user = useSessionStore((s) => s.user);
  const { data: outlets = [] } = useLocalOutlets();
  const { data: distributors = [] } = useLocalDistributors();
  const { data: schemes = [] } = useLocalSchemes();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const outlet: any = outlets.find((o: any) => o.id === outletId);
  const distributor: any = distributors.find((d: any) => d.id === outlet?.commercial?.assignedDistributorId);
  const activeSchemes = (schemes as any[]).filter((s) => s.isActive);

  const { items, totals, creditExceeded } = useMemo(
    () => calculateOrder(cart, outlet, distributor, activeSchemes),
    [cart, outlet, distributor, activeSchemes]
  );

  const handleSubmit = async () => {
    if (!outletId || cart.length === 0 || creditExceeded) return;
    setSubmitting(true);
    try {
      const payload = {
        id: uuid(),
        organizationId: outlet?.organizationId,
        idempotencyKey: uuid(),
        orderNumber: `ORD-${Math.floor(Math.random() * 100000)}`,
        outletId,
        assignedDistributorId: distributor?.id,
        createdByUserId: user?.id, // real logged-in rep, not a placeholder
        status: 'Submitted',
        items,
        totals,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await enqueue('CREATE_ORDER', payload);
      setSubmitted(true);
      clearCart();
      setTimeout(() => router.replace('/(rep)/(tabs)'), 2500);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        <Text style={styles.submittedTitle}>Order Placed!</Text>
        <Text style={styles.submittedText}>The order has been saved and will automatically sync when connected.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Order Booking</Text>
        <View style={{ width: 22 }} />
      </View>

      {cart.length === 0 ? (
        <View style={{ margin: 16 }}>
          <EmptyState
            icon="cart-outline"
            title="Cart is empty"
            message="Add items from the catalog to book an order."
            actionLabel="Browse Catalog"
            onAction={() => router.push('/(rep)/catalog')}
          />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scroll}>
            {!outletId && (
              <View style={styles.warningBanner}>
                <Ionicons name="information-circle" size={18} color="#B45309" />
                <Text style={styles.warningText}>Select an outlet from the Beat or Outlets tab before booking an order.</Text>
              </View>
            )}

            {creditExceeded && (
              <View style={styles.dangerBanner}>
                <Ionicons name="warning" size={18} color={colors.danger} />
                <Text style={styles.dangerText}>This order exceeds the outlet&apos;s available credit limit. Reduce the order or collect an outstanding payment first.</Text>
              </View>
            )}

            {cart.map((item) => {
              const calcItem = items.find((i) => i.productId === item.product.id);
              return (
                <View key={item.product.id} style={styles.cartItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
                    <Text style={styles.itemSku}>{item.product.sku}</Text>
                    <Text style={styles.itemPrice}>{formatCurrency(item.product.pricing.basePrice)}</Text>
                  </View>
                  <View style={styles.qtyControls}>
                    <View style={styles.qtyRow}>
                      <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
                        <Ionicons name={item.quantity === 1 ? 'trash' : 'remove'} size={16} color={item.quantity === 1 ? colors.danger : colors.textMuted} />
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{item.quantity}</Text>
                      <TouchableOpacity style={styles.qtyAddBtn} onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
                        <Ionicons name="add" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.itemTotal}>{formatCurrency(calcItem?.total || 0)}</Text>
                  </View>
                </View>
              );
            })}

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal ({cart.length} items)</Text><Text style={styles.summaryValue}>{formatCurrency(totals.subTotal)}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Discount</Text><Text style={styles.summaryValue}>- {formatCurrency(totals.discountTotal)}</Text></View>
              <View style={[styles.summaryRow, styles.summaryDivider]}><Text style={styles.summaryLabelBold}>Total Before Tax</Text><Text style={styles.summaryValueBold}>{formatCurrency(totals.totalBeforeTax)}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>CGST</Text><Text style={styles.summaryValue}>{formatCurrency(totals.cgstTotal)}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>SGST</Text><Text style={styles.summaryValue}>{formatCurrency(totals.sgstTotal)}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>IGST</Text><Text style={styles.summaryValue}>{formatCurrency(totals.igstTotal)}</Text></View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <View>
              <Text style={styles.footerLabel}>Total Amount</Text>
              <Text style={styles.footerValue}>{formatCurrency(totals.grandTotal)}</Text>
            </View>
            <Button
              label="Place Order  →"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!outletId || creditExceeded}
              fullWidth={false}
              style={{ paddingHorizontal: 24 }}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  submittedTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 16 },
  submittedText: { color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  emptyCard: { margin: 16, backgroundColor: colors.card, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emptyTitle: { fontWeight: '700', color: colors.text },
  emptyText: { color: colors.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' },
  browseButton: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10, marginTop: 16 },
  browseButtonText: { color: '#fff', fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 140, gap: 10 },
  warningBanner: { flexDirection: 'row', gap: 8, backgroundColor: colors.warningLight, borderRadius: 12, padding: 12 },
  warningText: { flex: 1, color: '#92400E', fontSize: 12 },
  dangerBanner: { flexDirection: 'row', gap: 8, backgroundColor: colors.dangerLight, borderRadius: 12, padding: 12 },
  dangerText: { flex: 1, color: colors.danger, fontSize: 12, fontWeight: '500' },
  cartItem: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
  itemName: { fontWeight: '700', color: colors.text, fontSize: 13 },
  itemSku: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  itemPrice: { fontWeight: '700', color: colors.text, fontSize: 13, marginTop: 6 },
  qtyControls: { alignItems: 'flex-end', justifyContent: 'space-between' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 10, padding: 4, gap: 8 },
  qtyValue: { fontWeight: '700', color: colors.text, width: 20, textAlign: 'center' },
  qtyAddBtn: { backgroundColor: colors.primary, borderRadius: 8, padding: 4 },
  itemTotal: { fontWeight: '700', color: colors.text, fontSize: 13, marginTop: 8 },
  summaryCard: { backgroundColor: colors.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.border },
  summaryTitle: { fontWeight: '800', color: colors.text, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryDivider: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4, paddingTop: 10 },
  summaryLabel: { color: colors.textMuted, fontSize: 13 },
  summaryValue: { color: colors.text, fontWeight: '700', fontSize: 13 },
  summaryLabelBold: { color: colors.text, fontWeight: '800', fontSize: 13 },
  summaryValueBold: { color: colors.text, fontWeight: '800', fontSize: 13 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderTopWidth: 1, borderTopColor: colors.border },
  footerLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  footerValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  submitButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14 },
  submitButtonText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.5 },
});
