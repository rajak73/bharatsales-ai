import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SupportService } from '@bharatsales/api-client';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';
import { ScreenHeader, Button } from '../../src/components/ui';

const PRIORITIES = ['Low', 'Medium', 'High'] as const;

// Reuses the existing self-service POST /support/tickets endpoint
// (SupportService.createTicket, already used by the web app's Help &
// Support flow) — no new backend needed for the "Report Issue" quick action.
export default function ReportIssueScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('Medium');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!subject || !message) return;
    setSubmitting(true);
    setError('');
    try {
      await SupportService.createTicket({ subject, message, priority });
      setSubmitted(true);
      setTimeout(() => router.back(), 1800);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="checkmark-circle" size={72} color={colors.success} />
        <Text style={styles.submittedTitle}>Issue Reported</Text>
        <Text style={styles.submittedText}>Your support ticket has been created. Our team will follow up soon.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Report an Issue" />
      <View style={styles.body}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Subject</Text>
        <TextInput style={styles.input} placeholder="Brief summary" value={subject} onChangeText={setSubject} />

        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map((p) => (
            <Button
              key={p}
              label={p}
              onPress={() => setPriority(p)}
              variant={priority === p ? 'primary' : 'ghost'}
              fullWidth={false}
              style={styles.priorityButton}
            />
          ))}
        </View>

        <Text style={styles.label}>Details</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe what happened..."
          value={message}
          onChangeText={setMessage}
          multiline
        />

        <Button label="Submit Ticket" onPress={handleSubmit} loading={submitting} disabled={!subject || !message} style={{ marginTop: spacing.lg }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl },
  submittedTitle: { ...typography.h1, color: colors.text, marginTop: spacing.lg },
  submittedText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  body: { padding: spacing.xl, gap: spacing.xs },
  error: { backgroundColor: colors.dangerLight, color: colors.danger, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, fontSize: 13 },
  label: { ...typography.caption, color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 14 },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: spacing.sm },
  priorityButton: { flex: 1, paddingVertical: spacing.sm },
});
