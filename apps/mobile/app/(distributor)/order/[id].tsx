import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { colors, formatCurrency } from '../../../src/lib/theme';
import { useLocalOrders } from '../../../src/hooks/useLocalData';
import { enqueue } from '../../../src/db/syncQueue';
import { ScreenHeader, Button } from '../../../src/components/ui';

export default function DistributorOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: orders = [], refetch } = useLocalOrders();
  const order: any = orders.find((o: any) => o.id === id);
  const [busy, setBusy] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionDone, setActionDone] = useState<string | null>(null);

  if (!order) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Order not found in local cache.</Text>
      </SafeAreaView>
    );
  }

  const canAccept = ['Submitted', 'Pending_Approval'].includes(order.status);
  const canDispatch = order.status === 'Approved';

  const handleAccept = async () => {
    setBusy(true);
    try {
      await enqueue('APPROVE_ORDER', { orderId: order.id });
      setActionDone('Order accepted — will sync shortly.');
      refetch();
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    try {
      await enqueue('REJECT_ORDER', { orderId: order.id, reason: rejectReason });
      setRejectModal(false);
      setActionDone('Order rejected — will sync shortly.');
      refetch();
    } finally {
      setBusy(false);
    }
  };

  const handleDispatch = async () => {
    setBusy(true);
    try {
      await enqueue('DISPATCH_ORDER', { orderId: order.id });
      setActionDone('Order marked as dispatched — will sync shortly.');
      refetch();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title={order.orderNumber} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {actionDone && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.successText}>{actionDone}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {(order.items || []).map((item: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>{item.sku} • Qty {item.quantity}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(order.totals?.grandTotal)}</Text>
          </View>
        </View>

        {order.deliveredItems && order.deliveredItems.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery Status</Text>
            {order.deliveredItems.map((d: any, idx: number) => (
              <Text key={idx} style={styles.deliveryLine}>
                {d.productId}: delivered {d.deliveredQty}/{d.orderedQty}
                {d.shortQty ? ` (short ${d.shortQty})` : ''}
                {d.damagedQty ? ` (damaged ${d.damagedQty})` : ''}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>

      {(canAccept || canDispatch) && (
        <View style={styles.footer}>
          {canAccept && (
            <>
              <Button label="Reject" onPress={() => setRejectModal(true)} disabled={busy} variant="danger" style={{ flex: 1 }} />
              <Button label="Accept Order" onPress={handleAccept} loading={busy} style={{ flex: 1 }} />
            </>
          )}
          {canDispatch && (
            <Button label="Mark as Dispatched" onPress={handleDispatch} loading={busy} style={{ flex: 1 }} />
          )}
        </View>
      )}

      <Modal visible={rejectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Order</Text>
            <TextInput style={styles.modalInput} placeholder="Reason for rejection" multiline value={rejectReason} onChangeText={setRejectReason} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRejectModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleReject} disabled={!rejectReason || busy}>
                <Text style={styles.modalSubmitText}>Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  scroll: { padding: 16, gap: 12, paddingBottom: 100 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.successLight, borderRadius: 12, padding: 14 },
  successText: { flex: 1, color: colors.success, fontSize: 12, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontWeight: '800', color: colors.text, marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemName: { fontWeight: '700', color: colors.text, fontSize: 13 },
  itemMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  itemTotal: { fontWeight: '700', color: colors.text, fontSize: 13 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  grandTotalLabel: { fontWeight: '800', color: colors.text },
  grandTotalValue: { fontWeight: '800', color: colors.text, fontSize: 16 },
  deliveryLine: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, backgroundColor: colors.card, padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  rejectButton: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: colors.dangerLight },
  rejectButtonText: { color: colors.danger, fontWeight: '700' },
  acceptButton: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: colors.primary },
  acceptButtonText: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, width: '100%' },
  modalTitle: { fontWeight: '800', fontSize: 16, color: colors.text, marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, minHeight: 80, textAlignVertical: 'top', fontSize: 13 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancel: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  modalCancelText: { color: colors.text, fontWeight: '600' },
  modalSubmit: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: colors.danger },
  modalSubmitText: { color: '#fff', fontWeight: '700' },
});
