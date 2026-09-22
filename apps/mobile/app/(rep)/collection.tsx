import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { colors, formatCurrency } from '../../src/lib/theme';
import { spacing, typography } from '../../src/theme/tokens';
import { useLocalOutlets } from '../../src/hooks/useLocalData';
import { useSessionStore } from '../../src/store/sessionStore';
import { enqueueAndSync } from '../../src/sync/syncEngine';
import { ScreenHeader, Button, Banner, Card, TextField, Chip, BottomBar, KeyboardAware, SuccessState } from '../../src/components/ui';

// Event-handler timestamp; kept out of the component body so the React
// compiler lint doesn't treat it as an impure call during render.
const nowMs = () => Date.now();

const PAYMENT_MODES = ['Cash', 'UPI', 'Cheque', 'Bank Transfer'] as const;

const MODE_ICONS: Record<(typeof PAYMENT_MODES)[number], 'cash-outline' | 'phone-portrait-outline' | 'document-text-outline' | 'business-outline'> = {
  Cash: 'cash-outline',
  UPI: 'phone-portrait-outline',
  Cheque: 'document-text-outline',
  'Bank Transfer': 'business-outline',
};

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
      await enqueueAndSync('CREATE_PAYMENT', {
        id: idempotencyKey,
        organizationId: outlet?.organizationId,
        receiptNumber: `REC-${nowMs()}`,
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
    } catch (err: any) {
      Alert.alert('Could not record payment', err?.message || 'The payment could not be saved on this device. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SuccessState
        title="Payment Recorded"
        message={`${formatCurrency(parseFloat(amount))} via ${mode}${outlet?.name ? ` from ${outlet.name}` : ''}.`}
        note="Syncs automatically when you're online"
      />
    );
  }

  const parsedAmount = parseFloat(amount);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Record Payment" subtitle={outlet?.name} />

      <KeyboardAware>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {error ? <Banner tone="danger" message={error} /> : null}

          <Card style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Outstanding Balance</Text>
            <Text style={styles.balanceValue}>{formatCurrency(outlet?.commercial?.outstandingBalance)}</Text>
          </Card>

          <Card style={styles.formCard}>
            <TextField
              label="Amount (₹)"
              required
              keyboardType="decimal-pad"
              placeholder="e.g. 5000"
              value={amount}
              onChangeText={setAmount}
              hint={!isNaN(parsedAmount) && parsedAmount > 0 ? `You are recording ${formatCurrency(parsedAmount)}` : undefined}
              style={styles.amountInput}
            />

            <View>
              <Text style={styles.label}>Payment Mode</Text>
              <View style={styles.modeGrid}>
                {PAYMENT_MODES.map((m) => (
                  <Chip key={m} label={m} icon={MODE_ICONS[m]} selected={mode === m} onPress={() => setMode(m)} />
                ))}
              </View>
            </View>

            {requiresReference && (
              <TextField
                label="Reference Number"
                required
                placeholder={mode === 'Cheque' ? 'Cheque number' : 'Transaction / UTR ID'}
                autoCapitalize="characters"
                value={referenceNumber}
                onChangeText={setReferenceNumber}
              />
            )}
          </Card>
        </ScrollView>

        <BottomBar>
          <Button
            label="Record Payment"
            onPress={handleSubmit}
            loading={submitting}
            icon={<Ionicons name="checkmark-circle" size={20} color="#fff" />}
          />
        </BottomBar>
      </KeyboardAware>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  balanceCard: { backgroundColor: colors.warningLight, borderColor: colors.warningBorder },
  balanceLabel: { ...typography.caption, color: colors.warningText },
  balanceValue: { ...typography.display, color: colors.text, marginTop: spacing.xs },
  formCard: { gap: spacing.lg },
  label: { ...typography.caption, fontFamily: typography.h3.fontFamily, color: colors.text, marginBottom: spacing.sm },
  amountInput: { ...typography.h2 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
