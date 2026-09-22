import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { colors } from '../../../src/lib/theme';
import { radius, spacing, typography } from '../../../src/theme/tokens';
import { useLocalDispatches, useLocalOrders } from '../../../src/hooks/useLocalData';
import { enqueueAndSync } from '../../../src/sync/syncEngine';
import { ScreenHeader, Button, Banner, Card, TextField, EmptyState, BottomBar, KeyboardAware, SuccessState } from '../../../src/components/ui';

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

  // Derived from the cached order (which can arrive after the first render,
  // since it is read from SQLite) plus whatever the user has typed, so the
  // screen never gets stuck on "Order items not found".
  const [edits, setEdits] = useState<Record<string, Partial<LineState>>>({});
  const lines: LineState[] = useMemo(
    () =>
      (order?.items || []).map((item: any) => ({
        productId: item.productId,
        name: item.name,
        orderedQty: item.quantity,
        deliveredQty: String(item.quantity),
        damagedQty: '0',
        reason: '',
        ...(edits[item.productId] || {}),
      })),
    [order, edits],
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!dispatch) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="Confirm Delivery" />
        <View style={styles.scroll}>
          <EmptyState
            icon="car-outline"
            title="Delivery not found"
            message="This delivery isn't in your offline data yet. Go back and pull down to sync, then try again."
            actionLabel="Go Back"
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const updateLine = (idx: number, patch: Partial<LineState>) => {
    const productId = lines[idx]?.productId;
    if (!productId) return;
    setEdits((prev) => ({ ...prev, [productId]: { ...prev[productId], ...patch } }));
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
      await enqueueAndSync('CONFIRM_DELIVERY', { dispatchId: dispatch.id, items });
      setSubmitted(true);
      setTimeout(() => router.back(), 1800);
    } catch (err: any) {
      Alert.alert('Could not confirm delivery', err?.message || 'The delivery could not be saved on this device. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SuccessState
        title="Delivery Confirmed"
        message="Any shortage or damage you entered will automatically create a return."
        note="Syncs automatically when you're online"
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Confirm Delivery" subtitle={[dispatch.vehicle, dispatch.driver].filter(Boolean).join(' · ') || undefined} />

      <KeyboardAware>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <Banner tone="info" message="Enter what was actually delivered for each item. Any shortage or damage will automatically create a return." />

          {lines.length === 0 ? (
            <EmptyState icon="cube-outline" title="Order items not found" message="The order's items aren't in your offline data yet — go back, pull down to sync and try again." />
          ) : (
            lines.map((line, idx) => {
              const delivered = Number(line.deliveredQty) || 0;
              const short = Math.max(0, line.orderedQty - delivered);
              return (
                <Card key={line.productId}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{line.name}</Text>
                    <View style={styles.orderedBadge}><Text style={styles.orderedText}>Ordered {line.orderedQty}</Text></View>
                  </View>
                  <View style={styles.row}>
                    <TextField
                      label="Delivered qty"
                      keyboardType="number-pad"
                      value={line.deliveredQty}
                      onChangeText={(v) => updateLine(idx, { deliveredQty: v })}
                      containerStyle={{ flex: 1 }}
                      accessibilityLabel={`Delivered quantity for ${line.name}`}
                      selectTextOnFocus
                    />
                    <TextField
                      label="Damaged qty"
                      keyboardType="number-pad"
                      value={line.damagedQty}
                      onChangeText={(v) => updateLine(idx, { damagedQty: v })}
                      containerStyle={{ flex: 1 }}
                      accessibilityLabel={`Damaged quantity for ${line.name}`}
                      selectTextOnFocus
                    />
                  </View>
                  {short > 0 ? <Text style={styles.shortText}>Short by {short} — a return will be created</Text> : null}
                  {Number(line.damagedQty) > 0 && (
                    <TextField
                      label="Reason for damage"
                      placeholder="e.g. Damaged in transit"
                      value={line.reason}
                      onChangeText={(v) => updateLine(idx, { reason: v })}
                      containerStyle={{ marginTop: spacing.md }}
                    />
                  )}
                </Card>
              );
            })
          )}
        </ScrollView>

        {lines.length > 0 && (
          <BottomBar>
            <Button
              label="Confirm Delivery"
              onPress={handleSubmit}
              loading={submitting}
              icon={<Ionicons name="checkmark-done" size={20} color="#fff" />}
            />
          </BottomBar>
        )}
      </KeyboardAware>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.md },
  itemName: { ...typography.h3, color: colors.text, flex: 1 },
  orderedBadge: { backgroundColor: colors.neutralLight, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  orderedText: { ...typography.caption, color: colors.textSecondary },
  row: { flexDirection: 'row', gap: spacing.md },
  shortText: { ...typography.caption, color: colors.warningText, marginTop: spacing.sm },
});
