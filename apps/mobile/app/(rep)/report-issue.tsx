import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SupportService } from '@bharatsales/api-client';
import { colors, spacing, typography } from '../../src/theme/tokens';
import { ScreenHeader, Button, Banner, Card, TextField, Chip, BottomBar, KeyboardAware, SuccessState } from '../../src/components/ui';

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
    return <SuccessState title="Issue Reported" message="Your support ticket has been created. Our team will follow up soon." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Report an Issue" />
      <KeyboardAware>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {error ? <Banner tone="danger" message={error} /> : null}

          <Card style={styles.form}>
            <TextField label="Subject" required placeholder="Brief summary" value={subject} onChangeText={setSubject} returnKeyType="next" />

            <View>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    selected={priority === p}
                    tone={p === 'High' ? 'danger' : 'primary'}
                    onPress={() => setPriority(p)}
                    style={styles.priorityChip}
                  />
                ))}
              </View>
            </View>

            <TextField
              label="Details"
              required
              placeholder="Describe what happened, which screen, and any error message you saw…"
              value={message}
              onChangeText={setMessage}
              multiline
              style={{ minHeight: 140 }}
            />
          </Card>
        </ScrollView>

        <BottomBar>
          <Button
            label="Submit Ticket"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!subject || !message}
            icon={<Ionicons name="send" size={18} color={!subject || !message ? colors.textMuted : '#fff'} />}
          />
        </BottomBar>
      </KeyboardAware>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  form: { gap: spacing.lg },
  label: { ...typography.caption, fontFamily: typography.h3.fontFamily, color: colors.text, marginBottom: spacing.sm },
  priorityRow: { flexDirection: 'row', gap: spacing.sm },
  priorityChip: { flex: 1, justifyContent: 'center' },
});
