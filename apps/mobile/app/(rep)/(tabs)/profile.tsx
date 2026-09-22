import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AttendanceService } from '@bharatsales/api-client';
import { colors, getUserInitials, formatDate, formatTime } from '../../../src/lib/theme';
import { radius, spacing, typography } from '../../../src/theme/tokens';
import { useSessionStore } from '../../../src/store/sessionStore';
import { useOrgStore } from '../../../src/store/orgStore';
import { useAuth } from '../../../src/lib/useAuth';
import { SyncStatusCard } from '../../../src/components/SyncStatusCard';
import { Avatar, Card, Button, EmptyState, ScreenHeader, SectionHeader, ListItem, SkeletonList, FormModal, TextField, StatusPill } from '../../../src/components/ui';

export default function ProfileScreen() {
  const user = useSessionStore((s) => s.user);
  const orgName = useOrgStore((s) => s.name);
  const orgLogoUrl = useOrgStore((s) => s.logoUrl);
  const { logout } = useAuth();
  const [regularizeModal, setRegularizeModal] = useState<{ sessionId: string } | null>(null);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['attendance', 'history'],
    queryFn: () => AttendanceService.getHistory(),
  });

  const requestRegularization = useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: string; reason: string }) => AttendanceService.requestRegularization(sessionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'history'] });
      setRegularizeModal(null);
      setReason('');
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Profile" showBack={false} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.profileCard}>
          <Avatar uri={null} initials={getUserInitials(user?.name, user?.email)} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Sales Representative'}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{user?.email || 'No email on file'}</Text>
            <View style={styles.badgeRow}>
              {user?.role && <StatusPill label={user.role} tone="primary" />}
              {orgName && (
                <View style={styles.orgBadge}>
                  {orgLogoUrl ? (
                    <Avatar uri={orgLogoUrl} initials={getUserInitials(orgName)} size={16} textColor={colors.textMuted} backgroundColor="transparent" />
                  ) : (
                    <Ionicons name="business-outline" size={14} color={colors.textMuted} />
                  )}
                  <Text style={styles.orgBadgeText} numberOfLines={1}>{orgName}</Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        <SyncStatusCard />

        <SectionHeader title="Attendance History" />
        {isLoading ? (
          <SkeletonList count={3} />
        ) : history.length === 0 ? (
          <EmptyState icon="time-outline" title="No attendance history yet" message="Your check-ins will appear here after you start your first day." />
        ) : (
          <Card padding={0}>
            {(history as any[]).slice(0, 10).map((session, idx) => (
              <View key={session._id || session.id} style={[styles.historyRow, idx > 0 && styles.historyRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDate}>{formatDate(session.startTime)}</Text>
                  <Text style={styles.historyTime}>
                    {formatTime(session.startTime)} – {session.endTime ? formatTime(session.endTime) : 'Ongoing'}
                  </Text>
                  {session.regularizationStatus && (
                    <View style={{ marginTop: spacing.xs }}>
                      <StatusPill label={`Fix ${session.regularizationStatus}`} tone="warning" />
                    </View>
                  )}
                </View>
                {!session.regularizationStatus && session.status === 'Completed' && (
                  <Pressable
                    onPress={() => setRegularizeModal({ sessionId: session._id || session.id })}
                    style={({ pressed }) => [styles.fixButton, pressed && { opacity: 0.6 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Request attendance fix for ${formatDate(session.startTime)}`}
                  >
                    <Text style={styles.fixButtonText}>Request Fix</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </Card>
        )}

        <SectionHeader title="Support" />
        <ListItem
          icon="help-buoy"
          title="Help & Support"
          subtitle="Report a problem to your admin team"
          showChevron
          onPress={() => router.push('/(rep)/report-issue')}
        />

        <Button label="Log Out" onPress={logout} variant="danger" icon={<Ionicons name="log-out-outline" size={20} color={colors.danger} />} style={{ marginTop: spacing.sm }} />
      </ScrollView>

      <FormModal
        visible={!!regularizeModal}
        title="Request Attendance Fix"
        message="Tell your manager what needs correcting for this day."
        onCancel={() => setRegularizeModal(null)}
        confirmLabel="Submit"
        confirmDisabled={!reason}
        confirmLoading={requestRegularization.isPending}
        onConfirm={() => regularizeModal && requestRegularization.mutate({ sessionId: regularizeModal.sessionId, reason })}
      >
        <TextField
          label="Reason"
          placeholder="e.g. Forgot to check out at 6:30 pm"
          multiline
          value={reason}
          onChangeText={setReason}
          autoFocus
        />
      </FormModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  userName: { ...typography.h2, color: colors.text },
  userEmail: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  orgBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  orgBadgeText: { ...typography.caption, color: colors.textMuted, flexShrink: 1 },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 64 },
  historyRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  historyDate: { ...typography.h3, color: colors.text },
  historyTime: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  fixButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.sm },
  fixButtonText: { ...typography.bodyMedium, fontFamily: typography.h3.fontFamily, color: colors.primary },
});
