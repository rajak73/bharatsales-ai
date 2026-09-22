import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { colors, formatCurrency, formatDate } from '../../../src/lib/theme';
import { radius, spacing, typography } from '../../../src/theme/tokens';
import { statusTone, orderStatusLabel } from '../../../src/lib/orderStatus';
import { useLocalOrders } from '../../../src/hooks/useLocalData';
import { enqueueAndSync } from '../../../src/sync/syncEngine';
import { ScreenHeader, Button, Banner, Card, EmptyState, BottomBar, FormModal, TextField, StatusPill } from '../../../src/components/ui';

export default function DistributorOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: orders = [], refetch } = useLocalOrders();
  const order: any = orders.find((o: any) => o.id === id);
  const [busy, setBusy] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionDone, setActionDone] = useState<string | null>(null);

  // Once the queued decision has reached the server and the fresh order has
  // been downloaded, drop the "will sync shortly" banner so the next step
  // (e.g. Mark as Dispatched on a now-Approved order) becomes available.
  const pendingAction: string | undefined = order?.pendingAction;
  const hadPending = useRef(false);
  useEffect(() => {
    if (pendingAction) hadPending.current = true;
    else if (hadPending.current) {
      hadPending.current = false;
      setActionDone(null);
    }
  }, [pendingAction]);

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="Order" />
        <View style={styles.scroll}>
          <EmptyState
            icon="receipt-outline"
            title="Order not found"
            message="This order isn't in your offline data yet. Go back and pull down to sync, then try again."
            actionLabel="Go Back"
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  // A decision already queued on this device (or just taken on this screen)
  // is shown as the order's status; its buttons stay hidden until the server
  // has answered, so the same decision can't be queued twice.
  const decisionPending = !!pendingAction || !!actionDone;
  // Pending_Approval orders need a manager to approve their pricing first;
  // Hold_Stock orders can be accepted again once stock has been added.
  const canAccept = !decisionPending && ['Submitted', 'Hold_Stock'].includes(order.status);
  const canDispatch = !decisionPending && order.status === 'Approved';

  const handleAccept = async () => {
    setBusy(true);
    try {
      await enqueueAndSync('APPROVE_ORDER', { orderId: order.id });
      setActionDone('Order accepted — will sync shortly.');
      refetch();
    } catch (err: any) {
      Alert.alert('Action failed', err?.message || 'This action could not be saved on this device. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    try {
      await enqueueAndSync('REJECT_ORDER', { orderId: order.id, reason: rejectReason });
      setRejectModal(false);
      setActionDone('Order rejected — will sync shortly.');
      refetch();
    } catch (err: any) {
      Alert.alert('Action failed', err?.message || 'This action could not be saved on this device. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleDispatch = async () => {
    setBusy(true);
    try {
      await enqueueAndSync('DISPATCH_ORDER', { orderId: order.id });
      setActionDone('Order marked as dispatched — will sync shortly.');
      refetch();
    } catch (err: any) {
      Alert.alert('Action failed', err?.message || 'This action could not be saved on this device. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const itemCount = (order.items || []).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title={order.orderNumber || 'Order'} subtitle={order.createdAt ? `Placed ${formatDate(order.createdAt)}` : undefined} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {actionDone && <Banner tone="success" message={actionDone} />}
        {!actionDone && order.pendingAction && (
          <Banner tone="info" message="Your decision on this order is saved on this phone and will sync shortly." />
        )}
        {order.status === 'Pending_Approval' && (
          <Banner tone="warning" message="Waiting for a sales manager to approve this order's pricing before it can be accepted." />
        )}
        {order.status === 'Hold_Stock' && !decisionPending && (
          <Banner tone="warning" message="On hold: there wasn't enough stock to allocate. Add stock, then accept again." />
        )}

        <Card style={styles.summaryCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Order value</Text>
            <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(order.totals?.grandTotal)}</Text>
            <Text style={styles.summaryMeta}>{itemCount} item{itemCount === 1 ? '' : 's'}</Text>
          </View>
          <StatusPill label={orderStatusLabel(order.status)} tone={statusTone(order.status)} />
        </Card>

        <Card padding={0}>
          <Text style={styles.sectionTitle}>Items</Text>
          {(order.items || []).map((item: any, idx: number) => (
            <View key={idx} style={[styles.itemRow, styles.itemRowBorder]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>{item.sku} · Qty {item.quantity}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
          <View style={[styles.itemRow, styles.totalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(order.totals?.grandTotal)}</Text>
          </View>
        </Card>

        {order.deliveredItems && order.deliveredItems.length > 0 && (
          <Card>
            <Text style={[styles.sectionTitle, { padding: 0, paddingBottom: spacing.sm }]}>Delivery Status</Text>
            {order.deliveredItems.map((d: any, idx: number) => (
              <Text key={idx} style={styles.deliveryLine}>
                {d.productId}: delivered {d.deliveredQty}/{d.orderedQty}
                {d.shortQty ? ` (short ${d.shortQty})` : ''}
                {d.damagedQty ? ` (damaged ${d.damagedQty})` : ''}
              </Text>
            ))}
          </Card>
        )}
      </ScrollView>

      {(canAccept || canDispatch) && (
        <BottomBar>
          {canAccept && (
            <>
              <Button label="Reject" onPress={() => setRejectModal(true)} disabled={busy} variant="danger" fullWidth={false} style={{ flex: 1 }} />
              <Button
                label="Accept Order"
                onPress={handleAccept}
                loading={busy}
                fullWidth={false}
                style={{ flex: 2 }}
                icon={<Ionicons name="checkmark-circle" size={20} color="#fff" />}
              />
            </>
          )}
          {canDispatch && (
            <Button
              label="Mark as Dispatched"
              onPress={handleDispatch}
              loading={busy}
              icon={<Ionicons name="car" size={20} color="#fff" />}
            />
          )}
        </BottomBar>
      )}

      <FormModal
        visible={rejectModal}
        title="Reject Order"
        message="The sales rep will see this reason."
        onCancel={() => setRejectModal(false)}
        confirmLabel="Confirm Reject"
        confirmVariant="destructive"
        confirmDisabled={!rejectReason || busy}
        confirmLoading={busy}
        onConfirm={handleReject}
      >
        <TextField label="Reason" placeholder="e.g. Out of stock for 2 SKUs" multiline value={rejectReason} onChangeText={setRejectReason} autoFocus />
      </FormModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  summaryCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  summaryLabel: { ...typography.caption, color: colors.textMuted },
  summaryValue: { ...typography.display, color: colors.text, marginTop: spacing.xs },
  summaryMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { ...typography.h2, color: colors.text, padding: spacing.lg, paddingBottom: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  itemRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg, borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
  itemName: { ...typography.bodyMedium, fontFamily: typography.h3.fontFamily, color: colors.text },
  itemMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  itemTotal: { ...typography.h3, color: colors.text },
  grandTotalLabel: { ...typography.h3, color: colors.text, flex: 1 },
  grandTotalValue: { ...typography.h2, color: colors.text },
  deliveryLine: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
});
