import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { colors, formatCurrency } from '../../src/lib/theme';
import { radius, spacing, typography } from '../../src/theme/tokens';
import { useCartStore } from '../../src/store/cartStore';
import { useLocalOutlets, useLocalDistributors, useLocalSchemes } from '../../src/hooks/useLocalData';
import { useSessionStore } from '../../src/store/sessionStore';
import { calculateOrder } from '../../src/features/rep/orderCalc';
import { enqueueAndSync } from '../../src/sync/syncEngine';
import { EmptyState, Button, ScreenHeader, Banner, Card, IconButton, BottomBar, SuccessState } from '../../src/components/ui';

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
      await enqueueAndSync('CREATE_ORDER', payload);
      setSubmitted(true);
      clearCart();
      setTimeout(() => router.replace('/(rep)/(tabs)'), 2500);
    } catch (err: any) {
      // The cart is left intact so the rep can simply try again.
      Alert.alert('Could not save order', err?.message || 'The order could not be saved on this device. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SuccessState
        title="Order Placed!"
        message={outlet?.name ? `Order for ${outlet.name} has been saved.` : 'The order has been saved.'}
        note="Syncs automatically when you're online"
      />
    );
  }

  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title="Review Order"
        subtitle={outlet?.name || undefined}
        rightAction={cart.length > 0 ? { icon: 'add-circle-outline', accessibilityLabel: 'Add more products', onPress: () => router.push('/(rep)/catalog') } : undefined}
      />

      {cart.length === 0 ? (
        <View style={styles.scroll}>
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
              <Banner tone="warning" message="Select an outlet from the Beat or Outlets tab before booking an order." />
            )}

            {creditExceeded && (
              <Banner
                tone="danger"
                title="Credit limit exceeded"
                message="This order exceeds the outlet's available credit limit. Reduce the order or collect an outstanding payment first."
              />
            )}

            {cart.map((item) => {
              const calcItem = items.find((i) => i.productId === item.product.id);
              return (
                <Card key={item.product.id} padding="md" elevation="none" style={styles.cartItem}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                    <Text style={styles.itemSku}>{item.product.sku} · {formatCurrency(item.product.pricing.basePrice)} each</Text>
                    <Text style={styles.itemTotal}>{formatCurrency(calcItem?.total || 0)}</Text>
                  </View>
                  <View style={styles.qtyRow}>
                    <IconButton
                      icon={item.quantity === 1 ? 'trash-outline' : 'remove'}
                      tone={item.quantity === 1 ? 'danger' : 'plain'}
                      size={18}
                      onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                      accessibilityLabel={item.quantity === 1 ? `Remove ${item.product.name}` : `Decrease quantity of ${item.product.name}`}
                    />
                    <Text style={styles.qtyValue} accessibilityLabel={`Quantity ${item.quantity}`}>{item.quantity}</Text>
                    <IconButton
                      icon="add"
                      tone="primary"
                      size={18}
                      onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                      accessibilityLabel={`Increase quantity of ${item.product.name}`}
                    />
                  </View>
                </Card>
              );
            })}

            <Card>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <SummaryRow label={`Subtotal (${itemCount} item${itemCount === 1 ? '' : 's'})`} value={formatCurrency(totals.subTotal)} />
              <SummaryRow label="Discount" value={`- ${formatCurrency(totals.discountTotal)}`} valueColor={totals.discountTotal > 0 ? colors.success : undefined} />
              <SummaryRow label="Total Before Tax" value={formatCurrency(totals.totalBeforeTax)} bold divider />
              <SummaryRow label="CGST" value={formatCurrency(totals.cgstTotal)} />
              <SummaryRow label="SGST" value={formatCurrency(totals.sgstTotal)} />
              <SummaryRow label="IGST" value={formatCurrency(totals.igstTotal)} />
              <SummaryRow label="Grand Total" value={formatCurrency(totals.grandTotal)} bold divider />
            </Card>
          </ScrollView>

          <BottomBar>
            <View style={{ flex: 1 }}>
              <Text style={styles.footerLabel}>Total Amount</Text>
              <Text style={styles.footerValue} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(totals.grandTotal)}</Text>
            </View>
            <Button
              label="Place Order"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!outletId || creditExceeded}
              fullWidth={false}
              variant="accent"
              style={{ paddingHorizontal: spacing.xxl }}
              icon={<Ionicons name="checkmark-circle" size={20} color={!outletId || creditExceeded ? colors.textMuted : colors.navy} />}
            />
          </BottomBar>
        </>
      )}
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, bold, divider, valueColor }: { label: string; value: string; bold?: boolean; divider?: boolean; valueColor?: string }) {
  return (
    <View style={[styles.summaryRow, divider && styles.summaryDivider]}>
      <Text style={bold ? styles.summaryLabelBold : styles.summaryLabel}>{label}</Text>
      <Text style={[bold ? styles.summaryValueBold : styles.summaryValue, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  cartItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemName: { ...typography.h3, color: colors.text },
  itemSku: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  itemTotal: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  qtyValue: { ...typography.h3, color: colors.text, minWidth: 28, textAlign: 'center' },
  summaryTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs + 2 },
  summaryDivider: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xs, paddingTop: spacing.md },
  summaryLabel: { ...typography.body, color: colors.textMuted },
  summaryValue: { ...typography.bodyMedium, color: colors.text },
  summaryLabelBold: { ...typography.h3, color: colors.text },
  summaryValueBold: { ...typography.h3, color: colors.text },
  footerLabel: { ...typography.caption, color: colors.textMuted },
  footerValue: { ...typography.h1, color: colors.text },
});
