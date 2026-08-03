import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { colors } from '../../../src/lib/theme';
import { useLocalDispatches, useLocalOrders } from '../../../src/hooks/useLocalData';
import { enqueue } from '../../../src/db/syncQueue';
import { ScreenHeader, Button } from '../../../src/components/ui';

interface LineState {
  productId: string;
  name: string;
  orderedQty: number;
  deliveredQty: string;
  damagedQty: string;
  reason: string;
}

export default function DeliveryConfirmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: dispatches = [] } = useLocalDispatches();
  const { data: orders = [] } = useLocalOrders();
  const dispatch: any = dispatches.find((d: any) => d.id === id);
  const order: any = orders.find((o: any) => o.id === dispatch?.orderId);

  const [lines, setLines] = useState<LineState[]>(() =>
    (order?.items || []).map((item: any) => ({
      productId: item.productId,
      name: item.name,
      orderedQty: item.quantity,
      deliveredQty: String(item.quantity),
      damagedQty: '0',
      reason: '',
    }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!dispatch) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Delivery not found in local cache.</Text>
      </SafeAreaView>
    );
  }

  const updateLine = (idx: number, patch: Partial<LineState>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const items = lines.map((l) => ({
        productId: l.productId,
        deliveredQty: Number(l.deliveredQty) || 0,
        damagedQty: Number(l.damagedQty) || 0,
        reason: l.reason || undefined,
      }));
      await enqueue('CONFIRM_DELIVERY', { dispatchId: dispatch.id, items });
      setSubmitted(true);
      setTimeout(() => router.back(), 1800);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="checkmark-circle" size={72} color={colors.success} />
        <Text style={styles.submittedTitle}>Delivery Confirmed</Text>
        <Text style={styles.submittedText}>Queued for sync — shortages/damage will auto-create returns.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Confirm Delivery" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.hint}>Enter what was actually delivered per item. Any shortage or damage will automatically create a return.</Text>

        {lines.length === 0 ? (
          <Text style={styles.emptyText}>Order items not found in local cache — pull to sync and try again.</Text>
        ) : (
          lines.map((line, idx) => (
            <View key={line.productId} style={styles.itemCard}>
              <Text style={styles.itemName}>{line.name}</Text>
              <Text style={styles.orderedText}>Ordered: {line.orderedQty}</Text>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Delivered Qty</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={line.deliveredQty} onChangeText={(v) => updateLine(idx, { deliveredQty: v })} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Damaged Qty</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={line.damagedQty} onChangeText={(v) => updateLine(idx, { damagedQty: v })} />
                </View>
              </View>
              {Number(line.damagedQty) > 0 && (
                <>
                  <Text style={styles.label}>Reason</Text>
                  <TextInput style={styles.input} placeholder="e.g. Damaged in transit" value={line.reason} onChangeText={(v) => updateLine(idx, { reason: v })} />
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {lines.length > 0 && (
        <View style={styles.footer}>
          <Button label="Confirm Delivery" onPress={handleSubmit} loading={submitting} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  submittedTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 16 },
  submittedText: { color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  header: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  scroll: { padding: 16, gap: 12, paddingBottom: 100 },
  hint: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 20 },
  itemCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  itemName: { fontWeight: '700', color: colors.text, fontSize: 14 },
  orderedText: { color: colors.textMuted, fontSize: 12, marginTop: 2, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, marginBottom: 8 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  submitButton: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: '700' },
});
