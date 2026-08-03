import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { colors, formatCurrency } from '../../src/lib/theme';
import { useLocalOutlets } from '../../src/hooks/useLocalData';
import { useSessionStore } from '../../src/store/sessionStore';
import { enqueue } from '../../src/db/syncQueue';
import { ScreenHeader, Button } from '../../src/components/ui';

const PAYMENT_MODES = ['Cash', 'UPI', 'Cheque', 'Bank Transfer'] as const;

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function CollectionScreen() {
  const { outletId } = useLocalSearchParams<{ outletId: string }>();
  const { data: outlets = [] } = useLocalOutlets();
  const user = useSessionStore((s) => s.user);
  const outlet: any = outlets.find((o: any) => o.id === outletId);

  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<(typeof PAYMENT_MODES)[number]>('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const requiresReference = mode !== 'Cash';

  const handleSubmit = async () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (requiresReference && !referenceNumber) {
      setError('Reference number is required for this payment mode.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const idempotencyKey = uuid();
      await enqueue('CREATE_PAYMENT', {
        id: idempotencyKey,
        organizationId: outlet?.organizationId,
        receiptNumber: `REC-${Date.now()}`,
        outletId,
        collectedByUserId: user?.id,
        amount: numericAmount,
        paymentMode: mode,
        referenceNumber: referenceNumber || undefined,
        status: 'Pending',
        collectionDate: new Date().toISOString(),
        idempotencyKey,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
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
        <Text style={styles.submittedTitle}>Payment Recorded</Text>
        <Text style={styles.submittedText}>Queued for sync — will upload automatically once online.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Record Payment" subtitle={outlet?.name} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Outstanding Balance</Text>
          <Text style={styles.balanceValue}>{formatCurrency(outlet?.commercial?.outstandingBalance)}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Payment Amount (₹)</Text>
          <TextInput style={styles.input} keyboardType="numeric" placeholder="e.g. 5000" value={amount} onChangeText={setAmount} />

          <Text style={styles.label}>Payment Mode</Text>
          <View style={styles.modeGrid}>
            {PAYMENT_MODES.map((m) => (
              <TouchableOpacity key={m} style={[styles.modeButton, mode === m && styles.modeButtonActive]} onPress={() => setMode(m)}>
                <Text style={[styles.modeButtonText, mode === m && styles.modeButtonTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {requiresReference && (
            <>
              <Text style={styles.label}>Reference Number</Text>
              <TextInput style={styles.input} placeholder="Txn ID / Cheque No." value={referenceNumber} onChangeText={setReferenceNumber} />
            </>
          )}
        </View>

        <Button
          label="Record Payment"
          onPress={handleSubmit}
          loading={submitting}
          icon={<Ionicons name="checkmark-circle" size={20} color="#fff" />}
        />
      </ScrollView>
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
  headerSubtitle: { fontSize: 12, color: colors.textMuted },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  error: { backgroundColor: colors.dangerLight, color: colors.danger, padding: 12, borderRadius: 10, fontSize: 13 },
  balanceCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  balanceLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  balanceValue: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 4 },
  formCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modeButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  modeButtonActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  modeButtonText: { fontSize: 12, fontWeight: '600', color: colors.text },
  modeButtonTextActive: { color: colors.primary },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15 },
  submitButtonText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
