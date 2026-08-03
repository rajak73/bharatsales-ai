import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AttendanceService } from '@bharatsales/api-client';
import { colors, getUserInitials } from '../../../src/lib/theme';
import { radius, spacing, typography } from '../../../src/theme/tokens';
import { useSessionStore } from '../../../src/store/sessionStore';
import { useOrgStore } from '../../../src/store/orgStore';
import { useAuth } from '../../../src/lib/useAuth';
import { useSyncStatus } from '../../../src/hooks/useSyncStatus';
import { SyncEngine } from '../../../src/sync/syncEngine';
import { Avatar, Card, Button, EmptyState } from '../../../src/components/ui';

export default function ProfileScreen() {
  const user = useSessionStore((s) => s.user);
  const orgName = useOrgStore((s) => s.name);
  const orgLogoUrl = useOrgStore((s) => s.logoUrl);
  const { logout } = useAuth();
  const syncStatus = useSyncStatus();
  const [forcingSync, setForcingSync] = useState(false);
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

  const handleForceSync = async () => {
    setForcingSync(true);
    try {
      if (user?.role === 'Sales Representative' || user?.role === 'Distributor') {
        await SyncEngine.pullSync(user.role);
      }
      await SyncEngine.triggerSync();
    } finally {
      setForcingSync(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile</Text>

        <Card style={styles.profileCard}>
          <Avatar uri={null} initials={getUserInitials(user?.name, user?.email)} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name || 'Sales Representative'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email on file'}</Text>
            <View style={styles.badgeRow}>
              {user?.role && <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>{user.role}</Text></View>}
              {orgName && (
                <View style={styles.orgBadge}>
                  <Avatar uri={orgLogoUrl} initials={getUserInitials(orgName)} size={14} textColor={colors.textMuted} backgroundColor="transparent" />
                  <Text style={styles.orgBadgeText} numberOfLines={1}>{orgName}</Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        <Card>
          <View style={styles.syncRow}>
            <Ionicons name={syncStatus.pendingCount > 0 ? 'cloud-offline' : 'cloud-done'} size={18} color={syncStatus.pendingCount > 0 ? colors.warning : colors.success} />
            <Text style={styles.syncText}>
              {syncStatus.pendingCount > 0 ? `${syncStatus.pendingCount} item(s) waiting to sync.` : 'Everything is synced.'}
            </Text>
          </View>
          <Button
            label="Force Sync Now"
            onPress={handleForceSync}
            loading={forcingSync}
            variant="secondary"
            icon={<Ionicons name="refresh" size={16} color={colors.primary} />}
          />
        </Card>

        <Text style={styles.sectionTitle}>Attendance History</Text>
        <Card padding={isLoading || history.length === 0 ? 'lg' : 0}>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : history.length === 0 ? (
            <EmptyState icon="time-outline" title="No attendance history yet" />
          ) : (
            (history as any[]).slice(0, 10).map((session, idx) => (
              <View key={session._id || session.id} style={[styles.historyRow, idx > 0 && styles.historyRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDate}>{new Date(session.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                  <Text style={styles.historyTime}>
                    {new Date(session.startTime).toLocaleTimeString()} — {session.endTime ? new Date(session.endTime).toLocaleTimeString() : 'Ongoing'}
                  </Text>
                  {session.regularizationStatus && (
                    <Text style={styles.regularizationStatus}>Regularization: {session.regularizationStatus}</Text>
                  )}
                </View>
                {!session.regularizationStatus && session.status === 'Completed' && (
                  <TouchableOpacity onPress={() => setRegularizeModal({ sessionId: session._id || session.id })}>
                    <Text style={styles.regularizeLink}>Request Fix</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </Card>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(rep)/report-issue')}>
          <Ionicons name="help-buoy" size={18} color={colors.text} />
          <Text style={styles.menuItemText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <Button label="Log Out" onPress={logout} variant="danger" icon={<Ionicons name="log-out" size={18} color={colors.danger} />} />
      </ScrollView>

      <Modal visible={!!regularizeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request Attendance Fix</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Reason for regularization"
              multiline
              value={reason}
              onChangeText={setReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRegularizeModal(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmit}
                disabled={!reason || requestRegularization.isPending}
                onPress={() => regularizeModal && requestRegularization.mutate({ sessionId: regularizeModal.sessionId, reason })}
              >
                <Text style={styles.modalSubmitText}>{requestRegularization.isPending ? 'Submitting...' : 'Submit'}</Text>
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
  scroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.huge },
  title: { ...typography.display, fontSize: 22, color: colors.text },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  userName: { ...typography.h2, color: colors.text },
  userEmail: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  roleBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  roleBadgeText: { color: colors.primary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  orgBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orgBadgeText: { ...typography.tiny, color: colors.textMuted, textTransform: 'none' },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  syncText: { color: colors.textMuted, fontSize: 13, flex: 1 },
  sectionTitle: { ...typography.h2, fontSize: 15, color: colors.text },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  historyRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  historyDate: { fontWeight: '700', color: colors.text, fontSize: 13 },
  historyTime: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  regularizationStatus: { color: colors.warning, fontSize: 10, marginTop: 2, fontWeight: '700' },
  regularizeLink: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  menuItemText: { flex: 1, ...typography.bodyMedium, color: colors.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  modalCard: { backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.xl, width: '100%' },
  modalTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  modalInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, minHeight: 80, textAlignVertical: 'top', fontSize: 13 },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  modalCancel: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  modalCancelText: { color: colors.text, fontWeight: '600' },
  modalSubmit: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary },
  modalSubmitText: { color: '#fff', fontWeight: '700' },
});
